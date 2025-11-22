import { Injectable } from '@angular/core';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';


export type RepaymentType = 'annuity' | 'linear';

@Injectable({
  providedIn: 'root'
})

export class LoanCalculatorService {

  constructor() { }

   calculateMonthlyPayment(amount: number, period: number, annualRate: number, insuranceRate: number | null): number {
    if (amount <= 0 || period <= 0 || annualRate < 0) {
      throw new Error('Invalid loan parameters');
    }

    const monthlyRate = annualRate / 100 / 12;
    let insuranceCost = 0;

    if (insuranceRate !== null) {
      insuranceCost = amount * (insuranceRate / 100);
    }

    if (monthlyRate === 0) {
      return (amount / period) + insuranceCost;
    }

    // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, period);
    return (amount * (monthlyRate * factor) / (factor - 1)) + insuranceCost;
  }

   /**
   * Calculate first monthly payment for linear (equal principal)
   */
  calculateFirstLinearPayment(amount: number, period: number, annualRate: number, insuranceRate: number | null): number {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;
    const firstInterest = amount * monthlyRate;
    const insuranceCost = insuranceRate !== null ? amount * (insuranceRate / 100) : 0;  
    return principalPayment + firstInterest + insuranceCost;
  }

  /**
   * Generate amortization schedule based on repayment type
   */
  generateAmortizationSchedule(
    amount: number,
    period: number,
    annualRate: number,
    insuranceRate: number | null,
    type: RepaymentType = 'annuity'
  ): PaymentScheduleRow[] {
    if (type === 'annuity') {
      return this.generateAnnuitySchedule(amount, period, annualRate, insuranceRate);
    } else {
      return this.generateLinearSchedule(amount, period, annualRate, insuranceRate);
    }
  }

  /**
   * Annuity: Equal monthly payments
   */
  private generateAnnuitySchedule(
    amount: number,
    period: number,
    annualRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const monthlyPayment = this.calculateMonthlyPayment(amount, period, annualRate, insuranceRate);
    const monthlyRate = annualRate / 100 / 12;
   
    let balance = amount;
    let insuranceCost = 0;
 
    if (insuranceRate !== null) {
      insuranceCost = balance * (insuranceRate / 100);
    }

    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment - insuranceCost;
      if (insuranceRate !== null) {
            insuranceCost = balance * (insuranceRate / 100);
      }
      balance = Math.max(0, balance - principalPayment);
    
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        insurance: insuranceCost, // Added insurance cost
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
    annualRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;

    let balance = amount;
    let insuranceCost = 0;

    if (insuranceRate !== null) {
      insuranceCost = balance * (insuranceRate / 100);
    }
    
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;
      const totalPayment = principalPayment + interestPayment + insuranceCost;
      if (insuranceRate !== null) {
            insuranceCost = balance * (insuranceRate / 100);
      } 
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        insurance: insuranceCost, // Added insurance cost
        remainingBalance: balance
      });
    }

    return schedule;
  }

  /**
 * Amortizes as banks do: First X months at fixed rate (original payment), restart annuity with new rate for remainder.
 */
generateVariableAnnuitySchedule (
  amount: number,
  totalPeriod: number,
  fixedRate: number,
  fixedMonths: number,
  variableRate: number,
  insuranceRate: number | null
): PaymentScheduleRow[] {
  const schedule: PaymentScheduleRow[] = [];
  let balance = amount;
  let insuranceCost = 0;

  // Step 1: Calculate fixed period payment for totalPeriod at fixedRate
  const monthlyFixedRate = fixedRate / 100 / 12;
  const monthlyVariableRate = variableRate / 100 / 12;
  const paymentFixed = this.calculateMonthlyPayment(amount, totalPeriod, fixedRate, insuranceRate);

  // First "fixedMonths" payments @ fixedRate
  for (let month = 1; month <= fixedMonths; month++) {
    const interest = balance * monthlyFixedRate;
    const principal = paymentFixed - interest;
    if (insuranceRate !== null) {
      insuranceCost = balance * (insuranceRate / 100);
    }
    balance = Math.max(0, balance - principal);

    schedule.push({
      month,
      payment: paymentFixed,
      principal,
      interest,
      insurance: insuranceCost,
      remainingBalance: balance
    });
  }

  // Step 2: After fixed period, recalculate payment for remaining balance, remaining months, new rate
  const remainingMonths = totalPeriod - fixedMonths;
  if (remainingMonths > 0 && balance > 0.01) {
    const newPayment = this.calculateMonthlyPayment(balance, remainingMonths, variableRate, insuranceRate);

    for (let month = fixedMonths + 1; month <= totalPeriod; month++) {
      const interest = balance * monthlyVariableRate;
      const principal = newPayment - interest;
      if (insuranceRate !== null) {
        insuranceCost = balance * (insuranceRate / 100);
      }
      balance = Math.max(0, balance - principal);

      schedule.push({
        month,
        payment: newPayment,
        principal,
        interest,
        insurance: insuranceCost,
        remainingBalance: balance
      });
    }
  }

  return schedule;
}


/**
 * Generate linear schedule for a loan with a fixed rate for fixedMonths and then variable rate.
 *
 * (Principal per month remains the same throughout, only rate/interest changes.)
 */
generateVariableLinearSchedule(
  amount: number,
  totalPeriod: number,
  fixedRate: number,
  fixedMonths: number,
  variableRate: number,
  insuranceRate: number | null
): PaymentScheduleRow[] {
  // First: linear with fixed rate for fixedMonths
  const firstPeriod = this.generateLinearSchedule(amount, totalPeriod, fixedRate, insuranceRate).slice(0, fixedMonths);

  // Get remaining balance after fixed period
  const remainingBalance = firstPeriod.length > 0
    ? firstPeriod[firstPeriod.length - 1].remainingBalance
    : amount;

  const secondPeriodMonths = totalPeriod - fixedMonths;

  // Second: linear with variable rate, principal = amount / totalPeriod, remaining months/remaining balance
  let secondPeriod: PaymentScheduleRow[] = [];
  if (secondPeriodMonths > 0 && remainingBalance > 0) {
    // Principal per month is ALWAYS amount / totalPeriod for the full loan
    const principalPayment = amount / totalPeriod;
    let balance = remainingBalance;
    let insuranceCost = 0;
    for (let i = 1; i <= secondPeriodMonths; i++) {
      const interest = balance * (variableRate / 100 / 12);
      const payment = principalPayment + interest;
      if (insuranceRate !== null) {
        insuranceCost = balance * (insuranceRate / 100);
      }
      balance = Math.max(0, balance - principalPayment);

      secondPeriod.push({
        month: fixedMonths + i,
        payment,
        principal: principalPayment,
        interest,
        insurance: insuranceCost,
        remainingBalance: balance
      });
    }
  }

  return [...firstPeriod, ...secondPeriod];
}

}
