import { Injectable, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';
import type { DataRepository } from './data-repository';
import { AppData, Profile, defaultAppData, migrate, serializeAppData } from '../models/app-data';
import { Category } from '../models/category.model';
import { Task } from '../models/task.model';
import { StorageService, STORAGE_KEYS } from '../services/storage';

/**
 * Stores everything on this device in localStorage, as one versioned JSON blob.
 * On first run after upgrading, it builds that blob from the old v1 keys (which are left in place as a fallback).
 */
@Injectable({ providedIn: 'root' })
export class LocalRepository implements DataRepository {
  private storage = inject(StorageService);
  private zone = inject(NgZone);
  private data: AppData = defaultAppData();
  private changes = new Subject<AppData>();
  readonly externalChanges = this.changes.asObservable();

  constructor() {
    // Keep multiple open tabs in sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key !== STORAGE_KEYS.data || !e.newValue) return;
        try {
          this.data = migrate(JSON.parse(e.newValue));
          this.zone.run(() => this.changes.next(this.data));
        } catch {
          // Ignore unreadable writes from other tabs
        }
      });
    }
  }

  async load(): Promise<AppData> {
    const stored = this.storage.getJson<any>(STORAGE_KEYS.data, null);
    if (stored) {
      try {
        this.data = migrate(stored);
        return this.data;
      } catch (err) {
        console.error('Stored data unreadable, falling back to legacy keys/defaults.', err);
      }
    }

    this.data = this.loadLegacy() ?? defaultAppData();
    this.persist();
    return this.data;
  }

  async saveTask(task: Task): Promise<void> {
    const i = this.data.tasks.findIndex((t) => t.id === task.id);
    if (i === -1) this.data.tasks.push(task);
    else this.data.tasks[i] = task;
    this.persist();
  }

  async deleteTask(id: string): Promise<void> {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.persist();
  }

  async saveCategory(category: Category): Promise<void> {
    const i = this.data.categories.findIndex((c) => c.id === category.id);
    if (i === -1) this.data.categories.push(category);
    else this.data.categories[i] = category;
    this.persist();
  }

  async deleteCategory(id: string): Promise<void> {
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.persist();
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.data.profile = profile;
    this.persist();
  }

  async replaceAll(data: AppData): Promise<void> {
    this.data = data;
    this.persist();
  }

  private persist() {
    this.storage.setJson(STORAGE_KEYS.data, serializeAppData(this.data));
  }

  // Assemble v1 data from the old separate keys, if any exist
  private loadLegacy(): AppData | null {
    const tasks = this.storage.getJson<any[] | null>(STORAGE_KEYS.legacyTasks, null);
    const categories = this.storage.getJson<any[] | null>(STORAGE_KEYS.legacyCategories, null);
    const codename = this.storage.getString(STORAGE_KEYS.legacyCodename);
    if (!tasks && !categories && !codename) return null;

    try {
      return migrate({
        tasks: Array.isArray(tasks) ? tasks : [],
        categories: Array.isArray(categories) && categories.length ? categories : defaultAppData().categories,
        profile: codename ? { codename } : undefined,
      });
    } catch {
      return null;
    }
  }
}
