/**
 * Minimal RFC-4180 CSV parser / serializer.
 *
 * Supports quoted fields, escaped quotes ("") and fields spanning commas
 * or newlines. Kept server-side only (runs in engine/node contexts).
 */

export interface CsvRowParse {
  /** 1-based physical line number where the row started */
  lineNumber: number;
  /** Raw parsed cells */
  cells: string[];
}

/** Returns the cells of a single logical line, plus whether the field is still open. */
function scanLine(
  line: string,
  startInQuotes: boolean,
  cells: string[],
  initialBuffer: string
): { buffer: string; inQuotes: boolean } {
  let buffer = initialBuffer;
  let inQuotes = startInQuotes;

  for (let j = 0; j < line.length; j += 1) {
    const ch = line[j];

    if (inQuotes) {
      if (ch === '"') {
        if (line[j + 1] === '"') {
          buffer += '"';
          j += 1;
        } else {
          inQuotes = false;
        }
      } else {
        buffer += ch;
      }
      continue;
    }

    if (ch === '"' && buffer === '') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      cells.push(buffer);
      buffer = '';
      continue;
    }

    buffer += ch;
  }

  return { buffer, inQuotes };
}

/**
 * Parses CSV content into rows. Blank lines, comment lines (starting with `#`)
 * and trailing content after a blank line are ignored so the generated template
 * can carry a "valid values" reference section at the bottom.
 */
export function parseCsv(content: string): CsvRowParse[] {
  const rows: CsvRowParse[] = [];
  const lines = content.split(/\r\n|\n|\r/);

  // Assemble logical lines first (handling quoted multi-line fields)
  const logical: { startLine: number; text: string }[] = [];
  let open = false;
  let pending: { startLine: number; text: string } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!open && line.trim() === '') {
      // Blank separator => everything after is a reference section
      break;
    }

    if (!open && line.trimStart().startsWith('#')) {
      continue;
    }

    if (!open) {
      pending = { startLine: i + 1, text: line };
    } else if (pending) {
      pending.text += `\n${line}`;
    }

    if (!pending) continue;

    // Count unescaped quotes to detect whether the field is still open
    let quoteCount = 0;
    let inQ = false;
    let k = 0;
    while (k < pending.text.length) {
      const ch = pending.text[k];
      if (ch === '"') {
        if (inQ && pending.text[k + 1] === '"') {
          k += 2;
          continue;
        }
        inQ = !inQ;
        quoteCount += 1;
      }
      k += 1;
    }
    open = quoteCount % 2 === 1;

    if (!open) {
      logical.push(pending);
      pending = null;
    }
  }
  if (pending) logical.push(pending);

  for (const entry of logical) {
    const cells: string[] = [];
    const { buffer, inQuotes } = scanLine(entry.text, false, cells, '');
    if (!inQuotes) cells.push(buffer);
    rows.push({ lineNumber: entry.startLine, cells });
  }

  return rows;
}

/** Serializes a cell for CSV output (wraps in quotes when needed). */
export function csvEscape(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializes rows (array of cell arrays) into a CSV string. */
export function buildCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}