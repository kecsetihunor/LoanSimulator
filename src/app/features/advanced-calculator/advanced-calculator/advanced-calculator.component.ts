import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedLoanInputComponent } from '@features/advanced-calculator/components/advanced-loan-input/advanced-loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';

@Component({
  selector: 'app-advanced-calculator',
  standalone: true,
  imports: [CommonModule, AdvancedLoanInputComponent, AmortizationScheduleComponent, PaymentSummaryCardsComponent],
  templateUrl: './advanced-calculator.component.html',
  styleUrls: ['./advanced-calculator.component.css']
})
export class AdvancedCalculatorComponent {
  annuitySchedule: PaymentScheduleRow[] = [];
  linearSchedule: PaymentScheduleRow[] = [];

  annuityPayment: number | null = null;
  annuityTotal: number | null = null;
  linearPayment: number | null = null;
  linearTotal: number | null = null;
  
  amount: number | null = null;
  totalPeriod: number | null = null;
  fixedRate: number | null = null;
  variableRate: number | null = null;
  fixedMonths: number | null = null;

  onInputChanged(data: { amount: number; totalPeriod: number; fixedMonths: number, fixedRate: number, variableRate: number }) {
    this.amount = data.amount;
    this.fixedMonths = data.fixedMonths;
    this.fixedRate = data.fixedRate;
    this.variableRate = data.variableRate;
    this.totalPeriod = data.totalPeriod;
  }

  onSchedulesGenerated(schedules: { annuity: PaymentScheduleRow[]; linear: PaymentScheduleRow[] }): void {
    this.annuitySchedule = schedules.annuity;
    this.linearSchedule = schedules.linear;
    
    this.annuityPayment = schedules.annuity.length > 0 ? schedules.annuity[0].payment : null;
    this.annuityTotal = schedules.annuity.reduce((sum, row) => sum + row.payment, 0);
    this.linearPayment = schedules.linear.length > 0 ? schedules.linear[0].payment : null;
    this.linearTotal = schedules.linear.reduce((sum, row) => sum + row.payment, 0);
  }
}
