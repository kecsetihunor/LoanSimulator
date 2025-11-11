import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanInputComponent } from '@features/simple-calculator/components/loan-input/loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';

@Component({
  selector: 'app-simple-calculator',
  standalone: true,
  imports: [CommonModule, LoanInputComponent, AmortizationScheduleComponent],
  templateUrl: './simple-calculator.component.html'
})
export class SimpleCalculatorComponent {
  annuitySchedule: PaymentScheduleRow[] = [];
  linearSchedule: PaymentScheduleRow[] = [];

  onSchedulesGenerated(schedules: { annuity: PaymentScheduleRow[]; linear: PaymentScheduleRow[] }) {
    this.annuitySchedule = schedules.annuity;
    this.linearSchedule = schedules.linear;
  }
}
