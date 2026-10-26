// Everything that touches the Firebase SDK lives here. This module is loaded on demand
// (dynamic import) so people who never sign in don't download Firebase at all.
import { initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getRedirectResult,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  Firestore,
  Timestamp,
  Unsubscribe,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Subject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { EMULATOR_HOST, EMULATOR_PORTS, firebaseConfig, useEmulators } from './firebase-config';
import type { DataRepository } from '../data/data-repository';
import { AppData, DATA_VERSION, Profile, deserializeTask, migrate, serializeTask } from '../models/app-data';
import { Category } from '../models/category.model';
import { Household, MEMBER_COLORS, Member } from '../models/member.model';
import { Task, generateUUID } from '../models/task.model';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class FirebaseRuntime {
  readonly auth: Auth;
  readonly db: Firestore;

  constructor() {
    const app = initializeApp(firebaseConfig);
    // Inside the native app, the popup/redirect helper can hang the WebView, and Google sign-in
    // needs a native plugin there; email sign-in works everywhere
    this.auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      ...(Capacitor.isNativePlatform() ? {} : { popupRedirectResolver: browserPopupRedirectResolver }),
    });
    // Offline-first: data is cached on the device and writes queue until back online
    this.db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
    if (useEmulators) {
      connectAuthEmulator(this.auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
      connectFirestoreEmulator(this.db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
    }
  }

  // ---------- Auth ----------

  onUser(callback: (user: AuthUser | null) => void): Unsubscribe {
    // Surface errors from a redirect sign-in (used on phones)
    getRedirectResult(this.auth).catch((err) => console.warn('Redirect sign-in failed', err));
    return onAuthStateChanged(this.auth, (user) => callback(user ? toAuthUser(user) : null));
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    // Popups are unreliable in installed (home-screen) apps and on phones; use a full-page redirect there
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (standalone || mobile) await signInWithRedirect(this.auth, provider);
    else await signInWithPopup(this.auth, provider);
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
  }

  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  // ---------- Households ----------

  async getHouseholdId(uid: string): Promise<string | null> {
    const snap = await getDoc(doc(this.db, 'users', uid));
    return (snap.data()?.['householdId'] as string | undefined) ?? null;
  }

  /** Create a household owned by `uid`, seeded with `data` (the founder's current chores and plots). */
  async createHousehold(uid: string, name: string, displayName: string, data: AppData): Promise<string> {
    const hid = doc(collection(this.db, 'households')).id;
    await setDoc(doc(this.db, 'households', hid), { name, ownerId: uid, createdAt: serverTimestamp() });
    await setDoc(doc(this.db, 'households', hid, 'members', uid), {
      displayName,
      color: MEMBER_COLORS[0],
      joinedAt: serverTimestamp(),
    });
    await writeAll(this.db, hid, data.tasks, data.categories);
    await setDoc(doc(this.db, 'users', uid), { householdId: hid });
    return hid;
  }

  /** Join with an invite code; returns the household id. Throws 'invalid-code' if the code doesn't exist. */
  async joinHousehold(uid: string, code: string, displayName: string): Promise<string> {
    const invite = await getDoc(doc(this.db, 'invites', code));
    const hid = invite.data()?.['householdId'] as string | undefined;
    if (!invite.exists() || !hid) throw new Error('invalid-code');

    await setDoc(doc(this.db, 'households', hid, 'members', uid), {
      displayName,
      color: MEMBER_COLORS[1],
      joinedAt: serverTimestamp(),
      inviteCode: code,
    });
    // Pick a color nobody else is using
    const members = await getDocs(collection(this.db, 'households', hid, 'members'));
    const used = new Set(members.docs.filter((m) => m.id !== uid).map((m) => m.data()['color']));
    const color = MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[1];
    await setDoc(doc(this.db, 'households', hid, 'members', uid), { color }, { merge: true });

    await setDoc(doc(this.db, 'users', uid), { householdId: hid });
    return hid;
  }

  /** Make a fresh invite code for the household and remember it on the household doc. */
  async createInvite(uid: string, hid: string): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => alphabet[b % alphabet.length]).join('');
      if (!(await getDoc(doc(this.db, 'invites', code))).exists()) break;
    }
    await setDoc(doc(this.db, 'invites', code), { householdId: hid, createdBy: uid, createdAt: serverTimestamp() });
    await setDoc(doc(this.db, 'households', hid), { inviteCode: code }, { merge: true });
    return code;
  }

  async leaveHousehold(uid: string, hid: string): Promise<void> {
    await deleteDoc(doc(this.db, 'households', hid, 'members', uid));
    await setDoc(doc(this.db, 'users', uid), { householdId: null });
  }

  /** Add chores from this device to a household, matching plots by name (creating any that are missing). */
  async mergeInto(hid: string, local: AppData): Promise<void> {
    const existing = await getDocs(collection(this.db, 'households', hid, 'categories'));
    const byName = new Map(existing.docs.map((d) => [String(d.data()['name']).toLowerCase(), d.id]));
    const newCategories: Category[] = [];
    const idMap = new Map<string, string>();
    for (const cat of local.categories) {
      const match = byName.get(cat.name.toLowerCase());
      if (match) idMap.set(cat.id, match);
      else {
        const created = { ...cat, id: generateUUID() };
        newCategories.push(created);
        idMap.set(cat.id, created.id);
      }
    }
    const tasks = local.tasks.map((t) => ({ ...t, categoryId: idMap.get(t.categoryId) ?? t.categoryId }));
    await writeAll(this.db, hid, tasks, newCategories);
  }

  repository(hid: string, uid: string): FirestoreRepository {
    return new FirestoreRepository(this.db, hid, uid);
  }
}

/**
 * Household data in Firestore. Listens live to chores, plots, members and the household doc,
 * emitting a full snapshot whenever anything changes (from this device or another).
 */
export class FirestoreRepository implements DataRepository {
  private changes = new Subject<AppData>();
  readonly externalChanges = this.changes.asObservable();
  private unsubs: Unsubscribe[] = [];

  private tasks: Task[] = [];
  private categories: Category[] = [];
  private members: Member[] = [];
  private household: Household | null = null;
  private loaded = { tasks: false, categories: false, members: false, household: false };

  constructor(private db: Firestore, private hid: string, private uid: string) {}

  load(): Promise<AppData> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const emit = () => {
        if (!Object.values(this.loaded).every(Boolean)) return;
        const data = this.snapshot();
        if (!resolved) {
          resolved = true;
          resolve(data);
        } else {
          this.changes.next(data);
        }
      };
      const fail = (err: unknown) => {
        console.error('Household sync error', err);
        if (!resolved) reject(err);
      };
      const base = ['households', this.hid] as const;

      this.unsubs.push(
        onSnapshot(collection(this.db, ...base, 'tasks'), (snap) => {
          this.tasks = snap.docs.map((d) => deserializeTask({ ...d.data(), id: d.id }));
          this.loaded.tasks = true;
          emit();
        }, fail),
        onSnapshot(collection(this.db, ...base, 'categories'), (snap) => {
          this.categories = snap.docs.map((d) => ({ ...(d.data() as Category), id: d.id }));
          this.loaded.categories = true;
          emit();
        }, fail),
        onSnapshot(collection(this.db, ...base, 'members'), (snap) => {
          this.members = snap.docs.map((d) => ({
            id: d.id,
            displayName: d.data()['displayName'] ?? '?',
            color: d.data()['color'] ?? MEMBER_COLORS[0],
          }));
          this.loaded.members = true;
          emit();
        }, fail),
        onSnapshot(doc(this.db, ...base), (snap) => {
          const d = snap.data();
          this.household = d
            ? { id: this.hid, name: d['name'] ?? '', ownerId: d['ownerId'], inviteCode: d['inviteCode'] }
            : null;
          this.loaded.household = true;
          emit();
        }, fail)
      );
    });
  }

  private snapshot(): AppData {
    // migrate() validates and fixes references (e.g. chores whose plot was deleted on another device)
    const data = migrate({
      version: DATA_VERSION,
      tasks: this.tasks,
      categories: this.categories,
      profile: { displayName: this.members.find((m) => m.id === this.uid)?.displayName ?? '' },
    });
    return { ...data, members: this.members, household: this.household };
  }

  saveTask(task: Task): Promise<void> {
    return setDoc(this.ref('tasks', task.id), toFirestoreTask(task));
  }

  deleteTask(id: string): Promise<void> {
    return deleteDoc(this.ref('tasks', id));
  }

  saveCategory(category: Category): Promise<void> {
    return setDoc(this.ref('categories', category.id), { ...category });
  }

  deleteCategory(id: string): Promise<void> {
    return deleteDoc(this.ref('categories', id));
  }

  saveProfile(profile: Profile): Promise<void> {
    return setDoc(this.ref('members', this.uid), { displayName: profile.displayName }, { merge: true });
  }

  /** Replace all household chores and plots (backup restore). */
  async replaceAll(data: AppData): Promise<void> {
    const batch = writeBatch(this.db);
    for (const t of this.tasks) batch.delete(this.ref('tasks', t.id));
    for (const c of this.categories) batch.delete(this.ref('categories', c.id));
    await batch.commit();
    await writeAll(this.db, this.hid, data.tasks, data.categories);
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  private ref(col: string, id: string) {
    return doc(this.db, 'households', this.hid, col, id);
  }
}

/** Write chores and plots into a household, in batches (Firestore allows up to 500 writes per batch). */
async function writeAll(db: Firestore, hid: string, tasks: Task[], categories: Category[]): Promise<void> {
  const ops: [string, string, Record<string, unknown>][] = [
    ...categories.map((c): [string, string, Record<string, unknown>] => ['categories', c.id, { ...c }]),
    ...tasks.map((t): [string, string, Record<string, unknown>] => ['tasks', t.id, toFirestoreTask(t)]),
  ];
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    for (const [col, id, data] of ops.slice(i, i + 450)) batch.set(doc(db, 'households', hid, col, id), data);
    await batch.commit();
  }
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

// Firestore stores Dates as Timestamps (deserializeTask converts them back)
function toFirestoreTask(task: Task): Record<string, unknown> {
  const out = serializeTask(task);
  for (const [key, value] of Object.entries(task)) {
    if (value instanceof Date) out[key] = Timestamp.fromDate(value);
  }
  return out;
}
