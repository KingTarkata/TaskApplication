import { Injectable, NgZone, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlannerStore } from './planner-store';
import { StorageService, STORAGE_KEYS } from './storage';
import { ToastService } from './toast';
import { UiStateService } from './ui-state';
import { Task, TaskStatus } from '../models/task.model';
import { TERMS } from '../terminology';
import {
  cancelNativeReminders,
  isNativeApp,
  nativePermission,
  onNativeReminderTap,
  requestNativePermission,
  scheduleNativeReminders,
  sendNativeTest,
  exactAlarmsAllowed,
  openExactAlarmSetting,
} from './native-reminders';

export type ReminderPermission = 'granted' | 'denied' | 'default' | 'unsupported';

interface ReminderPrefs {
  enabled: boolean;
  /** taskId -> reminder time (ms) already shown, so each reminder fires once */
  sent: Record<string, number>;
}

/** Reminders older than this when the app opens are skipped rather than shown late. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
/** Safety-net check interval (browsers throttle long timers in the background). */
const CHECK_EVERY_MS = 30 * 1000;

/** When a task's reminder should fire, or null if it has none / is finished. */
export function reminderTime(task: Task): number | null {
  if (task.reminderMinutes == null || !task.dueDate) return null;
  if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) return null;
  return task.dueDate.getTime() - task.reminderMinutes * 60_000;
}

/** Tasks whose reminder time has arrived (and isn't stale) and hasn't been shown yet. */
export function dueReminders(tasks: Task[], now: number, sent: Record<string, number>): Task[] {
  return tasks.filter((task) => {
    const at = reminderTime(task);
    return at !== null && at <= now && now - at < STALE_AFTER_MS && sent[task.id] !== at;
  });
}

/**
 * Shows reminders for upcoming chores: a system notification (when allowed) plus an in-app toast.
 * Works while the app is open or alive in the background. A native build can replace this with
 * OS-scheduled notifications that fire even when the app is closed.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private store = inject(PlannerStore);
  private storage = inject(StorageService);
  private toasts = inject(ToastService);
  private ui = inject(UiStateService);
  private router = inject(Router);
  private zone = inject(NgZone);

  private prefs = signal<ReminderPrefs>(this.loadPrefs());
  readonly enabled = computed(() => this.prefs().enabled);
  readonly permission = signal<ReminderPermission>(currentPermission());
  /** Android: exact-time alarms allowed? (null = not applicable) */
  readonly exactAllowed = signal<boolean | null>(null);
  readonly isNative = isNativeApp;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  constructor() {
    // Re-plan whenever chores change
    effect(() => {
      this.store.tasks();
      if (this.started) this.schedule();
    });
  }

  /** Begin watching for reminders (called once at app start). */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (isNativeApp) {
      nativePermission().then((p) => this.permission.set(p));
      exactAlarmsAllowed().then((e) => this.exactAllowed.set(e));
      // Re-check after returning from the system settings screen
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          exactAlarmsAllowed().then((e) => this.zone.run(() => {
            this.exactAllowed.set(e);
            this.schedule();
          }));
        }
      });
      onNativeReminderTap((taskId) =>
        this.zone.run(() => {
          this.router.navigateByUrl('/week');
          const task = taskId ? this.store.getTask(taskId) : undefined;
          if (task) this.ui.editTask(task);
        })
      );
    }
    this.zone.runOutsideAngular(() => setInterval(() => this.zone.run(() => this.check()), CHECK_EVERY_MS));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.zone.run(() => this.check());
    });
    this.check();
  }

  /** Turn reminders on (asking for notification permission) or off. */
  async setEnabled(on: boolean): Promise<void> {
    if (on && this.permission() === 'default') {
      try {
        this.permission.set(
          isNativeApp ? await requestNativePermission() : ((await Notification.requestPermission()) as ReminderPermission)
        );
      } catch {
        this.permission.set(currentPermission());
      }
    }
    let sent = this.prefs().sent;
    if (on && !this.enabled()) {
      // Don't flood with reminders that came due while they were off
      sent = { ...sent };
      for (const task of dueReminders(this.store.tasks(), Date.now(), sent)) sent[task.id] = reminderTime(task)!;
    }
    this.savePrefs({ enabled: on, sent });
    this.check();
  }

  /** Android: open the "Alarms & reminders" setting so reminders arrive exactly on time. */
  async allowExactAlarms(): Promise<void> {
    this.exactAllowed.set(await openExactAlarmSetting());
  }

  async sendTest(): Promise<void> {
    await this.notify(TERMS.app.name, TERMS.reminders.testBody, 'hearthstead-test');
    this.toasts.show({ icon: 'bi-bell', title: TERMS.app.name, body: TERMS.reminders.testBody }, 4000);
  }

  /** Show anything that's due now, then set a timer for the next one. */
  check(): void {
    if (!this.enabled()) return;
    const now = Date.now();
    const due = dueReminders(this.store.tasks(), now, this.prefs().sent);
    if (due.length) {
      const sent = { ...this.prefs().sent };
      for (const task of due) {
        sent[task.id] = reminderTime(task)!;
        this.fire(task);
      }
      this.savePrefs({ ...this.prefs(), sent: this.prune(sent) });
    }
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (isNativeApp) this.scheduleNative();
    if (!this.enabled()) return;
    const now = Date.now();
    const next = this.store
      .tasks()
      .map(reminderTime)
      .filter((at): at is number => at !== null && at > now)
      .sort((a, b) => a - b)[0];
    // Only arm precise timers for the next 24h; the interval check covers the rest
    if (next !== undefined && next - now < 24 * 60 * 60 * 1000) {
      this.zone.runOutsideAngular(() => {
        this.timer = setTimeout(() => this.zone.run(() => this.check()), next - now + 500);
      });
    }
  }

  private fire(task: Task): void {
    const when = formatTime(task.dueDate!);
    const body = TERMS.reminders.body(when);
    this.notify(task.title, body, `chore-${task.id}`);
    this.toasts.show({
      icon: 'bi-bell',
      title: task.title,
      body,
      action: {
        label: TERMS.reminders.open,
        run: () => {
          const latest = this.store.getTask(task.id);
          if (latest) this.ui.editTask(latest);
        },
      },
    }, 0); // stays until dismissed so it isn't missed
  }

  // Native app: the OS shows reminders itself (even when closed); keep its schedule in sync, debounced
  private nativeTimer: ReturnType<typeof setTimeout> | null = null;
  private scheduleNative(): void {
    if (this.nativeTimer) clearTimeout(this.nativeTimer);
    this.nativeTimer = setTimeout(() => {
      const work = this.enabled() && this.permission() === 'granted'
        ? scheduleNativeReminders(this.store.tasks(), (task) => TERMS.reminders.body(formatTime(task.dueDate!)))
        : cancelNativeReminders();
      work.catch((err) => console.warn('Could not schedule reminders', err));
    }, 500);
  }

  /** System notification via the service worker when available (required on Android), else the page API. */
  private async notify(title: string, body: string, tag: string): Promise<void> {
    if (this.permission() !== 'granted') return;
    if (isNativeApp) {
      // Scheduled reminders are shown by the OS; only the test notification is sent from here
      if (tag === 'hearthstead-test') await sendNativeTest(title, body);
      return;
    }
    const options: NotificationOptions & Record<string, unknown> = {
      body,
      tag,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-96x96.png',
      // Tells the Angular service worker what to do when the notification is tapped
      data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: '/week' } } },
    };
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        this.zone.run(() => this.router.navigateByUrl('/week'));
      };
    } catch (err) {
      console.warn('Could not show notification.', err);
    }
  }

  // Forget entries for chores that no longer exist
  private prune(sent: Record<string, number>): Record<string, number> {
    const ids = new Set(this.store.tasks().map((t) => t.id));
    return Object.fromEntries(Object.entries(sent).filter(([id]) => ids.has(id)));
  }

  private loadPrefs(): ReminderPrefs {
    const saved = this.storage.getJson<Partial<ReminderPrefs>>(STORAGE_KEYS.reminders, {});
    return { enabled: !!saved.enabled, sent: saved.sent ?? {} };
  }

  private savePrefs(prefs: ReminderPrefs): void {
    this.prefs.set(prefs);
    this.storage.setJson(STORAGE_KEYS.reminders, prefs);
  }
}

function currentPermission(): ReminderPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : (Notification.permission as ReminderPermission);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
