import { Injectable } from '@angular/core';
import { StorageService, STORAGE_KEYS } from './storage';

export type ThemeName = 'light' | 'dark';

// Browser/OS chrome color for each theme (matches --hs-bg in styles.css)
const THEME_COLORS: Record<ThemeName, string> = {
  light: '#f6f0e4',
  dark: '#1c1814',
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme: ThemeName = 'light';

  constructor(private storage: StorageService) {
    // Use the saved choice if there is one ('retro' was the old name for dark), otherwise follow the OS
    const saved = this.storage.getString(STORAGE_KEYS.theme);
    if (saved) {
      this.applyTheme(saved === 'light' ? 'light' : 'dark');
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
      this.applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  get isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  setTheme(theme: ThemeName) {
    this.applyTheme(theme);
    this.storage.setString(STORAGE_KEYS.theme, theme);
  }

  // Toggle theme
  toggleTheme() {
    this.setTheme(this.isDarkMode ? 'light' : 'dark');
  }

  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  private applyTheme(theme: ThemeName) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }
}
