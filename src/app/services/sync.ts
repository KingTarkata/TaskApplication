import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { PlannerStore } from './planner-store';
import { StorageService, STORAGE_KEYS } from './storage';
import { firebaseEnabled } from '../firebase/firebase-config';
import type { AuthUser, FirebaseRuntime } from '../firebase/firebase-runtime';
import { TERMS } from '../terminology';
import { AppData } from '../models/app-data';
import { TaskStatus } from '../models/task.model';

export type SyncStatus = 'disabled' | 'starting' | 'signed-out' | 'no-household' | 'connected';

interface Session {
  uid: string;
  householdId: string | null;
}

/**
 * Connects the app to a shared household via Firebase when signed in, and falls back to
 * on-device data otherwise. Firebase is only downloaded once sync is actually used.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private store = inject(PlannerStore);
  private storage = inject(StorageService);
  private zone = inject(NgZone);

  readonly enabled = firebaseEnabled;
  readonly status = signal<SyncStatus>(firebaseEnabled ? 'starting' : 'disabled');
  readonly user = signal<AuthUser | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly household = this.store.household;
  readonly members = this.store.members;
  readonly isOwner = computed(() => !!this.user() && this.household()?.ownerId === this.user()!.uid);

  private runtime?: FirebaseRuntime;
  private starting?: Promise<void>;
  private connectedTo: string | null = null;

  /**
   * Called at startup after on-device data has loaded. Waits briefly for the saved sign-in so a
   * household user doesn't see their device data flash first; continues in the background if slow.
   */
  async init(): Promise<void> {
    if (!firebaseEnabled) return;
    const session = this.storage.getJson<Session | null>(STORAGE_KEYS.session, null);
    // Only load Firebase at startup for people who have signed in before
    if (!session) {
      this.status.set('signed-out');
      return;
    }
    const firstUser = this.start();
    await Promise.race([firstUser, new Promise((r) => setTimeout(r, 3000))]);
  }

  /** Load Firebase (once) and react to sign-in changes. Resolves after the first auth state is handled. */
  private start(): Promise<void> {
    this.starting ??= new Promise((resolveFirst) => {
      import('../firebase/firebase-runtime').then(({ FirebaseRuntime }) => {
        this.runtime = new FirebaseRuntime();
        let first = true;
        this.runtime.onUser((user) =>
          this.zone.run(async () => {
            try {
              await this.handleUser(user);
            } finally {
              if (first) {
                first = false;
                resolveFirst();
              }
            }
          })
        );
      });
    });
    return this.starting;
  }

  private async ensureRuntime(): Promise<FirebaseRuntime> {
    await this.start();
    return this.runtime!;
  }

  private async handleUser(user: AuthUser | null): Promise<void> {
    this.user.set(user);
    if (!user) {
      this.saveSession(null);
      await this.disconnect();
      this.status.set('signed-out');
      return;
    }
    const cached = this.storage.getJson<Session | null>(STORAGE_KEYS.session, null);
    let householdId = cached?.uid === user.uid ? cached.householdId : null;
    // Connect from the cached session right away (works offline), then confirm with the server
    if (householdId) await this.connect(user.uid, householdId);
    try {
      const fresh = await this.runtime!.getHouseholdId(user.uid);
      if (fresh !== householdId) {
        householdId = fresh;
        if (householdId) await this.connect(user.uid, householdId);
        else await this.disconnect();
      }
    } catch (err) {
      console.warn('Could not check household (offline?)', err);
    }
    this.saveSession({ uid: user.uid, householdId });
    this.status.set(householdId ? 'connected' : 'no-household');
  }

  private async connect(uid: string, householdId: string): Promise<void> {
    if (this.connectedTo === householdId) return;
    await this.store.useRepository(this.runtime!.repository(householdId, uid), uid);
    this.connectedTo = householdId;
    this.status.set('connected');
  }

  private async disconnect(): Promise<void> {
    if (this.connectedTo === null) return;
    this.connectedTo = null;
    await this.store.useLocal();
  }

  // ---------- Actions (each sets busy/error for the UI) ----------

  signInWithGoogle() {
    return this.run(async (rt) => rt.signInWithGoogle());
  }

  signInWithEmail(email: string, password: string) {
    return this.run(async (rt) => rt.signInWithEmail(email.trim(), password));
  }

  signUpWithEmail(email: string, password: string, displayName: string) {
    return this.run(async (rt) => rt.signUpWithEmail(email.trim(), password, displayName.trim()));
  }

  resetPassword(email: string) {
    return this.run(async (rt) => rt.resetPassword(email.trim()));
  }

  signOut() {
    return this.run(async (rt) => rt.signOut());
  }

  /** Start a household and move this device's chores and plots into it. */
  createHousehold(name: string) {
    return this.run(async (rt) => {
      const user = this.user()!;
      const local = this.claim(await this.store.localSnapshot(), user.uid);
      const displayName = this.nameFor(user, local.profile.displayName);
      const hid = await rt.createHousehold(user.uid, name.trim() || TERMS.sync.defaultHouseholdName, displayName, local);
      await this.connect(user.uid, hid);
      this.saveSession({ uid: user.uid, householdId: hid });
      await rt.createInvite(user.uid, hid);
    });
  }

  /** Join with a code; optionally bring this device's chores along. */
  joinHousehold(code: string, bringLocalChores: boolean) {
    return this.run(async (rt) => {
      const user = this.user()!;
      const local = this.claim(await this.store.localSnapshot(), user.uid);
      const hid = await rt.joinHousehold(user.uid, code.trim().toUpperCase(), this.nameFor(user, local.profile.displayName));
      if (bringLocalChores && local.tasks.length) await rt.mergeInto(hid, local);
      await this.connect(user.uid, hid);
      this.saveSession({ uid: user.uid, householdId: hid });
    });
  }

  newInviteCode() {
    return this.run(async (rt) => {
      const hid = this.household()?.id;
      if (hid) await rt.createInvite(this.user()!.uid, hid);
    });
  }

  /** Leave the household; this device goes back to its own (pre-household) data. */
  leaveHousehold() {
    return this.run(async (rt) => {
      const user = this.user()!;
      const hid = this.household()?.id;
      await this.disconnect();
      if (hid) await rt.leaveHousehold(user.uid, hid);
      this.saveSession({ uid: user.uid, householdId: null });
      this.status.set('no-household');
    });
  }

  clearError() {
    this.error.set(null);
  }

  private async run(action: (rt: FirebaseRuntime) => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action(await this.ensureRuntime());
      return true;
    } catch (err) {
      console.error(err);
      this.error.set(friendlyError(err));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  /** Credit chores from this device to you before they're shared (so your XP stays yours). */
  private claim(data: AppData, uid: string): AppData {
    return {
      ...data,
      tasks: data.tasks.map((t) => ({
        ...t,
        createdBy: t.createdBy ?? uid,
        harvestedBy: t.status === TaskStatus.ARCHIVED ? (t.harvestedBy ?? uid) : t.harvestedBy,
      })),
    };
  }

  private nameFor(user: AuthUser, localName: string): string {
    const isDefault = !localName || localName === TERMS.profile.defaultName;
    return (isDefault ? user.displayName || user.email?.split('@')[0] : localName) || TERMS.profile.defaultName;
  }

  private saveSession(session: Session | null) {
    if (session) this.storage.setJson(STORAGE_KEYS.session, session);
    else this.storage.remove(STORAGE_KEYS.session);
  }
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string; message?: string })?.code ?? (err as Error)?.message ?? '';
  const messages = TERMS.sync.errors as Record<string, string>;
  for (const [key, message] of Object.entries(messages)) {
    if (code.includes(key)) return message;
  }
  return TERMS.sync.errors.generic;
}
