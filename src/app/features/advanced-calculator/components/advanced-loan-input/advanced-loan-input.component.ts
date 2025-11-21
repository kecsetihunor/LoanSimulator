import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormatCurrencyPipe } from '@app/pipes/format-currency.pipe';

@Component({
  selector: 'app-advanced-loan-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatExpansionModule,
    FormatCurrencyPipe
  ],
  templateUrl: './advanced-loan-input.component.html',
  styleUrls: ['./advanced-loan-input.component.css']
})
export class AdvancedLoanInputComponent implements OnChanges {

  // Loan parameters
  @Input() amount: number | null = null;
  @Output() amountChange = new EventEmitter<number | null>();

  @Input() totalPeriod: number | null = null;
  @Output() totalPeriodChange = new EventEmitter<number | null>();

  @Input() fixedMonths: number | null = null;
  @Output() fixedMonthsChange = new EventEmitter<number | null>();

  @Input() fixedRate: number | null = null;
  @Output() fixedRateChange = new EventEmitter<number | null>();

  @Input() variableRate: number | null = null;
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Input() insuranceRate: number | null = null;
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Input() isScheduleVisible: boolean = true;

  @Output() inputChanged = new EventEmitter<{
    amount: number | null;
    totalPeriod: number | null;
    fixedMonths: number | null;
    fixedRate: number | null;
    variableRate: number | null;
    insuranceRate: number | null;
  }>();

  @Output() scheduleSelectionChange = new EventEmitter<{
    showAnnuity: boolean;
    showLinear: boolean;
  }>();

  @Output() scheduleModeChange = new EventEmitter<'annuity' | 'linear' | 'both'>();

  isInsuranceRateEnabled: boolean = false;
  showAnnuity: boolean = true;
  showLinear: boolean = true;
  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['insuranceRate']) {
      if (this.insuranceRate !== null && !this.isInsuranceRateEnabled) {
        this.isInsuranceRateEnabled = true;
      }
    }
  }

  private emitInputChanged() {
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
      this.amount = null;
    } else {
      const n = Number(val);
      this.amount = isNaN(n) ? null : n;
    }

    this.amountChange.emit(this.amount);
    this.emitInputChanged();
  }

  onTotalPeriodChange(val: string) {
    if (val === '') {
      this.totalPeriod = null;
    } else {
      const n = Number(val);
      this.totalPeriod = isNaN(n) ? null : n;
    }

    this.totalPeriodChange.emit(this.totalPeriod);
    this.emitInputChanged();
  }

  onFixedMonthsChange(val: string) {
    if (val === '') {
      this.fixedMonths = null;
    } else {
      const n = Number(val);
      this.fixedMonths = isNaN(n) ? null : n;
    }

    this.fixedMonthsChange.emit(this.fixedMonths);
    this.emitInputChanged();
  }

  onFixedRateChange(val: string) {
    if (val === '') {
      this.fixedRate = null;
    } else {
      const n = Number(val);
      this.fixedRate = isNaN(n) ? null : n;
    }

    this.fixedRateChange.emit(this.fixedRate);
    this.emitInputChanged();
  }

  onVariableRateChange(val: string) {
    if (val === '') {
      this.variableRate = null;
    } else {
      const n = Number(val);
      this.variableRate = isNaN(n) ? null : n;
    }

    this.variableRateChange.emit(this.variableRate);
    this.emitInputChanged();
  }

  onInsuranceRateInputChange(val: string) {
    if (val === '') {
      this.insuranceRate = null;
    } else {
      const n = Number(val);
      this.insuranceRate = isNaN(n) ? null : n;
    }

    if (this.insuranceRate !== null) {
      this.isInsuranceRateEnabled = true;
    }

    this.insuranceRateChange.emit(this.insuranceRate);
    this.emitInputChanged();
  }

  onLifeInsuranceToggle() {
    if (!this.isInsuranceRateEnabled) {
      this.insuranceRate = null;
    }
    this.insuranceRateChange.emit(this.insuranceRate);
    this.emitInputChanged();
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
    this.scheduleModeChange.emit(this.scheduleMode);
  }
}
