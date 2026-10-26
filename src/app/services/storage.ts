import { Injectable } from '@angular/core';

// Central list of every key the app persists, so backup/restore and future storage backends stay in sync
export const STORAGE_KEYS = {
  tasks: 'directive_zero_tasks',
  categories: 'directive_zero_categories',
  codename: 'directive_zero_codename',
  theme: 'theme',
} as const;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Read and parse a JSON value, returning the fallback if it is missing or corrupt
  getJson<T>(key: string, fallback: T): T {
    const raw = this.getString(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Corrupt data in storage key "${key}", using defaults.`, err);
      return fallback;
    }
  }

  setJson(key: string, value: unknown): void {
    this.setString(key, JSON.stringify(value));
  }

  getString(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setString(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(`Failed to save storage key "${key}".`, err);
    }
  }
}
