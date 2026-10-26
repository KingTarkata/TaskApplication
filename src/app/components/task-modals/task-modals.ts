import { Component, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerStore } from '../../services/planner-store';
import { UiStateService } from '../../services/ui-state';
import { openModal } from '../../services/modal';
import { RecurrenceFreq, SubTask, Task, TaskStatus, generateUUID } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { Subscription } from 'rxjs';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-task-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modals.html',
  styleUrl: './task-modals.css',
})
export class TaskModals implements OnDestroy {
  store = inject(PlannerStore);
  private ui = inject(UiStateService);
  eTaskStatus = TaskStatus;
  t = TERMS;

  colorOptions = Object.entries(TERMS.categories.colors).map(([value, name]) => ({ value, name }));
  freqOptions: RecurrenceFreq[] = ['daily', 'weekly', 'monthly'];

  // Form fields
  title = '';
  categoryId = '';
  description = '';
  dueDate = ''; // datetime-local string
  subtasks: SubTask[] = [];
  newSubtaskTitle = '';
  repeatFreq: RecurrenceFreq | '' = '';
  repeatInterval = 1;
  isHabit = false;
  reminderMinutes: number | null = null;
  assigneeId: string | null = null;

  // Edit state
  editingId: string | null = null;

  // Plot manager
  newCatName = '';
  newCatColor = 'success';
  showCatManager = false;

  readonly harvested = computed(() =>
    this.store
      .tasks()
      .filter((t) => t.status === TaskStatus.ARCHIVED)
      .sort((a, b) => (b.harvestedAt?.getTime() ?? 0) - (a.harvestedAt?.getTime() ?? 0))
  );

  private editSub: Subscription;

  constructor() {
    this.resetForm();
    this.editSub = this.ui.editRequests.subscribe(({ task, dueDate }) => {
      if (task) this.loadTask(task);
      else this.resetForm(dueDate);
      openModal('addTaskModal');
    });
  }

  ngOnDestroy() {
    this.editSub.unsubscribe();
  }

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  get repeatUnit(): string {
    const units = TERMS.taskForm.units[this.repeatFreq || 'daily'];
    return this.repeatInterval === 1 ? units[0] : units[1];
  }

  private loadTask(task: Task) {
    this.editingId = task.id;
    this.showCatManager = false;
    this.title = task.title;
    this.categoryId = task.categoryId;
    this.description = task.description;
    this.dueDate = task.dueDate ? toLocalInput(task.dueDate) : '';
    this.subtasks = task.subtasks.map((st) => ({ ...st }));
    this.newSubtaskTitle = '';
    this.repeatFreq = task.recurrence?.freq ?? '';
    this.repeatInterval = task.recurrence?.interval ?? 1;
    this.isHabit = !!task.isHabit;
    this.reminderMinutes = task.reminderMinutes ?? null;
    this.assigneeId = task.assigneeId ?? null;
  }

  resetForm(dueDate?: Date) {
    this.editingId = null;
    this.showCatManager = false;
    this.title = '';
    this.description = '';
    this.dueDate = dueDate ? toLocalInput(dueDate) : '';
    this.subtasks = [];
    this.newSubtaskTitle = '';
    this.repeatFreq = '';
    this.repeatInterval = 1;
    this.isHabit = false;
    this.reminderMinutes = null;
    this.assigneeId = this.ui.memberFilter(); // default to whoever the board is filtered to
    this.categoryId = this.store.categories()[0]?.id ?? '';
  }

  // Add SubTask functionality
  addSubtask() {
    const title = this.newSubtaskTitle.trim();
    if (!title) return;
    this.subtasks.push({ id: generateUUID(), title, completed: false });
    this.newSubtaskTitle = '';
  }

  removeSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  saveTask() {
    const title = this.title.trim();
    if (!title) return;
    if (this.newSubtaskTitle.trim()) this.addSubtask(); // don't lose a typed-but-not-added step

    const due = this.dueDate ? new Date(this.dueDate) : undefined;
    const fields: Partial<Task> = {
      title,
      categoryId: this.categoryId || this.store.categories()[0].id,
      description: this.description,
      dueDate: due,
      subtasks: this.subtasks,
      recurrence: this.repeatFreq
        ? { freq: this.repeatFreq, interval: Math.max(1, Math.floor(this.repeatInterval || 1)) }
        : undefined,
      isHabit: !!this.repeatFreq && this.isHabit,
      reminderMinutes: due ? this.reminderMinutes : null,
      assigneeId: this.assigneeId,
    };

    if (this.editingId) {
      this.store.updateTask(this.editingId, fields);
    } else {
      this.store.addTask(fields as Task);
    }
    this.resetForm();
  }

  // ---------- Plots ----------

  addNewCategory() {
    if (this.store.addCategory(this.newCatName, this.newCatColor)) {
      this.newCatName = '';
    }
  }

  renameCategory(category: Category, event: Event) {
    const input = event.target as HTMLInputElement;
    const name = input.value.trim();
    if (name && name !== category.name) this.store.updateCategory(category.id, { name });
    input.value = this.store.categoryById().get(category.id)?.name ?? category.name;
  }

  deleteCategory(category: Category) {
    const count = this.store.countInCategory(category.id);
    const fallback = this.store.categories().find((c) => c.id !== category.id);
    if (!fallback) return;
    if (!confirm(TERMS.categories.confirmDelete(category.name, count, fallback.name))) return;
    this.store.removeCategory(category.id);
    if (this.categoryId === category.id) this.categoryId = fallback.id;
  }

  // ---------- Harvest log ----------

  deleteTask(task: Task) {
    if (confirm(TERMS.archive.confirmDelete(task.title))) {
      this.store.removeTask(task.id);
    }
  }

  replant(task: Task) {
    this.store.setStatus(task.id, TaskStatus.TODO);
  }

  categoryFor(task: Task) {
    return this.store.categoryFor(task);
  }
}

// Date -> "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">
function toLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
