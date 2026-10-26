import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GamificationService } from '../../services/gamification';
import { UiStateService } from '../../services/ui-state';
import { openModal } from '../../services/modal';
import { TERMS } from '../../terminology';

// App-style tab bar for phones (hidden on larger screens, where the header has these actions)
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
})
export class BottomNav {
  t = TERMS;
  ui = inject(UiStateService);
  gameService = inject(GamificationService);

  open(id: string) {
    openModal(id);
  }
}
