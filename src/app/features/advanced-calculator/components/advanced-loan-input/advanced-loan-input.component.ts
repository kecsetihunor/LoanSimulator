import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanCalculatorService, PaymentScheduleRow } from '@core/services/loan-calculator.service';

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
  amount: number | null = null;
  totalPeriod: number |null = null;
  fixedMonths: number | null = null;  // First 3 years
  fixedRate: number | null = null;  // Fixed rate for first period
  variableRate: number | null = null;  // Variable rate after fixed period

  // Results
  annuityPayment: number | null = null;
  linearPayment: number | null = null;
  annuityTotal: number | null = null;
  linearTotal: number | null = null;

  ngOnInit(): void {
    this.calculate();
  }

  calculate(): void {
    if (this.isValid()) {
      // Calculate annuity with variable rates
      const annuitySchedule = this.loanCalculator.generateVariableAnnuitySchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!
      );
      
      this.annuityPayment = annuitySchedule[0]?.payment || null;
      this.annuityTotal = annuitySchedule.reduce((sum, row) => sum + row.payment, 0);

      // Calculate linear with variable rates
      const linearSchedule = this.loanCalculator.generateVariableLinearSchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!
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
