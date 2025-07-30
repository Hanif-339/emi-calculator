// src/app/hooks/useEMICalculator.ts

import { useState, useEffect, useMemo } from 'react';
import { FormDataStrings, LoanType, Scenario } from '../types/emi';
import { EMICalculationService } from '../services/calculationService';
import { LoanService } from '../services/loanService';

interface UseEMICalculatorReturn {
  // Form state
  formData: FormDataStrings;
  updateFormData: (field: keyof FormDataStrings, value: string) => void;
  resetForm: () => void;
  
  // Loan types
  loanTypes: LoanType[];
  selectedLoanType: string;
  setSelectedLoanType: (loanType: string) => void;
  
  // Grace period
  isAfterGrace: boolean;
  setIsAfterGrace: (isAfter: boolean) => void;
  
  // Scenario
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  
  // Derived values
  bankFinanceAmount: number;
  equityAmount: number;
  totalProjectCost: number;
  equityPercentage: number;
  
  // Validation
  isFormValid: boolean;
  validationErrors: Record<string, string>;
}

const DEFAULT_FORM_DATA: FormDataStrings = {
  salary: '80000',
  rent: '',
  other: '',
  projectIncome: '',
  existingLoans: '',
  totalProjectCost: '1800000',
  equityPercentage: '10',
  rate: '9.0',
  repaymentPeriod: '240',
  gracePeriod: ''
};

export const useEMICalculator = (): UseEMICalculatorReturn => {
  // Form data state
  const [formData, setFormData] = useState<FormDataStrings>(DEFAULT_FORM_DATA);
  
  // Loan types state
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [selectedLoanType, setSelectedLoanType] = useState('home-loan');
  
  // Grace period state
  const [isAfterGrace, setIsAfterGrace] = useState(false);
  
  // Scenario state
  const [scenario, setScenario] = useState<Scenario>('normal');

  // Load loan types on mount
  useEffect(() => {
    const loadedLoanTypes = LoanService.loadLoanTypes();
    setLoanTypes(loadedLoanTypes);
  }, []);

  // Form data update handler
  const updateFormData = (field: keyof FormDataStrings, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form to default values
  const resetForm = (): void => {
    setFormData(DEFAULT_FORM_DATA);
    setIsAfterGrace(false);
    setScenario('normal');
    setSelectedLoanType('home-loan');
  };

  // Memoized derived values for performance
  const { totalProjectCost, equityPercentage, bankFinanceAmount, equityAmount } = useMemo(() => {
    const projectCost = EMICalculationService.getNumericValue(formData.totalProjectCost);
    const equity = EMICalculationService.getNumericValue(formData.equityPercentage);
    
    const bankFinance = EMICalculationService.calculateBankFinanceAmount(projectCost, equity);
    const equityAmt = EMICalculationService.calculateEquityAmount(projectCost, equity);
    
    return {
      totalProjectCost: projectCost,
      equityPercentage: equity,
      bankFinanceAmount: bankFinance,
      equityAmount: equityAmt
    };
  }, [formData.totalProjectCost, formData.equityPercentage]);

  // Form validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: Record<string, string> = {};
    
    // Required field validations
    if (!formData.salary || EMICalculationService.getNumericValue(formData.salary) <= 0) {
      errors.salary = 'Salary is required and must be greater than 0';
    }
    
    if (!formData.totalProjectCost || EMICalculationService.getNumericValue(formData.totalProjectCost) <= 0) {
      errors.totalProjectCost = 'Total project cost is required and must be greater than 0';
    }
    
    if (!formData.rate || EMICalculationService.getNumericValue(formData.rate) <= 0) {
      errors.rate = 'Interest rate is required and must be greater than 0';
    }
    
    if (!formData.repaymentPeriod || EMICalculationService.getNumericValue(formData.repaymentPeriod) <= 0) {
      errors.repaymentPeriod = 'Repayment period is required and must be greater than 0';
    }
    
    // Logical validations
    const equity = EMICalculationService.getNumericValue(formData.equityPercentage);
    if (equity < 0 || equity > 100) {
      errors.equityPercentage = 'Equity percentage must be between 0 and 100';
    }
    
    const rate = EMICalculationService.getNumericValue(formData.rate);
    if (rate > 50) { // Reasonable upper limit
      errors.rate = 'Interest rate seems unusually high';
    }
    
    const tenure = EMICalculationService.getNumericValue(formData.repaymentPeriod);
    if (tenure > 600) { // 50 years max
      errors.repaymentPeriod = 'Repayment period cannot exceed 600 months';
    }
    
    // Grace period validation
    const gracePeriod = EMICalculationService.getNumericValue(formData.gracePeriod);
    if (gracePeriod > tenure) {
      errors.gracePeriod = 'Grace period cannot be longer than repayment period';
    }
    
    return {
      isFormValid: Object.keys(errors).length === 0,
      validationErrors: errors
    };
  }, [formData]);

  return {
    // Form state
    formData,
    updateFormData,
    resetForm,
    
    // Loan types
    loanTypes,
    selectedLoanType,
    setSelectedLoanType,
    
    // Grace period
    isAfterGrace,
    setIsAfterGrace,
    
    // Scenario
    scenario,
    setScenario,
    
    // Derived values
    bankFinanceAmount,
    equityAmount,
    totalProjectCost,
    equityPercentage,
    
    // Validation
    isFormValid,
    validationErrors
  };
};