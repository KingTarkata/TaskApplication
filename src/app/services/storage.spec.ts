import { TestBed } from '@angular/core/testing';

import { StorageService, STORAGE_KEYS } from './storage';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should return the fallback for missing or corrupt data', () => {
    expect(service.getJson('missing', 42)).toBe(42);
    localStorage.setItem('bad', '{not json');
    expect(service.getJson('bad', [])).toEqual([]);
  });

  it('should not crash TaskService when stored tasks are corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.tasks, '{not json');
    const tasks = TestBed.inject(TaskService);
    expect(tasks.tasks).toEqual([]);
  });

  it('should round-trip tasks with real Date objects', () => {
    const due = new Date(2030, 5, 1, 9, 30);
    TestBed.inject(TaskService).addTask(new Task('Persist me', 'Work', 'notes', due));

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(TaskService);
    expect(reloaded.tasks.length).toBe(1);
    expect(reloaded.tasks[0].dueDate instanceof Date).toBeTrue();
    expect(reloaded.tasks[0].dueDate?.getTime()).toBe(due.getTime());
  });
});
