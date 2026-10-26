/** A person in a shared household. */
export interface Member {
  id: string; // Firebase Auth uid
  displayName: string;
  color: string; // palette name: sage | sky | honey | berry | rain
}

/** Shared household details. */
export interface Household {
  id: string;
  name: string;
  ownerId: string;
  inviteCode?: string;
}

export const MEMBER_COLORS = ['sage', 'sky', 'honey', 'berry', 'rain'];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
