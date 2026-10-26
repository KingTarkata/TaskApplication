import { Component, inject } from '@angular/core';
import { PlannerStore } from '../../services/planner-store';
import { UiStateService } from '../../services/ui-state';
import { initials } from '../../models/member.model';
import { TERMS } from '../../terminology';

// "Everyone / Alice / Bob" chips for filtering chores by who they're assigned to (households only)
@Component({
  selector: 'app-member-filter',
  template: `
    @if (store.isShared() && store.members().length > 1) {
    <div class="d-flex flex-wrap gap-2" role="radiogroup" [attr.aria-label]="t.assign.filterLabel">
      <button
        type="button"
        role="radio"
        class="chip chip-select"
        style="--c: var(--hs-muted)"
        [class.chip-solid]="ui.memberFilter() === null"
        [attr.aria-checked]="ui.memberFilter() === null"
        (click)="ui.memberFilter.set(null)"
      >
        <i class="bi bi-people"></i>{{ t.assign.everyone }}
      </button>
      @for (member of store.members(); track member.id) {
      <button
        type="button"
        role="radio"
        class="chip chip-select"
        [style.--c]="'var(--hs-' + member.color + ')'"
        [class.chip-solid]="ui.memberFilter() === member.id"
        [attr.aria-checked]="ui.memberFilter() === member.id"
        (click)="ui.memberFilter.set(member.id)"
      >
        <span class="mini-avatar">{{ initials(member.displayName) }}</span>{{ member.displayName }}
      </button>
      }
    </div>
    }
  `,
  styles: `
    .chip-select {
      border: 0;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.3rem 0.75rem 0.3rem 0.35rem;
    }
    .chip-select:first-child {
      padding-left: 0.7rem;
    }
    .mini-avatar {
      width: 1.3rem;
      height: 1.3rem;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 800;
      color: var(--hs-on-accent);
      background: var(--c);
    }
    .chip-solid .mini-avatar {
      background: var(--hs-on-accent);
      color: var(--c);
    }
  `,
})
export class MemberFilter {
  t = TERMS;
  store = inject(PlannerStore);
  ui = inject(UiStateService);
  initials = initials;
}
