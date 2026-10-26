import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { GamificationService } from '../../services/gamification';
import { UiStateService } from '../../services/ui-state';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  t = TERMS;
  themeService = inject(ThemeService);
  gameService = inject(GamificationService);
  ui = inject(UiStateService);

  // Search bar
  onSearch(event: Event) {
    this.ui.setSearch((event.target as HTMLInputElement).value);
  }
}
