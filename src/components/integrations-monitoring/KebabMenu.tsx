"use client";

import { useRef, useEffect } from "react";

export default function KebabMenu({
  open,
  onToggle,
  onConfigure,
  onStatus,
  onDelete,
  onReportIssue,
}: {
  open: boolean;
  onToggle: () => void;
  onConfigure: () => void;
  onStatus: () => void;
  onDelete: () => void;
  onReportIssue: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="p-1.5 rounded-lg hover:bg-[var(--hover-item)] transition-colors text-[var(--text-muted)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg shadow-xl z-50 min-w-[180px] py-1">
          <button
            onClick={(e) => { e.stopPropagation(); onConfigure(); }}
            className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)]">
              <path d="M7 9a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M11.4 8.6a1.1 1.1 0 00.2 1.2l.04.04a1.33 1.33 0 11-1.88 1.88l-.04-.04a1.1 1.1 0 00-1.2-.2 1.1 1.1 0 00-.67 1.01v.12a1.33 1.33 0 11-2.67 0v-.06a1.1 1.1 0 00-.72-1.01 1.1 1.1 0 00-1.2.2l-.04.04a1.33 1.33 0 11-1.88-1.88l.04-.04a1.1 1.1 0 00.2-1.2 1.1 1.1 0 00-1.01-.67h-.12a1.33 1.33 0 110-2.67h.06a1.1 1.1 0 001.01-.72 1.1 1.1 0 00-.2-1.2l-.04-.04A1.33 1.33 0 113.15 1.4l.04.04a1.1 1.1 0 001.2.2h.05a1.1 1.1 0 00.67-1.01V.52a1.33 1.33 0 012.67 0v.06a1.1 1.1 0 00.67 1.01 1.1 1.1 0 001.2-.2l.04-.04a1.33 1.33 0 011.88 1.88l-.04.04a1.1 1.1 0 00-.2 1.2v.05a1.1 1.1 0 001.01.67h.12a1.33 1.33 0 110 2.67h-.06a1.1 1.1 0 00-1.01.67z" stroke="currentColor" strokeWidth="1" />
            </svg>
            Configure
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStatus(); }}
            className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)]">
              <path d="M7 13A6 6 0 107 1a6 6 0 000 12z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Status
          </button>
          <div className="border-t border-[var(--border-subtle)] my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full text-left px-3 py-2 text-sm text-[#ff2056] hover:bg-[#ff2056]/5 transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#ff2056]">
              <path d="M1.75 3.5h10.5M4.67 3.5V2.33a1.17 1.17 0 011.16-1.16h2.34a1.17 1.17 0 011.16 1.16V3.5m1.75 0v8.17a1.17 1.17 0 01-1.16 1.16H4.08a1.17 1.17 0 01-1.16-1.16V3.5h8.16z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Delete
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReportIssue(); }}
            className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)]">
              <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Report Data Issue
          </button>
        </div>
      )}
    </div>
  );
}
