import { advanceDate, nextDueDate, isOnTime } from './recurrence';
import { createTask } from './task.model';

describe('recurrence', () => {
  it('advances daily, weekly and monthly, keeping the time of day', () => {
    const d = new Date(2026, 0, 31, 9, 30);
    expect(advanceDate(d, { freq: 'daily', interval: 2 })).toEqual(new Date(2026, 1, 2, 9, 30));
    expect(advanceDate(d, { freq: 'weekly', interval: 1 })).toEqual(new Date(2026, 1, 7, 9, 30));
    // Jan 31 + 1 month clamps to Feb 28
    expect(advanceDate(d, { freq: 'monthly', interval: 1 })).toEqual(new Date(2026, 1, 28, 9, 30));
  });

  it('skips past dates when a chore is completed late', () => {
    const now = new Date(2026, 5, 10, 12, 0);
    const task = createTask({
      title: 'Water plants',
      categoryId: 'c',
      dueDate: new Date(2026, 5, 7, 8, 0),
      recurrence: { freq: 'daily', interval: 1 },
    });
    expect(nextDueDate(task, now)).toEqual(new Date(2026, 5, 11, 8, 0));
  });

  it('counts completion any time on the due day as on time', () => {
    const task = createTask({ title: 'Walk', categoryId: 'c', dueDate: new Date(2026, 5, 10, 7, 0) });
    expect(isOnTime(task, new Date(2026, 5, 10, 22, 0))).toBeTrue();
    expect(isOnTime(task, new Date(2026, 5, 11, 0, 30))).toBeFalse();
  });
});
