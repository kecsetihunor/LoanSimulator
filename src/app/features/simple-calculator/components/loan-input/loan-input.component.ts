import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CurrencyService, Currency } from '@app/core/services/currency.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loan-input',
  templateUrl: './loan-input.component.html',
  imports: [MatSlideToggleModule, CommonModule, FormsModule],
  styleUrls: ['./loan-input.component.css']
})

export class LoanInputComponent implements OnInit, OnDestroy {
  private loanCalculator = inject(LoanCalculatorService);  // Inject the service

  @Input() amount: number | null = null;
  @Input() period: number | null = null;
  @Input() rate: number | null = null;
  @Input() insuranceRate: number | null = null;

  @Output() amountChange = new EventEmitter<number | null>();
  @Output() periodChange = new EventEmitter<number | null>();
  @Output() rateChange = new EventEmitter<number | null>();
  @Output() inputChanged = new EventEmitter<{ amount: number; period: number; rate: number, insuranceRate: number | null }>();
  @Output() scheduleSelectionChange = new EventEmitter<{showAnnuity: boolean, showLinear: boolean}>();
  @Output() insuranceRateChange = new EventEmitter<number | null>();

  @Output() schedulesGenerated = new EventEmitter<{
    annuity: PaymentScheduleRow[];
    linear: PaymentScheduleRow[];
  }>();

  enableLifeInsurance: boolean = false;
  showAnnuity: boolean = true;
  showLinear: boolean = true;
  
  annuityPayment: number | null = null;
  linearPayment: number | null = null;

  annuityTotal: number | null = null;
  linearTotal: number | null = null;

  private currencySub: Subscription | null = null;
  private currencyService = inject(CurrencyService);
  selectedCurrency: Currency = this.currencyService.getSelectedCurrency();

  ngOnInit(): void {
    this.currencySub = this.currencyService.selectedCurrency$.subscribe(
      currency => {
        this.selectedCurrency = currency;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.currencySub) {
      this.currencySub.unsubscribe();
    }
  }

  onAnyInputChange() {
    if (this.amount !== null && this.period !== null && this.rate !== null) {
      this.inputChanged.emit({ 
        amount: this.amount, 
        period: this.period, 
        rate: this.rate,
        insuranceRate: this.insuranceRate 
      });
    }
  }

  onAmountChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.amount = isNaN(n) ? this.amount : n;
    this.amountChange.emit(this.amount);
    this.onAnyInputChange();
    this.calculateIfValid();
  }

  onPeriodChange(val: string) {
    const n = val === '' ? null : Math.trunc(Number(val));
    this.period = isNaN(n as number) ? this.period : n;
    this.periodChange.emit(this.period);
    this.onAnyInputChange();
    this.calculateIfValid();
  }

  onRateChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.rate = isNaN(n) ? this.rate : n;
    this.rateChange.emit(this.rate);
    this.onAnyInputChange();
    this.calculateIfValid();
  }

  onInsuranceChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.insuranceRate = isNaN(n) ? this.insuranceRate : n;
    this.insuranceRateChange.emit(this.insuranceRate);
    this.onAnyInputChange();
    this.calculateIfValid();
  }

  onLifeInsuranceToggle() {
    if (this.enableLifeInsurance) {
      this.insuranceRateChange.emit(this.insuranceRate);
    }
    else{
      this.insuranceRate = null;
      this.insuranceRateChange.emit(this.insuranceRate);
    }
    this.onAnyInputChange();
    this.calculateIfValid();
  }

  onAnnuityChange(event: Event) {
    this.showAnnuity = (event.target as HTMLInputElement).checked;
    this.onScheduleSelectionChange();
  }

  onLinearChange(event: Event) {
    this.showLinear = (event.target as HTMLInputElement).checked;
    this.onScheduleSelectionChange();
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

 private calculateIfValid() {
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
