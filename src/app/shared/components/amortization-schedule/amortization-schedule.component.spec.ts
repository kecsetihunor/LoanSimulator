import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmortizationScheduleComponent } from './amortization-schedule.component';

describe('AmortizationScheduleComponent', () => {
  let component: AmortizationScheduleComponent;
  let fixture: ComponentFixture<AmortizationScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmortizationScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmortizationScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
