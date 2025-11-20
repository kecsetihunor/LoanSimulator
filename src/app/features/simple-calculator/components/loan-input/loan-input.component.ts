import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule }  from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';    
import { MatExpansionModule } from '@angular/material/expansion';
import { FormatCurrencyPipe } from '@app/pipes/format-currency.pipe';

@Component({
  selector: 'app-loan-input',
  templateUrl: './loan-input.component.html',
  imports: [MatButtonToggleModule, MatSlideToggleModule, MatExpansionModule, CommonModule, FormsModule, FormatCurrencyPipe],
  styleUrls: ['./loan-input.component.css']
})

export class LoanInputComponent implements OnChanges {
  private loanCalculator = inject(LoanCalculatorService);  // Inject the service
  scheduleMode: 'annuity' | 'linear' | 'both' = 'both';

  @Input() amount: number | null = null
  @Input() period: number | null = null;
  @Input() rate: number | null = null;
  @Input() insuranceRate: number | null = null;
  @Input() isInsuranceRateEnabled: boolean = false;
  @Input() isScheduleVisible: boolean = true;

  @Output() amountChange = new EventEmitter<number | null>();
  @Output() periodChange = new EventEmitter<number | null>();
  @Output() rateChange = new EventEmitter<number | null>();
  @Output() inputChanged = new EventEmitter<{ amount: number | null; period: number | null; rate: number | null, insuranceRate: number | null }>();
  @Output() scheduleSelectionChange = new EventEmitter<{showAnnuity: boolean, showLinear: boolean}>();
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Output() schedulesGenerated = new EventEmitter<{
    annuity: PaymentScheduleRow[];
    linear: PaymentScheduleRow[];
  }>();

  showAnnuity: boolean = true;
  showLinear: boolean = true;
  
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
    if (this.amount !== null && this.period !== null && this.rate !== null) {
      this.calculate();
    }

    this.inputChanged.emit({ 
      amount: this.amount, 
      period: this.period, 
      rate: this.rate,
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

  onPeriodChange(val: string) {
    if (val === '') {
        this.period = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.period = isNaN(n) ? null : n;
    }

    this.periodChange.emit(this.period);
    this.onAnyInputChange();
  }

  onRateChange(val: string) {
    if (val === '') {
        this.rate = null;               // or NaN if you prefer
    } else {
        const n = Number(val);
        this.rate = isNaN(n) ? null : n;
    }
    
    this.rateChange.emit(this.rate);
    this.onAnyInputChange();
  }

  onInsuranceChange(val: string) {
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

  onScheduleSelectionChange() {
    this.scheduleSelectionChange.emit({
      showAnnuity: this.showAnnuity,
      showLinear: this.showLinear
    });
  }

  isValid(): boolean {
    return this.amount !== null && 
           this.amount > 0 && 
           this.period !== null && 
           this.period > 0 && 
           this.rate !== null && 
           this.rate >= 0;
  }

  onScheduleModeChange(mode: 'annuity' | 'linear' | 'both') {
    this.scheduleMode = mode;

    this.showAnnuity = mode === 'annuity' || mode === 'both';
    this.showLinear  = mode === 'linear'  || mode === 'both';

    this.onScheduleSelectionChange();
  }

 private calculate() {
    if (!this.isValid()) {
      this.annuityPayment = null;
      this.linearPayment = null;
      this.annuityTotal = null;
      this.linearTotal = null;

      this.schedulesGenerated.emit({ annuity: [], linear: [] });
      return;
    }

    try {
      // Calculate both payment types
      this.annuityPayment = this.loanCalculator.calculateMonthlyPayment(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
        this.insuranceRate as number | null
      );

      this.linearPayment = this.loanCalculator.calculateFirstLinearPayment(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
        this.insuranceRate as number | null
      );

      // Generate both schedules
      const annuitySchedule = this.loanCalculator.generateAmortizationSchedule(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
        this.insuranceRate as number | null,
        'annuity'
      );

      const linearSchedule = this.loanCalculator.generateAmortizationSchedule(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
        this.insuranceRate as number | null,
        'linear'
      );

      // Calculate totals from schedules
      this.annuityTotal = annuitySchedule.reduce((sum, row) => sum + row.payment, 0);
      this.linearTotal = linearSchedule.reduce((sum, row) => sum + row.payment, 0);

      this.schedulesGenerated.emit({ 
        annuity: annuitySchedule, 
        linear: linearSchedule 
      });

    } catch (error) {
      console.error('Calculation error:', error);
      this.annuityPayment = null;
      this.linearPayment = null;
      this.annuityTotal = null;
      this.linearTotal = null;
    }
  }
}
