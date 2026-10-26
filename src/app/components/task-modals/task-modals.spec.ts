import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskModals } from './task-modals';
import { PlannerStore } from '../../services/planner-store';
import { UiStateService } from '../../services/ui-state';
import { TaskStatus } from '../../models/task.model';

describe('TaskModals', () => {
  let component: TaskModals;
  let fixture: ComponentFixture<TaskModals>;
  let store: PlannerStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TaskModals],
    }).compileComponents();

    store = TestBed.inject(PlannerStore);
    await store.init();
    fixture = TestBed.createComponent(TaskModals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should keep id, status and createdAt when editing a task', () => {
    const original = store.addTask({
      title: 'Original',
      categoryId: store.categories()[0].id,
      createdAt: new Date(2024, 0, 1),
    });
    store.setStatus(original.id, TaskStatus.IN_PROGRESS);

    TestBed.inject(UiStateService).editTask(store.getTask(original.id)!);
    component.title = 'Renamed';
    component.saveTask();

    const saved = store.getTask(original.id)!;
    expect(saved.title).toBe('Renamed');
    expect(saved.status).toBe(TaskStatus.IN_PROGRESS);
    expect(saved.createdAt.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(store.tasks().length).toBe(1);
  });

  it('should save repeat and habit settings', () => {
    component.title = 'Stretch';
    component.repeatFreq = 'daily';
    component.repeatInterval = 1;
    component.isHabit = true;
    component.saveTask();
    const task = store.tasks()[0];
    expect(task.recurrence).toEqual({ freq: 'daily', interval: 1 });
    expect(task.isHabit).toBeTrue();
    expect(task.seriesId).toBe(task.id);
  });

  it('should not save a task with a blank title', () => {
    component.title = '   ';
    component.saveTask();
    expect(store.tasks().length).toBe(0);
  });
});
