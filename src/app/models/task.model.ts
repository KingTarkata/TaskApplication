// Random ID for tasks, categories, etc. Uses crypto on secure (https/localhost) origins, Math.random otherwise.
export function generateUUID(): string {
  if (typeof self.crypto !== 'undefined' && typeof self.crypto.randomUUID === 'function') {
    return self.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Stored status codes (display names live in terminology.ts)
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly';

// "Every <interval> <freq>", e.g. every 2 weeks
export interface Recurrence {
  freq: RecurrenceFreq;
  interval: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date; // moved to Done
  harvestedAt?: Date; // moved to Archived (XP earned)
  subtasks: SubTask[];

  // Repeating chores: each occurrence is its own task; occurrences share a seriesId
  recurrence?: Recurrence;
  seriesId?: string;
  nextOccurrenceId?: string; // set once the next occurrence has been created

  // Habits are repeating chores that track a streak of on-time completions
  isHabit?: boolean;
  streak?: number; // streak going into this occurrence, or achieved by it once done
  streakBefore?: number; // streak before completion, so re-opening can undo it

  reminderMinutes?: number | null; // remind this many minutes before dueDate; null = no reminder

  // Household (sync) fields; empty when using the app on one device
  assigneeId?: string | null;
  createdBy?: string | null;
  harvestedBy?: string | null;
}

// Build a new task with sensible defaults
export function createTask(fields: Partial<Task> & Pick<Task, 'title' | 'categoryId'>): Task {
  const now = new Date();
  return {
    id: generateUUID(),
    description: '',
    status: TaskStatus.TODO,
    createdAt: now,
    updatedAt: now,
    subtasks: [],
    ...fields,
  };
}
