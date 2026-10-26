import { Injectable, computed, inject, signal } from '@angular/core';
import { DATA_REPOSITORY } from '../data/data-repository';
import { AppData, Profile, defaultAppData, migrate } from '../models/app-data';
import { Category } from '../models/category.model';
import { SubTask, Task, TaskStatus, createTask, generateUUID } from '../models/task.model';
import { buildNextOccurrence, isOnTime, isUntouched } from '../models/recurrence';
import { TERMS } from '../terminology';

/**
 * The single source of truth for app data. Components read the signals; every change goes through
 * a method here, which updates the signals immediately and then persists via the DataRepository.
 */
@Injectable({ providedIn: 'root' })
export class PlannerStore {
  private repo = inject(DATA_REPOSITORY);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _categories = signal<Category[]>(defaultAppData().categories);
  private readonly _profile = signal<Profile>(defaultAppData().profile);

  readonly tasks = this._tasks.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly ready = signal(false);

  /** Who is acting (set once signed in to a household; null on a single device). */
  readonly currentMemberId = signal<string | null>(null);

  readonly categoryById = computed(() => new Map(this._categories().map((c) => [c.id, c])));

  async init(): Promise<void> {
    this.apply(await this.repo.load());
    this.repo.externalChanges.subscribe((data) => this.apply(data));
    this.ready.set(true);
  }

  private apply(data: AppData) {
    this._tasks.set(data.tasks);
    this._categories.set(data.categories);
    this._profile.set(data.profile);
  }

  snapshot(): AppData {
    return {
      version: defaultAppData().version,
      tasks: this._tasks(),
      categories: this._categories(),
      profile: this._profile(),
    };
  }

  // ---------- Lookups ----------

  getTask(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  categoryFor(task: Task): Category {
    return (
      this.categoryById().get(task.categoryId) ?? {
        id: task.categoryId,
        name: TERMS.categories.unknown,
        colorClass: 'secondary',
      }
    );
  }

  // ---------- Tasks ----------

  addTask(fields: Partial<Task> & Pick<Task, 'title' | 'categoryId'>): Task {
    const task = createTask({ createdBy: this.currentMemberId(), ...fields });
    if (task.recurrence && !task.seriesId) task.seriesId = task.id;
    if (task.isHabit && task.streak === undefined) task.streak = 0;
    this.put(task);
    return task;
  }

  /** Apply edits to a task (not for status changes — use setStatus). */
  updateTask(id: string, changes: Partial<Task>): void {
    const task = this.getTask(id);
    if (!task) return;
    const updated: Task = { ...task, ...changes, id, updatedAt: new Date() };
    if (updated.recurrence && !updated.seriesId) updated.seriesId = updated.id;
    if (!updated.recurrence) updated.isHabit = false;
    if (updated.isHabit && updated.streak === undefined) updated.streak = 0;
    this.put(updated);
  }

  removeTask(id: string): void {
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    this.persist(this.repo.deleteTask(id));
  }

  toggleSubtask(taskId: string, subtaskId: string): void {
    const task = this.getTask(taskId);
    if (!task) return;
    const subtasks: SubTask[] = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    this.updateTask(taskId, { subtasks });
  }

  /**
   * Move a task between columns. Handles the bookkeeping:
   * completion/harvest timestamps, habit streaks, and spawning the next occurrence of repeating chores.
   */
  setStatus(id: string, status: TaskStatus, now: Date = new Date()): void {
    const task = this.getTask(id);
    if (!task || task.status === status) return;

    const updated: Task = { ...task, status, updatedAt: now };

    if (status === TaskStatus.DONE) {
      updated.completedAt = now;
      if (task.isHabit) {
        updated.streakBefore = task.streak ?? 0;
        updated.streak = isOnTime(task, now) ? (task.streak ?? 0) + 1 : 1;
      }
      if (task.recurrence && !task.nextOccurrenceId) {
        const next = buildNextOccurrence(task, updated.streak ?? 0, now);
        updated.nextOccurrenceId = next.id;
        this.put(next);
      }
    } else if (status === TaskStatus.ARCHIVED) {
      updated.harvestedAt = now;
      updated.harvestedBy = this.currentMemberId();
      updated.completedAt ??= now;
    } else if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
      // Re-opened: undo completion, the streak bump, and an untouched next occurrence
      delete updated.completedAt;
      delete updated.harvestedAt;
      delete updated.harvestedBy;
      if (task.isHabit && task.streakBefore !== undefined) {
        updated.streak = task.streakBefore;
        delete updated.streakBefore;
      }
      const next = task.nextOccurrenceId ? this.getTask(task.nextOccurrenceId) : undefined;
      if (next && isUntouched(next)) {
        this.removeTask(next.id);
        delete updated.nextOccurrenceId;
      }
    }

    this.put(updated);
  }

  // ---------- Categories (plots) ----------

  addCategory(name: string, colorClass: string): Category | null {
    name = name.trim();
    // Names must be unique so the picker is unambiguous
    if (!name || this._categories().some((c) => c.name.toLowerCase() === name.toLowerCase())) return null;
    const category: Category = { id: generateUUID(), name, colorClass };
    this._categories.update((cats) => [...cats, category]);
    this.persist(this.repo.saveCategory(category));
    return category;
  }

  updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): void {
    const existing = this.categoryById().get(id);
    if (!existing) return;
    const name = changes.name?.trim();
    if (name !== undefined && (!name || this._categories().some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase()))) {
      return;
    }
    const updated: Category = { ...existing, ...changes, ...(name ? { name } : {}) };
    this._categories.update((cats) => cats.map((c) => (c.id === id ? updated : c)));
    this.persist(this.repo.saveCategory(updated));
  }

  /** Delete a plot; its chores move to the first remaining plot. The last plot can't be deleted. */
  removeCategory(id: string): void {
    const remaining = this._categories().filter((c) => c.id !== id);
    if (remaining.length === 0 || remaining.length === this._categories().length) return;
    const fallback = remaining[0].id;
    for (const task of this._tasks().filter((t) => t.categoryId === id)) {
      this.put({ ...task, categoryId: fallback, updatedAt: new Date() });
    }
    this._categories.set(remaining);
    this.persist(this.repo.deleteCategory(id));
  }

  countInCategory(id: string): number {
    return this._tasks().filter((t) => t.categoryId === id).length;
  }

  // ---------- Profile ----------

  updateProfile(changes: Partial<Profile>): void {
    const profile = { ...this._profile(), ...changes };
    this._profile.set(profile);
    this.persist(this.repo.saveProfile(profile));
  }

  // ---------- Backup ----------

  /** Replace everything with imported data (any supported version). Throws if the data is invalid. */
  async restore(raw: unknown): Promise<void> {
    const data = migrate(raw);
    this.apply(data);
    await this.repo.replaceAll(data);
  }

  // ---------- Internals ----------

  private put(task: Task) {
    this._tasks.update((tasks) => {
      const i = tasks.findIndex((t) => t.id === task.id);
      if (i === -1) return [...tasks, task];
      const copy = tasks.slice();
      copy[i] = task;
      return copy;
    });
    this.persist(this.repo.saveTask(task));
  }

  private persist(op: Promise<void>) {
    op.catch((err) => console.error('Failed to save change.', err));
  }
}
