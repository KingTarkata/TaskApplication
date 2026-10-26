import { Category } from './category.model';
import { Task, TaskStatus, generateUUID } from './task.model';
import { Household, Member } from './member.model';
import { TERMS } from '../terminology';

// Bump this and add a step to migrate() whenever the stored shape changes
export const DATA_VERSION = 2;

export interface Profile {
  displayName: string;
}

// Everything the app persists (and what a backup file contains)
export interface AppData {
  version: number;
  tasks: Task[];
  categories: Category[];
  profile: Profile;
  // Only present when synced with a household (not part of backups)
  members?: Member[];
  household?: Household | null;
}

export function defaultAppData(): AppData {
  return {
    version: DATA_VERSION,
    tasks: [],
    categories: TERMS.categories.defaults.map((c) => ({ ...c })),
    profile: { displayName: TERMS.profile.defaultName },
  };
}

// ---------- Serialization (Dates <-> ISO strings) ----------

const DATE_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'harvestedAt'] as const;

export function serializeTask(task: Task): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(task)) {
    if (value === undefined) continue;
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

export function deserializeTask(raw: any): Task {
  const task = { ...raw } as Task;
  for (const field of DATE_FIELDS) {
    const value = raw[field];
    if (value) {
      // Accept ISO strings, epoch millis, or Firestore Timestamps
      const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
      (task as any)[field] = isNaN(date.getTime()) ? undefined : date;
    } else {
      delete (task as any)[field];
    }
  }
  task.createdAt ??= new Date();
  task.updatedAt ??= task.createdAt;
  task.description ??= '';
  task.subtasks = Array.isArray(raw.subtasks) ? raw.subtasks : [];
  return task;
}

export function serializeAppData(data: AppData): Record<string, unknown> {
  return {
    version: DATA_VERSION,
    tasks: data.tasks.map(serializeTask),
    categories: data.categories,
    profile: data.profile,
  };
}

// ---------- Migration ----------

// Old (v1) status values were display text
const V1_STATUS: Record<string, TaskStatus> = {
  'To Do': TaskStatus.TODO,
  'In Progress': TaskStatus.IN_PROGRESS,
  Done: TaskStatus.DONE,
  Archived: TaskStatus.ARCHIVED,
};

/**
 * Upgrade any stored or imported data to the current shape.
 * Accepts v1 backup files ({ tasks, categories, profile: { codename } }) and v2+ data.
 * Throws if the input isn't recognizable app data.
 */
export function migrate(raw: any): AppData {
  if (!raw || !Array.isArray(raw.tasks) || !Array.isArray(raw.categories)) {
    throw new Error('Not Hearthstead data');
  }

  const version = typeof raw.version === 'number' ? raw.version : 1;
  let categories: Category[] = raw.categories
    .filter((c: any) => c && typeof c.name === 'string')
    .map((c: any) => ({ id: String(c.id ?? generateUUID()), name: c.name, colorClass: c.colorClass ?? 'secondary' }));
  if (categories.length === 0) categories = defaultAppData().categories;

  let tasks: Task[];
  if (version < 2) {
    // v1: tasks linked to categories by name ("type") and used display text for status
    tasks = raw.tasks
      .filter((t: any) => t && typeof t.title === 'string')
      .map((t: any) => {
        const typeName = String(t.type ?? '');
        let cat = categories.find((c) => c.name.toLowerCase() === typeName.toLowerCase());
        if (!cat && typeName) {
          cat = { id: generateUUID(), name: typeName, colorClass: 'secondary' };
          categories.push(cat);
        }
        const { type, ...rest } = t;
        return deserializeTask({
          ...rest,
          id: String(t.id ?? generateUUID()),
          categoryId: (cat ?? categories[0]).id,
          status: V1_STATUS[t.status] ?? TaskStatus.TODO,
          updatedAt: t.createdAt,
        });
      });
  } else {
    tasks = raw.tasks.filter((t: any) => t && typeof t.title === 'string').map(deserializeTask);
  }

  // Any task pointing at a missing category goes to the first one
  const ids = new Set(categories.map((c) => c.id));
  for (const t of tasks) {
    if (!ids.has(t.categoryId)) t.categoryId = categories[0].id;
    if (!Object.values(TaskStatus).includes(t.status)) t.status = TaskStatus.TODO;
  }

  const displayName =
    raw.profile?.displayName ?? raw.profile?.codename ?? TERMS.profile.defaultName;

  return { version: DATA_VERSION, tasks, categories, profile: { displayName } };
}
