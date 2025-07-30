"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEMICalculator } from '../hooks/useEMICalculator';
import { EMICalculationService } from '../services/calculationService';
import { formatCurrency, getDSCRStatus } from '../utils/formatters';
import { Calculations } from '../types/emi';
import { styles, getInputStyles, getDynamicTextStyle } from './styles';

const EMICalculator: React.FC = () => {
  const router = useRouter();
  
  const {
    formData,
    updateFormData,
    loanTypes,
    selectedLoanType,
    setSelectedLoanType,
    scenario,
    setScenario,
    bankFinanceAmount,
    equityAmount,
    totalProjectCost,
    equityPercentage,
    isFormValid,
    validationErrors
  } = useEMICalculator();

  // Calculate both scenarios for both grace periods
  const normalDuringGrace = EMICalculationService.performCalculations(
    formData,
    'normal',
    false
  );

  const normalAfterGrace = EMICalculationService.performCalculations(
    formData,
    'normal',
    true
  );

  const reducedDuringGrace = EMICalculationService.performCalculations(
    formData,
    'income_reduce',
    false
  );

  const reducedAfterGrace = EMICalculationService.performCalculations(
    formData,
    'income_reduce',
    true
  );

  // Event handlers
  const handleLoanTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLoanTypeId = e.target.value;
    setSelectedLoanType(newLoanTypeId);

    const selectedLoan = loanTypes.find(loan => loan.id === newLoanTypeId);
    if (selectedLoan) {
      updateFormData('rate', selectedLoan.interestRate.toString());
      updateFormData('repaymentPeriod', selectedLoan.tenure.toString());
    }
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenario(e.target.value as 'normal' | 'income_reduce');
  };

  const handleEditLoanTypes = () => {
    router.push('/edit-loan-types');
  };

  // Convert months to years for display
  const getYearsFromMonths = (months: string): string => {
    const numMonths = parseFloat(months) || 0;
    return Math.floor(numMonths / 12).toString();
  };

  const getMonthsRemainder = (months: string): string => {
    const numMonths = parseFloat(months) || 0;
    return (numMonths % 12).toString();
  };

  // Convert years and months back to total months
  const handleYearsChange = (years: string) => {
    const numYears = parseFloat(years) || 0;
    const remainderMonths = parseFloat(getMonthsRemainder(formData.repaymentPeriod)) || 0;
    const totalMonths = (numYears * 12) + remainderMonths;
    updateFormData('repaymentPeriod', totalMonths.toString());
  };

  const handleMonthsChange = (months: string) => {
    const numMonths = parseFloat(months) || 0;
    const years = Math.floor(parseFloat(formData.repaymentPeriod) / 12) || 0;
    const totalMonths = (years * 12) + numMonths;
    updateFormData('repaymentPeriod', totalMonths.toString());
  };

  const taxBrackets = EMICalculationService.getTaxBrackets();

  // Reusable calculation results component
  const CalculationResults: React.FC<{
    title: string;
    duringGraceCalculations: Calculations;
    afterGraceCalculations: Calculations;
    bgColor: string;
    titleColor: string;
  }> = ({ title, duringGraceCalculations, afterGraceCalculations, bgColor, titleColor }) => {
    const afterGraceDscrStatus = getDSCRStatus(afterGraceCalculations.dscr);

    return (
      <div className={`${bgColor} ${styles.card.base}`}>
        <h2 className={`${styles.heading.section} ${titleColor}`}>{title}</h2>
        
        <div className={styles.layout.spaceY}>
          <div className={styles.results.valueContainer}>
            <div>
              <p className={styles.text.info.small}>Total Income</p>
              <p className={styles.text.value.large}>{formatCurrency(afterGraceCalculations.totalIncome)}</p>
            </div>
            <div>
              <p className={styles.text.info.small}>Total Expenditure</p>
              <p className="text-lg font-semibold text-gray-700">{formatCurrency(afterGraceCalculations.totalExpenditure)}</p>
            </div>
          </div>
          
          <div className={styles.results.valueContainer}>
            <div>
              <p className={styles.text.info.small}>Project Income</p>
              <p className={styles.text.value.large}>{formatCurrency(afterGraceCalculations.totalProjectIncome)}</p>
            </div>
            <div>
              <p className={styles.text.info.small}>Project Expenditure</p>
              <p className="text-lg font-semibold text-gray-700">{formatCurrency(afterGraceCalculations.totalProjectExpenditure)}</p>
            </div>
          </div>
          
          {/* Show maintenance cost and income tax breakdown */}
          <div className={styles.results.smallValueContainer}>
            <div>
              <p className={styles.text.info.xsmall}>Maintenance Cost (5%)</p>
              <p className={styles.text.value.medium}>{formatCurrency(afterGraceCalculations.maintenanceCost || 0)}</p>
            </div>
            <div>
              <p className={styles.text.info.xsmall}>Income Tax</p>
              <p className={styles.text.value.medium}>{formatCurrency(afterGraceCalculations.incomeTax)}</p>
            </div>
          </div>
          
          <div className={styles.layout.borderTop}>
            <div>
              <p className={styles.text.info.small}>Net Income</p>
              <p className={styles.text.value.xlarge}>{formatCurrency(afterGraceCalculations.netIncome)}</p>
            </div>
          </div>
          
          {/* Show both repayment amounts */}
          <div className={styles.results.valueContainer}>
            <div>
              <p className={styles.text.info.small}>EMI (During Grace)</p>
              <p className={styles.text.value.large}>{formatCurrency(duringGraceCalculations.monthlyRepayment)}</p>
            </div>
            <div>
              <p className={styles.text.info.small}>EMI (After Grace)</p>
              <p className="text-lg font-semibold text-gray-700">{formatCurrency(afterGraceCalculations.monthlyRepayment)}</p>
            </div>
          </div>
          
          <div className={styles.layout.borderTop}>
            <div>
              <p className={styles.text.info.small}>DSCR (Debt Service Coverage Ratio)</p>
              <p className={getDynamicTextStyle("text-2xl font-bold", afterGraceDscrStatus.color)}>
                {afterGraceCalculations.dscr.toFixed(2)}
              </p>
              <p className={styles.text.info.xsmall}>
                {afterGraceDscrStatus.status} (Based on after-grace EMI)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className="mb-8">
        <h1 className={styles.heading.main}>EMI Calculator</h1>
        
        {/* Loan Type Selection */}
        <div className="mb-6">
          <div className={styles.layout.flexBetween}>
            <label className={styles.text.label}>Loan Type</label>
            <button
              onClick={handleEditLoanTypes}
              className={styles.button.edit}
            >
              Edit
            </button>
          </div>
          <select 
            value={selectedLoanType} 
            onChange={handleLoanTypeChange}
            className={styles.input.select}
          >
            {loanTypes.map((loanType) => (
              <option key={loanType.id} value={loanType.id}>
                {loanType.name} ({loanType.interestRate}% - {Math.floor(loanType.tenure / 12)}y {loanType.tenure % 12}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.flexContainer}>
        {/* Monthly Income Section */}
        <div className={styles.layout.minWidth}>
          <div className={styles.card.gray}>
            <h2 className={styles.heading.section}>Monthly Income</h2>
            
            <div className={styles.layout.spaceY}>
              <div>
                <label className={styles.text.label}>
                  Salary *
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => updateFormData('salary', e.target.value)}
                  className={getInputStyles(!!validationErrors.salary)}
                  placeholder="Enter salary"
                />
                {validationErrors.salary && (
                  <p className={styles.text.error}>{validationErrors.salary}</p>
                )}
              </div>
              
              <div>
                <label className={styles.text.label}>Rent</label>
                <input
                  type="number"
                  value={formData.rent}
                  onChange={(e) => updateFormData('rent', e.target.value)}
                  className={styles.input.base}
                  placeholder="Enter rent income"
                />
              </div>
              
              <div>
                <label className={styles.text.label}>Other</label>
                <input
                  type="number"
                  value={formData.other}
                  onChange={(e) => updateFormData('other', e.target.value)}
                  className={styles.input.base}
                  placeholder="Enter other income"
                />
              </div>
              
              <div>
                <label className={styles.text.label}>
                  Project Income (After Grace)
                </label>
                <input
                  type="number"
                  value={formData.projectIncome}
                  onChange={(e) => updateFormData('projectIncome', e.target.value)}
                  className={styles.input.base}
                  placeholder="Enter project income"
                />
                <p className={styles.text.hint}>
                  Only applicable after grace period ends
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Details Section */}
        <div className={styles.layout.minWidth}>
          <div className={styles.card.fullHeight}>
            <h2 className={styles.heading.section}>Loan Details</h2>
            
            <div className={styles.layout.spaceY}>
              <div>
                <label className={styles.text.label}>Existing Loans</label>
                <input
                  type="number"
                  value={formData.existingLoans}
                  onChange={(e) => updateFormData('existingLoans', e.target.value)}
                  className={styles.input.base}
                  placeholder="Enter existing loan amount"
                />
              </div>
              
              <div>
                <label className={styles.text.label}>Total Project Cost *</label>
                <input
                  type="number"
                  value={formData.totalProjectCost}
                  onChange={(e) => updateFormData('totalProjectCost', e.target.value)}
                  className={getInputStyles(!!validationErrors.totalProjectCost)}
                  placeholder="Enter total project cost"
                />
                {validationErrors.totalProjectCost && (
                  <p className={styles.text.error}>{validationErrors.totalProjectCost}</p>
                )}
              </div>

              <div className={styles.layout.flexGap}>
                <div className="flex-1">
                  <label className={styles.text.label}>Equity %</label>
                  <input
                    type="number"
                    value={formData.equityPercentage}
                    onChange={(e) => updateFormData('equityPercentage', e.target.value)}
                    className={getInputStyles(!!validationErrors.equityPercentage)}
                    placeholder="Enter equity percentage"
                    min="0"
                    max="100"
                  />
                  {validationErrors.equityPercentage && (
                    <p className={styles.text.error}>{validationErrors.equityPercentage}</p>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className={styles.text.label}>Interest Rate (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rate}
                    onChange={(e) => updateFormData('rate', e.target.value)}
                    className={getInputStyles(!!validationErrors.rate)}
                    placeholder="Enter interest rate"
                  />
                  {validationErrors.rate && (
                    <p className={styles.text.error}>{validationErrors.rate}</p>
                  )}
                </div>
              </div>
 
              <div>
                <label className={styles.text.label}>Repayment Period *</label>                
                <div className={styles.layout.flexGapSmall}>
                  <div className="flex-1">
                    <label className={styles.text.labelSmall}>Years</label>
                    <input
                      type="number"
                      value={getYearsFromMonths(formData.repaymentPeriod)}
                      onChange={(e) => handleYearsChange(e.target.value)}
                      className={styles.input.base}
                      placeholder="Years"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className={styles.text.labelSmall}>Months</label>
                    <input
                      type="number"
                      value={getMonthsRemainder(formData.repaymentPeriod)}
                      onChange={(e) => handleMonthsChange(e.target.value)}
                      className={styles.input.base}
                      placeholder="Months"
                      min="0"
                      max="11"
                    />
                  </div>                  
                </div>
                <p className={styles.text.hint}>
                  Total: {formData.repaymentPeriod} months
                </p>
                {validationErrors.repaymentPeriod && (
                  <p className={styles.text.error}>{validationErrors.repaymentPeriod}</p>
                )}
              </div>

              <div>
                <label className={styles.text.label}>Grace Period (months)</label>
                <input
                  type="number"
                  value={formData.gracePeriod}
                  onChange={(e) => updateFormData('gracePeriod', e.target.value)}
                  className={getInputStyles(!!validationErrors.gracePeriod)}
                  placeholder="Enter grace period"
                />
                {validationErrors.gracePeriod && (
                  <p className={styles.text.error}>{validationErrors.gracePeriod}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Finance Details & Tax Brackets */}
        <div className={styles.layout.minWidth}>
          <div className={styles.card.grayAlt}>
            <h3 className={styles.heading.subsection}>Bank Finance Details</h3>
            <div className="space-y-2 mb-4">
              <div className={styles.layout.flexBetweenNoMargin}>
                <span className={styles.text.info.small}>Total Project Cost:</span>
                <span className="font-semibold">{formatCurrency(totalProjectCost)}</span>
              </div>
              <div className={styles.layout.flexBetweenNoMargin}>
                <span className={styles.text.info.small}>Equity ({equityPercentage}%):</span>
                <span className="font-semibold">{formatCurrency(equityAmount)}</span>
              </div>
              <div className={styles.layout.flexBetweenNoMargin}>
                <span className={styles.text.info.small}>Bank Finance:</span>
                <span className="font-semibold">{formatCurrency(bankFinanceAmount)}</span>
              </div>
            </div>

            <h3 className={styles.heading.subsection}>Income Tax Brackets</h3>
            <div className={styles.layout.spaceYSmall}>
              {taxBrackets.map((bracket, index) => (
                <div key={index} className={styles.layout.flexBetweenNoMargin}>
                  <span className={styles.text.info.small}>
                    {bracket.min === 0 ? 'Up to' : bracket.max === Infinity ? 'Above' : ''} 
                    {bracket.min === 0 ? '' : bracket.min.toLocaleString()}
                    {bracket.max !== Infinity && bracket.min !== 0 ? ' - ' : ''}
                    {bracket.max === Infinity ? '' : bracket.max.toLocaleString()}:
                  </span>
                  <span className="font-medium">{bracket.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.fullWidthFlex}> 
          {/* Normal Scenario Results */}
          <div className={styles.layout.minWidth}>
            <CalculationResults
              title="Normal Scenario Results"
              duringGraceCalculations={normalDuringGrace}
              afterGraceCalculations={normalAfterGrace}
              bgColor="bg-gray-100"
              titleColor="text-gray-800"
            />
          </div>

          {/* Income Reduced Scenario Results */}
          <div className={styles.layout.minWidth}>
            <CalculationResults
              title="Income Reduced by 20% Results"
              duringGraceCalculations={reducedDuringGrace}
              afterGraceCalculations={reducedAfterGrace}
              bgColor="bg-gray-100"
              titleColor="text-gray-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;