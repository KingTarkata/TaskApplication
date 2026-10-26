import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerStore } from '../../services/planner-store';
import { GamificationService } from '../../services/gamification';
import { UiStateService } from '../../services/ui-state';
import { TERMS } from '../../terminology';
import { Task, TaskStatus, SubTask } from '../../models/task.model';
import { endOfDay } from '../../models/recurrence';
import { initials } from '../../models/member.model';

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

  private store = inject(PlannerStore);
  private ui = inject(UiStateService);
  gameService = inject(GamificationService);
  eTaskStatus = TaskStatus;
  t = TERMS;

  // Whether the step checklist is expanded
  showSteps = false;

  get isDone(): boolean {
    return this.task.status === TaskStatus.DONE;
  }

  get category() {
    return this.store.categoryFor(this.task);
  }

  initials = initials;

  get assignee() {
    return this.store.memberFor(this.task);
  }

  get colorClass(): string {
    return this.category.colorClass;
  }

  get repeatLabel(): string {
    const r = this.task.recurrence;
    return r ? TERMS.recurrence.describe(r.freq, r.interval) : '';
  }

  get completedSteps(): number {
    return this.task.subtasks.filter((s) => s.completed).length;
  }

  // Progress marker for task based on completed SubTasks
  getProgress(): number {
    if (this.task.subtasks.length === 0) return 0;
    return Math.round((this.completedSteps / this.task.subtasks.length) * 100);
  }

  toggleSubtask(subtask: SubTask) {
    this.store.toggleSubtask(this.task.id, subtask.id);
  }

  deleteTask() {
    if (confirm(TERMS.card.confirmDelete(this.task.title))) {
      this.store.removeTask(this.task.id);
    }
  }

  updateStatus(newStatus: TaskStatus) {
    this.store.setStatus(this.task.id, newStatus);
  }

  // Overdue = past the due time (habits get until the end of the day)
  isOverdue(): boolean {
    if (!this.task.dueDate || this.isDone) return false;
    const limit = this.task.isHabit ? endOfDay(this.task.dueDate) : this.task.dueDate;
    return new Date() > limit;
  }

  // How soon the chore is due, for the due-date chip
  dueState(): 'overdue' | 'today' | 'tomorrow' | 'later' {
    if (this.isOverdue()) return 'overdue';
    const due = this.task.dueDate!;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((due.getTime() - startOfToday.getTime()) / 86_400_000);
    if (dayDiff <= 0) return 'today';
    if (dayDiff === 1) return 'tomorrow';
    return 'later';
  }

  onEdit() {
    this.ui.editTask(this.task);
  }
}
