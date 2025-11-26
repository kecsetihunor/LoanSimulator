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

export type PaymentType = 'annuity' | 'linear';

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

export interface LoanData {
  amount: number | null;
  period: number | null;
  rate: number | null;
  fixedPeriod: number | null;
  variableRate: number | null;
  insuranceRate: number | null;
}
