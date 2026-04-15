"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  ACTION REQUIRED SECTION
// ═══════════════════════════════════════════════════════════════════════════
//
//  Two-state action list that visually aligns with the category sections
//  below it. Each row represents one (integration, data_source) that needs
//  attention, with state-specific treatment:
//
//  • required_column_missing — red/orange warning, inline "Map column to
//    date" dropdown lets user rescue the source without leaving the tab
//  • mapping_required       — blue/teal informational, "Map Now" button
//    navigates to the platform detail view
//
//  Layout matches the KPIs section grid columns so rows align visually.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { ActionItem, ActionState } from "./mandatoryMetrics";

interface ActionRequiredSectionProps {
  items: ActionItem[];
  /** Called when the user clicks "Map Now" to navigate to the detail view */
  onMapNow: (integration: string, dataSource: string, category: string) => void;
  /** Called when the user inline-maps a column as the date column */
  onMapColumnAsDate?: (
    integration: string,
    dataSource: string,
    columnName: string,
  ) => void;
}

export default function ActionRequiredSection({
  items,
  onMapNow,
  onMapColumnAsDate,
}: ActionRequiredSectionProps) {
  const [expanded, setExpanded] = useState(true);

  // ─── Empty state ────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#00bc7d" strokeWidth="1.2" />
            <path d="M5.5 8L7 9.5L10.5 6" stroke="#00bc7d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[#00bc7d] text-sm font-medium">
            All set! No action required.
          </span>
        </div>
      </div>
    );
  }

  // Split by state for separate visual treatment
  const columnMissing = items.filter((i) => i.state === "required_column_missing");
  const mappingRequired = items.filter((i) => i.state === "mapping_required");

  return (
    <div className="bg-[var(--bg-card)] border border-[#ff2056]/30 rounded-[8px] overflow-hidden">
      {/* ─── Collapsible header ──────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--hover-bg)] transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-[var(--text-muted)] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="w-6 h-6 rounded-full bg-[#ff2056]/12 flex items-center justify-center flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V6M5 8.5V9" stroke="#ff2056" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] text-sm font-semibold">
              Action Required
            </span>
            <span className="bg-[#ff2056]/10 text-[#ff2056] text-[11px] font-semibold px-2 py-[2px] rounded-[4px]">
              {items.length}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            {columnMissing.length > 0 && `${columnMissing.length} need${columnMissing.length === 1 ? "s" : ""} a required column`}
            {columnMissing.length > 0 && mappingRequired.length > 0 && " · "}
            {mappingRequired.length > 0 && `${mappingRequired.length} need${mappingRequired.length === 1 ? "s" : ""} mapping`}
          </p>
        </div>
      </button>

      {/* ─── Items ─────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)]">
          {items.map((item) => (
            <ActionItemRow
              key={item.id}
              item={item}
              onMapNow={() => onMapNow(item.integration, item.dataSource, item.category)}
              onMapColumnAsDate={
                onMapColumnAsDate
                  ? (col) => onMapColumnAsDate(item.integration, item.dataSource, col)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row Component ─────────────────────────────────────────────────────────

function ActionItemRow({
  item,
  onMapNow,
  onMapColumnAsDate,
}: {
  item: ActionItem;
  onMapNow: () => void;
  onMapColumnAsDate?: (column: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isColumnMissing = item.state === "required_column_missing";
  const isDateMissing = item.missingItems.includes("Date");
  const stateColor = isColumnMissing ? "#ff2056" : "#fe9a00";

  return (
    <div
      className={`grid items-center gap-x-4 px-5 py-4 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--hover-bg)] transition-colors grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_150px]`}
    >
      {/* ── Col 1: Integration + data source ────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* State indicator bar */}
        <div
          className="w-1 h-9 rounded-full flex-shrink-0"
          style={{ backgroundColor: stateColor }}
        />
        {/* Integration icon */}
        <span
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: item.integrationColor }}
        >
          <span className="text-xs text-white font-bold">
            {item.integration[0]?.toUpperCase()}
          </span>
        </span>
        {/* Integration name + data source */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] text-sm font-semibold truncate">
              {item.integration}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-[2px] rounded-[3px] flex-shrink-0 uppercase tracking-wider"
              style={{
                backgroundColor: `${item.categoryColor}15`,
                color: item.categoryColor,
                border: `1px solid ${item.categoryColor}25`,
              }}
            >
              {item.categoryLabel}
            </span>
          </div>
          <div className="text-[var(--text-muted)] text-xs truncate mt-1">
            {item.dataSource}
          </div>
        </div>
      </div>

      {/* ── Col 2: Missing description ──────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          {isColumnMissing ? (
            <>
              <circle cx="6" cy="6" r="5" stroke={stateColor} strokeWidth="1.2" />
              <path d="M6 3.5V6.5M6 8.5V8.6" stroke={stateColor} strokeWidth="1.3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="6" cy="6" r="5" stroke={stateColor} strokeWidth="1.2" />
              <path d="M6 3V6L8 7.5" stroke={stateColor} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </svg>
        <span className="text-xs font-semibold truncate" style={{ color: stateColor }}>
          {item.missingLabel}
        </span>
      </div>

      {/* ── Col 3: Progress ─────────────────────────────────────────────── */}
      <div className="text-[var(--text-muted)] text-xs">
        {item.mappedFields}/{item.totalFields} mapped
      </div>

      {/* ── Col 4: Action button ────────────────────────────────────────── */}
      <div className="flex justify-end relative">
        {isColumnMissing && isDateMissing && onMapColumnAsDate && item.availableColumns.length > 0 ? (
          <>
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className="flex items-center gap-1.5 border border-[#027b8e]/40 text-[#027b8e] hover:bg-[#027b8e]/8 hover:border-[#027b8e] rounded-[6px] h-[30px] px-3 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Pick Date Column
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {pickerOpen && (
              <DateColumnPicker
                columns={item.availableColumns}
                onPick={(col) => {
                  onMapColumnAsDate(col);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </>
        ) : (
          <button
            onClick={onMapNow}
            className="flex items-center gap-1.5 border border-[#027b8e]/40 text-[#027b8e] hover:bg-[#027b8e]/8 hover:border-[#027b8e] rounded-[6px] h-[30px] px-3 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Map Now
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline Date Column Picker ─────────────────────────────────────────────
// Dropdown menu of column names that appears when "Pick Date Column" is clicked.

function DateColumnPicker({
  columns,
  onPick,
  onClose,
}: {
  columns: string[];
  onPick: (column: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Dropdown panel */}
      <div className="absolute right-0 top-[36px] z-50 w-[240px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] shadow-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-label)] font-semibold">
            Pick column to map as date
          </div>
        </div>
        <div className="max-h-[220px] overflow-y-auto py-1">
          {columns.map((col) => (
            <button
              key={col}
              onClick={() => onPick(col)}
              className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[var(--text-muted)]">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 6H14M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-[var(--text-primary)] font-mono truncate">
                {col}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
