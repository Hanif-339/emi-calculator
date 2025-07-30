// src/app/utils/formatters.ts

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount);
};

/**
 * Parse string to number with fallback
 */
export const parseNumericValue = (value: string, fallback: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Validate percentage value (0-100)
 */
export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

/**
 * Round to specified decimal places
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Calculate percentage of a value
 */
export const calculatePercentage = (value: number, percentage: number): number => {
  return (value * percentage) / 100;
};

/**
 * Get DSCR status message
 */
export const getDSCRStatus = (dscr: number): { status: string; color: string } => {
  if (dscr >= 1.25) {
    return { status: 'Excellent', color: 'text-green-600' };
  } else if (dscr >= 1.0) {
    return { status: 'Good', color: 'text-yellow-600' };
  } else {
    return { status: 'Needs Improvement', color: 'text-red-600' };
  }
};