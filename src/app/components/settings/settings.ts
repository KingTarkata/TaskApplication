import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category';
import { GamificationService } from '../../services/gamification';
import { StorageService, STORAGE_KEYS } from '../../services/storage';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private gameService: GamificationService,
    private storage: StorageService
  ) {}

  // 1. Export data as JSON file for user to download, including tasks, categories, profile details, and current version and date.

  downloadData() {
    const stats = this.gameService.getStats();

    // Bundle data
    const dataPackage = {
      tasks: this.taskService.tasks,
      categories: this.categoryService.categories,
      profile: {
        codename: this.gameService.operativeName,
        totalXp: stats.xp,
        level: stats.level,
      },
      exportedAt: new Date().toISOString(),
      version: '1.1',
    };

    // Create file
    const jsonString = JSON.stringify(dataPackage, null, 2); // Pretty print
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Download JSON file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `directive_zero_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to start the download before releasing the file
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  // 2. Import JSON data

  triggerImport() {
    document.getElementById('importFile')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Clear the input so choosing the same file again still triggers a change event
    input.value = '';
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);

        // Validate data
        if (!this.isValidBackup(data)) {
          alert('Error: Corrupt or Invalid Protocol File.');
          return;
        }

        // Confirm import
        if (
          confirm(
            'WARNING: Importing protocols will overwrite all current data. This process cannot be undone. Proceed?'
          )
        ) {
          this.performSystemRestore(data);
        }
      } catch (err) {
        alert('Error parsing JSON file.');
        console.error(err);
      }
    };

    reader.readAsText(file);
  }

  // Check the file has the shape this app exports before overwriting anything
  private isValidBackup(data: any): boolean {
    return (
      data &&
      Array.isArray(data.tasks) &&
      Array.isArray(data.categories) &&
      data.categories.length > 0 &&
      data.tasks.every((t: any) => t && typeof t.id === 'string' && typeof t.title === 'string') &&
      data.categories.every((c: any) => c && typeof c.id === 'string' && typeof c.name === 'string')
    );
  }

  // Overwrite stored data with the backup, then reload so every service picks it up
  private performSystemRestore(data: any) {
    this.storage.setJson(STORAGE_KEYS.tasks, data.tasks);
    this.storage.setJson(STORAGE_KEYS.categories, data.categories);
    if (data.profile && data.profile.codename) {
      this.storage.setString(STORAGE_KEYS.codename, data.profile.codename);
    }
    location.reload();
  }
}
