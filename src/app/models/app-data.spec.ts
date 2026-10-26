import { migrate, serializeAppData, DATA_VERSION } from './app-data';
import { TaskStatus } from './task.model';

describe('app data migration', () => {
  // Shape of a Directive Zero (v1) backup file / localStorage
  const v1 = {
    tasks: [
      {
        id: 'a',
        title: 'Old task',
        description: 'x',
        type: 'Work',
        status: 'In Progress',
        createdAt: '2025-05-01T10:00:00.000Z',
        dueDate: '2025-05-03T09:00:00.000Z',
        subtasks: [],
      },
      {
        id: 'b',
        title: 'Mystery',
        description: '',
        type: 'Gardening',
        status: 'Archived',
        createdAt: '2025-05-02T10:00:00.000Z',
        subtasks: [{ id: 's', title: 'step', completed: true }],
      },
    ],
    categories: [{ id: '1', name: 'Work', colorClass: 'primary' }],
    profile: { codename: 'Agent J' },
    version: '1.1',
  };

  it('upgrades v1 data: status codes, category ids, dates, profile name', () => {
    const data = migrate(v1);
    expect(data.version).toBe(DATA_VERSION);
    expect(data.profile.displayName).toBe('Agent J');

    const [a, b] = data.tasks;
    expect(a.status).toBe(TaskStatus.IN_PROGRESS);
    expect(a.categoryId).toBe('1');
    expect(a.dueDate instanceof Date).toBeTrue();
    expect((a as any).type).toBeUndefined();

    // Unknown category names become new plots rather than being lost
    const gardening = data.categories.find((c) => c.name === 'Gardening')!;
    expect(gardening).toBeTruthy();
    expect(b.categoryId).toBe(gardening.id);
    expect(b.status).toBe(TaskStatus.ARCHIVED);
  });

  it('round-trips current data through serialization', () => {
    const data = migrate(v1);
    const again = migrate(JSON.parse(JSON.stringify(serializeAppData(data))));
    expect(again.tasks.length).toBe(2);
    expect(again.tasks[0].dueDate?.getTime()).toBe(data.tasks[0].dueDate?.getTime());
    expect(again.categories.length).toBe(data.categories.length);
  });

  it('rejects files that are not app data', () => {
    expect(() => migrate({ hello: 'world' })).toThrow();
    expect(() => migrate(null)).toThrow();
  });

  it('reassigns tasks whose category no longer exists', () => {
    const data = migrate({
      version: 2,
      categories: [{ id: 'c1', name: 'Home', colorClass: 'success' }],
      tasks: [{ id: 't', title: 'T', categoryId: 'gone', status: 'todo', createdAt: new Date().toISOString(), subtasks: [] }],
      profile: { displayName: 'X' },
    });
    expect(data.tasks[0].categoryId).toBe('c1');
  });
});
