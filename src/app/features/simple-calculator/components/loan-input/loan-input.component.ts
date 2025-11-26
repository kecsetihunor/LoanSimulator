import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormatCurrencyPipe } from '@app/pipes/format-currency.pipe';

@Component({
  selector: 'app-loan-input',
  templateUrl: './loan-input.component.html',
  styleUrls: ['./loan-input.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatExpansionModule,
    FormatCurrencyPipe
  ]
})
export class LoanInputComponent implements OnChanges {

  @Input() amount: number | null = null;
  @Input() period: number | null = null;
  @Input() rate: number | null = null;
  @Input() insuranceRate: number | null = null;
  @Input() isInsuranceRateEnabled: boolean = false;
  @Input() isScheduleVisible: boolean = true;

  @Output() amountChange = new EventEmitter<number | null>();
  @Output() periodChange = new EventEmitter<number | null>();
  @Output() rateChange = new EventEmitter<number | null>();
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{
    amount: number | null;
    period: number | null;
    rate: number | null;
    insuranceRate: number | null;
  }>();

  @Output() scheduleSelectionChange = new EventEmitter<{
    showAnnuity: boolean;
    showLinear: boolean;
  }>();

  @Output() scheduleModeChange = new EventEmitter<'annuity' | 'linear' | 'both'>();

  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';
  showAnnuity: boolean = true;
  showLinear: boolean = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['insuranceRate']) {
      if (this.insuranceRate !== null && !this.isInsuranceRateEnabled) {
        this.isInsuranceRateEnabled = true;
      }
    }
    // no calculations here anymore
  }

  private emitInputChanged() {
    this.inputChanged.emit({
      amount: this.amount,
      period: this.period,
      rate: this.rate,
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

  onPeriodChange(val: string) {
    if (val === '') {
      this.period = null;
    } else {
      const n = Number(val);
      this.period = isNaN(n) ? null : n;
      if (this.period !== null && this.period > 480) {
        this.period = 480;
      }
    }
    this.periodChange.emit(this.period);
    this.emitInputChanged();
  }

  onRateChange(val: string) {
    if (val === '') {
      this.rate = null;
    } else {
      const n = Number(val);
      this.rate = isNaN(n) ? null : n;
    }
    this.rateChange.emit(this.rate);
    this.emitInputChanged();
  }

  onInsuranceChange(val: string) {
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

  onScheduleModeChange(mode: 'annuity' | 'linear' | 'both') {
    this.scheduleMode = mode;

    this.showAnnuity = mode === 'annuity' || mode === 'both';
    this.showLinear  = mode === 'linear'  || mode === 'both';

    this.scheduleSelectionChange.emit({
      showAnnuity: this.showAnnuity,
      showLinear: this.showLinear
    });

    this.scheduleModeChange.emit(this.scheduleMode);
  }

  onlyNumbers(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) {
      return true;
    }
    event.preventDefault();
    return false;
  }
}
