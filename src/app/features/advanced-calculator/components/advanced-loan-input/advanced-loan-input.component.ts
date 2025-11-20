import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models'; 
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormatCurrencyPipe } from '@app/pipes/format-currency.pipe';

@Component({
  selector: 'app-advanced-loan-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSlideToggleModule, MatButtonToggleModule, MatExpansionModule, FormatCurrencyPipe],
  templateUrl: './advanced-loan-input.component.html',
  styleUrls: ['./advanced-loan-input.component.css']
})
export class AdvancedLoanInputComponent implements OnChanges {
  private loanCalculator = inject(LoanCalculatorService);
  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';

  @Output() schedulesGenerated = new EventEmitter<{
    annuity: PaymentScheduleRow[];
    linear: PaymentScheduleRow[];
  }>();

  // Loan parameters
  @Input() amount: number | null = null;
  @Output() amountChange = new EventEmitter<number | null>();
  
  @Input() totalPeriod: number |null = null;
  @Output() totalPeriodChange = new EventEmitter<number | null>();
 
  @Input() fixedMonths: number | null = null;  // First 3 years
  @Output() fixedMonthsChange = new EventEmitter<number | null>();
 
  @Input() fixedRate: number | null = null;  // Fixed rate for first period
  @Output() fixedRateChange = new EventEmitter<number | null>();

  @Input() insuranceRate: number | null = null;  // Insurance rate
  @Output() insuranceRateChange = new EventEmitter<number | null>();
 
  @Input() isScheduleVisible: boolean = true;

  @Input() variableRate: number | null = null;  // Variable rate after fixed period
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{ amount: number | null; totalPeriod: number | null; fixedMonths: number | null; fixedRate: number | null; variableRate: number | null, insuranceRate: number | null }>();
  @Output() scheduleSelectionChange = new EventEmitter<{showAnnuity: boolean, showLinear: boolean}>();

  isInsuranceRateEnabled: boolean = false;
  showAnnuity: boolean = true;
  showLinear: boolean = true;

  // Results
  annuityPayment: number | null = null;
  linearPayment: number | null = null;
  annuityTotal: number | null = null;
  linearTotal: number | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['insuranceRate']) {
      if (this.insuranceRate !== null && !this.isInsuranceRateEnabled) {
        this.isInsuranceRateEnabled = true;
      }
    }

    this.calculate();
  }

   onAnyInputChange() {
    if (this.amount !== null && this.totalPeriod !== null && this.fixedMonths !== null && this.fixedRate !== null && this.variableRate !== null) {
      this.calculate();
    }

    this.inputChanged.emit({ 
      amount: this.amount, 
      totalPeriod: this.totalPeriod, 
      fixedMonths: this.fixedMonths,
      fixedRate: this.fixedRate,
      variableRate: this.variableRate,
      insuranceRate: this.insuranceRate
    });
  }

  onAmountChange(val: string) {
    if (val === '') {
        this.amount = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.amount = isNaN(n) ? null : n;
    }

    this.amountChange.emit(this.amount);
    this.onAnyInputChange();
  }

  onTotalPeriodChange(val: string) {
    if (val === '') {
        this.totalPeriod = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.totalPeriod = isNaN(n) ? null : n;
    }

    this.totalPeriodChange.emit(this.totalPeriod);
    this.onAnyInputChange();
  }

  onFixedMonthsChange(val: string) {
    if (val === '') {
        this.fixedMonths = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.fixedMonths = isNaN(n) ? null : n;
    }
    
    this.fixedMonthsChange.emit(this.fixedMonths);
    this.onAnyInputChange();
  }

  onFixedRateChange(val: string) {
    if (val === '') {
        this.fixedRate = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.fixedRate = isNaN(n) ? null : n;
    }

    this.fixedRateChange.emit(this.fixedRate);
    this.onAnyInputChange();
  }

    onInsuranceRateChange(val: string) {
      if (val === '') {
        this.insuranceRate = null;               // or NaN if you prefer
      } else {
        const n = Number(val);
        this.insuranceRate = isNaN(n) ? null : n;
      }

      if (this.insuranceRate !== null) {
        this.isInsuranceRateEnabled = true;
      }

      this.insuranceRateChange.emit(this.insuranceRate);
      this.onAnyInputChange();
    }

    onLifeInsuranceToggle() {
      if (this.isInsuranceRateEnabled) {
        this.insuranceRateChange.emit(this.insuranceRate);
      }
      else{
        this.insuranceRate = null;
        this.insuranceRateChange.emit(this.insuranceRate);
      }

      this.onAnyInputChange();
    }

    onVariableRateChange(val: string) {
      if (val === '') {
          this.variableRate = null;               // or NaN if you prefer
      } else {
          const n = Number(val);
          this.variableRate = isNaN(n) ? null : n;
      }

      this.variableRateChange.emit(this.variableRate);
      this.onAnyInputChange();
    } 

    onScheduleSelectionChange() {
    this.scheduleSelectionChange.emit({
      showAnnuity: this.showAnnuity,
      showLinear: this.showLinear
    });
  }

  onScheduleModeChange(mode: 'annuity' | 'linear' | 'both') {
    this.scheduleMode = mode;
    this.showAnnuity = mode === 'annuity' || mode === 'both';
    this.showLinear  = mode === 'linear'  || mode === 'both';
    this.onScheduleSelectionChange();
}
  
  calculate(): void {
    if (this.isValid()) {
      // Calculate annuity with variable rates
      const annuitySchedule = this.loanCalculator.generateVariableAnnuitySchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!,
        this.insuranceRate
      );
      
      this.annuityPayment = annuitySchedule[0]?.payment || null;
      this.annuityTotal = annuitySchedule.reduce((sum, row) => sum + row.payment, 0);

      // Calculate linear with variable rates
      const linearSchedule = this.loanCalculator.generateVariableLinearSchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!,
        this.insuranceRate
      );
      
      this.linearPayment = linearSchedule[0]?.payment || null;
      this.linearTotal = linearSchedule.reduce((sum, row) => sum + row.payment, 0);

      this.schedulesGenerated.emit({
        annuity: annuitySchedule,
        linear: linearSchedule
      });
    } else {
      this.resetResults();
    }
  }

  isValid(): boolean {
    return this.amount !== null && 
           this.amount > 0 && 
           this.totalPeriod !== null &&
           this.totalPeriod! > 0 && 
           this.fixedMonths !== null &&
           this.fixedMonths! > 0 &&
           this.fixedMonths! <= this.totalPeriod! &&
           this.fixedRate !== null &&
           this.fixedRate! >= 0 &&
           this.variableRate !== null &&
           this.variableRate! >= 0;
  }

  resetResults(): void {
    this.annuityPayment = null;
    this.linearPayment = null;
    this.annuityTotal = null;
    this.linearTotal = null;
    this.schedulesGenerated.emit({ annuity: [], linear: [] });
  }
}
