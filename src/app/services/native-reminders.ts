import { Capacitor } from '@capacitor/core';
import { LocalNotificationSchema, LocalNotifications } from '@capacitor/local-notifications';
import { Task } from '../models/task.model';
import { reminderTime } from './reminders';

/** True inside the Android/iOS app (Capacitor), false in a browser. */
export const isNativeApp = Capacitor.isNativePlatform();

// Notification ids must be 32-bit ints; derive a stable one from the task id
function notificationId(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) hash = (Math.imul(31, hash) + taskId.charCodeAt(i)) | 0;
  return Math.abs(hash) % 2_000_000_000;
}

/**
 * Native reminders: hand every upcoming reminder to the operating system, which shows them on time
 * even when the app is closed. Called again whenever chores change (replaces what was scheduled).
 */
export async function scheduleNativeReminders(tasks: Task[], describe: (task: Task) => string): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }

  // Exact timing needs Android's "Alarms & reminders" access (off by default on Android 14+).
  // Without it, schedule normally (may arrive a few minutes late) rather than prompting.
  const exact = (await exactAlarmsAllowed()) ?? true;

  const now = Date.now();
  const notifications = tasks
    .map((task) => ({ task, at: reminderTime(task) }))
    .filter((r): r is { task: Task; at: number } => r.at !== null && r.at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, 60) // OSes cap pending notifications (iOS: 64)
    .map(({ task, at }) => ({
      id: notificationId(task.id),
      title: task.title,
      body: describe(task),
      schedule: { at: new Date(at), allowWhileIdle: exact },
      extra: { taskId: task.id },
      // Android plugin option (not in its typings): without this it opens the "Alarms & reminders"
      // settings screen on every schedule call when exact alarms aren't allowed
      isExactNotification: exact,
    })) as LocalNotificationSchema[];

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

export async function requestNativePermission(): Promise<'granted' | 'denied'> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted' ? 'granted' : 'denied';
}

export async function nativePermission(): Promise<'granted' | 'denied' | 'default'> {
  const result = await LocalNotifications.checkPermissions();
  return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default';
}

export async function cancelNativeReminders(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }
}

/** Run `handler(taskId)` when a reminder notification is tapped. */
export function onNativeReminderTap(handler: (taskId: string | undefined) => void): void {
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    handler(action.notification.extra?.taskId);
  });
}

/** Fire a notification right away (Settings → Send a test). */
export async function sendNativeTest(title: string, body: string): Promise<void> {
  await LocalNotifications.schedule({
    notifications: [
      { id: 1, title, body, schedule: { at: new Date(Date.now() + 1000) }, isExactNotification: false } as LocalNotificationSchema,
    ],
  });
}

/** Android only: whether exact-time alarms are allowed (null where the setting doesn't exist, e.g. iOS). */
export async function exactAlarmsAllowed(): Promise<boolean | null> {
  if (Capacitor.getPlatform() !== 'android') return null;
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return null;
  }
}

/** Open Android's "Alarms & reminders" setting for this app. */
export async function openExactAlarmSetting(): Promise<boolean | null> {
  await LocalNotifications.changeExactNotificationSetting();
  return exactAlarmsAllowed();
}
