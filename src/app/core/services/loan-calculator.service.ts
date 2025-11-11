import { Injectable } from '@angular/core';

export interface LoanInput {
  amount: number;
  period: number;
  rate: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface PaymentScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export type RepaymentType = 'annuity' | 'linear';

@Injectable({
  providedIn: 'root'
})

export class LoanCalculatorService {

  constructor() { }

   calculateMonthlyPayment(amount: number, period: number, annualRate: number): number {
    if (amount <= 0 || period <= 0 || annualRate < 0) {
      throw new Error('Invalid loan parameters');
    }

    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      // No interest case
      return amount / period;
    }

    // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, period);
    return amount * (monthlyRate * factor) / (factor - 1);
  }

   /**
   * Calculate first monthly payment for linear (equal principal)
   */
  calculateFirstLinearPayment(amount: number, period: number, annualRate: number): number {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;
    const firstInterest = amount * monthlyRate;
    return principalPayment + firstInterest;
  }

  /**
   * Generate amortization schedule based on repayment type
   */
  generateAmortizationSchedule(
    amount: number,
    period: number,
    annualRate: number,
    type: RepaymentType = 'annuity'
  ): PaymentScheduleRow[] {
    if (type === 'annuity') {
      return this.generateAnnuitySchedule(amount, period, annualRate);
    } else {
      return this.generateLinearSchedule(amount, period, annualRate);
    }
  }

  /**
   * Annuity: Equal monthly payments
   */
  private generateAnnuitySchedule(
    amount: number,
    period: number,
    annualRate: number
  ): PaymentScheduleRow[] {
    const monthlyPayment = this.calculateMonthlyPayment(amount, period, annualRate);
    const monthlyRate = annualRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: balance
      });
    }

    return schedule;
  }

  /**
   * Linear: Equal principal, decreasing total payment
   */
  private generateLinearSchedule(
    amount: number,
    period: number,
    annualRate: number
  ): PaymentScheduleRow[] {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;
      const totalPayment = principalPayment + interestPayment;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: balance
      });
    }

    return schedule;
  }
}
