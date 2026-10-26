import { Component, inject } from '@angular/core';
import { Toast, ToastService } from '../../services/toast';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
      <div class="hs-toast" role="status">
        <span class="toast-icon"><i class="bi {{ toast.icon }}"></i></span>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="fw-bold text-truncate">{{ toast.title }}</div>
          @if (toast.body) {
          <small class="text-muted">{{ toast.body }}</small>
          }
        </div>
        @if (toast.action) {
        <button type="button" class="btn btn-sm btn-success" (click)="run(toast)">{{ toast.action.label }}</button>
        }
        <button type="button" class="icon-action" (click)="toasts.dismiss(toast.id)" [attr.aria-label]="t.reminders.dismiss">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      z-index: 1090;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: min(22rem, calc(100vw - 2rem));
    }
    @media (max-width: 767.98px) {
      .toast-stack {
        right: 0.75rem;
        left: 0.75rem;
        width: auto;
        bottom: calc(5.5rem + env(safe-area-inset-bottom));
      }
    }
    .hs-toast {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 0.8rem;
      background: var(--hs-surface);
      border: 1px solid var(--hs-border);
      border-radius: 16px;
      box-shadow: var(--hs-shadow-lg);
      animation: toast-in 0.2s ease-out;
    }
    .toast-icon {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-honey);
      background: color-mix(in srgb, var(--hs-honey) 16%, transparent);
    }
    @keyframes toast-in {
      from { transform: translateY(8px); opacity: 0; }
    }
  `,
})
export class Toasts {
  t = TERMS;
  toasts = inject(ToastService);

  run(toast: Toast) {
    toast.action?.run();
    this.toasts.dismiss(toast.id);
  }
}
