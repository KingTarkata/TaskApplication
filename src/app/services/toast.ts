import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  icon: string;
  title: string;
  body?: string;
  action?: { label: string; run: () => void };
}

/** Small in-app notifications shown in a corner of the screen. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>, durationMs = 8000): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { ...toast, id }].slice(-3));
    if (durationMs > 0) setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
