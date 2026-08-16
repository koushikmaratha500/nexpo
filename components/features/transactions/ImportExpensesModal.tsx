'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useToast } from '@/hooks/useToast';

const PREVIEW_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'currency', label: 'Currency' },
  { key: 'paymentType', label: 'Payment Type' },
  { key: 'notes', label: 'Notes' },
  { key: 'isRecurring', label: 'Recurring' },
];

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

export interface ImportExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

function displayCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportExpensesModal({ isOpen, onClose, onImported }: ImportExpensesModalProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{
    rows: ImportRowResult[];
    summary: ImportSummary;
    categories: string[];
    paymentTypes: string[];
    currencies: string[];
  } | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setPreview(null);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreview(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get<{ fileName: string; content: string }>('/api/user/transactions/import/template');
      const { fileName, content } = res.data;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Sample template downloaded', 'success');
    } catch {
      addToast('Failed to download the sample template', 'error');
    }
  };

  const handleValidate = async () => {
    if (!file) {
      addToast('Please choose a CSV file first', 'warning');
      return;
    }
    setValidating(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/user/transactions/import/validate', fd);
      setPreview(res.data);
      if (res.data.summary?.fileError) {
        addToast(res.data.summary.fileError, 'error');
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Failed to validate the CSV file';
      addToast(message, 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !preview.summary.valid) return;
    setImporting(true);
    try {
      const rows = preview.rows.map((r) => ({
        type: r.data.type,
        title: r.data.title || '',
        merchant: r.data.merchant || '',
        category: r.data.category || '',
        amount: Number(r.data.amount),
        transactionDate: r.data.date,
        currency: r.data.currency || 'INR',
        paymentType: r.data.paymentType ? String(r.data.paymentType) : undefined,
        notes: r.data.notes ? String(r.data.notes) : undefined,
        isRecurring: Boolean(r.data.isRecurring),
        recurringDay: r.data.recurringDay ? Number(r.data.recurringDay) : undefined,
      }));
      const res = await axios.post('/api/user/transactions/import', { rows });
      const count = res.data?.imported ?? rows.length;
      addToast(`Successfully imported ${count} transaction(s)`, 'success');
      onImported(count);
      onClose();
      setFile(null);
      setPreview(null);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Failed to import transactions';
      addToast(message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setPreview(null);
    setValidating(false);
    setImporting(false);
    onClose();
  };

  const summary = preview?.summary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import transactions from CSV"
      subtitle="Bulk upload last year's expenses into your ledger"
      maxWidth="max-w-5xl"
      dismissible={false}
      headerIcon={
        <span className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
        </span>
      }
    >
      {/* Step 1: Upload */}
      {!preview && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">description</span>
              <span className="font-body-md text-body-md text-on-surface">
                Start from the sample template to get the exact Column names and valid Category/Payment Type values.
              </span>
            </div>
            <Button type="button" variant="secondary" onClick={handleDownloadTemplate} className="shrink-0">
              <span className="material-symbols-outlined text-sm">download</span>
              Download sample CSV
            </Button>
          </div>

          <div>
            {file && (
              <div className="flex items-center justify-between gap-3 mb-3 px-4 py-3 rounded-lg border border-primary/30 bg-primary-fixed/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0">upload_file</span>
                  <div className="min-w-0">
                    <span className="text-body-md text-on-surface truncate font-medium block">{file.name}</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
                  title="Remove file"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 select-none ${
                isDragging
                  ? 'border-tertiary bg-tertiary-container/10'
                  : 'border-outline-variant bg-surface-container-low hover:border-tertiary/50 hover:bg-surface-container'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInput}
                className="sr-only"
              />
              <span className={`material-symbols-outlined text-[32px] ${isDragging ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                cloud_upload
              </span>
              <span className="font-body-md text-body-md text-on-surface font-medium">
                Drag & drop or <span className="text-tertiary font-semibold">browse</span> a CSV file
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">CSV only · Max 200 rows</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              Close
            </Button>
            <Button type="button" variant="tertiary" onClick={handleValidate} disabled={validating || !file}>
              <span className="material-symbols-outlined text-sm">fact_check</span>
              {validating ? 'Validating...' : 'Upload & Validate'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
              <p className="font-headline-sm text-headline-sm font-bold text-primary">{summary?.totalRows ?? 0}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Total rows</p>
            </div>
            <div className="px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
              <p className="font-headline-sm text-headline-sm font-bold text-secondary">{summary?.validRows ?? 0}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Valid rows</p>
            </div>
            <div className="px-4 py-3 rounded-lg border border-error/30 bg-error-container/10">
              <p className="font-headline-sm text-headline-sm font-bold text-error">{summary?.totalErrors ?? 0}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Errors</p>
            </div>
            <div className="px-4 py-3 rounded-lg border border-tertiary/40 bg-tertiary-container/10">
              <p className="font-headline-sm text-headline-sm font-bold text-tertiary">{summary?.totalWarnings ?? 0}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Warnings</p>
            </div>
          </div>

          {summary?.fileError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-error/40 bg-error-container/15 text-error">
              <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
              <p className="text-sm font-semibold">{summary.fileError}</p>
            </div>
          )}

          {/* Reference panel */}
          {preview.categories.length > 0 && (
            <div className="px-4 py-3 rounded-lg border border-tertiary/30 bg-tertiary-container/10">
              <p className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary">info</span>
                Valid values — enter Category & Payment Type EXACTLY as listed
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant">
                <span className="min-w-0">
                  <span className="font-semibold text-tertiary">Categories:</span> {preview.categories.join(', ')}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold text-tertiary">Payment Types:</span> {preview.paymentTypes.join(', ')}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold text-tertiary">Currencies:</span> {preview.currencies.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Preview table */}
          <div className="flex items-center justify-between">
            <p className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
              Preview · errors highlighted in red, warnings in amber
            </p>
            <Button type="button" variant="secondary" onClick={() => setPreview(null)} className="shrink-0">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Choose another file
            </Button>
          </div>

          <div className="w-full overflow-x-auto border border-outline-variant rounded-lg max-h-[45vh] overflow-y-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  {PREVIEW_COLUMNS.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => {
                  const rowErrors = row.errors.length > 0;
                  const rowWarnings = !rowErrors && row.warnings.length > 0;
                  return (
                    <TableRow key={row.lineNumber}>
                      <TableCell className={`${rowErrors ? 'bg-error-container/10' : rowWarnings ? 'bg-tertiary-container/10' : ''} font-mono-data text-[10px] text-on-surface-variant`}>
                        {row.lineNumber}
                      </TableCell>
                      {PREVIEW_COLUMNS.map((col) => {
                        const colErrors = row.errors.filter((err) => err.column === col.label);
                        const colWarnings = row.warnings.filter((err) => err.column === col.label);
                        const cellValue = displayCell(row.data[col.key]);
                        if (colErrors.length > 0) {
                          return (
                            <TableCell key={col.key} className="bg-error-container/20">
                              <span
                                className="inline-block w-full border-b-2 border-b-error text-error font-semibold"
                                title={colErrors.map((err) => err.message).join('; ')}
                              >
                                {cellValue || <em className="italic text-error/70">missing</em>}
                              </span>
                            </TableCell>
                          );
                        }
                        if (colWarnings.length > 0) {
                          return (
                            <TableCell key={col.key} className="bg-tertiary-container/15">
                              <span
                                className="inline-block w-full border-b-2 border-b-tertiary text-tertiary"
                                title={colWarnings.map((err) => err.message).join('; ')}
                              >
                                {cellValue || '—'}
                              </span>
                            </TableCell>
                          );
                        }
                        return <TableCell key={col.key}>{cellValue || '—'}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}
                {preview.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={PREVIEW_COLUMNS.length + 1} className="text-center py-8 text-on-surface-variant italic">
                      No rows to preview.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!summary?.valid && summary && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-tertiary/40 bg-tertiary-container/10 text-tertiary">
              <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
              <p className="text-sm font-semibold">
                Fix all errors{warningsText(summary)} before importing. The Import button stays disabled until the file is valid.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleImport} disabled={importing || !summary?.valid}>
              <span className="material-symbols-outlined text-sm">playlist_add</span>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function warningsText(summary: ImportSummary): string {
  return summary.totalWarnings > 0 ? ' and warnings' : '';
}