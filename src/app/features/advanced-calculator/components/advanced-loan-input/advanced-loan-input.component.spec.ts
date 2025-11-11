import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedLoanInputComponent } from './advanced-loan-input.component';

describe('AdvancedLoanInputComponent', () => {
  let component: AdvancedLoanInputComponent;
  let fixture: ComponentFixture<AdvancedLoanInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedLoanInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedLoanInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
