import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerStore } from '../../services/planner-store';
import { UiStateService } from '../../services/ui-state';
import { Task, TaskStatus } from '../../models/task.model';
import { advanceDate } from '../../models/recurrence';
import { TERMS } from '../../terminology';

// 0 = Sunday, 1 = Monday
const WEEK_STARTS_ON = 0;

export interface WeekItem {
  task: Task;
  date: Date;
  projected: boolean; // a future repeat that doesn't exist yet (preview only)
}

export interface WeekDay {
  date: Date;
  isToday: boolean;
  items: WeekItem[];
}

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week-view.html',
  styleUrl: './week-view.css',
})
export class WeekView {
  private store = inject(PlannerStore);
  private ui = inject(UiStateService);
  t = TERMS;

  /** First day of the week being shown. */
  readonly weekStart = signal(startOfWeek(new Date()));

  readonly weekEnd = computed(() => addDays(this.weekStart(), 7)); // exclusive

  readonly isCurrentWeek = computed(() => sameDay(this.weekStart(), startOfWeek(new Date())));

  readonly days = computed<WeekDay[]>(() => {
    const start = this.weekStart();
    const end = this.weekEnd();
    const today = startOfDay(new Date());
    const term = this.ui.search();

    const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return { date, isToday: sameDay(date, today), items: [] };
    });
    const place = (item: WeekItem) => {
      const index = Math.floor((startOfDay(item.date).getTime() - start.getTime()) / 86_400_000);
      if (index >= 0 && index < 7) days[index].items.push(item);
    };

    for (const task of this.store.tasks()) {
      if (!task.dueDate || !this.matches(task, term)) continue;
      if (task.dueDate >= start && task.dueDate < end) place({ task, date: task.dueDate, projected: false });

      // Preview future repeats of chores that are still pending
      if (task.recurrence && !isFinished(task)) {
        let next = advanceDate(task.dueDate, task.recurrence);
        for (let guard = 0; next < end && guard < 400; guard++) {
          if (next >= start) place({ task, date: next, projected: true });
          next = advanceDate(next, task.recurrence);
        }
      }
    }

    for (const day of days) day.items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return days;
  });

  /** Unfinished chores due before today (only shown on the current week). */
  readonly overdue = computed(() => {
    const today = startOfDay(new Date());
    const term = this.ui.search();
    return this.store
      .tasks()
      .filter((t) => t.dueDate && t.dueDate < today && !isFinished(t) && this.matches(t, term))
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  });

  /** Unfinished chores with no date. */
  readonly anytime = computed(() => {
    const term = this.ui.search();
    return this.store.tasks().filter((t) => !t.dueDate && !isFinished(t) && this.matches(t, term));
  });

  readonly rangeLabel = computed(() => {
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return TERMS.week.range(fmt(this.weekStart()), fmt(addDays(this.weekStart(), 6)));
  });

  previousWeek() {
    this.weekStart.update((d) => addDays(d, -7));
  }

  nextWeek() {
    this.weekStart.update((d) => addDays(d, 7));
  }

  goToToday() {
    this.weekStart.set(startOfWeek(new Date()));
  }

  isFinished(task: Task): boolean {
    return isFinished(task);
  }

  colorFor(task: Task): string {
    return this.store.categoryFor(task).colorClass;
  }

  /** Tick a chore done (or back to growing if it was already done but not harvested). */
  toggleDone(task: Task) {
    if (task.status === TaskStatus.ARCHIVED) return;
    this.store.setStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE);
  }

  edit(task: Task) {
    this.ui.editTask(task);
  }

  /** New chore on a given day, at 9am (or the next hour if that day is today). */
  addOn(day: Date) {
    const due = new Date(day);
    const now = new Date();
    if (sameDay(day, now)) due.setHours(Math.min(now.getHours() + 1, 23), 0, 0, 0);
    else due.setHours(9, 0, 0, 0);
    this.ui.newTask(due);
  }

  dayLabel(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  private matches(task: Task, term: string): boolean {
    if (!term) return true;
    return (
      task.title.toLowerCase().includes(term) ||
      task.description.toLowerCase().includes(term) ||
      this.store.categoryFor(task).name.toLowerCase().includes(term)
    );
  }
}

function isFinished(task: Task): boolean {
  return task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const diff = (d.getDay() - WEEK_STARTS_ON + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
