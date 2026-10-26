import { TestBed } from '@angular/core/testing';

import { GamificationService } from './gamification';
import { TaskService } from './task.service';
import { Task, TaskStatus } from '../models/task.model';

describe('GamificationService', () => {
  let service: GamificationService;
  let taskService: TaskService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamificationService);
    taskService = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start at level 1 with no XP', () => {
    const stats = service.getStats();
    expect(stats.xp).toBe(0);
    expect(stats.level).toBe(1);
    expect(stats.progress).toBe(0);
  });

  it('should award XP only for archived tasks, including subtask bonus', () => {
    const archived = new Task('Archived', 'Work', '', undefined, [
      { id: 's1', title: 'step', completed: true },
    ]);
    archived.status = TaskStatus.ARCHIVED;
    const done = new Task('Done');
    done.status = TaskStatus.DONE;
    taskService.addTask(archived);
    taskService.addTask(done);

    const stats = service.getStats();
    expect(stats.xp).toBe(service.XP_PER_TASK + service.XP_PER_SUBTASK);
    expect(stats.tasksCompleted).toBe(1);
  });

  it('should reach level 2 at 100 XP', () => {
    const t = new Task('One');
    t.status = TaskStatus.ARCHIVED;
    taskService.addTask(t);
    expect(service.getStats().level).toBe(2);
  });
});
