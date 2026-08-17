import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { parseCsv, buildCsv } from '../utils/csv';
import { MetaRepository } from '../repositories/meta.repository';
import { TransactionRepository } from '../repositories/transaction.repository';

dayjs.extend(customParseFormat);

export const IMPORT_COLUMNS = [
  'Type',
  'Title',
  'Merchant',
  'Category',
  'Amount',
  'Date',
  'Currency',
  'Payment Type',
  'Notes',
  'Recurring',
] as const;

const MAX_IMPORT_ROWS = 200;

export interface ImportCellError {
  column: string;
  message: string;
}

export interface ImportRowResult {
  lineNumber: number;
  rowIndex: number;
  data: Record<string, unknown>;
  errors: ImportCellError[];
  warnings: ImportCellError[];
}

export interface ImportSummary {
  fileError: string | null;
  totalRows: number;
  validRows: number;
  errorRows: number;
  totalErrors: number;
  totalWarnings: number;
  valid: boolean;
}

interface ImportPreview {
  rows: ImportRowResult[];
  summary: ImportSummary;
  categories: string[];
  paymentTypes: string[];
  currencies: string[];
}

function stripBom(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) return content.slice(1);
  return content;
}

function toDateCell(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY'];
  for (const f of formats) {
    const parsed = dayjs(v, f, true);
    if (parsed.isValid()) return parsed.toDate();
  }
  const parsed = dayjs(v);
  return parsed.isValid() ? parsed.toDate() : null;
}

function parseRecurring(value: string): boolean | null {
  const v = value.trim().toUpperCase();
  if (!v) return false;
  if (['TRUE', 'T', 'YES', 'Y', '1'].includes(v)) return true;
  if (['FALSE', 'F', 'NO', 'N', '0'].includes(v)) return false;
  return null;
}

function parseAmount(value: string): { ok: boolean; value: number; reason?: string } {
  const v = value.trim().replace(/,/g, '');
  if (!v) return { ok: false, value: 0, reason: 'Amount is required' };
  const amount = Number(v);
  if (!Number.isFinite(amount)) return { ok: false, value: 0, reason: 'Amount must be a valid number' };
  if (amount <= 0) return { ok: false, value: 0, reason: 'Amount must be greater than zero' };
  return { ok: true, value: amount };
}

export class ImportService {
  /**
   * Builds the sample CSV at runtime from the database so categories and payment
   * types carry their exact system text. A reference section is appended at the
   * bottom (ignored by the parser) for copy/paste accuracy.
   */
  static async buildTemplateFile(): Promise<{ fileName: string; content: string; categories: string[]; paymentTypes: string[]; currencies: string[] }> {
    const [categories, paymentTypes, currencies] = await Promise.all([
      MetaRepository.getActiveCategories(),
      MetaRepository.getActivePaymentTypes(),
      MetaRepository.getActiveCurrencies(),
    ]);
    const categoryNames = categories.map((c) => c.name);
    const paymentTypeNames = paymentTypes.map((p) => p.name);
    const currencyCodes = currencies.map((c) => c.code);

    const header: string[] = [...IMPORT_COLUMNS];
    const exampleRows: (string | number | boolean | null)[][] = [
      ['DEBIT', 'Grocery shopping', 'Whole Foods', categoryNames[0] || 'FOOD', 1250.5, '2025-01-15', currencyCodes[0] || 'INR', paymentTypeNames[0] || 'Credit Card', 'Monthly groceries', 'FALSE'],
      ['CREDIT', 'Salary credit', '', categoryNames[1] || categoryNames[0] || 'Salary', 75000, '2025-01-01', currencyCodes[0] || 'INR', '', 'January salary', 'FALSE'],
      ['DEBIT', 'Monthly rent', 'Landlord', categoryNames[1] || categoryNames[0] || 'RENT', 18000, '2025-01-01', currencyCodes[0] || 'INR', paymentTypeNames[1] || paymentTypeNames[0] || 'Credit Card', 'Recurring rent', 'TRUE'],
    ];

    const dataRows = [header.map((h) => h), ...exampleRows];

    const referenceSection = [
      '',
      '# --------------------------------------------------------------------',
      '# REFERENCE - enter Category & Payment Type text EXACTLY as listed below',
      '# --------------------------------------------------------------------',
      `# Valid Categories: ${categoryNames.join(', ')}`,
      `# Valid Payment Types: ${paymentTypeNames.join(', ')}`,
      `# Valid Currencies: ${currencyCodes.join(', ')}`,
      '#',
      '# Columns: Type(DEBIT/CREDIT), Title, Merchant, Category, Amount, Date(YYYY-MM-DD),',
      '#          Currency, Payment Type, Notes, Recurring(optional TRUE/FALSE)',
      '# When Recurring=TRUE the recurring day is derived from the Date column.',
    ];

    const content = buildCsv(dataRows) + '\n' + referenceSection.join('\n') + '\n';

    return { fileName: 'transactions-import-template.csv', content, categories: categoryNames, paymentTypes: paymentTypeNames, currencies: currencyCodes };
  }

  /** Validates an uploaded CSV against the database metadata and returns a preview. */
  static async validateCsv(content: string): Promise<ImportPreview> {
    const fileError = validateFileLevel(content);
    if (fileError) {
      return {
        rows: [],
        summary: { fileError, totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0, totalWarnings: 0, valid: false },
        categories: [],
        paymentTypes: [],
        currencies: [],
      };
    }

    const [categories, paymentTypes, currencies] = await Promise.all([
      MetaRepository.getActiveCategories(),
      MetaRepository.getActivePaymentTypes(),
      MetaRepository.getActiveCurrencies(),
    ]);

    const categoriesSet = new Set(categories.map((c) => c.name));
    const paymentTypesSet = new Set(paymentTypes.map((p) => p.name));
    const currenciesSet = new Set(currencies.map((c) => c.code.toUpperCase()));

    const parsed = parseCsv(stripBom(content));
    if (parsed.length === 0) {
      return {
        rows: [],
        summary: { fileError: 'The uploaded file is empty', totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0, totalWarnings: 0, valid: false },
        categories: [],
        paymentTypes: [],
        currencies: [],
      };
    }

    let headerError: string | null = null;
    const firstRow = parsed[0];
    for (let i = 0; i < IMPORT_COLUMNS.length; i += 1) {
      const expected = IMPORT_COLUMNS[i];
      const actual = firstRow.cells[i]?.trim() ?? '';
      if (actual.toLowerCase() !== expected.toLowerCase()) {
        headerError = `Invalid header. Expecting column #${i + 1} to be "${expected}" but found "${actual || 'empty'}". Download the sample template if needed.`;
        break;
      }
    }

    if (headerError) {
      return {
        rows: [],
        summary: { fileError: headerError, totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0, totalWarnings: 0, valid: false },
        categories: categoryNames(categories),
        paymentTypes: paymentTypeNames(paymentTypes),
        currencies: currencyNames(currencies),
      };
    }

    const dataRows = parsed.slice(1);
    if (dataRows.length === 0) {
      return {
        rows: [],
        summary: { fileError: 'No data rows found in the CSV', totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0, totalWarnings: 0, valid: false },
        categories: categoryNames(categories),
        paymentTypes: paymentTypeNames(paymentTypes),
        currencies: currencyNames(currencies),
      };
    }
    if (dataRows.length > MAX_IMPORT_ROWS) {
      return {
        rows: [],
        summary: { fileError: `The file contains ${dataRows.length} rows but the maximum allowed is ${MAX_IMPORT_ROWS}`, totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0, totalWarnings: 0, valid: false },
        categories: categoryNames(categories),
        paymentTypes: paymentTypeNames(paymentTypes),
        currencies: currencyNames(currencies),
      };
    }

    const rows: ImportRowResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    dataRows.forEach((row, idx) => {
      const cells = row.cells;
      const errors: ImportCellError[] = [];
      const warnings: ImportCellError[] = [];
      const get = (i: number) => (cells[i] ?? '').trim();

      const type = get(0).toUpperCase();
      const title = get(1);
      const merchant = get(2);
      const category = get(3);
      const amountStr = get(4);
      const dateStr = get(5);
      const currency = get(6).toUpperCase();
      const paymentType = get(7);
      const notes = get(8);
      const recurringRaw = get(9);

      const data: Record<string, unknown> = {
        type,
        title,
        merchant,
        category,
        amountStr,
        dateStr,
        currency,
        paymentType,
        notes,
        recurringRaw,
      };

      // Type
      if (!type) {
        errors.push({ column: 'Type', message: 'Type is required (DEBIT or CREDIT)' });
      } else if (type !== 'DEBIT' && type !== 'CREDIT') {
        errors.push({ column: 'Type', message: 'Type must be either DEBIT or CREDIT' });
      }
      data.type = type;

      // Title / Merchant
      if (!title && !merchant) {
        errors.push({ column: 'Title', message: 'Either Title or Merchant is required' });
      }
      if (title && title.length > 100) errors.push({ column: 'Title', message: 'Title must be at most 100 characters' });
      if (merchant && merchant.length > 100) errors.push({ column: 'Merchant', message: 'Merchant must be at most 100 characters' });

      // Category - exact text must exist in the database
      if (!category) {
        errors.push({ column: 'Category', message: 'Category is required' });
      } else if (!categoriesSet.has(category)) {
        errors.push({
          column: 'Category',
          message: `Category "${category}" does not exist. Use the exact text from the reference list (e.g. ${suggestNames(category, [...categoriesSet])}).`,
        });
      }

      // Amount
      const parsedAmount = parseAmount(amountStr);
      if (!parsedAmount.ok) {
        errors.push({ column: 'Amount', message: parsedAmount.reason || 'Invalid amount' });
      } else {
        const decimals = get(4).replace(/,/g, '').split('.')[1] ?? '';
        if (decimals.length > 2) {
          warnings.push({ column: 'Amount', message: 'Amount has more than 2 decimal places and will be rounded' });
        }
      }
      data.amount = parsedAmount.ok ? parsedAmount.value : amountStr;

      // Date
      const parsedDate = toDateCell(dateStr);
      if (!parsedDate) {
        errors.push({ column: 'Date', message: 'Date is required and must be a valid date (YYYY-MM-DD or DD-MM-YYYY)' });
      } else {
        if (new Date(parsedDate).setHours(0, 0, 0, 0) > today.getTime()) {
          warnings.push({ column: 'Date', message: 'Date is in the future' });
        }
      }
      data.date = parsedDate ? dayjs(parsedDate).format('YYYY-MM-DD') : dateStr;

      // Currency
      if (!currency) {
        errors.push({ column: 'Currency', message: 'Currency is required (e.g. INR, USD)' });
      } else if (!currenciesSet.has(currency)) {
        errors.push({ column: 'Currency', message: `Currency "${currency}" is not supported. Use a valid 3-letter code (e.g. ${suggestNames(currency, [...currenciesSet])}).` });
      }

      // Payment Type
      const effectivePaymentType = paymentType;
      if (type === 'DEBIT' && !effectivePaymentType) {
        errors.push({ column: 'Payment Type', message: 'Payment Type is required for DEBIT transactions' });
      } else if (effectivePaymentType && !paymentTypesSet.has(effectivePaymentType)) {
        errors.push({
          column: 'Payment Type',
          message: `Payment Type "${effectivePaymentType}" does not exist. Use the exact text from the reference list (e.g. ${suggestNames(effectivePaymentType, [...paymentTypesSet])}).`,
        });
      }
      data.paymentType = effectivePaymentType || null;

      // Notes
      if (notes && notes.length > 1000) errors.push({ column: 'Notes', message: 'Notes must be at most 1000 characters' });

      // Recurring
      const recurring = parseRecurring(recurringRaw);
      if (recurring === null) {
        errors.push({ column: 'Recurring', message: 'Recurring must be TRUE or FALSE when provided' });
      } else {
        data.isRecurring = recurring;
        if (recurring && parsedDate) {
          data.recurringDay = parsedDate.getDate();
        }
      }

      totalErrors += errors.length;
      totalWarnings += warnings.length;

      rows.push({ lineNumber: row.lineNumber, rowIndex: idx, data, errors, warnings });
    });

    const errorRows = rows.filter((r) => r.errors.length > 0).length;
    const valid = totalErrors === 0 && totalWarnings === 0 && fileError === null;

    return {
      rows,
      summary: {
        fileError: null,
        totalRows: rows.length,
        validRows: rows.length - errorRows,
        errorRows,
        totalErrors,
        totalWarnings,
        valid,
      },
      categories: categoryNames(categories),
      paymentTypes: paymentTypeNames(paymentTypes),
      currencies: currencyNames(currencies),
    };
  }

  /** Creates transactions from validated import rows in one atomic batch. */
  static async importRows(
    userId: string,
    rows: Array<{
      type: 'DEBIT' | 'CREDIT';
      title: string;
      merchant?: string;
      category: string;
      amount: number;
      date: Date | string;
      currency: string;
      paymentType?: string;
      notes?: string;
      isRecurring?: boolean;
      recurringDay?: number;
    }>,
    meta: { ip?: string; ua?: string } = {}
  ) {
    if (!rows.length) throw new Error('No rows to import');

    const [categories, paymentTypes, currencies] = await Promise.all([
      MetaRepository.getActiveCategories(),
      MetaRepository.getActivePaymentTypes(),
      MetaRepository.getActiveCurrencies(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
    const paymentTypeMap = new Map(paymentTypes.map((p) => [p.name, p.id]));
    const currencyMap = new Map(currencies.map((c) => [c.code.toUpperCase(), c.id]));

    const payloads: Array<{ data: Parameters<typeof TransactionRepository.bulkCreateTransactions>[1][number]['data']; meta: { ip?: string; ua?: string } }> = [];

    for (const row of rows) {
      const categoryId = categoryMap.get(row.category);
      const currencyId = currencyMap.get(row.currency.toUpperCase());
      const paymentTypeId = row.paymentType ? paymentTypeMap.get(row.paymentType) : undefined;
      const isCredit = row.type === 'CREDIT';

      if (!categoryId || !currencyId || (isCredit ? false : !paymentTypeId)) {
        throw new Error('Import rows must reference existing categories, currencies and payment types');
      }

      const titleVal = row.title || row.merchant || 'Imported Transaction';

      payloads.push({
        data: {
          userId,
          type: row.type,
          categoryId,
          currencyId,
          paymentTypeId: isCredit ? null : paymentTypeId || null,
          title: titleVal,
          description: row.merchant || null,
          amount: row.amount,
          transactionDate: new Date(row.date),
          notes: row.notes || null,
          merchant: row.merchant || null,
          status: 'A',
          isRecurring: row.isRecurring ?? false,
          recurringDay: row.isRecurring ? row.recurringDay ?? null : null,
        },
        meta,
      });
    }

    const created = await TransactionRepository.bulkCreateTransactions(
      userId,
      payloads.map((p) => ({ data: p.data, meta: p.meta }))
    );

    return { created, count: created.length };
  }
}

function validateFileLevel(content: string): string | null {
  const text = stripBom(content).trim();
  if (!text) return 'The uploaded file is empty';
  return null;
}

function categoryNames(categories: { name: string }[]): string[] {
  return categories.map((c) => c.name);
}

function paymentTypeNames(paymentTypes: { name: string }[]): string[] {
  return paymentTypes.map((p) => p.name);
}

function currencyNames(currencies: { code: string }[]): string[] {
  return currencies.map((c) => c.code);
}

function suggestNames(value: string, all: string[]): string {
  const suggestions = all.filter((name) => name.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(name.toLowerCase()));
  if (suggestions.length === 0) return 'check the reference list';
  return suggestions.slice(0, 3).join(', ');
}