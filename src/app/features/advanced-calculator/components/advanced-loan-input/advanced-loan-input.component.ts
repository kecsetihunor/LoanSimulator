import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanCalculatorService } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models'; 

@Component({
  selector: 'app-advanced-loan-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-loan-input.component.html',
  styleUrls: ['./advanced-loan-input.component.css']
})
export class AdvancedLoanInputComponent {
  private loanCalculator = inject(LoanCalculatorService);

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
 
  @Input() variableRate: number | null = null;  // Variable rate after fixed period
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{ amount: number; totalPeriod: number; fixedMonths: number; fixedRate: number; variableRate: number, insuranceRate: number | null }>();

  // Results
  annuityPayment: number | null = null;
  linearPayment: number | null = null;
  annuityTotal: number | null = null;
  linearTotal: number | null = null;

  ngOnInit(): void {
    this.calculate();
  }

   onAnyInputChange() {
    if (this.amount !== null && this.totalPeriod !== null && this.fixedMonths !== null && this.fixedRate !== null && this.variableRate !== null) {
    this.calculate();
    
    this.inputChanged.emit({ 
      amount: this.amount, 
      totalPeriod: this.totalPeriod, 
      fixedMonths: this.fixedMonths,
      fixedRate: this.fixedRate,
      variableRate: this.variableRate,
      insuranceRate: this.insuranceRate
    });
    }
  }

  onAmountChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.amount = isNaN(n) ? this.amount : n;
    this.amountChange.emit(this.amount);
    this.onAnyInputChange();
  }

  onTotalPeriodChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.totalPeriod = isNaN(n) ? this.totalPeriod : n;
    this.totalPeriodChange.emit(this.totalPeriod);
    this.onAnyInputChange();
  }

  onFixedMonthsChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.fixedMonths = isNaN(n) ? this.fixedMonths : n;
    this.fixedMonthsChange.emit(this.fixedMonths);
    this.onAnyInputChange();
  }

  onFixedRateChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.fixedRate = isNaN(n) ? this.fixedRate : n;
    this.fixedRateChange.emit(this.fixedRate);
    this.onAnyInputChange();
  }

    onInsuranceRateChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.insuranceRate = isNaN(n) ? this.insuranceRate : n;
    this.insuranceRateChange.emit(this.insuranceRate);
    this.onAnyInputChange();
  }

  onVariableRateChange(val: string) {
    const n = val === '' ? NaN : Number(val);
    this.variableRate = isNaN(n) ? this.variableRate : n;
    this.variableRateChange.emit(this.variableRate);
    this.onAnyInputChange();
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
