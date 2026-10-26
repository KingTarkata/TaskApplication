import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerStore } from '../../services/planner-store';
import { serializeAppData } from '../../models/app-data';
import { ReminderService } from '../../services/reminders';
import { AccountComponent } from '../account/account';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, AccountComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  t = TERMS;
  private store = inject(PlannerStore);
  reminders = inject(ReminderService);

  // iPhone/iPad Safari that isn't installed to the Home Screen can't show notifications
  isIosBrowser =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as any).standalone;

  toggleReminders(event: Event) {
    this.reminders.setEnabled((event.target as HTMLInputElement).checked);
  }

  // Export everything as a versioned JSON backup file
  downloadData() {
    const backup = { ...serializeAppData(this.store.snapshot()), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${TERMS.app.backupFilePrefix}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to start the download before releasing the file
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  triggerImport() {
    document.getElementById('importFile')?.click();
  }

  // Restore from a backup file (current or older Directive Zero format)
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Clear the input so choosing the same file again still triggers a change event
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      let data: unknown;
      try {
        data = JSON.parse(reader.result as string);
      } catch (err) {
        alert(TERMS.settings.parseError);
        return;
      }
      if (!confirm(TERMS.settings.confirmImport)) return;
      try {
        await this.store.restore(data);
      } catch (err) {
        console.error(err);
        alert(TERMS.settings.invalidFile);
      }
    };
    reader.readAsText(file);
  }
}
