import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const pageRange = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageRange.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-lg py-md border-t border-outline-variant/40 bg-surface-container-lowest gap-4">
      <span className="font-label-md text-label-md text-on-surface-variant font-medium text-center sm:text-left">
        Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
      </span>
      <div className="flex items-center gap-sm">
        {currentPage > 1 && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
          >
            Back
          </button>
        )}
        {pageRange.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              currentPage === p
                ? 'bg-primary text-on-primary shadow-sm active:scale-90'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {p}
          </button>
        ))}
        {currentPage < totalPages && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
