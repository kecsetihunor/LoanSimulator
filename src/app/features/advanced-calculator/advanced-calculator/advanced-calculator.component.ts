import { Component, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedLoanInputComponent } from '@features/advanced-calculator/components/advanced-loan-input/advanced-loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-advanced-calculator',
  standalone: true,
  imports: [CommonModule, AdvancedLoanInputComponent, AmortizationScheduleComponent, PaymentSummaryCardsComponent],
  templateUrl: './advanced-calculator.component.html',
  styleUrls: ['./advanced-calculator.component.css']
})
export class AdvancedCalculatorComponent implements OnInit {
  private loanDataService = inject(LoanDataService);

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

  insuranceRate: number | null = null;
  showAnnuity: boolean = true;
  showLinear: boolean = true;

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        // Pre-fill the component's state from the service
        this.amount = data.amount;
        this.totalPeriod = data.period;
        this.fixedRate = data.rate;
        this.variableRate = data.variableRate;
        this.fixedMonths = data.fixedPeriod;
        if (data.insuranceRate !== null) {
          this.insuranceRate = data.insuranceRate;
        }
      }
    });
  }

  onInputChanged(data: { amount: number | null; totalPeriod: number | null; fixedMonths: number | null, fixedRate: number | null, variableRate: number | null, insuranceRate: number | null }) {
    this.amount = data.amount;
    this.fixedMonths = data.fixedMonths;
    this.fixedRate = data.fixedRate;
    this.variableRate = data.variableRate;
    this.totalPeriod = data.totalPeriod;
    this.insuranceRate = data.insuranceRate;
    
    // Map the advanced calculator data to the shared LoanData interface
    this.loanDataService.updateLoanData({
      amount: data.amount,
      period: data.totalPeriod, // Map totalPeriod to period
      rate: data.fixedRate,      // Map fixedRate to rate
      fixedPeriod: data.fixedMonths,
      variableRate: data.variableRate,
      insuranceRate: data.insuranceRate
    });
  }

  onSchedulesGenerated(schedules: { annuity: PaymentScheduleRow[]; linear: PaymentScheduleRow[] }): void {
    this.annuitySchedule = schedules.annuity;
    this.linearSchedule = schedules.linear;
    
    this.annuityPayment = schedules.annuity.length > 0 ? schedules.annuity[0].payment : null;
    this.annuityTotal = schedules.annuity.reduce((sum, row) => sum + row.payment, 0);
    this.linearPayment = schedules.linear.length > 0 ? schedules.linear[0].payment : null;
    this.linearTotal = schedules.linear.reduce((sum, row) => sum + row.payment, 0);
  }

  onVisibilityChanged(data: { showAnnuity: boolean; showLinear: boolean }) {
    this.showAnnuity = data.showAnnuity;
    this.showLinear = data.showLinear;
  }
}
