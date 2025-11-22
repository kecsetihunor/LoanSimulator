import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanCalculatorService, RepaymentType } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { LoanInputComponent } from '@app/features/simple-calculator/components/loan-input/loan-input.component';
import { AdvancedLoanInputComponent } from '@app/features/advanced-calculator/components/advanced-loan-input/advanced-loan-input.component';
import { AmortizationScheduleComponent } from '@app/shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentSummaryCardsComponent } from '@app/shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { take } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormatCurrencyPipe } from '@app/pipes/format-currency.pipe';

type ScenarioMode = 'simple' | 'advanced';
type RepaymentEffect = 'amount' | 'period';
type LoanType = 'annuity' | 'linear';

@Component({
  selector: 'app-repayment-calculator',
  standalone: true,
  imports: [
    MatButtonToggleModule,
    CommonModule,
    FormsModule,
    LoanInputComponent,
    AdvancedLoanInputComponent,
    AmortizationScheduleComponent,
    PaymentSummaryCardsComponent,
    MatExpansionModule,
    FormatCurrencyPipe
  ],
  templateUrl: './repayment-calculator.component.html',
  styleUrl: './repayment-calculator.component.css'
})
export class RepaymentCalculatorComponent implements OnInit {
  // UI state
  mode: ScenarioMode = 'simple';
  loanType: LoanType = 'annuity';

  // Early repayment UI state
  earlyRepaymentAmount: number | null = null;
  totalSaved: number = 0;
  repaymentEffect: RepaymentEffect = 'period'; // default: reduce period
  repaymentResultText = '';

  // Original vs simulated schedules / totals
  originalSchedule: PaymentScheduleRow[] = [];
  originalTotal = 0;
  originalFirstPayment = 0;

  afterRepaymentSchedule: PaymentScheduleRow[] = [];
  afterRepaymentTotal = 0;
  afterRepaymentFirstPayment = 0;

  private loanDataService = inject(LoanDataService);

  @Input() amount: number | null = null;
  @Output() amountChange = new EventEmitter<number | null>();

  @Input() totalPeriod: number | null = null;
  @Output() totalPeriodChange = new EventEmitter<number | null>();

  @Input() fixedMonths: number | null = null; // First 3 years
  @Output() fixedMonthsChange = new EventEmitter<number | null>();

  @Input() fixedRate: number | null = null; // Fixed rate for first period
  @Output() fixedRateChange = new EventEmitter<number | null>();

  @Input() insuranceRate: number | null = null; // Insurance rate
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Input() variableRate: number | null = null; // Variable rate after fixed period
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{
    amount: number | null;
    totalPeriod: number | null;
    fixedMonths: number | null;
    fixedRate: number | null;
    variableRate: number | null;
    insuranceRate: number | null;
  }>();

  // Scenario output (kept as "after repayment" for compatibility)
  scenarioSchedule: PaymentScheduleRow[] = [];
  scenarioTotal = 0;
  scenarioFirstPayment = 0;

  constructor(private loanService: LoanCalculatorService) {}

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
      }
    });

    this.recalculateScenario();
  }

  // === Input handlers from child components ===

  onSimpleInputChanged(data: {
    amount: number | null;
    period: number | null;
    rate: number | null;
    insuranceRate: number | null;
  }) {
    this.amount = data.amount;
    this.totalPeriod = data.period;
    this.fixedRate = data.rate;
    this.insuranceRate = data.insuranceRate;

    this.loanDataService.updateLoanData({
      amount: data.amount,
      period: data.period,
      rate: data.rate,
      fixedPeriod: null,
      variableRate: null,
      insuranceRate: data.insuranceRate
    });

    this.recalculateScenario();
  }

  onAdvancedInputChanged(data: {
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

    this.recalculateScenario();
  }

  onModeChanged(mode: ScenarioMode) {
    this.mode = mode;
    this.recalculateScenario();
  }

  onLoanTypeChanged(type: LoanType) {
    this.loanType = type;
    this.recalculateScenario();
  }

  // Early‑repayment handlers
  onEarlyRepaymentAmountChange(value: number | null) {
    this.earlyRepaymentAmount = value;
    this.recalculateScenario();
  }

  onRepaymentEffectChange(effect: RepaymentEffect) {
    this.repaymentEffect = effect;
    this.recalculateScenario();
  }

  // === Core scenario calculation ===

  private recalculateScenario(): void {
    if (!this.isValid()) {
      this.clearScenario();
      return;
    }

    const baseSchedule =
      this.mode === 'simple' ? this.buildSimpleSchedule() : this.buildAdvancedSchedule();

    this.setOriginalFromSchedule(baseSchedule);

    if (!this.earlyRepaymentAmount || this.earlyRepaymentAmount <= 0) {
      this.afterRepaymentSchedule = [];
      this.afterRepaymentFirstPayment = 0;
      this.afterRepaymentTotal = 0;
      this.repaymentResultText = '';

      this.scenarioSchedule = this.originalSchedule;
      this.scenarioFirstPayment = this.originalFirstPayment;
      this.scenarioTotal = this.originalTotal;

      return;
    }

    const afterSchedule = this.buildEarlyRepaymentSchedule(baseSchedule);
    this.setAfterRepaymentFromSchedule(afterSchedule);

    this.scenarioSchedule = this.afterRepaymentSchedule;
    this.scenarioFirstPayment = this.afterRepaymentFirstPayment;
    this.scenarioTotal = this.afterRepaymentTotal;

    this.updateRepaymentResultText();
  }

  private buildSimpleSchedule(): PaymentScheduleRow[] {
    const type: RepaymentType = this.loanType === 'annuity' ? 'annuity' : 'linear';
    return this.loanService.generateAmortizationSchedule(
      this.amount!,
      this.totalPeriod!,
      this.fixedRate!,
      this.insuranceRate,
      type
    );
  }

  private buildAdvancedSchedule(): PaymentScheduleRow[] {
    if (this.loanType === 'annuity') {
      return this.loanService.generateVariableAnnuitySchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!,
        this.insuranceRate
      );
    }

    return this.loanService.generateVariableLinearSchedule(
      this.amount!,
      this.totalPeriod!,
      this.fixedRate!,
      this.fixedMonths!,
      this.variableRate!,
      this.insuranceRate
    );
  }

  private setOriginalFromSchedule(schedule: PaymentScheduleRow[]): void {
    this.originalSchedule = schedule;

    if (!schedule.length) {
      this.originalTotal = 0;
      this.originalFirstPayment = 0;
      return;
    }

    this.originalFirstPayment = schedule[0].payment;
    this.originalTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
  }

  private setAfterRepaymentFromSchedule(schedule: PaymentScheduleRow[]): void {
    this.afterRepaymentSchedule = schedule;

    if (!schedule.length) {
      this.afterRepaymentTotal = 0;
      this.afterRepaymentFirstPayment = 0;
      return;
    }

    this.afterRepaymentFirstPayment = schedule[0].payment;
    this.afterRepaymentTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
  }

  // === Early repayment logic ===
  private buildEarlyRepaymentSchedule(baseSchedule: PaymentScheduleRow[]): PaymentScheduleRow[] {
    if (!baseSchedule.length || !this.earlyRepaymentAmount || this.earlyRepaymentAmount <= 0) {
      return baseSchedule;
    }

    const originalAmount = this.amount || 0;
    const originalPeriod = this.totalPeriod || baseSchedule.length;
    const extra = this.earlyRepaymentAmount || 0;
    const newPrincipal = Math.max(originalAmount - extra, 0);

    // Reduce monthly payment (same period)
    if (this.repaymentEffect === 'amount') {
      const remainingMonths = baseSchedule.length;

      if (this.mode === 'simple') {
        const type: RepaymentType = this.loanType === 'annuity' ? 'annuity' : 'linear';
        return this.loanService.generateAmortizationSchedule(
          newPrincipal,
          remainingMonths,
          this.fixedRate!,
          this.insuranceRate,
          type
        );
      }

      return this.buildAdvancedScheduleWithNewAmount(newPrincipal);
    }

    // Reduce period (shorter term)
    if (this.loanType === 'linear') {
      // --- LINEAR reduce period, BCR-style logic ---
      // Principal standard pe lună din creditul inițial:
      const principalPerMonth = originalAmount / originalPeriod;
      if (principalPerMonth <= 0 || originalPeriod <= 0) {
        return baseSchedule;
      }

      // Sold după rambursare anticipată:
      const remainingPrincipal = Math.max(originalAmount - extra, 0);
      if (remainingPrincipal <= 0) {
        return [];
      }

      // Câte luni întregi cu principal standard pot fi plătite din soldul rămas:
      const fullMonths = Math.floor(remainingPrincipal / principalPerMonth);
      const lastPrincipal = remainingPrincipal - fullMonths * principalPerMonth;

      // Număr total de luni în noul grafic:
      const totalMonths = fullMonths + (lastPrincipal > 0 ? 1 : 0);

      const monthlyRate = (this.fixedRate || 0) / 100 / 12;
      let balance = remainingPrincipal;
      const schedule: PaymentScheduleRow[] = [];
      let insuranceCost = 0;

      for (let i = 1; i <= totalMonths; i++) {
        const isLast = i === totalMonths && lastPrincipal > 0;
        const principal = isLast ? lastPrincipal : principalPerMonth;

        const interest = balance * monthlyRate;

        if (this.insuranceRate != null) {
          insuranceCost = balance * (this.insuranceRate / 100);
        } else {
          insuranceCost = 0;
        }

        const payment = principal + interest + insuranceCost;
        balance = Math.max(0, balance - principal);

        schedule.push({
          month: i,
          payment,
          principal,
          interest,
          insurance: this.insuranceRate != null ? insuranceCost : null,
          remainingBalance: balance
        });
      }

      return schedule;
    } else {
      // ANNUITY: keep monthly payment approx. the same, solve for new n analytically.
      const r = (this.fixedRate || 0) / 100 / 12;
      const M = this.originalFirstPayment;

      if (r <= 0 || M <= 0) {
        return this.loanService.generateAmortizationSchedule(
          newPrincipal,
          originalPeriod,
          this.fixedRate || 0,
          this.insuranceRate,
          'annuity'
        );
      }

      const numerator = Math.log(M / (M - newPrincipal * r));
      const denominator = Math.log(1 + r);
      const nReal = numerator / denominator;
      const n = Math.max(1, Math.ceil(nReal));

      return this.loanService.generateAmortizationSchedule(
        newPrincipal,
        n,
        this.fixedRate || 0,
        this.insuranceRate,
        'annuity'
      );
    }
  }

  private buildAdvancedScheduleWithNewAmount(newAmount: number): PaymentScheduleRow[] {
    if (this.loanType === 'annuity') {
      return this.loanService.generateVariableAnnuitySchedule(
        newAmount,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths || 0,
        this.variableRate || this.fixedRate || 0,
        this.insuranceRate
      );
    }

    return this.loanService.generateVariableLinearSchedule(
      newAmount,
      this.totalPeriod!,
      this.fixedRate!,
      this.fixedMonths || 0,
      this.variableRate || this.fixedRate || 0,
      this.insuranceRate
    );
  }

  private updateRepaymentResultText(): void {
    if (!this.originalSchedule.length || !this.afterRepaymentSchedule.length) {
      this.repaymentResultText = '';
      return;
    }

    const originalMonths = this.originalSchedule.length;
    const newMonths = this.afterRepaymentSchedule.length;
    const reducedMonths = Math.max(originalMonths - newMonths, 0);

    const originalInstallment = this.originalFirstPayment;
    const newInstallment = this.afterRepaymentFirstPayment;
    const diffInstallment = Math.max(originalInstallment - newInstallment, 0);

    const originalInterest = this.originalSchedule
      .reduce((sum, row) => sum + (row.interest || 0), 0);
    const newInterest = this.afterRepaymentSchedule
      .reduce((sum, row) => sum + (row.interest || 0), 0);

    const originalInsurance = this.originalSchedule
      .reduce((sum, row) => sum + (row.insurance || 0), 0);
    const newInsurance = this.afterRepaymentSchedule
      .reduce((sum, row) => sum + (row.insurance || 0), 0);

    const savedInterest = Math.max(originalInterest - newInterest, 0);
    const savedInsurance = Math.max(originalInsurance - newInsurance, 0);
    this.totalSaved = Math.max(savedInterest + savedInsurance, 0);

    const totalSavedText = this.totalSaved.toFixed(2);
    const diffInstallmentText = diffInstallment.toFixed(2);

    if (this.repaymentEffect === 'period') {
      this.repaymentResultText =
        `Veți reduce perioada creditului cu ${reducedMonths} luni. ` +
        `Veți economisi aproximativ ${totalSavedText} RON (dobândă + asigurare).`;
    } else {
      this.repaymentResultText =
        `Rata lunară va fi cu aproximativ ${diffInstallmentText} RON mai mică. ` +
        `Veți economisi aproximativ ${totalSavedText} RON (dobândă + asigurare).`;
    }
  }

  // === Helpers ===

  private clearScenario(): void {
    this.scenarioSchedule = [];
    this.scenarioTotal = 0;
    this.scenarioFirstPayment = 0;

    this.originalSchedule = [];
    this.originalTotal = 0;
    this.originalFirstPayment = 0;

    this.afterRepaymentSchedule = [];
    this.afterRepaymentTotal = 0;
    this.afterRepaymentFirstPayment = 0;

    this.repaymentResultText = '';
  }

  downloadScenarioPdf(): void {
    // this.pdfService.download(this.scenarioSchedule, this.loanType, this.mode);
  }

  isValid(): boolean {
    if (this.mode === 'simple') {
      return (
        this.amount !== null &&
        this.amount > 0 &&
        this.totalPeriod !== null &&
        this.totalPeriod > 0 &&
        this.fixedRate !== null &&
        this.fixedRate >= 0
      );
    } else {
      return (
        this.amount !== null &&
        this.amount > 0 &&
        this.totalPeriod !== null &&
        this.totalPeriod > 0 &&
        this.fixedMonths !== null &&
        this.fixedMonths > 0 &&
        this.fixedMonths <= this.totalPeriod &&
        this.fixedRate !== null &&
        this.fixedRate >= 0 &&
        this.variableRate !== null &&
        this.variableRate >= 0
      );
    }
  }
}
