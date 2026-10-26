import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, RankStats } from '../../services/gamification';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  t = TERMS;
  
// Handles "Profile" modal, including user name and current stats

  stats!: RankStats; 

  constructor(public gameService: GamificationService) {
    this.refreshStats();
  }
  
  onNameChange(event: any) {
    this.gameService.updateName(event.target.value);
  }

  refreshStats() {
    this.stats = this.gameService.getStats();
  }
}