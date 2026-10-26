import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Task } from '../models/task.model';

/** Transient UI state shared between components (not persisted). */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  /** Board search text, lower-cased and trimmed. */
  readonly search = signal('');

  /** In a household: only show chores assigned to this member (null = everyone's). */
  readonly memberFilter = signal<string | null>(null);

  /** Does a task pass the current member filter? */
  matchesMember(task: Task): boolean {
    const member = this.memberFilter();
    return member === null || task.assigneeId === member;
  }

  /** Ask the task form to open for editing (a task) or for a new chore (null, optionally pre-filled). */
  readonly editRequests = new Subject<{ task: Task | null; dueDate?: Date }>();

  setSearch(term: string) {
    this.search.set(term.trim().toLowerCase());
  }

  editTask(task: Task) {
    this.editRequests.next({ task });
  }

  newTask(dueDate?: Date) {
    this.editRequests.next({ task: null, dueDate });
  }
}
