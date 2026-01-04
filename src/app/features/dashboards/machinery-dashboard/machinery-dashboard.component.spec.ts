import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineryDashboardComponent } from './machinery-dashboard.component';

describe('MachineryDashboardComponent', () => {
  let component: MachineryDashboardComponent;
  let fixture: ComponentFixture<MachineryDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineryDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineryDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
