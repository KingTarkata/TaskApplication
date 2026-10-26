import { Component, computed, inject } from '@angular/core';
import { PlannerStore } from '../../services/planner-store';
import { GamificationService } from '../../services/gamification';
import { UiStateService } from '../../services/ui-state';
import { Task, TaskStatus } from '../../models/task.model';
import { TaskCard } from '../task-card/task-card';
import { MemberFilter } from '../member-filter/member-filter';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [TaskCard, MemberFilter],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard {
  private store = inject(PlannerStore);
  private ui = inject(UiStateService);
  gameService = inject(GamificationService);
  eTaskStatus = TaskStatus;
  t = TERMS;

  // Board columns, in display order
  columns = [
    { status: TaskStatus.TODO, label: TERMS.board.columns.todo, tab: TERMS.board.tabs.todo, icon: TERMS.icons.todo, color: 'rain', empty: TERMS.board.empty.todo },
    { status: TaskStatus.IN_PROGRESS, label: TERMS.board.columns.inProgress, tab: TERMS.board.tabs.inProgress, icon: TERMS.icons.inProgress, color: 'honey', empty: TERMS.board.empty.inProgress },
    { status: TaskStatus.DONE, label: TERMS.board.columns.done, tab: TERMS.board.tabs.done, icon: TERMS.icons.done, color: 'sage', empty: TERMS.board.empty.done },
  ];

  // Which column is shown on phones (all three show side by side on larger screens)
  activeStatus: TaskStatus = TaskStatus.TODO;

  // Tasks per column, filtered by search (title, notes, or plot name), soonest due first
  private readonly byStatus = computed(() => {
    const term = this.ui.search();
    const groups = new Map<TaskStatus, Task[]>(this.columns.map((c) => [c.status, []]));
    for (const task of this.store.tasks()) {
      const group = groups.get(task.status);
      if (!group || !this.ui.matchesMember(task)) continue;
      if (
        term &&
        !task.title.toLowerCase().includes(term) &&
        !task.description.toLowerCase().includes(term) &&
        !this.store.categoryFor(task).name.toLowerCase().includes(term)
      ) {
        continue;
      }
      group.push(task);
    }
    for (const group of groups.values()) group.sort(byDueDate);
    return groups;
  });

  private readonly counts = computed(() => {
    const counts = new Map<TaskStatus, number>();
    for (const task of this.store.tasks()) counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    return counts;
  });

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return TERMS.greeting.morning;
    if (hour < 18) return TERMS.greeting.afternoon;
    return TERMS.greeting.evening;
  }

  readonly summary = computed(() =>
    TERMS.greeting.summary(
      this.countByStatus(TaskStatus.IN_PROGRESS),
      this.countByStatus(TaskStatus.TODO),
      this.countByStatus(TaskStatus.DONE)
    )
  );

  countByStatus(status: TaskStatus): number {
    return this.counts().get(status) ?? 0;
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.byStatus().get(status) ?? [];
  }
}

// Dated chores first (soonest at top), then undated by creation time
function byDueDate(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.createdAt.getTime() - b.createdAt.getTime();
}
