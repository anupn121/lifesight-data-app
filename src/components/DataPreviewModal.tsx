"use client";

import { useMemo } from "react";
import type { DataModel } from "./dataModelsData";
import type { Field } from "./fieldsData";
import { generateMockDataset } from "./mockDataGenerator";

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DataModel | null;
  fields: Field[];
}

function formatValue(value: string | number | null, type: string): string {
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (type === "currency") return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (type === "integer") return Math.round(value).toLocaleString("en-US");
  if (type === "decimal") return value.toFixed(2);
  return String(value);
}

export default function DataPreviewModal({ isOpen, onClose, model, fields }: DataPreviewModalProps) {
  const dataset = useMemo(() => {
    if (!model) return null;
    return generateMockDataset(model, fields, 20);
  }, [model, fields]);

  if (!isOpen || !model || !dataset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-[var(--text-primary)] text-base font-semibold">Data Preview</h2>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">{model.name} &middot; {model.granularity} granularity</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--hover-item)] flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--hover-item)]">
                  {dataset.columns.map((col, i) => (
                    <th
                      key={i}
                      className="sticky top-0 bg-[var(--hover-item)] text-[var(--text-label)] font-medium text-left px-3 py-2.5 whitespace-nowrap border-b border-[var(--border-primary)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-2 whitespace-nowrap ${
                          cell === null
                            ? "text-[var(--text-dim)] italic"
                            : typeof cell === "number"
                            ? "text-[var(--text-primary)] tabular-nums text-right"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {formatValue(cell, dataset.columnTypes[dataset.columns[ci]])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-primary)]">
          <span className="text-[var(--text-muted)] text-xs">
            Showing {dataset.rows.length} rows &middot; {dataset.columns.length} columns (mock data)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--hover-item)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
