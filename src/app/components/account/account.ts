import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SyncService } from '../../services/sync';
import { PlannerStore } from '../../services/planner-store';
import { initials } from '../../models/member.model';
import { TERMS } from '../../terminology';

// Settings section for signing in and sharing a household
@Component({
  selector: 'app-account',
  imports: [FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent {
  t = TERMS;
  sync = inject(SyncService);
  store = inject(PlannerStore);
  initials = initials;

  // Sign-in form
  showEmail = signal(false);
  mode = signal<'signin' | 'signup'>('signin');
  email = '';
  password = '';
  name = '';
  resetSent = signal(false);

  // Household forms
  householdName = TERMS.sync.defaultHouseholdName;
  code = '';
  bringChores = true;
  copied = signal(false);

  canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  async submitEmail() {
    this.resetSent.set(false);
    if (this.mode() === 'signin') await this.sync.signInWithEmail(this.email, this.password);
    else await this.sync.signUpWithEmail(this.email, this.password, this.name);
    this.password = '';
  }

  async forgot() {
    if (await this.sync.resetPassword(this.email)) this.resetSent.set(true);
  }

  toggleMode() {
    this.mode.update((m) => (m === 'signin' ? 'signup' : 'signin'));
    this.sync.clearError();
  }

  async join() {
    if (await this.sync.joinHousehold(this.code, this.bringChores)) this.code = '';
  }

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard unavailable; the code is visible to copy by hand
    }
  }

  shareCode(code: string) {
    navigator.share?.({ title: TERMS.app.name, text: TERMS.sync.shareText(code, TERMS.app.name) }).catch(() => {});
  }

  leave() {
    if (confirm(TERMS.sync.confirmLeave)) this.sync.leaveHousehold();
  }
}
