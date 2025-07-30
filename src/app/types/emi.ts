// src/app/types/emi.ts

export interface FormDataStrings {
  salary: string;
  rent: string;
  other: string;
  projectIncome: string;
  existingLoans: string;
  totalProjectCost: string;
  equityPercentage: string;
  rate: string;
  repaymentPeriod: string;
  gracePeriod: string;
}

export interface FormData {
  salary: number;
  rent: number;
  other: number;
  projectIncome: number;
  existingLoans: number;
  totalProjectCost: number;
  equityPercentage: number;
  rate: number;
  repaymentPeriod: number;
  gracePeriod: number;
}

export interface Calculations {
  totalIncome: number;
  totalExpenditure: number;
  totalProjectIncome: number;
  totalProjectExpenditure: number;
  netIncome: number;
  monthlyRepayment: number;
  afterGraceRepayment?: number; 
  gracePeriodRepayment?: number; 
  dscr: number;
  incomeTax: number;
  maintenanceCost?: number; 
  bankFinanceAmount?: number; 
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface LoanType {
  id: string;
  name: string;
  interestRate: number;
  tenure: number; 
}

export type Scenario = 'normal' | 'income_reduce';