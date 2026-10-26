import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { BottomNav } from './components/bottom-nav/bottom-nav';
import { TaskModals } from './components/task-modals/task-modals';
import { SettingsComponent } from './components/settings/settings';
import { ProfileComponent } from './components/profile/profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, BottomNav, TaskModals, SettingsComponent, ProfileComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
