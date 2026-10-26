import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { TaskService } from '../../services/task.service';
import { GamificationService } from '../../services/gamification';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  t = TERMS;

  constructor(
    public themeService: ThemeService,
    public taskService: TaskService,
    public gameService: GamificationService
  ) {}

  // Search bar
  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.taskService.updateSearchTerm(term);
  }
}
