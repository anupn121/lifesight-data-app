"use client";

import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }: PaginationProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-[#0f0f10] flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-[#6a7282] text-xs">Show per page</span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="bg-[#1f1f21] border border-[#333] rounded px-2 py-1 flex items-center gap-1.5 text-[#d1d5dc] text-xs hover:border-[#475467] transition-colors"
          >
            {itemsPerPage}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-1 bg-[#1f1f21] border border-[#333] rounded shadow-lg z-10 min-w-[60px]">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onItemsPerPageChange?.(size);
                    setShowDropdown(false);
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    size === itemsPerPage
                      ? "text-[#6941c6] bg-[#6941c6]/10"
                      : "text-[#d1d5dc] hover:bg-white/5"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[#6a7282] text-xs">
          {start}-{end} of {totalItems.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M6 2L2 6L6 10" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M2 2L6 6L2 10" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
