'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export interface ReportFiltersProps {
  startDate?: string;
  endDate?: string;
  type?: 'DEBIT' | 'CREDIT';
  onFilterChange: (filters: {
    startDate: string;
    endDate: string;
    type: string;
  }) => void;
}

export function ReportFilters({
  startDate,
  endDate,
  type,
  onFilterChange,
}: ReportFiltersProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      startDate: e.target.value,
      endDate: endDate || '',
      type: type || '',
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      startDate: startDate || '',
      endDate: e.target.value,
      type: type || '',
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      startDate: startDate || '',
      endDate: endDate || '',
      type: e.target.value,
    });
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-label-sm text-on-surface-variant mb-1 block">From</label>
          <input
            type="date"
            value={startDate || ''}
            onChange={handleStartDateChange}
            className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-label-sm text-on-surface-variant mb-1 block">To</label>
          <input
            type="date"
            value={endDate || ''}
            onChange={handleEndDateChange}
            className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-label-sm text-on-surface-variant mb-1 block">Type</label>
          <select
            value={type || ''}
            onChange={handleTypeChange}
            className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">All</option>
            <option value="DEBIT">Expense</option>
            <option value="CREDIT">Income</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
