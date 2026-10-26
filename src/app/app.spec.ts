import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { TaskBoard } from './components/task-board/task-board';
import { TERMS } from './terminology';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App, TaskBoard],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the three board columns', () => {
    const fixture = TestBed.createComponent(TaskBoard);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = Array.from(compiled.querySelectorAll('.bed-header h2')).map((h) => h.textContent?.trim());
    const { todo, inProgress, done } = TERMS.board.columns;
    expect(headings).toEqual([todo, inProgress, done]);
  });
});
