import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Pagination } from '../../types';

export interface PaginationProps {
  pagination: Pagination;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  limitOptions?: number[];
  className?: string;
}

export const PaginationControl: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 15, 25, 50],
  className = '',
}) => {
  const { page, totalPages, total, limit } = pagination;

  // If there are no records, do not show pagination
  if (total === 0) return null;

  const safeTotalPages = Math.max(1, totalPages || 1);
  const startRecord = Math.min((page - 1) * limit + 1, total);
  const endRecord = Math.min(page * limit, total);

  // Generate visible page numbers for pagination pills
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(safeTotalPages - 1, page + 1);

      if (page <= 2) {
        end = 3;
      } else if (page >= safeTotalPages - 1) {
        start = safeTotalPages - 2;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < safeTotalPages - 1) {
        pages.push('...');
      }

      // Always include last page
      pages.push(safeTotalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 ${className}`}
    >
      {/* Left side: Results Count info */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{startRecord}</span> to{' '}
          <span className="font-semibold text-slate-900">{endRecord}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span> results
        </div>

        {/* Rows per page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-500 text-[11px] font-medium">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons & page pills */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 select-none">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p as number)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-[28px] h-7 px-2 text-xs font-medium rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={page >= safeTotalPages}
          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] text-slate-500 font-medium pl-2 hidden md:inline">
          Page <span className="text-slate-800 font-semibold">{page}</span> of{' '}
          <span className="text-slate-800 font-semibold">{safeTotalPages}</span>
        </span>
      </div>
    </div>
  );
};
