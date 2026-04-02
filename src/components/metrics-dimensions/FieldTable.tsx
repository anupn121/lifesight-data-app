"use client";

import { type Field, getSourceStreamInfo } from "../fieldsData";
import { DataTypeBadge } from "./badges";

// Grid template shared between header and rows (no Target Key column)
export const TABLE_GRID = "grid-cols-[1fr_130px_130px_1fr_80px_90px_36px]";

// Unified field row for collapsible category sections
export const NewFieldRow = ({ field, onEdit }: { field: Field; onEdit: (field: Field) => void }) => {
  const info = getSourceStreamInfo(field.source);
  return (
    <div
      className={`grid ${TABLE_GRID} border-b border-[var(--border-subtle)] hover:bg-[var(--hover-item)] transition-colors cursor-pointer group`}
      onClick={() => onEdit(field)}
    >
      {/* Display Name */}
      <div className="px-4 py-2.5 flex items-center gap-2.5 min-w-0">
        <span
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: field.sourceColor }}
        >
          <span className="text-[7px] text-white font-bold">{info.parent[0]}</span>
        </span>
        <span className="text-[var(--text-primary)] text-xs font-medium truncate" title={field.displayName || field.columnName}>
          {field.displayName || field.columnName}
        </span>
      </div>
      {/* Source Name */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <span className="text-[var(--text-secondary)] text-[11px] truncate" title={info.parent}>{info.parent}</span>
      </div>
      {/* Stream Name */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <span className="text-[var(--text-muted)] text-[11px] truncate" title={info.stream}>{info.stream}</span>
      </div>
      {/* Source Field */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <code className="text-[#a78bfa] text-[10px] bg-[#027b8e]/10 px-1.5 py-0.5 rounded font-mono truncate" title={field.sourceKey}>
          {field.sourceKey}
        </code>
      </div>
      {/* Data Type */}
      <div className="px-3 py-2.5 flex items-center">
        <DataTypeBadge type={field.dataType} />
      </div>
      {/* Status */}
      <div className="px-3 py-2.5 flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
          field.status === "Mapped"
            ? "bg-[#00bc7d]/10 text-[#00bc7d]"
            : "bg-[#fe9a00]/10 text-[#fe9a00]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${field.status === "Mapped" ? "bg-[#00bc7d]" : "bg-[#fe9a00]"}`} />
          {field.status === "Mapped" ? "Mapped" : "Unmapped"}
        </span>
      </div>
      {/* Edit */}
      <div className="px-1 py-2.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(field); }}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--hover-item)] transition-all"
          title="Edit"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5.5 2.5H2.5C2.23478 2.5 1.98043 2.60536 1.79289 2.79289C1.60536 2.98043 1.5 3.23478 1.5 3.5V9.5C1.5 9.76522 1.60536 10.0196 1.79289 10.2071C1.98043 10.3946 2.23478 10.5 2.5 10.5H8.5C8.76522 10.5 9.01957 10.3946 9.20711 10.2071C9.39464 10.0196 9.5 9.76522 9.5 9.5V6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.75 1.75C8.94891 1.55109 9.2187 1.43934 9.5 1.43934C9.7813 1.43934 10.0511 1.55109 10.25 1.75C10.4489 1.94891 10.5607 2.2187 10.5607 2.5C10.5607 2.7813 10.4489 3.05109 10.25 3.25L5.5 8L3.5 8.5L4 6.5L8.75 1.75Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Reusable table header
export function FieldTableHeader() {
  return (
    <div className={`grid ${TABLE_GRID} border-b border-[var(--border-primary)]`}>
      <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Display Name</span></div>
      <div className="px-3 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Source</span></div>
      <div className="px-3 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Stream</span></div>
      <div className="px-3 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Source Field</span></div>
      <div className="px-3 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Type</span></div>
      <div className="px-3 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
      <div className="px-1 py-2.5" />
    </div>
  );
}
