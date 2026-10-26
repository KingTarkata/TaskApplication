// Every user-facing word in the app lives here, so a rebrand (or a future translation) is a one-file change.
// Templates read this as `t` (e.g. {{ t.board.columns.todo }}); services import TERMS directly.
// Note: storage keys and stored status values are NOT here on purpose — changing them would orphan saved data.
//
// Theme: a cozy homestead. Chores are planted, tended while they grow, and harvested for XP.

export const TERMS = {
  app: {
    name: 'Hearthstead',
    version: 'v1.2',
    backupFilePrefix: 'hearthstead_backup',
    copyright: 'All rights reserved.',
    createdBy: 'Created by',
    author: 'John Heim',
  },

  // Icons (Bootstrap Icons class names) that carry the theme
  icons: {
    logo: 'bi-house-heart-fill',
    archive: 'bi-basket2',
    profile: 'bi-person-circle',
    profileHero: 'bi-flower1',
    settings: 'bi-sliders',
    settingsTitle: 'bi-tools',
    newTask: 'bi-plus-lg',
    todo: 'bi-droplet',
    inProgress: 'bi-sun',
    done: 'bi-flower2',
    emptyArchive: 'bi-basket',
    subtaskDone: 'bi-check2-square',
  },

  header: {
    searchPlaceholder: 'Search the homestead...',
    searchLabel: 'Search chores',
    archiveButton: 'Harvest Log',
    archiveTitle: 'Harvest Log',
    profileTitle: 'View your homestead profile',
    levelShort: 'LVL',
    settingsTitle: 'Settings',
    themeToggle: 'Toggle day / night',
    newTask: 'Plant a Chore',
  },

  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    summary: (growing: number, planted: number, ready: number) => {
      const parts = [];
      if (growing) parts.push(`${growing} growing`);
      if (planted) parts.push(`${planted} planted`);
      if (ready) parts.push(`${ready} ready to harvest`);
      return parts.length ? parts.join(' · ') : 'A quiet day on the homestead. Plant something new!';
    },
  },

  board: {
    columns: {
      todo: 'Planted',
      inProgress: 'Growing',
      done: 'Ready to Harvest',
    },
    // Shorter labels for the phone tab switcher
    tabs: {
      todo: 'Planted',
      inProgress: 'Growing',
      done: 'Harvest',
    },
    empty: {
      todo: 'Nothing planted yet.',
      inProgress: 'Nothing growing right now.',
      done: 'Nothing ready to harvest.',
    },
  },

  card: {
    edit: 'Edit',
    editLabel: 'Edit chore',
    delete: 'Pull up',
    deleteLabel: 'Delete chore',
    progress: 'Growth',
    start: 'Start Tending',
    hold: 'Set Aside',
    complete: 'Done',
    reopen: 'Not Yet',
    archive: 'Harvest',
    xp: 'XP',
    steps: 'Steps',
    dueToday: 'Today',
    dueTomorrow: 'Tomorrow',
    overdue: 'Overdue',
    confirmDelete: (title: string) => `Pull up "${title}"? This cannot be undone.`,
  },

  taskForm: {
    newTitle: 'Plant a Chore',
    editTitle: 'Edit Chore',
    title: 'What needs doing?',
    titlePlaceholder: 'e.g. Water the tomatoes',
    category: 'Plot',
    manageCategories: 'Manage Plots',
    dueDate: 'Ready By',
    optional: '(Optional)',
    notes: 'Notes',
    subtasks: 'Steps',
    subtaskPlaceholder: 'Add a step...',
    cancel: 'Cancel',
    create: 'Plant',
    update: 'Save Chore',
  },

  categories: {
    title: 'Manage Plots',
    namePlaceholder: 'New plot name',
    add: 'Add',
    back: 'Back to Chore',
    // Seeded on first run only; existing users keep their own categories
    defaults: [
      { id: '1', name: 'Home', colorClass: 'success' },
      { id: '2', name: 'Health', colorClass: 'info' },
      { id: '3', name: 'Hobbies', colorClass: 'warning' },
    ],
    colors: {
      primary: 'Sky',
      success: 'Sage',
      warning: 'Honey',
      danger: 'Berry',
      info: 'Rain',
      secondary: 'Stone',
    } as Record<string, string>,
  },

  archive: {
    title: 'Harvest Log',
    subtasksHeading: 'Steps completed',
    restore: 'Replant',
    restoreTitle: 'Move back to Planted',
    deleteTitle: 'Delete permanently',
    empty: 'Nothing harvested yet. Finished chores will be gathered here.',
    close: 'Close',
    confirmDelete: (title: string) => `Permanently delete "${title}"? Its XP will be lost.`,
  },

  profile: {
    defaultName: 'Homesteader',
    namePlaceholder: 'Your name',
    level: 'Level',
    statusHeading: 'Homestead Stats',
    tasksCompleted: 'Harvested',
    totalXp: 'Total XP',
    levelStat: 'Level',
    progressLabel: 'Growth to next level',
    xpToNext: (xp: number) => `${xp} XP to go`,
    close: 'Close',
    // Optional flavor line under the level badge; return '' to hide it
    idLine: (_xp: number, _level: number) => '',
    // Level titles, checked in order: first entry whose maxLevel is >= the user's level wins
    rankTitles: [
      { maxLevel: 1, title: 'Seedling' },
      { maxLevel: 4, title: 'Sprout' },
      { maxLevel: 9, title: 'Sapling' },
      { maxLevel: 19, title: 'In Bloom' },
      { maxLevel: 49, title: 'Orchard Keeper' },
      { maxLevel: Infinity, title: 'Ancient Grove' },
    ],
  },

  settings: {
    title: 'Settings',
    dataHeading: 'Backup & Restore',
    exportTitle: 'Save a Backup',
    exportSubtitle: 'Download everything as a JSON file',
    importTitle: 'Restore from Backup',
    importSubtitle: 'Load a previously saved file',
    close: 'Close',
    invalidFile: "That file doesn't look like a Hearthstead backup.",
    parseError: "Couldn't read that file. Is it a JSON backup?",
    confirmImport:
      'Restoring will replace everything currently on your homestead. This cannot be undone. Continue?',
  },
};

export type Terms = typeof TERMS;
