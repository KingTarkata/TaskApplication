import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { generateUUID } from '../models/task.model';
import { StorageService, STORAGE_KEYS } from './storage';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  public categories: Category[] = [];

  // Available colors for new categories
  public availableColors = [
    { name: 'Blue', value: 'primary' },
    { name: 'Green', value: 'success' },
    { name: 'Yellow', value: 'warning' },
    { name: 'Red', value: 'danger' },
    { name: 'Cyan', value: 'info' },
    { name: 'Dark', value: 'secondary' },
  ];

  constructor(private storage: StorageService) {
    this.loadCategories();
  }

  addCategory(name: string, colorClass: string) {
    name = name.trim();
    // Tasks link to categories by name, so names must be unique
    if (!name || this.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;

    const newCat: Category = {
      id: generateUUID(),
      name,
      colorClass,
    };
    this.categories.push(newCat);
    this.saveCategories();
  }

  removeCategory(id: string) {
    // Prevent deleting the last category
    if (this.categories.length <= 1) return;
    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveCategories();
  }

  getCategoryColor(typeName: string): string {
    const cat = this.categories.find((c) => c.name === typeName);
    return cat ? cat.colorClass : 'secondary';
  }

  private saveCategories() {
    this.storage.setJson(STORAGE_KEYS.categories, this.categories);
  }

  private loadCategories() {
    const saved = this.storage.getJson<Category[] | null>(STORAGE_KEYS.categories, null);
    if (Array.isArray(saved) && saved.length > 0) {
      this.categories = saved;
    } else {
      // Default categories
      this.categories = [
        { id: '1', name: 'Work', colorClass: 'primary' },
        { id: '2', name: 'Game', colorClass: 'success' },
        { id: '3', name: 'Hobby', colorClass: 'warning' },
      ];
      this.saveCategories();
    }
  }
}
