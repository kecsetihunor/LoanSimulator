import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedLoanInputComponent } from '@features/advanced-calculator/components/advanced-loan-input/advanced-loan-input.component';
import { AmortizationScheduleComponent } from '@shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentScheduleRow } from '@shared/models/loan.models';
import { PaymentSummaryCardsComponent } from '@shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { take } from 'rxjs';
import { DownloadPdfService } from '@app/core/services/download-pdf.service';

@Component({
  selector: 'app-advanced-calculator',
  standalone: true,
  imports: [
    CommonModule,
    AdvancedLoanInputComponent,
    AmortizationScheduleComponent,
    PaymentSummaryCardsComponent
  ],
  templateUrl: './advanced-calculator.component.html',
  styleUrls: ['./advanced-calculator.component.css']
})
export class AdvancedCalculatorComponent implements OnInit {
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
  totalPeriod: number | null = null;
  fixedRate: number | null = null;
  variableRate: number | null = null;
  fixedMonths: number | null = null;
  insuranceRate: number | null = null;

  showAnnuity: boolean = true;
  showLinear: boolean = true;
  annuityInsuranceTotal = 0;
  annuityInterestTotal = 0;
  linearInsuranceTotal = 0;
  linearInterestTotal = 0;

  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        this.amount = data.amount;
        this.totalPeriod = data.period;
        this.fixedRate = data.rate;
        this.variableRate = data.variableRate;
        this.fixedMonths = data.fixedPeriod;
        if (data.insuranceRate !== null) {
          this.insuranceRate = data.insuranceRate;
        }

        this.recalculateSchedules();
      }
    });
  }

  onInputChanged(data: {
    amount: number | null;
    totalPeriod: number | null;
    fixedMonths: number | null;
    fixedRate: number | null;
    variableRate: number | null;
    insuranceRate: number | null;
  }) {
    this.amount = data.amount;
    this.fixedMonths = data.fixedMonths;
    this.fixedRate = data.fixedRate;
    this.variableRate = data.variableRate;
    this.totalPeriod = data.totalPeriod;
    this.insuranceRate = data.insuranceRate;

    this.loanDataService.updateLoanData({
      amount: data.amount,
      period: data.totalPeriod,
      rate: data.fixedRate,
      fixedPeriod: data.fixedMonths,
      variableRate: data.variableRate,
      insuranceRate: data.insuranceRate
    });

    this.recalculateSchedules();
  }

  onVisibilityChanged(data: { showAnnuity: boolean; showLinear: boolean }) {
    this.showAnnuity = data.showAnnuity;
    this.showLinear = data.showLinear;
  }

  onScheduleModeChanged(mode: 'annuity' | 'linear' | 'both') {
    this.scheduleMode = mode;

    this.showAnnuity = mode === 'annuity' || mode === 'both';
    this.showLinear  = mode === 'linear'  || mode === 'both';

    this.recalculateSchedules();
  }

  private isValid(): boolean {
    return this.amount !== null &&
           this.amount > 0 &&
           this.totalPeriod !== null &&
           this.totalPeriod > 0 &&
           this.fixedMonths !== null &&
           this.fixedMonths > 0 &&
           this.fixedMonths <= this.totalPeriod &&
           this.fixedRate !== null &&
           this.fixedRate >= 0 &&
           this.variableRate !== null &&
           this.variableRate >= 0;
  }

  private resetResults(): void {
    this.annuityPayment = null;
    this.linearPayment = null;
    this.annuityTotal = null;
    this.linearTotal = null;
    this.annuitySchedule = [];
    this.linearSchedule = [];
    this.annuityInsuranceTotal = 0;
    this.annuityInterestTotal = 0;
    this.linearInsuranceTotal = 0;
    this.linearInterestTotal = 0;
}

  private recalculateSchedules(): void {
    if (!this.isValid()) {
      this.resetResults();
      return;
    }

    try {
      if (this.scheduleMode === 'annuity' || this.scheduleMode === 'both') {
        const annuitySchedule = this.loanCalculator.generateVariableAnnuitySchedule(
          this.amount!,
          this.totalPeriod!,
          this.fixedRate!,
          this.fixedMonths!,
          this.variableRate!,
          this.insuranceRate
        );

        this.annuitySchedule = annuitySchedule;
        this.annuityPayment = annuitySchedule[0]?.payment ?? null;
        this.annuityTotal = annuitySchedule.reduce((sum, row) => sum + row.payment, 0);
        this.annuityInterestTotal = annuitySchedule.reduce((sum, row) => sum + row.interest, 0);
        if (this.insuranceRate !== null) {
          this.annuityInsuranceTotal = annuitySchedule.reduce((sum, row) => sum + row.insurance!, 0);
        }
      } else {
        this.annuitySchedule = [];
        this.annuityPayment = null;
        this.annuityTotal = null;
      }

      if (this.scheduleMode === 'linear' || this.scheduleMode === 'both') {
        const linearSchedule = this.loanCalculator.generateVariableLinearSchedule(
          this.amount!,
          this.totalPeriod!,
          this.fixedRate!,
          this.fixedMonths!,
          this.variableRate!,
          this.insuranceRate
        );

        this.linearSchedule = linearSchedule;
        this.linearPayment = linearSchedule[0]?.payment ?? null;
        this.linearTotal = linearSchedule.reduce((sum, row) => sum + row.payment, 0);
        this.linearInterestTotal = linearSchedule.reduce((sum, row) => sum + row.interest, 0);
        if (this.insuranceRate !== null) {
          this.linearInsuranceTotal = linearSchedule.reduce((sum, row) => sum + row.insurance!, 0);
        }
      } else {
        this.linearSchedule = [];
        this.linearPayment = null;
        this.linearTotal = null;
      }

    } catch (error) {
      console.error('Calculation error:', error);
      this.resetResults();
    }
  }

  downloadPdf(schedule: PaymentScheduleRow[], type: string) {
    this.downloadPdfService.schedule = schedule;
    this.downloadPdfService.amount = this.amount;
    this.downloadPdfService.totalPeriod = this.totalPeriod;
    this.downloadPdfService.fixedMonths = this.fixedMonths;
    this.downloadPdfService.fixedRate = this.fixedRate;
    this.downloadPdfService.variableRate = this.variableRate;
    this.downloadPdfService.insuranceRate = this.insuranceRate;
    this.downloadPdfService.scheduleType = type;
    this.downloadPdfService.downloadPdf();
  }
}
