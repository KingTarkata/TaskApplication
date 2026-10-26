import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme';
import { GamificationService } from '../../services/gamification';
import { UiStateService } from '../../services/ui-state';
import { openModal } from '../../services/modal';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  t = TERMS;
  themeService = inject(ThemeService);
  gameService = inject(GamificationService);
  ui = inject(UiStateService);

  open(id: string) {
    openModal(id);
  }

  // Search bar
  onSearch(event: Event) {
    this.ui.setSearch((event.target as HTMLInputElement).value);
  }
}
