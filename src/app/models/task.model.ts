// Function to generate a random ID for categories and tasks, utilizing math on unsecure "http" servers, and cryptography if using secure "https" servers
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

export enum TaskStatus {
  // Possible task statuses
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
  ARCHIVED = 'Archived',
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export class Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: TaskStatus;
  createdAt: Date;
  dueDate?: Date;
  subtasks: SubTask[];

  constructor(
    title: string,
    type: string = 'Work',
    description: string = '',
    dueDate?: Date,
    subtasks: SubTask[] = []
  ) {
    this.id = generateUUID();
    this.title = title;
    this.type = type;
    this.description = description;
    this.status = TaskStatus.TODO;
    this.createdAt = new Date();
    this.subtasks = subtasks;

    // Create due date if requested
    if (dueDate) {
      this.dueDate = dueDate;
    }
  }
}
