export const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (!numericValue || isNaN(numericValue)) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numericValue);
};