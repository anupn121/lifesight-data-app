"use client";

import { useMemo, useState } from "react";
import type { DataModel } from "./dataModelsData";
import type { Field } from "./fieldsData";
import { generateMockDataset } from "./mockDataGenerator";

interface DataPreviewViewProps {
  model: DataModel;
  fields: Field[];
  onBack: () => void;
}

function formatValue(value: string | number | null, type: string): string {
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (type === "currency") return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (type === "integer") return Math.round(value).toLocaleString("en-US");
  if (type === "decimal") return value.toFixed(2);
  return String(value);
}

const ROWS_PER_PAGE = 50;

export default function DataPreviewView({ model, fields, onBack }: DataPreviewViewProps) {
  const dataset = useMemo(() => generateMockDataset(model, fields), [model.id]);

  const [currentPage, setCurrentPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => new Set(dataset.columns));
  const [searchQuery, setSearchQuery] = useState("");
  const [showColumnFilter, setShowColumnFilter] = useState(false);

  // Filter rows by search query across visible columns
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return dataset.rows;
    const q = searchQuery.toLowerCase();
    return dataset.rows.filter((row) =>
      row.some((cell, ci) => {
        if (!visibleColumns.has(dataset.columns[ci])) return false;
        if (cell === null) return false;
        return String(cell).toLowerCase().includes(q);
      })
    );
  }, [dataset, searchQuery, visibleColumns]);

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const pagedRows = filteredRows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  const visibleColIndices = dataset.columns.map((col, i) => ({ col, i })).filter(({ col }) => visibleColumns.has(col));

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        if (next.size > 1) next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const typeBadgeColor: Record<string, string> = {
    date: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    string: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    currency: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    integer: "bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20",
    decimal: "bg-[#ec4899]/10 text-[#f472b6] border-[#ec4899]/20",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg hover:bg-[var(--hover-item)] flex items-center justify-center transition-colors"
            title="Back to Models"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h2 className="text-[var(--text-primary)] text-lg font-semibold">Data Preview</h2>
            <p className="text-[var(--text-muted)] text-sm">
              {model.name} &middot; {model.granularity} &middot; {dataset.rows.length} rows &middot; {dataset.columns.length} columns
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search rows..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[#6941c6]/50"
          />
        </div>

        {/* Column filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowColumnFilter(!showColumnFilter)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm text-[var(--text-muted)] hover:border-[var(--border-secondary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.75 3.5H12.25M3.5 7H10.5M5.25 10.5H8.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Columns ({visibleColumns.size}/{dataset.columns.length})
          </button>
          {showColumnFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumnFilter(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl py-2 w-64 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-[var(--border-primary)] mb-1">
                  <span className="text-xs font-medium text-[var(--text-label)]">Toggle Columns</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVisibleColumns(new Set(dataset.columns))}
                      className="text-[10px] text-[#6941c6] hover:underline"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setVisibleColumns(new Set([dataset.columns[0]]))}
                      className="text-[10px] text-[#6941c6] hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>
                {dataset.columns.map((col) => (
                  <label key={col} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--hover-item)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-[var(--border-secondary)] accent-[#6941c6]"
                    />
                    <span className="text-xs text-[var(--text-primary)] truncate">{col}</span>
                    <span className={`ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${typeBadgeColor[dataset.columnTypes[col]] || ""}`}>
                      {dataset.columnTypes[col]}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--hover-item)]">
                {visibleColIndices.map(({ col }) => (
                  <th
                    key={col}
                    className="sticky top-0 bg-[var(--hover-item)] text-[var(--text-label)] font-medium text-left px-3 py-2.5 whitespace-nowrap border-b border-[var(--border-primary)]"
                  >
                    <div className="flex items-center gap-1.5">
                      {col}
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium border ${typeBadgeColor[dataset.columnTypes[col]] || ""}`}>
                        {dataset.columnTypes[col]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row, ri) => (
                <tr key={ri} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                  {visibleColIndices.map(({ col, i: ci }) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 whitespace-nowrap ${
                        row[ci] === null
                          ? "text-[var(--text-dim)] italic"
                          : typeof row[ci] === "number"
                          ? "text-[var(--text-primary)] tabular-nums text-right"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {formatValue(row[ci], dataset.columnTypes[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)]">
          <span className="text-[var(--text-muted)] text-xs">
            Showing {currentPage * ROWS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} rows
            {searchQuery && ` (filtered from ${dataset.rows.length})`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:bg-[var(--hover-item)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:bg-[var(--hover-item)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-xs text-[var(--text-primary)] font-medium">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:bg-[var(--hover-item)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:bg-[var(--hover-item)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
