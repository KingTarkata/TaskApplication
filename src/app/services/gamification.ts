import { Injectable, computed, inject } from '@angular/core';
import { PlannerStore } from './planner-store';
import { Task, TaskStatus } from '../models/task.model';
import { Member } from '../models/member.model';
import { TERMS } from '../terminology';

export interface RankStats {
  xp: number;
  level: number;
  progress: number;
  nextLevelXp: number;
  tasksCompleted: number;
}

// Configurable XP amounts and level "difficulty"
export const XP_RULES = {
  perTask: 100,
  perDailyTask: 50, // daily repeats would inflate levels at full value
  perSubtask: 20,
  perStreakDay: 5, // habit bonus per streak count...
  maxStreakBonus: 50, // ...capped here
  levelConstant: 0.1,
};

/** XP a task earns when harvested. */
export function taskXp(task: Task): number {
  const base = task.recurrence?.freq === 'daily' ? XP_RULES.perDailyTask : XP_RULES.perTask;
  const steps = (task.subtasks?.length ?? 0) * XP_RULES.perSubtask;
  const streak = task.isHabit
    ? Math.min((task.streak ?? 0) * XP_RULES.perStreakDay, XP_RULES.maxStreakBonus)
    : 0;
  return base + steps + streak;
}

/** Level math: level = floor(k * sqrt(xp)) + 1 */
export function statsFor(harvested: Task[]): RankStats {
  const xp = harvested.reduce((total, task) => total + taskXp(task), 0);
  const k = XP_RULES.levelConstant;
  const level = Math.floor(k * Math.sqrt(xp)) + 1;
  const currentLevelBaseXp = Math.pow((level - 1) / k, 2);
  const nextLevelBaseXp = Math.pow(level / k, 2);
  const range = nextLevelBaseXp - currentLevelBaseXp;
  const progress = range > 0 ? Math.round(((xp - currentLevelBaseXp) / range) * 100) : 0;
  return { xp, level, progress, nextLevelXp: Math.round(nextLevelBaseXp), tasksCompleted: harvested.length };
}

/** Who gets the XP for a harvested chore: whoever harvested it, else whoever it was assigned to. */
export function creditedTo(task: Task): string | null {
  return task.harvestedBy ?? task.assigneeId ?? null;
}

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private store = inject(PlannerStore);

  readonly harvested = computed(() => this.store.tasks().filter((t) => t.status === TaskStatus.ARCHIVED));

  /** Your stats: on one device that's everything; in a household it's what you harvested. */
  readonly stats = computed(() => {
    const me = this.store.currentMemberId();
    const harvested = this.harvested();
    return statsFor(me ? harvested.filter((t) => creditedTo(t) === me) : harvested);
  });

  /** Everything harvested by the whole household. */
  readonly householdStats = computed(() => statsFor(this.harvested()));

  /** Each member's stats, highest XP first. */
  readonly leaderboard = computed<{ member: Member; stats: RankStats }[]>(() =>
    this.store
      .members()
      .map((member) => ({ member, stats: statsFor(this.harvested().filter((t) => creditedTo(t) === member.id)) }))
      .sort((a, b) => b.stats.xp - a.stats.xp)
  );

  readonly displayName = computed(() => this.store.profile().displayName);

  updateName(newName: string) {
    this.store.updateProfile({ displayName: newName });
  }

  getTaskPotentialXp(task: Task): number {
    return taskXp(task);
  }

  // Give user titles based on level
  getTitle(level: number): string {
    const ranks = TERMS.profile.rankTitles;
    return (ranks.find((r) => level <= r.maxLevel) ?? ranks[ranks.length - 1]).title;
  }
}
