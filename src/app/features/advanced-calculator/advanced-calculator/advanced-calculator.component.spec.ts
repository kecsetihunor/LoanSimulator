import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedCalculatorComponent } from './advanced-calculator.component';

describe('AdvancedCalculatorComponent', () => {
  let component: AdvancedCalculatorComponent;
  let fixture: ComponentFixture<AdvancedCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
