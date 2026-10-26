import { Routes } from '@angular/router';
import { TaskBoard } from './components/task-board/task-board';
import { WeekView } from './components/week-view/week-view';
import { TERMS } from './terminology';

export const routes: Routes = [
  { path: '', component: TaskBoard, title: TERMS.app.name },
  { path: 'week', component: WeekView, title: `${TERMS.week.title} · ${TERMS.app.name}` },
  { path: '**', redirectTo: '' },
];
