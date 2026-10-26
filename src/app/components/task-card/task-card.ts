import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category';
import { GamificationService } from '../../services/gamification';
import { TERMS } from '../../terminology';
import { Task, TaskStatus, SubTask } from '../../models/task.model';

// A single task card on the board; buttons and styling adapt to the task's status
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  @Input({ required: true }) task!: Task;

  eTaskStatus = TaskStatus;
  t = TERMS;

  constructor(
    public taskService: TaskService,
    public categoryService: CategoryService,
    public gameService: GamificationService
  ) {}

  get isDone(): boolean {
    return this.task.status === TaskStatus.DONE;
  }

  get colorClass(): string {
    return this.categoryService.getCategoryColor(this.task.type);
  }

  // Progress marker for task based on completed SubTasks
  getProgress(): number {
    if (!this.task.subtasks || this.task.subtasks.length === 0) return 0;
    const done = this.task.subtasks.filter((t) => t.completed).length;
    return Math.round((done / this.task.subtasks.length) * 100);
  }

  toggleSubtask(subtask: SubTask) {
    subtask.completed = !subtask.completed;
    this.taskService.saveToStorage();
  }

  deleteTask() {
    if (confirm(TERMS.card.confirmDelete(this.task.title))) {
      this.taskService.removeTask(this.task.id);
    }
  }

  updateStatus(newStatus: TaskStatus) {
    this.task.status = newStatus;
    this.taskService.saveToStorage();
  }

  // Make due date text red if overdue
  isOverdue(): boolean {
    if (!this.task.dueDate || this.isDone) return false;
    return new Date() > this.task.dueDate;
  }

  onEdit() {
    this.taskService.setTaskToEdit(this.task);
  }
}
