import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanInputComponent } from '@features/simple-calculator/components/loan-input/loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';

// Add to your component's "imports" array if using standalone component pattern


@Component({
  selector: 'app-simple-calculator',
  standalone: true,
  imports: [CommonModule, LoanInputComponent, AmortizationScheduleComponent, PaymentSummaryCardsComponent],
  templateUrl: './simple-calculator.component.html'
})
export class SimpleCalculatorComponent {
  annuitySchedule: PaymentScheduleRow[] = [];
  linearSchedule: PaymentScheduleRow[] = [];

  annuityPayment: number | null = null;
  annuityTotal: number | null = null;
  linearPayment: number | null = null;
  linearTotal: number | null = null;
  amount: number | null = null;
  period: number | null = null;
  rate: number | null = null;

  onInputChanged(data: { amount: number; period: number; rate: number }) {
    this.amount = data.amount;
    this.period = data.period;
    this.rate = data.rate;
  }

  onSchedulesGenerated(schedules: { annuity: PaymentScheduleRow[]; linear: PaymentScheduleRow[] }) {
    this.annuitySchedule = schedules.annuity;
    this.linearSchedule = schedules.linear;

    this.annuityPayment = schedules.annuity.length > 0 ? schedules.annuity[0].payment : null;
    this.annuityTotal = schedules.annuity.reduce((sum, row) => sum + row.payment, 0);
    this.linearPayment = schedules.linear.length > 0 ? schedules.linear[0].payment : null;
    this.linearTotal = schedules.linear.reduce((sum, row) => sum + row.payment, 0);
  }
}
