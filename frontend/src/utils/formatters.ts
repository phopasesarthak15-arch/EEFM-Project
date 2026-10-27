/**
 * Indian Rupee and Financial Formatters
 */

export function formatINR(amount: number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with Indian numbering system (e.g. 1,00,000.00)
  const parts = absAmount.toFixed(showDecimals ? 2 : 0).split('.');
  let intPart = parts[0];
  const decPart = parts.length > 1 ? '.' + parts[1] : '';

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInt}${decPart}`;
}

export function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[mIndex]} ${year}`;
}
