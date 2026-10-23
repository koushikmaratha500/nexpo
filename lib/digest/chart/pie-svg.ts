import type { MonthlyDigestExpenseLine } from '../types';

const COLORS = ['#6d28d9', '#a78bfa', '#f6ad55', '#0e9f6e', '#cbd5e1', '#f472b6', '#38bdf8', '#94a3b8'];

export function buildExpensePieSvg(expenses: MonthlyDigestExpenseLine[], size = 200): string {
  if (expenses.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="#e5e7eb"/></svg>`;
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  if (total <= 0) {
    return buildExpensePieSvg([], size);
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  let angle = -Math.PI / 2;
  const slices: string[] = [];

  expenses.forEach((exp, i) => {
    const slice = (exp.amount / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += slice;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = slice > Math.PI ? 1 : 0;
    const color = COLORS[i % COLORS.length];
    slices.push(
      `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}"/>`,
    );
  });

  const inner = r * 0.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Expense breakdown">${slices.join('')}<circle cx="${cx}" cy="${cy}" r="${inner}" fill="#ffffff"/></svg>`;
}

export function pieSvgToDataUri(svg: string): string {
  const encoded = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
