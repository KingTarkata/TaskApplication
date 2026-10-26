import { InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppData, Profile } from '../models/app-data';
import { Category } from '../models/category.model';
import { Task } from '../models/task.model';
import { LocalRepository } from './local-repository';

/**
 * Where app data lives. The store talks only to this interface, so the backing storage
 * (this device's localStorage today, a synced Firebase household later) can be swapped
 * without touching the UI.
 */
export interface DataRepository {
  /** Load everything once at startup (after migrating old data if needed). */
  load(): Promise<AppData>;

  /** Emits full snapshots when data changes from outside this tab (another tab or device). */
  readonly externalChanges: Observable<AppData>;

  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;

  /** Replace everything (used by backup restore). */
  replaceAll(data: AppData): Promise<void>;

  /** Stop listening for changes (called when switching to another repository). */
  dispose?(): void;
}

/** Defaults to on-device storage; app.config (or a test) can provide another implementation. */
export const DATA_REPOSITORY = new InjectionToken<DataRepository>('DataRepository', {
  providedIn: 'root',
  factory: () => inject(LocalRepository),
});
