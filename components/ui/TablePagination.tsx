import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (n: number) => void;
  itemsPerPageOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const pageRange: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageRange.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-lg py-md border-t border-outline-variant/40 bg-surface-container-lowest gap-4">
      {/* Left: Items per page selector or showing text */}
      <div className="flex items-center gap-2">
        {onItemsPerPageChange ? (
          <>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value, 10))}
              className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">entries</span>
          </>
        ) : (
          <span className="font-label-md text-label-md text-on-surface-variant font-medium text-center sm:text-left">
            Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
          </span>
        )}
      </div>

      {/* Right: Page navigation - only show when more than 1 page */}
      {totalItems > itemsPerPage && (
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
          {pageRange.map((p) => (
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
      )}
    </div>
  );
}