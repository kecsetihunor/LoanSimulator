import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanInputComponent } from '@features/simple-calculator/components/loan-input/loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { take } from 'rxjs';
import { DownloadPdfService } from '@app/core/services/download-pdf.service'; 

// Add to your component's "imports" array if using standalone component pattern


@Component({
  selector: 'app-simple-calculator',
  standalone: true,
  imports: [CommonModule, LoanInputComponent, AmortizationScheduleComponent, PaymentSummaryCardsComponent],
  templateUrl: './simple-calculator.component.html'
})
export class SimpleCalculatorComponent implements OnInit {
  private loanDataService = inject(LoanDataService);
  downloadPdfService = inject(DownloadPdfService);

  annuitySchedule: PaymentScheduleRow[] = [];
  linearSchedule: PaymentScheduleRow[] = [];

  annuityPayment: number | null = null;
  annuityTotal: number | null = null;
  linearPayment: number | null = null;
  linearTotal: number | null = null;
  amount: number | null = null;
  period: number | null = null;
  rate: number | null = null;
  insuranceRate: number | null = null;
  showAnnuity: boolean = true;
  showLinear: boolean = true;

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        // Pre-fill the component's state from the service
        this.amount = data.amount;
        this.period = data.period;
        this.rate = data.rate;
        this.insuranceRate = data.insuranceRate;
      }
    });
  }

  onInputChanged(data: { amount: number | null; period: number | null; rate: number | null, insuranceRate: number | null }) {
    this.amount = data.amount;
    this.period = data.period;
    this.rate = data.rate;
    this.insuranceRate = data.insuranceRate;

    this.loanDataService.updateLoanData(data)
  }

  onVisibilityChanged(data: { showAnnuity: boolean; showLinear: boolean }) {
    this.showAnnuity = data.showAnnuity;
    this.showLinear = data.showLinear;
  }

  onSchedulesGenerated(schedules: { annuity: PaymentScheduleRow[]; linear: PaymentScheduleRow[] }) {
    this.annuitySchedule = schedules.annuity;
    this.linearSchedule = schedules.linear;

    this.annuityPayment = schedules.annuity.length > 0 ? schedules.annuity[0].payment : null;
    this.annuityTotal = schedules.annuity.reduce((sum, row) => sum + row.payment, 0);
    this.linearPayment = schedules.linear.length > 0 ? schedules.linear[0].payment : null;
    this.linearTotal = schedules.linear.reduce((sum, row) => sum + row.payment, 0);
  }

  downloadPdf(schedule: PaymentScheduleRow[], type: string) {
    this.downloadPdfService.schedule = schedule;
    this.downloadPdfService.amount = this.amount;
    this.downloadPdfService.totalPeriod = this.period;
    this.downloadPdfService.insuranceRate = this.insuranceRate;
    this.downloadPdfService.scheduleType = type;
    this.downloadPdfService.downloadPdf();
  }
}
