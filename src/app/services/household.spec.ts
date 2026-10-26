import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PlannerStore } from './planner-store';
import { GamificationService, creditedTo } from './gamification';
import { UiStateService } from './ui-state';
import { DataRepository } from '../data/data-repository';
import { AppData, defaultAppData } from '../models/app-data';
import { TaskStatus, createTask } from '../models/task.model';

/** In-memory stand-in for the Firestore household repository. */
class FakeHouseholdRepo implements DataRepository {
  changes = new Subject<AppData>();
  externalChanges = this.changes.asObservable();
  saved: string[] = [];
  disposed = false;
  constructor(private data: AppData) {}
  async load() {
    return this.data;
  }
  async saveTask(t: { id: string }) {
    this.saved.push(t.id);
  }
  async deleteTask() {}
  async saveCategory() {}
  async deleteCategory() {}
  async saveProfile() {}
  async replaceAll() {}
  dispose() {
    this.disposed = true;
  }
}

describe('household mode', () => {
  let store: PlannerStore;
  let game: GamificationService;
  const plot = defaultAppData().categories[0].id;

  const householdData = (): AppData => ({
    ...defaultAppData(),
    tasks: [
      { ...createTask({ title: 'Alice harvested', categoryId: plot }), status: TaskStatus.ARCHIVED, harvestedBy: 'alice' },
      { ...createTask({ title: 'Bob assigned', categoryId: plot }), status: TaskStatus.ARCHIVED, assigneeId: 'bob' },
      createTask({ title: 'For Bob', categoryId: plot, assigneeId: 'bob' }),
    ],
    members: [
      { id: 'alice', displayName: 'Alice', color: 'sage' },
      { id: 'bob', displayName: 'Bob', color: 'berry' },
    ],
    household: { id: 'h1', name: 'Home', ownerId: 'alice' },
  });

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlannerStore);
    game = TestBed.inject(GamificationService);
    await store.init();
  });

  it('switches to a household repository and back to this device', async () => {
    store.addTask({ title: 'Local only', categoryId: plot });
    const repo = new FakeHouseholdRepo(householdData());

    await store.useRepository(repo, 'alice');
    expect(store.isShared()).toBeTrue();
    expect(store.currentMemberId()).toBe('alice');
    expect(store.tasks().map((t) => t.title)).not.toContain('Local only');

    // New chores go to the household and record who made them
    const t = store.addTask({ title: 'Shared', categoryId: plot });
    expect(repo.saved).toContain(t.id);
    expect(t.createdBy).toBe('alice');

    // Live updates from other devices are applied
    repo.changes.next({ ...householdData(), tasks: [] });
    expect(store.tasks().length).toBe(0);

    await store.useLocal();
    expect(repo.disposed).toBeTrue();
    expect(store.isShared()).toBeFalse();
    expect(store.tasks().map((t) => t.title)).toEqual(['Local only']);
  });

  it('credits XP to the harvester, else the assignee, and builds a leaderboard', async () => {
    await store.useRepository(new FakeHouseholdRepo(householdData()), 'alice');
    expect(creditedTo(store.tasks()[0])).toBe('alice');
    expect(creditedTo(store.tasks()[1])).toBe('bob');

    expect(game.stats().xp).toBe(100); // only Alice's
    expect(game.householdStats().xp).toBe(200);
    expect(game.leaderboard().map((r) => [r.member.displayName, r.stats.xp])).toEqual([
      ['Alice', 100],
      ['Bob', 100],
    ]);
  });

  it('records who harvested a chore', async () => {
    await store.useRepository(new FakeHouseholdRepo(householdData()), 'bob');
    const forBob = store.tasks().find((t) => t.title === 'For Bob')!;
    store.setStatus(forBob.id, TaskStatus.ARCHIVED);
    expect(store.getTask(forBob.id)!.harvestedBy).toBe('bob');
  });

  it('filters chores by member', async () => {
    await store.useRepository(new FakeHouseholdRepo(householdData()), 'alice');
    const ui = TestBed.inject(UiStateService);
    const forBob = store.tasks().find((t) => t.title === 'For Bob')!;
    expect(ui.matchesMember(forBob)).toBeTrue();
    ui.memberFilter.set('alice');
    expect(ui.matchesMember(forBob)).toBeFalse();
    ui.memberFilter.set('bob');
    expect(ui.matchesMember(forBob)).toBeTrue();
  });
});
