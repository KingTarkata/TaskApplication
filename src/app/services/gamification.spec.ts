import { TestBed } from '@angular/core/testing';

import { GamificationService, XP_RULES, taskXp } from './gamification';
import { PlannerStore } from './planner-store';
import { TaskStatus, createTask } from '../models/task.model';
import { TERMS } from '../terminology';

describe('GamificationService', () => {
  let service: GamificationService;
  let store: PlannerStore;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlannerStore);
    await store.init();
    service = TestBed.inject(GamificationService);
  });

  const plot = () => store.categories()[0].id;

  it('should start at level 1 with no XP', () => {
    const stats = service.stats();
    expect(stats.xp).toBe(0);
    expect(stats.level).toBe(1);
    expect(stats.progress).toBe(0);
  });

  it('should award XP only for harvested tasks, including the step bonus', () => {
    const a = store.addTask({ title: 'Harvested', categoryId: plot(), subtasks: [{ id: 's1', title: 'step', completed: true }] });
    const b = store.addTask({ title: 'Done only', categoryId: plot() });
    store.setStatus(a.id, TaskStatus.ARCHIVED);
    store.setStatus(b.id, TaskStatus.DONE);

    expect(service.stats().xp).toBe(XP_RULES.perTask + XP_RULES.perSubtask);
    expect(service.stats().tasksCompleted).toBe(1);
    expect(service.stats().level).toBe(2);
  });

  it('should give daily repeats less base XP and habits a capped streak bonus', () => {
    const daily = createTask({ title: 'd', categoryId: 'c', recurrence: { freq: 'daily', interval: 1 } });
    expect(taskXp(daily)).toBe(XP_RULES.perDailyTask);
    const habit = createTask({ title: 'h', categoryId: 'c', recurrence: { freq: 'daily', interval: 1 }, isHabit: true, streak: 100 });
    expect(taskXp(habit)).toBe(XP_RULES.perDailyTask + XP_RULES.maxStreakBonus);
  });

  it('should map levels to rank titles from the terminology file', () => {
    const ranks = TERMS.profile.rankTitles;
    expect(service.getTitle(1)).toBe(ranks[0].title);
    expect(service.getTitle(2)).toBe(ranks[1].title);
    expect(service.getTitle(10)).toBe(ranks[3].title);
    expect(service.getTitle(1000)).toBe(ranks[ranks.length - 1].title);
  });
});
