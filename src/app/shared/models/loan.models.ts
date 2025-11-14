export interface PaymentScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number | null;
  remainingBalance: number;
}

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

export type RepaymentType = 'annuity' | 'linear';

export interface LoanParameters {
  amount: number;
  period: number;
  annualRate: number;
  insuranceRate: number | null;
}

export interface ScheduleResult {
  annuity: PaymentScheduleRow[];
  linear: PaymentScheduleRow[];
}
