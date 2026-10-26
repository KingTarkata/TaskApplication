import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskModals } from './task-modals';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus } from '../../models/task.model';

describe('TaskModals', () => {
  let component: TaskModals;
  let fixture: ComponentFixture<TaskModals>;
  let taskService: TaskService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TaskModals],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskModals);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep id, status and createdAt when editing a task', () => {
    const original = new Task('Original');
    original.createdAt = new Date(2024, 0, 1);
    original.status = TaskStatus.IN_PROGRESS;
    taskService.addTask(original);

    taskService.setTaskToEdit(original);
    component.newTaskTitle = 'Renamed';
    component.saveTask();

    const saved = taskService.tasks.find((t) => t.id === original.id)!;
    expect(saved.title).toBe('Renamed');
    expect(saved.status).toBe(TaskStatus.IN_PROGRESS);
    expect(saved.createdAt.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(taskService.tasks.length).toBe(1);
  });

  it('should not save a task with a blank title', () => {
    component.newTaskTitle = '   ';
    component.saveTask();
    expect(taskService.tasks.length).toBe(0);
  });
});
