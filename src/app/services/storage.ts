import { Injectable } from '@angular/core';

// Central list of every key the app persists on this device
export const STORAGE_KEYS = {
  // All app data, as one versioned blob (see models/app-data.ts)
  data: 'hearthstead_data',
  // Device-only preferences
  theme: 'theme',
  reminders: 'hearthstead_reminders',
  session: 'hearthstead_session', // signed-in user + household, for fast offline start
  // v1 keys (Directive Zero era); read once for migration and kept as a fallback
  legacyTasks: 'directive_zero_tasks',
  legacyCategories: 'directive_zero_categories',
  legacyCodename: 'directive_zero_codename',
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

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable; nothing to remove
    }
  }
}
