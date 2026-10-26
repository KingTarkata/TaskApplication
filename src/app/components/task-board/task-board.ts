import { Component, OnDestroy } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus } from '../../models/task.model';
import { Subscription } from 'rxjs';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [TaskCard],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard implements OnDestroy {
  eTaskStatus = TaskStatus;

  // Board columns, in display order
  columns = [
    { status: TaskStatus.TODO, label: 'To Do', icon: 'bi-circle', color: 'text-secondary', empty: 'No pending directives.' },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress', icon: 'bi-play-circle', color: 'text-primary', empty: 'Nothing in progress.' },
    { status: TaskStatus.DONE, label: 'Completed', icon: 'bi-check-circle', color: 'text-success', empty: 'Nothing completed yet.' },
  ];

  searchTerm: string = '';
  searchSub: Subscription;

  constructor(public taskService: TaskService) {
    this.searchSub = this.taskService.searchSubject.subscribe((term) => {
      this.searchTerm = term.trim().toLowerCase();
    });
  }

  ngOnDestroy() {
    this.searchSub.unsubscribe();
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
