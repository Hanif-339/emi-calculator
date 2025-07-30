// src/app/services/calculationService.ts

import Decimal from 'decimal.js';
import { FormData, FormDataStrings, TaxBracket, Calculations, Scenario } from '../types/emi';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21
});

export class EMICalculationService {
  private static taxBrackets: TaxBracket[] = [
    { min: 0, max: 720000, rate: 0 },
    { min: 720000, max: 1200000, rate: 5.5 },
    { min: 1200000, max: 1800000, rate: 8 },
    { min: 1800000, max: 2400000, rate: 12 },
    { min: 2400000, max: Infinity, rate: 15 }
  ];

  /**
   * Convert string form data to numeric values with precision handling
   */
  static getNumericValue(value: string): number {
    const parsed = parseFloat(value) || 0;
    return new Decimal(parsed).toNumber();
  }

  /**
   * Convert string-based form data to numeric form data
   */
  static convertToNumericFormData(formData: FormDataStrings): FormData {
    return {
      salary: this.getNumericValue(formData.salary),
      rent: this.getNumericValue(formData.rent),
      other: this.getNumericValue(formData.other),
      projectIncome: this.getNumericValue(formData.projectIncome),
      existingLoans: this.getNumericValue(formData.existingLoans),
      totalProjectCost: this.getNumericValue(formData.totalProjectCost),
      equityPercentage: this.getNumericValue(formData.equityPercentage),
      rate: this.getNumericValue(formData.rate),
      repaymentPeriod: this.getNumericValue(formData.repaymentPeriod),
      gracePeriod: this.getNumericValue(formData.gracePeriod)
    };
  }

  /**
   * Calculate monthly income tax based on annual income with precision
   */
  static calculateIncomeTax(annualIncome: number): number {
    let tax = new Decimal(0);
    const income = new Decimal(annualIncome);
    
    for (const bracket of this.taxBrackets) {
      const bracketMin = new Decimal(bracket.min);
      const bracketMax = bracket.max === Infinity ? new Decimal(Number.MAX_SAFE_INTEGER) : new Decimal(bracket.max);
      
      if (income.gt(bracketMin)) {
        const taxableInBracket = Decimal.min(
          income.minus(bracketMin), 
          bracketMax.minus(bracketMin)
        );
        
        const bracketTax = taxableInBracket
          .mul(bracket.rate)
          .div(100);
        
        tax = tax.plus(bracketTax);
      }
    }
    
    // Return monthly tax
    return tax.div(12).toNumber();
  }

  /**
   * Calculate EMI using standard formula with high precision
   */
  static calculateEMI(principal: number, rate: number, tenure: number): number {
    const p = new Decimal(principal);
    const r = new Decimal(rate);
    const n = new Decimal(tenure);
    
    // Monthly interest rate
    const monthlyRate = r.div(100).div(12);
    
    // Handle zero interest rate case
    if (monthlyRate.isZero()) {
      return p.div(n).toNumber();
    }
    
    // EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1)
    const onePlusR = monthlyRate.plus(1);
    const onePlusRPowerN = onePlusR.pow(n.toNumber());
    
    const numerator = p.mul(monthlyRate).mul(onePlusRPowerN);
    const denominator = onePlusRPowerN.minus(1);
    
    const emi = numerator.div(denominator);
    
    return emi.toNumber();
  }

  /**
   * Calculate EMI for grace period (interest-only payments) with precision
   */
  static calculateGracePeriodPayment(principal: number, rate: number): number {
    const p = new Decimal(principal);
    const r = new Decimal(rate);
    
    // Monthly interest = (principal * rate / 100) / 12
    const monthlyInterest = p.mul(r).div(100).div(12);
    
    return monthlyInterest.toNumber();
  }

  /**
   * Apply scenario multipliers to income values with precision
   */
  static applyScenarioMultipliers(
    formData: FormData, 
    scenario: Scenario
  ): {
    adjustedSalary: number;
    adjustedRent: number;
    adjustedOther: number;
    adjustedProjectIncome: number;
  } {
    const multiplier = new Decimal(scenario === 'income_reduce' ? 0.8 : 1);
    
    return {
      adjustedSalary: new Decimal(formData.salary).mul(multiplier).toNumber(),
      adjustedRent: new Decimal(formData.rent).mul(multiplier).toNumber(),
      adjustedOther: new Decimal(formData.other).mul(multiplier).toNumber(),
      adjustedProjectIncome: new Decimal(formData.projectIncome).mul(multiplier).toNumber()
    };
  }

  /**
   * Calculate bank finance amount with precision
   */
  static calculateBankFinanceAmount(totalProjectCost: number, equityPercentage: number): number {
    const cost = new Decimal(totalProjectCost);
    const equity = new Decimal(equityPercentage);
    
    // Bank finance = total cost * (1 - equity% / 100)
    const equityRatio = equity.div(100);
    const bankFinanceRatio = new Decimal(1).minus(equityRatio);
    
    return cost.mul(bankFinanceRatio).toNumber();
  }

  /**
   * Calculate equity amount with precision
   */
  static calculateEquityAmount(totalProjectCost: number, equityPercentage: number): number {
    const cost = new Decimal(totalProjectCost);
    const equity = new Decimal(equityPercentage);
    
    // Equity amount = total cost * equity% / 100
    return cost.mul(equity).div(100).toNumber();
  }

  /**
   * Main calculation function that performs all EMI calculations with precision
   */
  static performCalculations(
    formData: FormDataStrings,
    scenario: Scenario,
    isAfterGrace: boolean
  ): Calculations {
    // Convert string form data to numeric values
    const numericData = this.convertToNumericFormData(formData);

    // Apply scenario multipliers
    const {
      adjustedSalary,
      adjustedRent,
      adjustedOther,
      adjustedProjectIncome
    } = this.applyScenarioMultipliers(numericData, scenario);

    // Calculate total income with precision
    const totalIncome = new Decimal(adjustedSalary)
      .plus(adjustedRent)
      .plus(adjustedOther)
      .toNumber();

    // Calculate total expenditure based on income level
    const expenditureRate = new Decimal(totalIncome > 25000 ? 0.35 : 0.40);
    const totalExpenditure = new Decimal(totalIncome)
      .mul(expenditureRate)
      .toNumber();

    // Grace period logic for project income
    const totalProjectIncome = isAfterGrace ? adjustedProjectIncome : 0;

    // Calculate bank finance amount
    const bankFinanceAmount = this.calculateBankFinanceAmount(
      numericData.totalProjectCost, 
      numericData.equityPercentage
    );

    // Calculate repayments - Always calculate after-grace repayment for DSCR
    const afterGraceRepayment = this.calculateEMI(
      bankFinanceAmount, 
      numericData.rate, 
      numericData.repaymentPeriod
    );
    
    const gracePeriodRepayment = this.calculateGracePeriodPayment(
      bankFinanceAmount, 
      numericData.rate
    );

    // Current monthly repayment (what customer pays now)
    const currentMonthlyRepayment = isAfterGrace ? afterGraceRepayment : gracePeriodRepayment;

    // Maintenance cost calculation (5% of Rent + Project Income) with precision
    const maintenanceCost = (adjustedRent > 0 || adjustedProjectIncome > 0) ? 
      new Decimal(adjustedRent)
        .plus(isAfterGrace ? adjustedProjectIncome : 0)
        .mul(0.05)
        .toNumber() : 0;

    // Calculate income tax based on total annual income
    const annualTotalIncome = new Decimal(totalIncome)
      .plus(totalProjectIncome)
      .mul(12)
      .toNumber();
    const monthlyIncomeTax = this.calculateIncomeTax(annualTotalIncome);

    // Total project expenditure calculation with precision
    let totalProjectExpenditure = new Decimal(maintenanceCost)
      .plus(monthlyIncomeTax);
    
    // Add 20% of total income in certain scenarios
    if (scenario === 'income_reduce') {
      totalProjectExpenditure = totalProjectExpenditure
        .plus(new Decimal(totalIncome).mul(0.20));
    }

    const finalProjectExpenditure = totalProjectExpenditure.toNumber();

    // Calculate net income with precision
    const netIncome = new Decimal(totalIncome)
      .minus(totalExpenditure)
      .plus(totalProjectIncome)
      .minus(finalProjectExpenditure)
      .toNumber();

    // DSCR calculation with precision - always use after-grace repayment
    const totalRepaymentObligation = new Decimal(numericData.existingLoans)
      .plus(afterGraceRepayment);
    
    const dscr = totalRepaymentObligation.isZero() ? 
      0 : new Decimal(netIncome).div(totalRepaymentObligation).toNumber();

    return {
      totalIncome,
      totalExpenditure,
      totalProjectIncome,
      totalProjectExpenditure: finalProjectExpenditure,
      netIncome,
      monthlyRepayment: currentMonthlyRepayment, // What customer currently pays
      afterGraceRepayment, // What customer will pay after grace
      gracePeriodRepayment, // What customer pays during grace
      dscr, // Always based on after-grace repayment
      incomeTax: monthlyIncomeTax,
      maintenanceCost,
      bankFinanceAmount
    };
  }

  /**
   * Get tax brackets for display purposes
   */
  static getTaxBrackets(): TaxBracket[] {
    return [...this.taxBrackets];
  }

  /**
   * Utility method to round to specified decimal places (for display purposes)
   */
  static roundToDecimalPlaces(value: number, places: number = 2): number {
    return new Decimal(value).toDecimalPlaces(places).toNumber();
  }

  /**
   * Utility method to format currency (for display purposes)
   */
  static formatCurrency(value: number, currency: string = 'MVR'): string {
    const rounded = this.roundToDecimalPlaces(value, 2);
    return `${currency} ${rounded.toLocaleString()}`;
  }
}