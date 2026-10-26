import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { TaskStatus, Task } from '../models/task.model';
import { StorageService, STORAGE_KEYS } from './storage';

export interface RankStats {
  xp: number;
  level: number;
  progress: number;
  nextLevelXp: number;
  tasksCompleted: number;
}

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  // Configurable XP amounts and level increase "difficulty"
  public readonly XP_PER_TASK = 100;
  public readonly XP_PER_SUBTASK = 20;

  private readonly LEVEL_CONSTANT = 0.1;

  public operativeName: string = 'Operative';

  constructor(private taskService: TaskService, private storage: StorageService) {
    this.loadProfile();
  }

  // Load existing profile if one exists
  private loadProfile() {
    const savedName = this.storage.getString(STORAGE_KEYS.codename);
    if (savedName) {
      this.operativeName = savedName;
    }
  }

  updateName(newName: string) {
    this.operativeName = newName;
    this.storage.setString(STORAGE_KEYS.codename, newName);
  }

  // Calculate total task XP
  getTaskPotentialXp(task: Task): number {
    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    return this.XP_PER_TASK + subtaskCount * this.XP_PER_SUBTASK;
  }

  getStats(): RankStats {
    const archivedTasks = this.taskService.tasks.filter((t) => t.status === TaskStatus.ARCHIVED);
    const count = archivedTasks.length;

    // Sum variable XP (base + subtask bonus) across archived tasks
    const xp = archivedTasks.reduce((total, task) => total + this.getTaskPotentialXp(task), 0);

    // Calculate Level
    const level = Math.floor(this.LEVEL_CONSTANT * Math.sqrt(xp)) + 1;

    // Calculate Progress to next level
    const currentLevelBaseXp = Math.pow((level - 1) / this.LEVEL_CONSTANT, 2);
    const nextLevelBaseXp = Math.pow(level / this.LEVEL_CONSTANT, 2);

    const range = nextLevelBaseXp - currentLevelBaseXp;
    const gained = xp - currentLevelBaseXp;

    let progress = 0;
    if (range > 0) {
      progress = Math.round((gained / range) * 100);
    }

    return {
      xp,
      level,
      progress,
      nextLevelXp: Math.round(nextLevelBaseXp),
      tasksCompleted: count,
    };
  }

  // Give user titles based on level
  getTitle(level: number): string {
    if (level === 1) return 'Novice';
    if (level < 5) return 'Apprentice';
    if (level < 10) return 'Operative';
    if (level < 20) return 'Specialist';
    if (level < 50) return 'Elite';
    return 'Legend';
  }
}
