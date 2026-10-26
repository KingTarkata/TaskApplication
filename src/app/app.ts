import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { TaskBoard } from './components/task-board/task-board';
import { TaskModals } from './components/task-modals/task-modals';
import { SettingsComponent } from './components/settings/settings';
import { ProfileComponent } from './components/profile/profile';
import { TERMS } from './terminology';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, TaskBoard, TaskModals, SettingsComponent, ProfileComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(title: Title) {
    title.setTitle(TERMS.app.name);
  }
}
