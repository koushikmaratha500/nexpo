import { describe, expect, it } from 'vitest';
import { buildExpensePieSvg } from '@/lib/digest/chart/pie-svg';

describe('buildExpensePieSvg', () => {
  it('renders empty state without slices', () => {
    const svg = buildExpensePieSvg([]);
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('<path');
  });

  it('renders a path per category', () => {
    const svg = buildExpensePieSvg([
      { categoryId: '1', categoryName: 'Food', amount: 50, percentage: 50 },
      { categoryId: '2', categoryName: 'Rent', amount: 50, percentage: 50 },
    ]);
    expect(svg.match(/<path/g)?.length).toBe(2);
  });
});
