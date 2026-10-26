import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TERMS } from './terminology';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the three board columns', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = Array.from(compiled.querySelectorAll('app-task-board h6')).map((h) =>
      h.textContent?.trim()
    );
    const { todo, inProgress, done } = TERMS.board.columns;
    expect(headings).toEqual([todo, inProgress, done]);
  });
});
