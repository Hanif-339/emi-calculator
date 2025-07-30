// styles.ts - Centralized Tailwind class definitions

export const styles = {
  // Layout & Container styles
  container: "max-w-7xl mx-auto p-6 bg-white",
  flexContainer: "flex flex-wrap gap-6",
  fullWidthFlex: "flex flex-wrap gap-6 w-full",
  
  // Card/Section styles
  card: {
    base: "p-6 rounded-lg",
    gray: "bg-gray-50 p-6 rounded-lg",
    grayAlt: "bg-gray-100 p-6 rounded-lg",
    fullHeight: "bg-gray-100 p-6 rounded-lg h-full",
  },
  
  // Typography
  heading: {
    main: "text-3xl font-bold text-gray-800 mb-4",
    section: "text-xl font-semibold text-gray-800 mb-4",
    subsection: "text-lg font-semibold text-gray-800 mb-3",
  },
  
  text: {
    label: "block text-sm font-medium text-gray-700 mb-1",
    labelSmall: "block text-xs text-gray-600 mb-1",
    hint: "text-xs text-gray-500 mt-1",
    error: "text-red-500 text-xs mt-1",
    value: {
      large: "text-lg font-semibold text-gray-800",
      xlarge: "text-2xl font-bold text-gray-900",
      medium: "text-sm font-medium text-gray-700",
    },
    info: {
      small: "text-sm text-gray-600",
      xsmall: "text-xs text-gray-500",
    }
  },
  
  // Form Elements
  input: {
    base: "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500",
    error: "w-full p-3 border border-red-500 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500",
    select: "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500",
  },
  
  // Button styles
  button: {
    edit: "px-4 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500",
  },
  
  // Layout utilities
  layout: {
    flexBetween: "flex items-center justify-between mb-2",
    flexBetweenNoMargin: "flex justify-between",
    flexGap: "flex gap-4",
    flexGapSmall: "flex gap-3",
    gridCols2: "grid grid-cols-2 gap-4",
    spaceY: "space-y-4",
    spaceYSmall: "space-y-2",
    borderTop: "border-t pt-4",
    minWidth: "flex-1 min-w-80",
  },
  
  // Results/Display styles
  results: {
    container: "p-6 rounded-lg",
    valueContainer: "grid grid-cols-2 gap-4",
    smallValueContainer: "grid grid-cols-2 gap-4 text-sm",
  }
} as const;

// Helper function to conditionally apply error styles
export const getInputStyles = (hasError: boolean) => 
  hasError ? styles.input.error : styles.input.base;

// Helper function for dynamic text colors (for DSCR status)
export const getDynamicTextStyle = (baseStyle: string, colorClass: string) => 
  `${baseStyle} ${colorClass}`;

// Complex component style builders
export const buildCardStyle = (variant: 'gray' | 'grayAlt' | 'fullHeight' = 'gray') => 
  styles.card[variant];

export const buildTextStyle = (category: keyof typeof styles.text, variant?: string) => {
  const textCategory = styles.text[category];
  if (typeof textCategory === 'string') return textCategory;
  if (variant && typeof textCategory === 'object' && variant in textCategory) {
    return textCategory[variant as keyof typeof textCategory];
  }
  return '';
};