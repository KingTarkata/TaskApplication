import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { Subject, BehaviorSubject } from 'rxjs';
import { StorageService, STORAGE_KEYS } from './storage';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  public tasks: Task[] = [];
  public searchSubject = new BehaviorSubject<string>('');
  public editTaskSubject = new Subject<Task | null>();

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  updateSearchTerm(term: string) {
    this.searchSubject.next(term);
  }

  setTaskToEdit(task: Task | null) {
    this.editTaskSubject.next(task);
  }

  // Create task
  addTask(task: Task): void {
    this.tasks.push(task);
    this.saveToStorage();
  }

  updateExistingTask(updatedTask: Task) {
    const index = this.tasks.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      this.tasks[index] = updatedTask;
      this.saveToStorage();
    }
  }

  // Delete task
  removeTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveToStorage();
  }

  // STORAGE: Save
  public saveToStorage(): void {
    this.storage.setJson(STORAGE_KEYS.tasks, this.tasks);
  }

  // STORAGE: Load
  private loadFromStorage(): void {
    const rawObjects = this.storage.getJson<any[]>(STORAGE_KEYS.tasks, []);
    if (!Array.isArray(rawObjects)) return;

    this.tasks = rawObjects.map((obj: any) => {
      // Create base task
      const t = new Task(obj.title ?? '', obj.type, obj.description ?? '');

      // Copy saved properties
      Object.assign(t, obj);

      // Fix Date Objects (Convert from string)
      t.createdAt = new Date(obj.createdAt);

      // Fix Due Date if it exists
      if (obj.dueDate) {
        t.dueDate = new Date(obj.dueDate);
      }

      t.description = obj.description ?? '';
      t.subtasks = obj.subtasks || [];

      return t;
    });
  }
}
