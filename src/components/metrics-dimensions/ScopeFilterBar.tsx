"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  SCOPE FILTER BAR
// ═══════════════════════════════════════════════════════════════════════════
//
//  Compact multi-select pills for Brand · Product · Country · Region.
//  Appears at the top of the Data Transformation overview and inside the
//  category-detail / platform-detail views.
//
//  When no values are selected in a dimension, the pill reads the dimension
//  name. When values are selected, it shows the count and uses the accent
//  color.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useRef, useEffect, useState } from "react";
import type { Field } from "../fieldsData";
import {
  type ScopeFilter,
  type ScopeDimension,
  SCOPE_DIMENSIONS,
  countActiveFilters,
  collectScopeValues,
} from "./scopeTypes";

interface ScopeFilterBarProps {
  fields: Field[];
  filter: ScopeFilter;
  onChange: (next: ScopeFilter) => void;
  /** When true, renders compact pills that stack on narrow screens. */
  compact?: boolean;
}

export function ScopeFilterBar({ fields, filter, onChange, compact = false }: ScopeFilterBarProps) {
  const available = useMemo(() => collectScopeValues(fields.map((f) => f.accountScope)), [fields]);
  const totalActive = countActiveFilters(filter);

  const clearAll = () => onChange({});

  // Don't render a filter bar when there's nothing to filter on
  const anyValues = SCOPE_DIMENSIONS.some((d) => available[d.key].length > 0);
  if (!anyValues) return null;

  return (
    <div
      className={`flex items-center gap-2 flex-wrap ${
        compact ? "" : "bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-[10px] px-3 py-2"
      }`}
    >
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)] mr-1">
          Filter
        </span>
      )}
      {SCOPE_DIMENSIONS.map((d) => {
        if (available[d.key].length === 0) return null;
        return (
          <FilterPill
            key={d.key}
            dimension={d}
            values={available[d.key]}
            selected={filter[d.key] ?? new Set()}
            onChange={(next) => {
              onChange({
                ...filter,
                [d.key]: next.size > 0 ? next : undefined,
              });
            }}
          />
        );
      })}
      {totalActive > 0 && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 h-[26px] px-2.5 rounded-[4px] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8 2L2 8M2 2l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Filter pill (per dimension) ───────────────────────────────────────────

function FilterPill({
  dimension,
  values,
  selected,
  onChange,
}: {
  dimension: (typeof SCOPE_DIMENSIONS)[number];
  values: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  };

  const count = selected.size;
  const active = count > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[4px] text-xs font-semibold border transition-colors`}
        style={{
          color: active ? dimension.accent : "var(--text-secondary)",
          borderColor: active ? `${dimension.accent}40` : "var(--border-secondary)",
          backgroundColor: active ? `${dimension.accent}10` : "transparent",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path d={dimension.iconPath} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {dimension.label}
        {active ? (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: dimension.accent }}
          >
            {count}
          </span>
        ) : (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="text-[var(--text-dim)]">
            <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[200px] bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[8px] overflow-hidden py-1 max-h-[300px] overflow-y-auto"
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] border-b border-[var(--border-subtle)]">
            Filter by {dimension.label}
          </div>
          {values.map((v) => {
            const isSel = selected.has(v);
            return (
              <button
                key={v}
                onClick={() => toggle(v)}
                className="w-full text-left px-3 py-2 hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2.5"
              >
                <span
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSel ? "bg-current border-current" : "border-[var(--border-secondary)]"
                  }`}
                  style={isSel ? { color: dimension.accent } : {}}
                >
                  {isSel && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[var(--text-primary)] text-xs truncate flex-1">{v}</span>
              </button>
            );
          })}
          {selected.size > 0 && (
            <button
              onClick={() => onChange(new Set())}
              className="w-full text-left px-3 py-2 border-t border-[var(--border-primary)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
            >
              Clear {dimension.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
