// Every user-facing word in the app lives here, so a rebrand (or a future translation) is a one-file change.
// Templates read this as `t` (e.g. {{ t.board.columns.todo }}); services import TERMS directly.
// Note: storage keys and stored status values are NOT here on purpose — changing them would orphan saved data.

export const TERMS = {
  app: {
    name: 'Directive Zero',
    version: 'v1.1',
    backupFilePrefix: 'directive_zero_backup',
    copyright: 'All rights reserved.',
    createdBy: 'Created by',
    author: 'John Heim',
  },

  // Icons (Bootstrap Icons class names) that carry the theme
  icons: {
    archive: 'bi-archive',
    profile: 'bi-person-circle',
    profileHero: 'bi-person-bounding-box',
    settings: 'bi-sliders',
    settingsTitle: 'bi-cpu-fill',
    newTask: 'bi-plus-lg',
    todo: 'bi-circle',
    inProgress: 'bi-play-circle',
    done: 'bi-check-circle',
    emptyArchive: 'bi-inbox',
    subtaskDone: 'bi-check2-square',
  },

  header: {
    searchPlaceholder: 'Search Directives...',
    searchLabel: 'Search directives',
    archiveButton: 'Archives',
    archiveTitle: 'Mission Archive',
    profileTitle: 'Click to view full dossier',
    levelShort: 'LVL',
    settingsTitle: 'System Config',
    themeToggle: 'Toggle theme',
    newTask: 'New Directive',
  },

  board: {
    columns: {
      todo: 'To Do',
      inProgress: 'In Progress',
      done: 'Completed',
    },
    empty: {
      todo: 'No pending directives.',
      inProgress: 'Nothing in progress.',
      done: 'Nothing completed yet.',
    },
  },

  card: {
    edit: 'Edit',
    editLabel: 'Edit directive',
    delete: 'Delete',
    deleteLabel: 'Delete directive',
    progress: 'PROGRESS',
    start: 'Start Protocol',
    hold: 'Hold',
    complete: 'Complete',
    reopen: 'Re-open',
    archive: 'Archive',
    xp: 'XP',
    confirmDelete: (title: string) => `Delete "${title}"? This cannot be undone.`,
  },

  taskForm: {
    newTitle: 'New Directive',
    editTitle: 'Edit Directive',
    title: 'Objective Title',
    titlePlaceholder: 'e.g. Complete API Integration',
    category: 'Category',
    manageCategories: 'Manage Types',
    dueDate: 'Target Date',
    optional: '(Optional)',
    notes: 'Briefing / Notes',
    subtasks: 'Sub-Directives (Checklist)',
    subtaskPlaceholder: 'Add step...',
    cancel: 'Cancel',
    create: 'Initialize',
    update: 'Update Directive',
  },

  categories: {
    title: 'Manage Categories',
    namePlaceholder: 'New Category Name',
    add: 'Add',
    back: 'Back to Task',
    // Seeded on first run only; existing users keep their own categories
    defaults: [
      { id: '1', name: 'Work', colorClass: 'primary' },
      { id: '2', name: 'Game', colorClass: 'success' },
      { id: '3', name: 'Hobby', colorClass: 'warning' },
    ],
    colors: {
      primary: 'Blue',
      success: 'Green',
      warning: 'Yellow',
      danger: 'Red',
      info: 'Cyan',
      secondary: 'Dark',
    } as Record<string, string>,
  },

  archive: {
    title: 'Mission Archive',
    subtasksHeading: 'LOGGED SUB-DIRECTIVES:',
    restore: 'Restore',
    restoreTitle: 'Restore to To-Do',
    deleteTitle: 'Delete Permanently',
    empty: 'Archive is empty. No decommissioned directives found.',
    close: 'Close',
    confirmDelete: (title: string) => `Permanently delete "${title}"? Its XP will be lost.`,
  },

  profile: {
    defaultName: 'Operative',
    namePlaceholder: 'ENTER CODENAME',
    level: 'LEVEL',
    statusHeading: 'Operative Status',
    tasksCompleted: 'Directives Completed',
    totalXp: 'Total Experience',
    progressLabel: 'PROGRESS TO NEXT LEVEL',
    close: 'CLOSE PROFILE',
    idLine: (xp: number, level: number) => `ID: REF-${xp}-${level}`,
    // Level titles, checked in order: first entry whose maxLevel is >= the user's level wins
    rankTitles: [
      { maxLevel: 1, title: 'Novice' },
      { maxLevel: 4, title: 'Apprentice' },
      { maxLevel: 9, title: 'Operative' },
      { maxLevel: 19, title: 'Specialist' },
      { maxLevel: 49, title: 'Elite' },
      { maxLevel: Infinity, title: 'Legend' },
    ],
  },

  settings: {
    title: 'SYSTEM_CONFIG',
    dataHeading: 'Data Exfiltration & Injection',
    exportTitle: 'Download Mission Log',
    exportSubtitle: 'Export current state to JSON',
    importTitle: 'Inject Protocols',
    importSubtitle: 'Restore from backup file',
    close: 'Close',
    invalidFile: 'Error: Corrupt or Invalid Protocol File.',
    parseError: 'Error parsing JSON file.',
    confirmImport:
      'WARNING: Importing protocols will overwrite all current data. This process cannot be undone. Proceed?',
  },
};

export type Terms = typeof TERMS;
