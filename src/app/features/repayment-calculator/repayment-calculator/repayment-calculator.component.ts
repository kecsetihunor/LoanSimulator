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
import { DownloadPdfService } from '@app/core/services/download-pdf.service';

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
  downloadPdfService = inject(DownloadPdfService);

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
  originalFirstPayment = 0;          // prima plată TOTALĂ (credit + asigurare)
  originalCreditInstallment = 0;    // prima rată de CREDIT (fără asigurare) – folosită la Reduce perioada

  afterRepaymentSchedule: PaymentScheduleRow[] = [];
  afterRepaymentTotal = 0;
  afterRepaymentFirstPayment = 0;

  originalInterestTotal = 0;
  afterRepaymentInterestTotal = 0;

  originalInsuranceTotal = 0;
  afterRepaymentInsuranceTotal = 0;

  private loanDataService = inject(LoanDataService);

  @Input() amount: number | null = null;
  @Output() amountChange = new EventEmitter<number | null>();

  @Input() totalPeriod: number | null = null;
  @Output() totalPeriodChange = new EventEmitter<number | null>();

  @Input() fixedMonths: number | null = null; // first period with fixed rate
  @Output() fixedMonthsChange = new EventEmitter<number | null>();

  @Input() fixedRate: number | null = null; // fixed rate
  @Output() fixedRateChange = new EventEmitter<number | null>();

  @Input() insuranceRate: number | null = null; // insurance
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Input() variableRate: number | null = null; // variable rate
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{
    amount: number | null;
    totalPeriod: number | null;
    fixedMonths: number | null;
    fixedRate: number | null;
    variableRate: number | null;
    insuranceRate: number | null;
  }>();

  // Scenario output
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
      this.originalInterestTotal = 0;
      this.originalInsuranceTotal = 0;
      this.originalCreditInstallment = 0;
      return;
    }

    this.originalFirstPayment = schedule[0].payment;
    this.originalTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
    this.originalInterestTotal = schedule.reduce((sum, row) => sum + row.interest, 0);

    if (this.insuranceRate !== null) {
      this.originalInsuranceTotal = schedule.reduce(
        (sum, row) => sum + (row.insurance ?? 0),
        0
      );
      const firstInsurance = schedule[0].insurance ?? 0;
      // rata de CREDIT = plată totală - asigurarea din prima lună
      this.originalCreditInstallment = this.originalFirstPayment - firstInsurance;
    } else {
      this.originalInsuranceTotal = 0;
      this.originalCreditInstallment = this.originalFirstPayment;
    }
  }

  private setAfterRepaymentFromSchedule(schedule: PaymentScheduleRow[]): void {
    this.afterRepaymentSchedule = schedule;

    if (!schedule.length) {
      this.afterRepaymentTotal = 0;
      this.afterRepaymentFirstPayment = 0;
      this.afterRepaymentInterestTotal = 0;
      this.afterRepaymentInsuranceTotal = 0;
      return;
    }

    this.afterRepaymentFirstPayment = schedule[0].payment;
    this.afterRepaymentTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
    this.afterRepaymentInterestTotal = schedule.reduce((sum, row) => sum + row.interest, 0);

    if (this.insuranceRate !== null) {
      this.afterRepaymentInsuranceTotal = schedule.reduce(
        (sum, row) => sum + (row.insurance ?? 0),
        0
      );
    } else {
      this.afterRepaymentInsuranceTotal = 0;
    }
  }

  // === Early repayment logic ===

  private buildEarlyRepaymentSchedule(baseSchedule: PaymentScheduleRow[]): PaymentScheduleRow[] {
    if (!baseSchedule.length || !this.earlyRepaymentAmount || this.earlyRepaymentAmount <= 0) {
      return baseSchedule;
    }

    const originalAmount = this.amount || 0;
    const originalPeriod = this.totalPeriod || baseSchedule.length;
    const extra = this.earlyRepaymentAmount || 0;

    // Reduce monthly payment (same period)
    if (this.repaymentEffect === 'amount') {
      const remainingMonths = baseSchedule.length;

      if (this.mode === 'simple') {
        const type: RepaymentType = this.loanType === 'annuity' ? 'annuity' : 'linear';
        const newPrincipal = Math.max(originalAmount - extra, 0);

        return this.loanService.generateAmortizationSchedule(
          newPrincipal,
          remainingMonths,
          this.fixedRate!,
          this.insuranceRate,
          type
        );
      }

      const newAmount = Math.max(originalAmount - extra, 0);
      return this.buildAdvancedScheduleWithNewAmount(newAmount);
    }

    // Reduce period (shorter term)
    if (this.mode === 'simple') {
      return this.buildReducedPeriodSimple(baseSchedule, originalAmount, originalPeriod, extra);
    } else {
      return this.buildReducedPeriodAdvanced(baseSchedule, originalAmount, originalPeriod, extra);
    }
  }

  // === Reduce period – SIMPLE mode ===
private buildReducedPeriodSimple(
  baseSchedule: PaymentScheduleRow[],
  originalAmount: number,
  originalPeriod: number,
  extra: number
): PaymentScheduleRow[] {
  const newPrincipal = Math.max(originalAmount - extra, 0);

  if (newPrincipal <= 0) {
    return [];
  }

  const r = (this.fixedRate || 0) / 100 / 12;

  // === LINEAR ===
  if (this.loanType === 'linear') {
    const principalPerMonth = originalAmount / originalPeriod;
    if (principalPerMonth <= 0) {
      return baseSchedule;
    }

    const fullMonths = Math.floor(newPrincipal / principalPerMonth);
    const lastPrincipal = newPrincipal - fullMonths * principalPerMonth;
    const totalMonths = fullMonths + (lastPrincipal > 0 ? 1 : 0);

    const newSchedule: PaymentScheduleRow[] = [];
    let balance = newPrincipal;

    for (let i = 1; i <= totalMonths; i++) {
      const isLast = i === totalMonths && lastPrincipal > 0;
      const principal = isLast ? lastPrincipal : principalPerMonth;
      const interest = balance * r;

      const insuranceCost = this.insuranceRate != null
        ? balance * (this.insuranceRate / 100)
        : 0;

      const payment = principal + interest + insuranceCost;
      balance = Math.max(0, balance - principal);

      newSchedule.push({
        month: i,
        payment,
        principal,
        interest,
        insurance: this.insuranceRate != null ? insuranceCost : null,
        remainingBalance: balance
      });
    }

    return newSchedule;
  }

  // === ANNUITY ===
  const M = this.originalCreditInstallment;

  if (r <= 0 || M <= 0) {
    return baseSchedule;
  }

  if (M <= newPrincipal * r) {
    return baseSchedule;
  }

  const nReal = Math.log(M / (M - newPrincipal * r)) / Math.log(1 + r);
  let n = Math.max(1, Math.ceil(nReal));

  n = Math.min(n, originalPeriod);

  const newSchedule: PaymentScheduleRow[] = [];
  let balance = newPrincipal;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;

    let principal: number;
    let payment: number;

    if (i === n) {
      // ULTIMA LUNĂ: ajustez ca să stingem exact
      principal = balance;
      payment = principal + interest;
    } else {
      // LUNI NORMALE: rată regulară
      principal = Math.max(M - interest, 0);
      payment = M;
    }

    const insuranceCost = this.insuranceRate != null
      ? balance * (this.insuranceRate / 100)
      : 0;

    const totalPayment = payment + insuranceCost;
    balance = Math.max(0, balance - principal);

    newSchedule.push({
      month: i,
      payment: totalPayment,
      principal,
      interest,
      insurance: this.insuranceRate != null ? insuranceCost : null,
      remainingBalance: balance
    });
  }

  return newSchedule;
}



private buildReducedPeriodAdvanced(
  baseSchedule: PaymentScheduleRow[],
  originalAmount: number,
  originalPeriod: number,
  extra: number
): PaymentScheduleRow[] {
  if (!baseSchedule.length || extra <= 0) {
    return baseSchedule;
  }

  const fixedMonths = this.fixedMonths || 0;
  const totalMonthsOriginal = baseSchedule.length;

  // === LINEAR: păstrăm principalul lunar inițial, scurtăm perioada ===
if (this.loanType === 'linear') {
  const principalPerMonth = originalAmount / originalPeriod;
  if (principalPerMonth <= 0 || originalPeriod <= 0) {
    return baseSchedule;
  }

  // MODIFICARE: Aplică rambursarea de la bun început
  const newPrincipal = Math.max(originalAmount - extra, 0);

  if (newPrincipal <= 0) {
    return [];
  }

  const fullMonths = Math.floor(newPrincipal / principalPerMonth);
  const lastPrincipal = newPrincipal - fullMonths * principalPerMonth;
  const totalMonthsNew = fullMonths + (lastPrincipal > 0 ? 1 : 0);

  const monthlyFixedRate = (this.fixedRate || 0) / 100 / 12;
  const monthlyVariableRate =
    (this.variableRate ?? this.fixedRate ?? 0) / 100 / 12;

  const schedule: PaymentScheduleRow[] = [];
  let balance = newPrincipal;

  for (let i = 1; i <= totalMonthsNew; i++) {
    const isLast = i === totalMonthsNew && lastPrincipal > 0;
    const principal = isLast ? lastPrincipal : principalPerMonth;

    const monthlyRate = i <= fixedMonths ? monthlyFixedRate : monthlyVariableRate;

    const interest = balance * monthlyRate;

    const insuranceCost = this.insuranceRate != null
      ? balance * (this.insuranceRate / 100)
      : 0;

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
  }

  // === ANNUITY
  const newPrincipal = Math.max(originalAmount - extra, 0);

  if (newPrincipal <= 0) {
    return [];
  }

  const firstInsurance = baseSchedule[0].insurance ?? 0;
  const M_fixed = baseSchedule[0].payment - firstInsurance;

  const firstVarRow = baseSchedule.find(row => row.month > fixedMonths);
  if (!firstVarRow) {
    return baseSchedule;
  }

  const firstVarInsurance = firstVarRow.insurance ?? 0;
  const M_variable = firstVarRow.payment - firstVarInsurance;

  const rFixed = (this.fixedRate || 0) / 100 / 12;
  const rVar = (this.variableRate ?? this.fixedRate ?? 0) / 100 / 12;

  const newSchedule: PaymentScheduleRow[] = [];
  let balance = newPrincipal;

  // === PERIOADA FIXĂ (lunile 1 la fixedMonths) ===
  for (let month = 1; month <= fixedMonths && balance > 0.01; month++) {
    const interest = balance * rFixed;
    
    let principal: number;
    let payment: number;

    if (month === fixedMonths && balance <= M_fixed - interest) {
      // ULTIMA LUNĂ A PERIOADEI FIXE: ajustez
      principal = balance;
      payment = principal + interest;
    } else {
      // LUNI NORMALE
      principal = Math.max(M_fixed - interest, 0);
      payment = M_fixed;
    }

    const insuranceCost = this.insuranceRate != null
      ? balance * (this.insuranceRate / 100)
      : 0;

    const totalPayment = payment + insuranceCost;
    balance = Math.max(0, balance - principal);

    newSchedule.push({
      month,
      payment: totalPayment,
      principal,
      interest,
      insurance: this.insuranceRate != null ? insuranceCost : null,
      remainingBalance: balance
    });
  }

  // === PERIOADA VARIABILĂ (lunile fixedMonths+1 la final) ===
  if (balance > 0.01 && rVar > 0) {
    const r = rVar;
    const Pnew = balance;

    if (M_variable <= Pnew * r) {
      return newSchedule;
    }

    const nReal = Math.log(M_variable / (M_variable - Pnew * r)) / Math.log(1 + r);
    let n = Math.max(1, Math.ceil(nReal));

    const originalVarMonths = totalMonthsOriginal - fixedMonths;
    n = Math.min(n, originalVarMonths);

    for (let i = 1; i <= n && balance > 0.01; i++) {
      const month = fixedMonths + i;
      const interest = balance * r;

      let principal: number;
      let payment: number;

      if (i === n) {
        // ULTIMA LUNĂ: ajustez ca să stingem exact
        principal = balance;
        payment = principal + interest;
      } else {
        // LUNI NORMALE
        principal = Math.max(M_variable - interest, 0);
        payment = M_variable;
      }

      const insuranceCost = this.insuranceRate != null
        ? balance * (this.insuranceRate / 100)
        : 0;

      const totalPayment = payment + insuranceCost;
      balance = Math.max(0, balance - principal);

      newSchedule.push({
        month,
        payment: totalPayment,
        principal,
        interest,
        insurance: this.insuranceRate != null ? insuranceCost : null,
        remainingBalance: balance
      });
    }
  }

  return newSchedule;
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
        $localize`Vei reduce perioada creditului cu ${reducedMonths} luni. ` +
        $localize`Vei economisi aproximativ ${totalSavedText} RON (dobândă + asigurare).`;
    } else {
      this.repaymentResultText =
        $localize`Rata lunară va fi cu aproximativ ${diffInstallmentText} RON mai mică. ` +
        $localize`Vei economisi aproximativ ${totalSavedText} RON (dobândă + asigurare).`;
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
    this.originalCreditInstallment = 0;

    this.afterRepaymentSchedule = [];
    this.afterRepaymentTotal = 0;
    this.afterRepaymentFirstPayment = 0;

    this.repaymentResultText = '';
  }

  downloadOriginalSchedulePdf(): void {
    this.downloadPdfService.schedule = this.originalSchedule;
    this.downloadPdfService.amount = this.amount;
    this.downloadPdfService.totalPeriod = this.totalPeriod;
    this.downloadPdfService.fixedMonths = this.fixedMonths;
    this.downloadPdfService.scheduleType = this.loanType;
    this.downloadPdfService.insuranceRate = this.insuranceRate;

    if (this.mode === 'advanced') {
      this.downloadPdfService.fixedRate = this.fixedRate;
      this.downloadPdfService.variableRate = this.variableRate;
    }

    this.downloadPdfService.downloadPdf();
  }

  downloadAfterRepaymentSchedulePdf(): void {
    this.downloadPdfService.schedule = this.afterRepaymentSchedule;
    this.downloadPdfService.amount = this.amount;
    this.downloadPdfService.totalPeriod = this.totalPeriod;
    this.downloadPdfService.fixedMonths = this.fixedMonths;
    this.downloadPdfService.scheduleType = this.loanType;
    this.downloadPdfService.insuranceRate = this.insuranceRate;

    if (this.mode === 'advanced') {
      this.downloadPdfService.fixedRate = this.fixedRate;
      this.downloadPdfService.variableRate = this.variableRate;
    }

    this.downloadPdfService.downloadPdf();
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
