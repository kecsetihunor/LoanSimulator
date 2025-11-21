import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanInputComponent } from '@features/simple-calculator/components/loan-input/loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { take } from 'rxjs';
import { DownloadPdfService } from '@app/core/services/download-pdf.service';

@Component({
  selector: 'app-simple-calculator',
  standalone: true,
  imports: [
    CommonModule,
    LoanInputComponent,
    AmortizationScheduleComponent,
    PaymentSummaryCardsComponent
  ],
  templateUrl: './simple-calculator.component.html'
})
export class SimpleCalculatorComponent implements OnInit {
  private loanDataService = inject(LoanDataService);
  private loanCalculator = inject(LoanCalculatorService);
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

  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        this.amount = data.amount;
        this.period = data.period;
        this.rate = data.rate;
        this.insuranceRate = data.insuranceRate;

        // if there is stored data, also trigger initial calculation
        this.recalculateSchedules();
      }
    });
  }

  onInputChanged(data: {
    amount: number | null;
    period: number | null;
    rate: number | null;
    insuranceRate: number | null;
  }) {
    this.amount = data.amount;
    this.period = data.period;
    this.rate = data.rate;
    this.insuranceRate = data.insuranceRate;

    this.loanDataService.updateLoanData(data);

    this.recalculateSchedules();
  }

  onVisibilityChanged(data: { showAnnuity: boolean; showLinear: boolean }) {
    this.showAnnuity = data.showAnnuity;
    this.showLinear = data.showLinear;
  }

  onScheduleModeChanged(mode: 'annuity' | 'linear' | 'both') {
    this.scheduleMode = mode;

    // The child already controls showAnnuity/showLinear visually,
    // but parent also keeps its own flags if the mode affects other logic.
    this.showAnnuity = mode === 'annuity' || mode === 'both';
    this.showLinear  = mode === 'linear'  || mode === 'both';

    this.recalculateSchedules();
  }

  private isValid(): boolean {
    return this.amount !== null && this.amount > 0 &&
           this.period !== null && this.period > 0 &&
           this.rate !== null && this.rate >= 0;
  }

  private recalculateSchedules() {
    if (!this.isValid()) {
      this.annuitySchedule = [];
      this.linearSchedule = [];
      this.annuityPayment = null;
      this.linearPayment = null;
      this.annuityTotal = null;
      this.linearTotal = null;
      return;
    }

    try {
      // Always compute both, or only what’s needed based on scheduleMode
      if (this.scheduleMode === 'annuity' || this.scheduleMode === 'both') {
        const annuitySchedule = this.loanCalculator.generateAmortizationSchedule(
          this.amount! as number,
          this.period! as number,
          this.rate! as number,
          this.insuranceRate as number | null,
          'annuity'
        );

        this.annuitySchedule = annuitySchedule;
        this.annuityPayment = annuitySchedule.length > 0 ? annuitySchedule[0].payment : null;
        this.annuityTotal = annuitySchedule.reduce((sum, row) => sum + row.payment, 0);
      } else {
        this.annuitySchedule = [];
        this.annuityPayment = null;
        this.annuityTotal = null;
      }

      if (this.scheduleMode === 'linear' || this.scheduleMode === 'both') {
        const linearSchedule = this.loanCalculator.generateAmortizationSchedule(
          this.amount! as number,
          this.period! as number,
          this.rate! as number,
          this.insuranceRate as number | null,
          'linear'
        );

        this.linearSchedule = linearSchedule;
        this.linearPayment = linearSchedule.length > 0 ? linearSchedule[0].payment : null;
        this.linearTotal = linearSchedule.reduce((sum, row) => sum + row.payment, 0);
      } else {
        this.linearSchedule = [];
        this.linearPayment = null;
        this.linearTotal = null;
      }

    } catch (error) {
      console.error('Calculation error:', error);
      this.annuitySchedule = [];
      this.linearSchedule = [];
      this.annuityPayment = null;
      this.linearPayment = null;
      this.annuityTotal = null;
      this.linearTotal = null;
    }
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
