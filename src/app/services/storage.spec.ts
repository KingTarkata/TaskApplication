import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage';
import { PlannerStore } from './planner-store';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should return the fallback for missing or corrupt data', () => {
    expect(service.getJson('missing', 42)).toBe(42);
    localStorage.setItem('bad', '{not json');
    expect(service.getJson('bad', [])).toEqual([]);
  });

  it('should not crash the app when stored data is corrupt', async () => {
    localStorage.setItem('hearthstead_data', '{not json');
    localStorage.setItem('directive_zero_tasks', '{also bad');
    const store = TestBed.inject(PlannerStore);
    await store.init();
    expect(store.tasks()).toEqual([]);
    expect(store.categories().length).toBeGreaterThan(0);
  });
});
