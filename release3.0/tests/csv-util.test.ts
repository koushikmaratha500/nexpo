import { describe, it, expect } from 'vitest';
import { parseCsv, buildCsv, csvEscape } from '@/lib/api/utils/csv';

describe('csv utils', () => {
  it('parses simple rows and preserves the trailing cell', () => {
    expect(parseCsv('A,B\nX,Y')).toEqual([
      { lineNumber: 1, cells: ['A', 'B'] },
      { lineNumber: 2, cells: ['X', 'Y'] },
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('A,B\n"x,y",z');
    expect(rows[0].cells).toEqual(['A', 'B']);
    expect(rows[1].cells).toEqual(['x,y', 'z']);
  });

  it('handles quoted fields spanning multiple lines', () => {
    const rows = parseCsv('A\n"line1\nline2",val\n');
    expect(rows).toEqual([
      { lineNumber: 1, cells: ['A'] },
      { lineNumber: 2, cells: ['line1\nline2', 'val'] },
    ]);
  });

  it('ignores blank separator and reference section after it', () => {
    const content = 'Type,Title\nDEBIT,Coffee\n\n# REFERENCE\n# Valid Categories: FOOD\n';
    const rows = parseCsv(content);
    expect(rows.length).toBe(2);
    expect(rows[1].cells).toEqual(['DEBIT', 'Coffee']);
  });

  it('escapes and serializes cells', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('has,comma')).toBe('"has,comma"');
    expect(csvEscape('has "quotes"')).toBe('"has ""quotes"""');
    expect(buildCsv([['a', 'b,c'], ['d', 'e']])).toBe('a,"b,c"\nd,e');
  });
});