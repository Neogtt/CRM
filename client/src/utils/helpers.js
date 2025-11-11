// Helper function to convert various number formats to a number
// Matches backend dataService.smartToNum implementation
export function smartToNum(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = String(value)
    .replace(/[USD€$₺TLtlTl,\s]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

