import { Recurrence, Task, TaskStatus, createTask, generateUUID } from './task.model';

/** Move a date forward by one recurrence step, keeping the time of day. */
export function advanceDate(date: Date, rule: Recurrence): Date {
  const next = new Date(date);
  const n = Math.max(1, rule.interval || 1);
  switch (rule.freq) {
    case 'daily':
      next.setDate(next.getDate() + n);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * n);
      break;
    case 'monthly': {
      // Clamp to the last day of the month (Jan 31 + 1 month -> Feb 28/29)
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + n);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, lastDay));
      break;
    }
  }
  return next;
}

/** The first due date after `now`, stepping forward from the current due date (or from now if there is none). */
export function nextDueDate(task: Task, now: Date = new Date()): Date {
  const rule = task.recurrence!;
  let next = advanceDate(task.dueDate ?? now, rule);
  while (next <= now) next = advanceDate(next, rule);
  return next;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** A habit completion counts toward the streak if it happens by the end of its due day. */
export function isOnTime(task: Task, completedAt: Date): boolean {
  return !task.dueDate || completedAt <= endOfDay(task.dueDate);
}

/** Create the next occurrence of a repeating chore: same details, fresh steps, next due date. */
export function buildNextOccurrence(task: Task, carriedStreak: number, now: Date = new Date()): Task {
  return createTask({
    title: task.title,
    description: task.description,
    categoryId: task.categoryId,
    dueDate: nextDueDate(task, now),
    subtasks: task.subtasks.map((s) => ({ id: generateUUID(), title: s.title, completed: false })),
    recurrence: { ...task.recurrence! },
    seriesId: task.seriesId ?? task.id,
    isHabit: task.isHabit,
    streak: task.isHabit ? carriedStreak : undefined,
    reminderMinutes: task.reminderMinutes,
    assigneeId: task.assigneeId,
    createdBy: task.createdBy,
    status: TaskStatus.TODO,
  });
}

/** An occurrence nobody has touched yet can safely be removed if its predecessor is re-opened. */
export function isUntouched(task: Task): boolean {
  return task.status === TaskStatus.TODO && task.subtasks.every((s) => !s.completed);
}
