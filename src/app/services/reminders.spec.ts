import { dueReminders, reminderTime } from './reminders';
import { TaskStatus, createTask } from '../models/task.model';

describe('reminders', () => {
  const due = new Date(2026, 5, 10, 9, 0);
  const task = (fields = {}) =>
    createTask({ title: 'Water plants', categoryId: 'c', dueDate: due, reminderMinutes: 15, ...fields });

  it('computes the reminder time from the due date', () => {
    expect(reminderTime(task())).toBe(due.getTime() - 15 * 60_000);
    expect(reminderTime(task({ reminderMinutes: null }))).toBeNull();
    expect(reminderTime(task({ status: TaskStatus.DONE }))).toBeNull();
  });

  it('fires once when the time arrives, and again only if the time changes', () => {
    const t = task();
    const at = reminderTime(t)!;
    expect(dueReminders([t], at - 1000, {})).toEqual([]);
    expect(dueReminders([t], at + 1000, {})).toEqual([t]);
    expect(dueReminders([t], at + 1000, { [t.id]: at })).toEqual([]);
    // Rescheduled chore: reminder fires for the new time
    const moved = { ...t, dueDate: new Date(due.getTime() + 3_600_000) };
    expect(dueReminders([moved], reminderTime(moved)! + 1000, { [t.id]: at })).toEqual([moved]);
  });

  it('skips reminders that are many hours stale', () => {
    const t = task();
    expect(dueReminders([t], reminderTime(t)! + 13 * 3_600_000, {})).toEqual([]);
  });
});
