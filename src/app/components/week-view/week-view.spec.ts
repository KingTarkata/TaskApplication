import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekView } from './week-view';
import { PlannerStore } from '../../services/planner-store';
import { TaskStatus } from '../../models/task.model';

describe('WeekView', () => {
  let component: WeekView;
  let fixture: ComponentFixture<WeekView>;
  let store: PlannerStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [WeekView] }).compileComponents();
    store = TestBed.inject(PlannerStore);
    await store.init();
    fixture = TestBed.createComponent(WeekView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows seven days including today', () => {
    expect(component.days().length).toBe(7);
    expect(component.days().filter((d) => d.isToday).length).toBe(1);
  });

  it('places dated chores on their day and previews daily repeats', () => {
    const start = component.weekStart();
    const due = new Date(start);
    due.setHours(8, 0, 0, 0);
    store.addTask({ title: 'Feed chickens', categoryId: store.categories()[0].id, dueDate: due, recurrence: { freq: 'daily', interval: 1 } });

    const days = component.days();
    expect(days[0].items.length).toBe(1);
    expect(days[0].items[0].projected).toBeFalse();
    // The other six days show projected repeats
    expect(days.slice(1).every((d) => d.items.length === 1 && d.items[0].projected)).toBeTrue();
  });

  it('lists overdue and undated chores separately, and can tick a chore done', () => {
    const plot = store.categories()[0].id;
    const late = store.addTask({ title: 'Late', categoryId: plot, dueDate: new Date(2000, 0, 1) });
    store.addTask({ title: 'Someday', categoryId: plot });
    expect(component.overdue().map((t) => t.title)).toEqual(['Late']);
    expect(component.anytime().map((t) => t.title)).toEqual(['Someday']);

    component.toggleDone(late);
    expect(store.getTask(late.id)!.status).toBe(TaskStatus.DONE);
    expect(component.overdue().length).toBe(0);
  });
});
