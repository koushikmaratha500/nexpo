export function monthRangeFromYm(month: string): { start: Date; end: Date; label: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const zeroBased = Number(m[2]) - 1;
  if (zeroBased < 0 || zeroBased > 11) return null;
  const start = new Date(year, zeroBased, 1);
  const end = new Date(year, zeroBased + 1, 0, 23, 59, 59, 999);
  return { start, end, label: month };
}

export function currentMonthLabel(reference = new Date()): string {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}
