import { Injectable } from '@angular/core';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { PaymentType } from '@app/shared/models/loan.models';

@Injectable({
  providedIn: 'root'
})
export class LoanCalculatorService {
  
  constructor() {}


  calculateMonthlyPaymentAnnuity(
    amount: number,
    period: number,
    annualRate: number
  ): number {
    if (amount <= 0 || period <= 0 || annualRate < 0) {
      throw new Error('Invalid loan parameters');
    }

    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return amount / period;
    }

    const factor = Math.pow(1 + monthlyRate, period);
    return amount * (monthlyRate * factor) / (factor - 1);
  }

  /**
   * Wrapper: generează scadențar anuitate / linear.
   */
  generateAmortizationSchedule(
    amount: number,
    period: number,
    interestRate: number,
    insuranceRate: number | null,
    type: PaymentType = 'annuity'
  ): PaymentScheduleRow[] {
    if (type === 'annuity') {
      return this.generateAnnuitySchedule(amount, period, interestRate, insuranceRate);
    } else {
      return this.generateLinearSchedule(amount, period, interestRate, insuranceRate);
    }
  }

  generateVariableAmortizationSchedule(
    amount: number,
    totalPeriod: number,
    fixedInterestRate: number,
    fixedMonths: number,
    variableInterestRate: number,
    insuranceRate: number | null,
    type: PaymentType = 'annuity'
  ): PaymentScheduleRow[] {
    if (type === 'annuity') {
      return this.generateVariableAnnuitySchedule(amount, totalPeriod, fixedInterestRate, fixedMonths, variableInterestRate, insuranceRate);
    } else {
      return this.generateVariableLinearSchedule(amount, totalPeriod, fixedInterestRate, fixedMonths, variableInterestRate, insuranceRate);
    }
  }
  /**
   * Anuitate: rate egale.
   * Asigurarea este calculată separat și adăugată la plată,
   * dar nu influențează principalul/soldul.
   */
  private generateAnnuitySchedule(
    amount: number,
    period: number,
    interestRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    
    const monthlyPayment = this.calculateMonthlyPaymentAnnuity(amount, period, interestRate);
    const monthlyInterestRate = interestRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;

      const insuranceCost = insuranceRate !== null
        ? balance * (insuranceRate / 100)
        : 0;

      const totalPayment = monthlyPayment + insuranceCost;

      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        insurance: insuranceRate !== null ? insuranceCost : null,
        remainingBalance: balance
      });
    }

    return schedule;
  }

  /**
   * Linear: principal egal, plată totală descrescătoare.
   * Asigurarea este adăugată peste rată, nu influențează principalul.
   */
  private generateLinearSchedule(
    amount: number,
    period: number,
    interestRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {

    const principalPayment = amount / period;
    const monthlyInterestRate = interestRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyInterestRate;

      const insuranceCost = insuranceRate !== null
        ? balance * (insuranceRate / 100)
        : 0;

      const totalPayment = principalPayment + interestPayment + insuranceCost;

      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        insurance: insuranceRate !== null ? insuranceCost : null,
        remainingBalance: balance
      });
    }

    return schedule;
  }

  /**
   * Anuitate cu perioadă fixă + perioadă variabilă.
   * În ambele etape: rata de credit (fără asigurare) din formula standard,
   * asigurarea calculată separat.
   */
  generateVariableAnnuitySchedule(
    amount: number,
    totalPeriod: number,
    fixedInterestRate: number,
    fixedMonths: number,
    variableInterestRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const schedule: PaymentScheduleRow[] = [];
    let balance = amount;

    const monthlyFixedRate = fixedInterestRate / 100 / 12;
    const monthlyVariableRate = variableInterestRate / 100 / 12;

    const fixedPrincipalPayment = this.calculateMonthlyPaymentAnnuity(amount, totalPeriod, fixedInterestRate);

    // Fixed period
    for (let month = 1; month <= fixedMonths; month++) {
      const monthlyInterest = balance * monthlyFixedRate;
      const monthlyPrincipal = fixedPrincipalPayment - monthlyInterest;

      const insuranceCost = insuranceRate !== null
        ? balance * (insuranceRate / 100)
        : 0;

      const monthlyPayment = fixedPrincipalPayment + insuranceCost;

      balance = Math.max(0, balance - monthlyPrincipal);

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        insurance: insuranceRate !== null ? insuranceCost : null,
        remainingBalance: balance
      });
    }

    // Variable period
    const remainingMonths = totalPeriod - fixedMonths;
    if (remainingMonths > 0 && balance > 0) {
      const variablePrincipalPayment = this.calculateMonthlyPaymentAnnuity(balance, remainingMonths, variableInterestRate);

      for (let month = fixedMonths + 1; month <= totalPeriod; month++) {
        const monthlyInterest = balance * monthlyVariableRate;
        const monthlyPrincipal = variablePrincipalPayment - monthlyInterest;

        const insuranceCost = insuranceRate !== null
          ? balance * (insuranceRate / 100)
          : 0;

        const totalPayment = variablePrincipalPayment + insuranceCost;

        balance = Math.max(0, balance - monthlyPrincipal);

        schedule.push({
          month,
          payment: totalPayment,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          insurance: insuranceRate !== null ? insuranceCost : null,
          remainingBalance: balance
        });
      }
    }

    return schedule;
  }

  /**
   * Linear cu perioadă fixă + variabilă (principal constant).
   */
  generateVariableLinearSchedule(
    amount: number,
    totalPeriod: number,
    fixedInterestRate: number,
    fixedMonths: number,
    variableInterestRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
      const firstPeriod = this.generateLinearSchedule(amount, totalPeriod, fixedInterestRate, insuranceRate).slice(0, fixedMonths);
      const secondPeriod = this.generateLinearSchedule(amount, totalPeriod, variableInterestRate, insuranceRate).slice(fixedMonths);
     return [...firstPeriod, ...secondPeriod];
  }
}
