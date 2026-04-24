"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  SCOPE BREAKDOWN CHIPS
// ═══════════════════════════════════════════════════════════════════════════
//
//  For each integration, breaks its fields down by the dominant tag dimension
//  (usually Brand, but whichever dimension has the most distinct values).
//  Renders as a small horizontal chip strip:
//
//      [🛍 GAP 20/25]  [🛍 Banana Republic 15/20]  [🛍 Old Navy 10/12]
//
//  First number: mapped-within-tag. Second number: total-within-tag.
//  Untagged fields appear as a final muted "Untagged" chip when present.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import type { Field } from "../fieldsData";
import {
  type ScopeDimension,
  type ScopeFilter,
  SCOPE_DIMENSIONS,
} from "./scopeTypes";

interface ScopeBreakdownProps {
  fields: Field[];
  /** Active scope filter — used to highlight the chip that matches the filter */
  filter?: ScopeFilter;
  /** Called when user clicks a chip. Optional — enables click-to-filter */
  onToggleFilter?: (dimension: ScopeDimension, value: string) => void;
  /** Max chips to render before truncating to "+N more" */
  maxChips?: number;
}

export function ScopeBreakdown({ fields, filter, onToggleFilter, maxChips = 5 }: ScopeBreakdownProps) {
  // Pick the dominant dimension: the dimension with the most distinct values
  // across the field list. If no dimension has >= 2 values, skip rendering.
  const { dimension, breakdown } = useMemo(() => {
    let best: {
      dimension: ScopeDimension;
      values: Map<string, { mapped: number; total: number }>;
    } | null = null;

    for (const d of SCOPE_DIMENSIONS) {
      const map = new Map<string, { mapped: number; total: number }>();
      for (const f of fields) {
        const v = f.accountScope?.[d.key];
        if (!v) continue;
        const cur = map.get(v) || { mapped: 0, total: 0 };
        cur.total += 1;
        if (f.status === "Mapped") cur.mapped += 1;
        map.set(v, cur);
      }
      if (map.size < 2) continue;
      if (!best || map.size > best.values.size) {
        best = { dimension: d.key, values: map };
      }
    }

    if (!best) return { dimension: null as ScopeDimension | null, breakdown: [] as { value: string; mapped: number; total: number }[] };

    const sorted = Array.from(best.values.entries())
      .map(([value, counts]) => ({ value, ...counts }))
      .sort((a, b) => b.total - a.total);

    return { dimension: best.dimension, breakdown: sorted };
  }, [fields]);

  // Untagged count — fields with no value in the dominant dimension
  const untaggedCount = useMemo(() => {
    if (!dimension) return 0;
    return fields.filter((f) => !f.accountScope?.[dimension]).length;
  }, [fields, dimension]);

  if (!dimension || breakdown.length === 0) return null;

  const dimConfig = SCOPE_DIMENSIONS.find((d) => d.key === dimension)!;
  const visible = breakdown.slice(0, maxChips);
  const hidden = breakdown.length - visible.length;
  const activeFilter = filter?.[dimension];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] mr-1">
        By {dimConfig.label}
      </span>
      {visible.map((b) => {
        const isActive = activeFilter?.has(b.value);
        const isOtherActive = activeFilter && activeFilter.size > 0 && !isActive;
        return (
          <button
            key={b.value}
            onClick={() => onToggleFilter?.(dimension, b.value)}
            disabled={!onToggleFilter}
            className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] border text-xs font-medium transition-colors ${
              onToggleFilter ? "cursor-pointer hover:border-current" : "cursor-default"
            } ${isOtherActive ? "opacity-40" : ""}`}
            style={{
              color: isActive ? "#fff" : dimConfig.accent,
              borderColor: isActive ? dimConfig.accent : `${dimConfig.accent}30`,
              backgroundColor: isActive ? dimConfig.accent : `${dimConfig.accent}10`,
            }}
            title={`${b.value}: ${b.mapped} mapped of ${b.total}`}
          >
            <span className="truncate max-w-[120px]">{b.value}</span>
            <span className="font-mono opacity-80">
              {b.mapped}/{b.total}
            </span>
          </button>
        );
      })}
      {hidden > 0 && (
        <span className="text-xs text-[var(--text-muted)]">+{hidden} more</span>
      )}
      {untaggedCount > 0 && (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] border border-[var(--border-secondary)] text-xs font-medium text-[var(--text-muted)]"
          title={`${untaggedCount} fields have no ${dimConfig.label.toLowerCase()} tag`}
        >
          <span>Untagged</span>
          <span className="font-mono opacity-80">{untaggedCount}</span>
        </span>
      )}
    </div>
  );
}
