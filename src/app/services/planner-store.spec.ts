import { TestBed } from '@angular/core/testing';
import { PlannerStore } from './planner-store';
import { TaskStatus } from '../models/task.model';

describe('PlannerStore', () => {
  let store: PlannerStore;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlannerStore);
    await store.init();
  });

  const plot = () => store.categories()[0].id;

  it('starts with the default plots and persists new tasks', async () => {
    expect(store.categories().length).toBe(3);
    store.addTask({ title: 'Sweep', categoryId: plot() });

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(PlannerStore);
    await reloaded.init();
    expect(reloaded.tasks().map((t) => t.title)).toEqual(['Sweep']);
  });

  it('migrates legacy Directive Zero storage on first run', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    localStorage.setItem(
      'directive_zero_tasks',
      JSON.stringify([
        { id: 'x', title: 'Legacy', description: '', type: 'Work', status: 'To Do', createdAt: new Date().toISOString(), subtasks: [] },
      ])
    );
    localStorage.setItem('directive_zero_categories', JSON.stringify([{ id: '1', name: 'Work', colorClass: 'primary' }]));
    localStorage.setItem('directive_zero_codename', 'Operative J');

    const fresh = TestBed.inject(PlannerStore);
    await fresh.init();
    expect(fresh.tasks()[0].title).toBe('Legacy');
    expect(fresh.tasks()[0].status).toBe(TaskStatus.TODO);
    expect(fresh.profile().displayName).toBe('Operative J');
    expect(localStorage.getItem('hearthstead_data')).toBeTruthy();
  });

  it('spawns the next occurrence when a repeating chore is done, and undoes it on re-open', () => {
    const now = new Date(2026, 5, 10, 9, 0);
    const task = store.addTask({
      title: 'Water plants',
      categoryId: plot(),
      dueDate: new Date(2026, 5, 10, 8, 0),
      recurrence: { freq: 'daily', interval: 1 },
    });

    store.setStatus(task.id, TaskStatus.DONE, now);
    const done = store.getTask(task.id)!;
    const next = store.getTask(done.nextOccurrenceId!)!;
    expect(next.status).toBe(TaskStatus.TODO);
    expect(next.seriesId).toBe(task.id);
    expect(next.dueDate).toEqual(new Date(2026, 5, 11, 8, 0));

    // Harvesting after done must not create a duplicate
    store.setStatus(task.id, TaskStatus.ARCHIVED, now);
    expect(store.tasks().length).toBe(2);

    // Re-opening removes the untouched next occurrence
    store.setStatus(task.id, TaskStatus.IN_PROGRESS, now);
    expect(store.tasks().length).toBe(1);
    expect(store.getTask(task.id)!.completedAt).toBeUndefined();
  });

  it('grows a habit streak for on-time completions and resets it when late', () => {
    const habit = store.addTask({
      title: 'Stretch',
      categoryId: plot(),
      isHabit: true,
      dueDate: new Date(2026, 5, 10, 7, 0),
      recurrence: { freq: 'daily', interval: 1 },
    });
    expect(habit.streak).toBe(0);

    store.setStatus(habit.id, TaskStatus.DONE, new Date(2026, 5, 10, 20, 0));
    const day2 = store.getTask(store.getTask(habit.id)!.nextOccurrenceId!)!;
    expect(store.getTask(habit.id)!.streak).toBe(1);
    expect(day2.streak).toBe(1);

    // Day 2 done two days late: streak restarts at 1
    store.setStatus(day2.id, TaskStatus.DONE, new Date(2026, 5, 13, 9, 0));
    expect(store.getTask(day2.id)!.streak).toBe(1);
  });

  it('moves chores to another plot when their plot is deleted', () => {
    const [first, second] = store.categories();
    const task = store.addTask({ title: 'Fix fence', categoryId: second.id });
    store.removeCategory(second.id);
    expect(store.getTask(task.id)!.categoryId).toBe(first.id);
    expect(store.categories().some((c) => c.id === second.id)).toBeFalse();
  });

  it('restores from an old backup file', async () => {
    await store.restore({
      tasks: [{ id: 'z', title: 'From backup', type: 'Hobby', status: 'Done', createdAt: new Date().toISOString(), subtasks: [] }],
      categories: [{ id: 'h', name: 'Hobby', colorClass: 'warning' }],
      profile: { codename: 'Restored' },
    });
    expect(store.tasks()[0].status).toBe(TaskStatus.DONE);
    expect(store.profile().displayName).toBe('Restored');
  });
});
