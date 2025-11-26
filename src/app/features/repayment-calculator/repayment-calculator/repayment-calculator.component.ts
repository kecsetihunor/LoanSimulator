import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
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
import { PaymentType } from '@app/shared/models/loan.models';

type ScenarioMode = 'simple' | 'advanced';
type RepaymentEffect = 'amount' | 'period';

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
  styleUrl: './repayment-calculator.component.css',
  providers: [FormatCurrencyPipe]
})
export class RepaymentCalculatorComponent implements OnInit {
  downloadPdfService = inject(DownloadPdfService);
  formatCurrencyPipe = inject(FormatCurrencyPipe);
  // UI state
  mode: ScenarioMode = 'simple';
  loanType: PaymentType = 'annuity';

  // Early repayment UI state
  earlyRepaymentAmount: number | null = null;
  totalSaved: number = 0;
  repaymentEffect: RepaymentEffect = 'period'; 
  repaymentResultText = '';

  // Original vs simulated schedules / totals
  baseSchedule: PaymentScheduleRow[] = [];
  baseTotal = 0;
  baseFirstPayment = 0;          
  baseInterestTotal = 0;
  baseInsuranceTotal = 0;

  newSchedule: PaymentScheduleRow[] = [];
  newTotal = 0;
  newFirstPayment = 0;
  newInterestTotal = 0;
  newInsuranceTotal = 0;

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

  constructor(private loanService: LoanCalculatorService) {}

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        this.amount = data.amount;
        this.totalPeriod = data.period;
        this.fixedRate = data.rate;
        this.variableRate = data.variableRate;
        this.fixedMonths = data.fixedPeriod;

        if (this.fixedMonths !== null && this.totalPeriod !== null && this.fixedMonths > this.totalPeriod) {
          this.fixedMonths = this.totalPeriod;
        }

        if (data.insuranceRate !== null) {
          this.insuranceRate = data.insuranceRate;
        }
      }
    });

    this.recalculateScenario();
  }

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

  onLoanTypeChanged(type: PaymentType) {
    this.loanType = type;
    this.recalculateScenario();
  }

  onEarlyRepaymentAmountChange(value: number | null) {
    this.earlyRepaymentAmount = value;
    this.recalculateScenario();
  }

  onRepaymentEffectChange(effect: RepaymentEffect) {
    this.repaymentEffect = effect;
    this.recalculateScenario();
  }

  private recalculateScenario(): void {
    if (!this.isValid()) {
      this.clearScenario();
      return;
    }

    //CALCULATE BASE SCHEDULE BASED ON LOAN TYPE
    const baseSchedule =
      this.mode === 'simple' 
        ? this.loanService.generateAmortizationSchedule(this.amount!,this.totalPeriod!, this.fixedRate!, this.insuranceRate, this.loanType) 
        : this.loanService.generateVariableAmortizationSchedule(this.amount!,this.totalPeriod!, this.fixedRate!, this.fixedMonths!, this.variableRate!, this.insuranceRate, this.loanType);

    if (!baseSchedule.length) {
      this.baseTotal = 0;
      this.baseFirstPayment = 0;
      this.baseInterestTotal = 0;
      this.baseInsuranceTotal = 0;

      return;
    }

    this.setBasePaymentCard(baseSchedule);

    if (!this.earlyRepaymentAmount || this.earlyRepaymentAmount <= 0) {
      this.newSchedule = [];
      this.newFirstPayment = 0;
      this.newTotal = 0;
      this.repaymentResultText = '';

      return;
    }

      const newSchedule = this.buildNewSchedule(baseSchedule);
      this.setNewPaymentCard(newSchedule);
      this.updateRepaymentResultText();
  }

  private buildNewSchedule(baseSchedule: PaymentScheduleRow[]): PaymentScheduleRow[] {
    const schedule: PaymentScheduleRow[] = [];

    //NEED TO TREAT 4 DIFFERENT CASES; simple-annuity, simpe-linear, advanced-annuity, advanced-linear
    let balance = this.amount! - this.earlyRepaymentAmount!;
    const originalBalance = balance;
    if (this.repaymentEffect === 'amount') {
      if (this.mode === 'simple') {
        schedule.push(...this.loanService.generateAmortizationSchedule(balance, this.totalPeriod!, this.fixedRate!, this.insuranceRate, this.loanType));
      } else {
        schedule.push(...this.loanService.generateVariableAmortizationSchedule(balance, this.totalPeriod!, this.fixedRate!, this.fixedMonths!, this.variableRate!, this.insuranceRate, this.loanType));
      }
    } else {
      //REDUCE PERIOD

      ///SIMPLE MODE

      if (this.mode === 'simple') {
        const monthlyInterestRate = this.fixedRate! / 100 / 12;

        //LINEAR
        if (this.loanType === 'linear') {
          const basePrincipal = baseSchedule[0].principal; 
          
          for (let month = 1; Math.round(balance * 100) / 100 > 0; month++) {
            const interestPayment = balance * monthlyInterestRate;
            const insuranceCost = this.insuranceRate !== null
              ? balance * (this.insuranceRate / 100)
              : 0;
            
            const monthlyPrincipal = Math.min(balance, basePrincipal); 
            const totalPayment = monthlyPrincipal + interestPayment + insuranceCost;
            balance = Math.max(0, balance - basePrincipal);
            
            schedule.push({ 
              month,
              payment: totalPayment,
              principal: monthlyPrincipal,
              interest: interestPayment,
              insurance: this.insuranceRate !== null ? insuranceCost : null,
              remainingBalance: balance
            });
          }
        } else { 
          //ANNUITY 
            const baseMonthlyPayment = baseSchedule[0].payment;

            for (let month = 1; Math.round(balance * 100) / 100 > 0; month++) { 
              const interestPayment = balance * monthlyInterestRate;
              
              if (balance + interestPayment >=  baseMonthlyPayment)
              {
                const monthlyPayment = baseMonthlyPayment;
                const principalPayment = monthlyPayment - interestPayment;
              
                const insuranceCost = this.insuranceRate !== null
                  ? balance * (this.insuranceRate / 100)
                  : 0;

                balance = Math.max(0, balance - principalPayment);
                schedule.push({
                  month,
                  payment: monthlyPayment,
                  principal: principalPayment,
                  interest: interestPayment,
                  insurance: this.insuranceRate !== null ? insuranceCost : null,
                  remainingBalance: balance
                });
              } else {

                const principalPayment = originalBalance - schedule.reduce((sum, row) => sum + Math.round(row.principal * 100)/100, 0);
                const interestPayment = balance * monthlyInterestRate;
                const monthlyPayment = principalPayment + interestPayment
              
                const insuranceCost = this.insuranceRate !== null
                  ? balance * (this.insuranceRate / 100)
                  : 0;

                balance = 0;
                schedule.push({
                  month,
                  payment: monthlyPayment,
                  principal: principalPayment,
                  interest: interestPayment,
                  insurance: this.insuranceRate !== null ? insuranceCost : null,
                  remainingBalance: balance
                });
              }
            } 
          }
        } else {
          //ADVANCED MODE

          //LINEAR
          if (this.loanType === 'linear') {
            const basePrincipal = baseSchedule[0].principal; 
            let monthlyInterestRate: number;
            
            for (let month = 1; Math.round(balance * 100) / 100 > 0; month++) {
              month <= this.fixedMonths! 
                ? monthlyInterestRate = this.fixedRate! / 100 / 12
                : monthlyInterestRate = this.variableRate! / 100 / 12;

              const interestPayment = balance * monthlyInterestRate;
              const insuranceCost = this.insuranceRate !== null
                ? balance * (this.insuranceRate / 100)
                : 0;
              
              const monthlyPrincipal = Math.min(balance, basePrincipal); 
              const totalPayment = monthlyPrincipal + interestPayment + insuranceCost;
              balance = Math.max(0, balance - basePrincipal);
              
              schedule.push({ 
                month,
                payment: totalPayment,
                principal: monthlyPrincipal,
                interest: interestPayment,
                insurance: this.insuranceRate !== null ? insuranceCost : null,
                remainingBalance: balance
              });
            }
          } else { 
            //ANNUITY
            let baseMonthlyPayment = baseSchedule[0].payment;
            let monthlyInterestRate = this.fixedRate! / 100 / 12;
            
            //FIXED PERIOD
            for (let month = 1; Math.round(balance * 100) / 100 > 0 && month <= this.fixedMonths!; month++) {   
              const interestPayment = balance * monthlyInterestRate;
             
              if (balance + interestPayment >=  baseMonthlyPayment) {
                const monthlyPayment = baseMonthlyPayment;
                const principalPayment = monthlyPayment - interestPayment;
                const insuranceCost = this.insuranceRate !== null
                  ? balance * (this.insuranceRate / 100)
                  : 0;

                balance = Math.max(0, balance - principalPayment);
                schedule.push({
                  month,
                  payment: monthlyPayment,
                  principal: principalPayment,
                  interest: interestPayment,
                  insurance: this.insuranceRate !== null ? insuranceCost : null,
                  remainingBalance: balance
                });
              } else {
                const principalPayment = originalBalance - schedule.reduce((sum, row) => sum + Math.round(row.principal * 100)/100, 0);
                const interestPayment = balance * monthlyInterestRate;
                const monthlyPayment = principalPayment + interestPayment
                const insuranceCost = this.insuranceRate !== null
                  ? balance * (this.insuranceRate / 100)
                  : 0;

                balance = 0;

                schedule.push({
                  month,
                  payment: monthlyPayment,
                  principal: principalPayment,
                  interest: interestPayment,
                  insurance: this.insuranceRate !== null ? insuranceCost : null,
                  remainingBalance: balance
                });
              }
            }

            //VARIABLE PERIOD
            if (balance !== 0) {
              baseMonthlyPayment = baseSchedule[this.fixedMonths!].payment;
              monthlyInterestRate = this.variableRate! / 100 / 12;

              for (let month = this.fixedMonths! + 1; Math.round(balance * 100) / 100 > 0; month++) {
                const interestPayment = balance * monthlyInterestRate;

                if (balance + interestPayment >=  baseMonthlyPayment) {
                  const monthlyPayment = baseMonthlyPayment;
                  const principalPayment = monthlyPayment - interestPayment;
                  const insuranceCost = this.insuranceRate !== null
                    ? balance * (this.insuranceRate / 100)
                    : 0;

                  balance = Math.max(0, balance - principalPayment);
                  schedule.push({
                    month,
                    payment: monthlyPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    insurance: this.insuranceRate !== null ? insuranceCost : null,
                    remainingBalance: balance
                  });

                } else {
                  const principalPayment = originalBalance - schedule.reduce((sum, row) => sum + Math.round(row.principal * 100)/100, 0);
                  const interestPayment = balance * monthlyInterestRate;
                  const monthlyPayment = principalPayment + interestPayment
                  const insuranceCost = this.insuranceRate !== null
                    ? balance * (this.insuranceRate / 100)
                    : 0;

                  balance = 0;

                  schedule.push({
                    month,
                    payment: monthlyPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    insurance: this.insuranceRate !== null ? insuranceCost : null,
                    remainingBalance: balance
                  });
                }                
              }
            } 
          }
        }
      }

      return schedule;
  }

  private setBasePaymentCard(schedule: PaymentScheduleRow[]): void {
    this.baseSchedule = schedule;

    if (!schedule.length) {
      this.baseTotal = 0;
      this.baseFirstPayment = 0;
      this.baseInterestTotal = 0;
      this.baseInsuranceTotal = 0;
      return;
    }

    this.baseFirstPayment = schedule[0].payment;
    this.baseTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
    this.baseInterestTotal = schedule.reduce((sum, row) => sum + row.interest, 0);

    if (this.insuranceRate !== null) {
      this.baseInsuranceTotal = schedule.reduce((sum, row) => sum + (row.insurance ?? 0), 0);
      const firstInsurance = schedule[0].insurance ?? 0;
    } else {
      this.baseInsuranceTotal = 0;
    }
  }

  private setNewPaymentCard(schedule: PaymentScheduleRow[]): void {
    this.newSchedule = schedule;

    if (!schedule.length) {
      this.newTotal = 0;
      this.newFirstPayment = 0;
      this.newInterestTotal = 0;
      this.newInsuranceTotal = 0;
      return;
    }

    this.newFirstPayment = schedule[0].payment;
    this.newTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
    this.newInterestTotal = schedule.reduce((sum, row) => sum + row.interest, 0);

    if (this.insuranceRate !== null) {
      this.newInsuranceTotal = schedule.reduce(
        (sum, row) => sum + (row.insurance ?? 0),
        0
      );
    } else {
      this.newInsuranceTotal = 0;
    }
  }

  private updateRepaymentResultText(): void {
    if (!this.baseSchedule.length || !this.newSchedule.length) {
      this.repaymentResultText = '';
      return;
    }

    const originalMonths = this.baseSchedule.length;
    const newMonths = this.newSchedule.length;
    const reducedMonths = Math.max(originalMonths - newMonths, 0);

    const originalInstallment = this.baseFirstPayment;
    const newInstallment = this.newFirstPayment;
    const diffInstallment = Math.max(originalInstallment - newInstallment, 0);

    const originalInterest = this.baseSchedule
      .reduce((sum, row) => sum + (row.interest || 0), 0);
    const newInterest = this.newSchedule
      .reduce((sum, row) => sum + (row.interest || 0), 0);

    const originalInsurance = this.baseSchedule
      .reduce((sum, row) => sum + (row.insurance || 0), 0);
    const newInsurance = this.newSchedule
      .reduce((sum, row) => sum + (row.insurance || 0), 0);

    const savedInterest = Math.max(originalInterest - newInterest, 0);
    const savedInsurance = Math.max(originalInsurance - newInsurance, 0);
    this.totalSaved = Math.max(savedInterest + savedInsurance, 0);

    const totalSavedText = this.formatCurrencyPipe.transform(this.totalSaved);
    const diffInstallmentText = this.formatCurrencyPipe.transform(diffInstallment);

    if (this.repaymentEffect === 'period') {
      this.repaymentResultText =
        $localize`Vei reduce perioada creditului cu ${reducedMonths} luni. ` +
        $localize`Vei economisi aproximativ ${totalSavedText} (dobândă + asigurare).`;
    } else {
      this.repaymentResultText =
        $localize`Rata lunară va fi cu aproximativ ${diffInstallmentText} mai mică. ` +
        $localize`Vei economisi aproximativ ${totalSavedText} (dobândă + asigurare).`;
    }
  }

  // === Helpers ===

  private clearScenario(): void {
    this.baseSchedule = [];
    this.baseTotal = 0;
    this.baseFirstPayment = 0;

    this.newSchedule = [];
    this.newTotal = 0;
    this.newFirstPayment = 0;

    this.repaymentResultText = '';
  }

  downloadOriginalSchedulePdf(): void {
    this.downloadPdfService.schedule = this.baseSchedule;
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
    this.downloadPdfService.schedule = this.newSchedule;
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
