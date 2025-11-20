import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepaymentCalculatorComponent } from './repayment-calculator.component';

describe('RepaymentCalculatorComponent', () => {
  let component: RepaymentCalculatorComponent;
  let fixture: ComponentFixture<RepaymentCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepaymentCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepaymentCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
