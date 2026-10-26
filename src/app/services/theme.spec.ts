import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(TestBed.inject(ThemeService)).toBeTruthy();
  });

  it('should treat the legacy "retro" setting as dark mode', () => {
    localStorage.setItem('theme', 'retro');
    const service = TestBed.inject(ThemeService);
    expect(service.isDarkMode).toBeTrue();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should toggle and remember the choice', () => {
    localStorage.setItem('theme', 'light');
    const service = TestBed.inject(ThemeService);
    service.toggleTheme();
    expect(service.isDarkMode).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
