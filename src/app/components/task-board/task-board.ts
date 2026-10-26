import { Component, OnDestroy } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { GamificationService } from '../../services/gamification';
import { Task, TaskStatus } from '../../models/task.model';
import { Subscription } from 'rxjs';
import { TaskCard } from '../task-card/task-card';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [TaskCard],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard implements OnDestroy {
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

  searchTerm: string = '';
  searchSub: Subscription;

  constructor(public taskService: TaskService, public gameService: GamificationService) {
    this.searchSub = this.taskService.searchSubject.subscribe((term) => {
      this.searchTerm = term.trim().toLowerCase();
    });
  }

  ngOnDestroy() {
    this.searchSub.unsubscribe();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return TERMS.greeting.morning;
    if (hour < 18) return TERMS.greeting.afternoon;
    return TERMS.greeting.evening;
  }

  get summary(): string {
    return TERMS.greeting.summary(
      this.countByStatus(TaskStatus.IN_PROGRESS),
      this.countByStatus(TaskStatus.TODO),
      this.countByStatus(TaskStatus.DONE)
    );
  }

  countByStatus(status: TaskStatus): number {
    return this.taskService.tasks.filter((t) => t.status === status).length;
  }

  // Search functionality, ensures proper searching that is not case sensitive, can search by task name or categories
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.taskService.tasks.filter((t) => {
      const matchesStatus = t.status === status;
      const matchesSearch =
        t.title.toLowerCase().includes(this.searchTerm) ||
        t.description.toLowerCase().includes(this.searchTerm) ||
        t.type.toLowerCase().includes(this.searchTerm);

      return matchesStatus && matchesSearch;
    });
  }
}
