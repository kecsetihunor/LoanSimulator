import { Injectable } from '@angular/core';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';

export type RepaymentType = 'annuity' | 'linear';

@Injectable({
  providedIn: 'root'
})
export class LoanCalculatorService {

  constructor() {}

  /**
   * Rată lunară anuitară (NUMAI credit: principal + dobândă, FĂRĂ asigurare)
   */
  calculateMonthlyPayment(
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
   * Prima rată pentru credit linear (principal egal) – include și asigurarea.
   */
  calculateFirstLinearPayment(
    amount: number,
    period: number,
    annualRate: number,
    insuranceRate: number | null
  ): number {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;
    const firstInterest = amount * monthlyRate;
    const insuranceCost = insuranceRate !== null ? amount * (insuranceRate / 100) : 0;
    return principalPayment + firstInterest + insuranceCost;
  }

  /**
   * Wrapper: generează scadențar anuitate / linear.
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
   * Anuitate: rate egale.
   * Asigurarea este calculată separat și adăugată la plată,
   * dar nu influențează principalul/soldul.
   */
  private generateAnnuitySchedule(
    amount: number,
    period: number,
    annualRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const monthlyPaymentWithoutInsurance =
      this.calculateMonthlyPayment(amount, period, annualRate);
    const monthlyRate = annualRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPaymentWithoutInsurance - interestPayment;

      const insuranceCost = insuranceRate !== null
        ? balance * (insuranceRate / 100)
        : 0;

      const totalPayment = monthlyPaymentWithoutInsurance + insuranceCost;

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
    annualRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const principalPayment = amount / period;
    const monthlyRate = annualRate / 100 / 12;

    let balance = amount;
    const schedule: PaymentScheduleRow[] = [];

    for (let month = 1; month <= period; month++) {
      const interestPayment = balance * monthlyRate;

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
    fixedRate: number,
    fixedMonths: number,
    variableRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const schedule: PaymentScheduleRow[] = [];
    let balance = amount;

    const monthlyFixedRate = fixedRate / 100 / 12;
    const monthlyVariableRate = variableRate / 100 / 12;

    const paymentFixedCredit =
      this.calculateMonthlyPayment(amount, totalPeriod, fixedRate);

    // Perioada cu dobândă fixă
    for (let month = 1; month <= fixedMonths; month++) {
      const interest = balance * monthlyFixedRate;
      const principal = paymentFixedCredit - interest;

      const insuranceCost = insuranceRate !== null
        ? balance * (insuranceRate / 100)
        : 0;

      const totalPayment = paymentFixedCredit + insuranceCost;

      balance = Math.max(0, balance - principal);

      schedule.push({
        month,
        payment: totalPayment,
        principal,
        interest,
        insurance: insuranceRate !== null ? insuranceCost : null,
        remainingBalance: balance
      });
    }

    // Perioada variabilă
    const remainingMonths = totalPeriod - fixedMonths;
    if (remainingMonths > 0 && balance > 0.01) {
      const paymentVarCredit =
        this.calculateMonthlyPayment(balance, remainingMonths, variableRate);

      for (let i = 1; i <= remainingMonths; i++) {
        const month = fixedMonths + i;
        const interest = balance * monthlyVariableRate;
        const principal = paymentVarCredit - interest;

        const insuranceCost = insuranceRate !== null
          ? balance * (insuranceRate / 100)
          : 0;

        const totalPayment = paymentVarCredit + insuranceCost;

        balance = Math.max(0, balance - principal);

        schedule.push({
          month,
          payment: totalPayment,
          principal,
          interest,
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
    fixedRate: number,
    fixedMonths: number,
    variableRate: number,
    insuranceRate: number | null
  ): PaymentScheduleRow[] {
    const firstPeriod = this
      .generateLinearSchedule(amount, totalPeriod, fixedRate, insuranceRate)
      .slice(0, fixedMonths);

    const remainingBalance = firstPeriod.length > 0
      ? firstPeriod[firstPeriod.length - 1].remainingBalance
      : amount;

    const secondPeriodMonths = totalPeriod - fixedMonths;

    let secondPeriod: PaymentScheduleRow[] = [];
    if (secondPeriodMonths > 0 && remainingBalance > 0) {
      const principalPayment = amount / totalPeriod;
      let balance = remainingBalance;

      for (let i = 1; i <= secondPeriodMonths; i++) {
        const interest = balance * (variableRate / 100 / 12);

        const insuranceCost = insuranceRate !== null
          ? balance * (insuranceRate / 100)
          : 0;

        const totalPayment = principalPayment + interest + insuranceCost;

        balance = Math.max(0, balance - principalPayment);

        secondPeriod.push({
          month: fixedMonths + i,
          payment: totalPayment,
          principal: principalPayment,
          interest,
          insurance: insuranceRate !== null ? insuranceCost : null,
          remainingBalance: balance
        });
      }
    }

    return [...firstPeriod, ...secondPeriod];
  }
}
