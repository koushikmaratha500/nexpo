export function formatGroupAmount(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
