import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSummaryCardsComponent } from './payment-summary-cards.component';

describe('PaymentSummaryCardsComponent', () => {
  let component: PaymentSummaryCardsComponent;
  let fixture: ComponentFixture<PaymentSummaryCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSummaryCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentSummaryCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
