export interface PaymentScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export type RepaymentType = 'annuity' | 'linear';

export interface LoanParameters {
  amount: number;
  period: number;
  annualRate: number;
}

export interface ScheduleResult {
  annuity: PaymentScheduleRow[];
  linear: PaymentScheduleRow[];
}
