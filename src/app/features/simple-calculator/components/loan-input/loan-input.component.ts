import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanCalculatorService, PaymentScheduleRow } from '@core/services/loan-calculator.service';

@Component({
  selector: 'app-loan-input',
  templateUrl: './loan-input.component.html',
  imports: [CommonModule],
  styleUrls: ['./loan-input.component.css']
})
export class LoanInputComponent {
  private loanCalculator = inject(LoanCalculatorService);  // Inject the service

  @Input() amount: number | null = null;
  @Input() period: number | null = null;
  @Input() rate: number | null = null;

  @Output() amountChange = new EventEmitter<number | null>();
  @Output() periodChange = new EventEmitter<number | null>();
  @Output() rateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{ amount: number; period: number; rate: number }>();

  @Output() schedulesGenerated = new EventEmitter<{
    annuity: PaymentScheduleRow[];
    linear: PaymentScheduleRow[];
  }>();
  
  annuityPayment: number | null = null;
  linearPayment: number | null = null;

  annuityTotal: number | null = null;
  linearTotal: number | null = null;

  onAnyInputChange() {
    if (this.amount !== null && this.period !== null && this.rate !== null) {
    this.inputChanged.emit({ 
      amount: this.amount, 
      period: this.period, 
      rate: this.rate 
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
        this.rate! as number
      );

      this.linearPayment = this.loanCalculator.calculateFirstLinearPayment(
        this.amount! as number,
        this.period! as number,
        this.rate! as number
      );

      // Generate both schedules
      const annuitySchedule = this.loanCalculator.generateAmortizationSchedule(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
        'annuity'
      );

      const linearSchedule = this.loanCalculator.generateAmortizationSchedule(
        this.amount! as number,
        this.period! as number,
        this.rate! as number,
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
