import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, RankStats } from '../../services/gamification';
import { TERMS } from '../../terminology';
import { initials } from '../../models/member.model';

// Profile modal: name and current stats
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  t = TERMS;
  gameService = inject(GamificationService);
  initials = initials;

  get stats(): RankStats {
    return this.gameService.stats();
  }

  onNameChange(event: Event) {
    this.gameService.updateName((event.target as HTMLInputElement).value);
  }
}
