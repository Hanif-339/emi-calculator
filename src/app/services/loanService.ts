// src/app/services/loanService.ts

import { LoanType } from '../types/emi';

export class LoanService {
  private static readonly STORAGE_KEY = 'loanTypes';
  private static readonly DEFAULT_LOAN_TYPES: LoanType[] = [
    { id: 'home-loan', name: 'Home Loan', interestRate: 8.5, tenure: 240 }, 
    { id: 'car-loan', name: 'Car Loan', interestRate: 9.5, tenure: 60 },
    { id: 'personal-loan', name: 'Personal Loan', interestRate: 12.0, tenure: 36 }, 
    { id: 'business-loan', name: 'Business Loan', interestRate: 11.0, tenure: 84 }, 
    { id: 'education-loan', name: 'Education Loan', interestRate: 7.5, tenure: 120 } 
  ];

  /**
   * Load loan types from localStorage or return defaults
   */
  static loadLoanTypes(): LoanType[] {
    if (typeof window === 'undefined') {
      return [...this.DEFAULT_LOAN_TYPES];
    }

    try {
      const savedLoanTypes = localStorage.getItem(this.STORAGE_KEY);
      if (savedLoanTypes) {
        const parsed = JSON.parse(savedLoanTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check for legacy data and migrate
          const migratedTypes = parsed.map(loan => this.migrateLoanType(loan));
          if (this.isValidLoanTypesArray(migratedTypes)) {
            return migratedTypes;
          }
        }
      }
    } catch (err) {
      console.error('Error loading saved loan types:', err);
    }

    return [...this.DEFAULT_LOAN_TYPES];
  }

  /**
   * Migrate legacy loan type (without interest rate and tenure) to new format
   */
  private static migrateLoanType(loan: any): LoanType {
    if (this.isValidLoanType(loan)) {
      return loan;
    }

    // Legacy loan type - add default values
    if (typeof loan === 'object' && loan.id && loan.name) {
      const defaultLoan = this.DEFAULT_LOAN_TYPES.find(d => d.id === loan.id);
      return {
        id: loan.id,
        name: loan.name,
        interestRate: defaultLoan?.interestRate || 10.0,
        tenure: defaultLoan?.tenure || 60
      };
    }

    // Fallback
    return {
      id: 'unknown-' + Date.now(),
      name: 'Unknown Loan',
      interestRate: 10.0,
      tenure: 60
    };
  }

  /**
   * Save loan types to localStorage
   */
  static saveLoanTypes(loanTypes: LoanType[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loanTypes));
    } catch (err) {
      console.error('Error saving loan types:', err);
    }
  }

  /**
   * Get default loan types
   */
  static getDefaultLoanTypes(): LoanType[] {
    return [...this.DEFAULT_LOAN_TYPES];
  }

  /**
   * Validate loan type object
   */
  static isValidLoanType(loanType: any): loanType is LoanType {
    return (
      typeof loanType === 'object' &&
      loanType !== null &&
      typeof loanType.id === 'string' &&
      typeof loanType.name === 'string' &&
      typeof loanType.interestRate === 'number' &&
      typeof loanType.tenure === 'number' &&
      loanType.id.trim().length > 0 &&
      loanType.name.trim().length > 0 &&
      loanType.interestRate > 0 &&
      loanType.interestRate <= 100 &&
      loanType.tenure > 0 &&
      loanType.tenure <= 1200 // Max 100 years
    );
  }

  /**
   * Validate array of loan types
   */
  static isValidLoanTypesArray(loanTypes: any): loanTypes is LoanType[] {
    return (
      Array.isArray(loanTypes) &&
      loanTypes.length > 0 &&
      loanTypes.every(this.isValidLoanType)
    );
  }

  /**
   * Generate a unique ID for new loan types
   */
  static generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }

  /**
   * Validate loan name uniqueness
   */
  static isNameUnique(name: string, existingLoans: LoanType[], excludeId?: string): boolean {
    return !existingLoans.some(loan => 
      loan.id !== excludeId && 
      loan.name.toLowerCase() === name.trim().toLowerCase()
    );
  }
}