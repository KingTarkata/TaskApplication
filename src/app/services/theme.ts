import { Injectable } from '@angular/core';
import { StorageService, STORAGE_KEYS } from './storage';

export type ThemeName = 'retro' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme: ThemeName = 'retro'; // Default to dark theme

  constructor(private storage: StorageService) {
    // Check if the user has a saved preference
    const savedTheme = this.storage.getString(STORAGE_KEYS.theme);
    this.setTheme(savedTheme === 'light' ? 'light' : 'retro');
  }

  get isDarkMode(): boolean {
    return this.currentTheme === 'retro';
  }

  setTheme(theme: ThemeName) {
    this.currentTheme = theme;

    document.body.setAttribute('data-theme', theme);
    // Let Bootstrap's own components (close buttons, form controls, etc.) follow the theme too
    document.documentElement.setAttribute('data-bs-theme', theme === 'retro' ? 'dark' : 'light');

    // Save theme to storage
    this.storage.setString(STORAGE_KEYS.theme, theme);
  }

  // Toggle theme
  toggleTheme() {
    this.setTheme(this.currentTheme === 'retro' ? 'light' : 'retro');
  }

  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }
}
