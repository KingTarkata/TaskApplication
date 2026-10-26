import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCard } from './task-card';
import { Task, TaskStatus } from '../../models/task.model';

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TaskCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', new Task('Test task'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate subtask progress', () => {
    component.task.subtasks = [
      { id: 'a', title: 'one', completed: true },
      { id: 'b', title: 'two', completed: false },
    ];
    expect(component.getProgress()).toBe(50);
  });

  it('should not mark completed tasks as overdue', () => {
    component.task.dueDate = new Date(2000, 0, 1);
    expect(component.isOverdue()).toBeTrue();
    component.task.status = TaskStatus.DONE;
    expect(component.isOverdue()).toBeFalse();
  });
});
