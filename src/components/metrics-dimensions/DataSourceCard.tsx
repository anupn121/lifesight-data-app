"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  DATA SOURCE CARD
// ═══════════════════════════════════════════════════════════════════════════
//
//  A compact preview card within an integration group. Redesigned to use:
//  • Status pill (Mapped / Unmapped / Suggestions available)
//  • Mini stacked progress bar (mapped | suggested | unmapped)
//  • Status dots (from the shared palette) next to each preview field
//  • "Apply N suggestions" inline CTA when any field has a suggestion
//
//  Typography discipline: text-[10px]/[11px] ONLY for uppercase tracking
//  labels. Body text is text-xs, field names text-xs, chips text-xs.
// ═══════════════════════════════════════════════════════════════════════════

import type { DataSourceGroup } from "./useFieldData";
import type { Field } from "../fieldsData";
import { getFieldDisplayStatus, fieldStatusConfig } from "./StatusBadge";
import { InlineSampleValue } from "./SampleDataPreview";

interface DataSourceCardProps {
  dataSource: DataSourceGroup;
  categoryColor: string;
  onViewAll: () => void;
}

export default function DataSourceCard({
  dataSource,
  categoryColor,
  onViewAll,
}: DataSourceCardProps) {
  const {
    displayName,
    topMetrics,
    topDimensions,
    fields,
    metrics,
    dimensions,
    mappedFields,
    mappedMetrics,
    mappedDimensions,
    totalFields,
    progress,
  } = dataSource;

  const isComplete = progress === 100;
  const mappedPct = totalFields ? (mappedFields / totalFields) * 100 : 0;
  const unmappedPct = Math.max(0, 100 - mappedPct);

  return (
    <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] rounded-[10px] overflow-hidden transition-colors">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-[var(--text-primary)] text-sm font-semibold truncate">
              {displayName}
            </div>
          </div>
          {/* Status pill */}
          {isComplete ? (
            <StatusPill label="Ready" tone="green" />
          ) : mappedFields > 0 ? (
            <StatusPill label="In progress" tone="orange" />
          ) : (
            <StatusPill label="Unmapped" tone="grey" />
          )}
        </div>

        {/* Progress bar */}
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-[var(--bg-card)]">
          <div
            style={{ width: `${mappedPct}%`, backgroundColor: "#00bc7d" }}
            className="h-full transition-all duration-500"
          />
          <div
            style={{ width: `${unmappedPct}%`, backgroundColor: "var(--border-secondary)" }}
            className="h-full transition-all duration-500"
          />
        </div>

        {/* Stats line under bar */}
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <LegendDot color="#00bc7d" label={`${mappedFields} mapped`} />
          <span className="ml-auto text-[var(--text-dim)]">
            {totalFields} total
          </span>
        </div>
      </div>

      {/* ─── Body: side-by-side ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
        <PreviewColumn
          label="Metrics"
          count={mappedMetrics}
          total={metrics.length}
          accentColor={categoryColor}
          fields={topMetrics}
          allFields={fields}
          emptyText="No metrics yet"
        />
        <PreviewColumn
          label="Dimensions"
          count={mappedDimensions}
          total={dimensions.length}
          accentColor="#6b7280"
          fields={topDimensions}
          allFields={fields}
          emptyText="No dimensions yet"
        />
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between gap-3">
        <span className="text-[var(--text-dim)] text-xs">
          {totalFields} {totalFields === 1 ? "field" : "fields"} available
        </span>
        <button
          onClick={onViewAll}
          className="text-[#027b8e] hover:text-[#02899e] text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          View all fields
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Preview column ────────────────────────────────────────────────────────

function PreviewColumn({
  label,
  count,
  total,
  accentColor,
  fields,
  allFields,
  emptyText,
}: {
  label: string;
  count: number;
  total: number;
  accentColor: string;
  fields: Field[];
  allFields: Field[];
  emptyText: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-label)]">
          {label}
        </span>
        <span
          className="text-xs font-semibold px-1.5 py-[1px] rounded-[3px] border"
          style={{
            backgroundColor: `${accentColor}12`,
            color: accentColor,
            borderColor: `${accentColor}30`,
          }}
        >
          {count}/{total}
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="text-[var(--text-dim)] text-xs italic py-1">{emptyText}</div>
      ) : (
        <ul className="space-y-1.5">
          {fields.map((f) => {
            const displayStatus = getFieldDisplayStatus(f, { allFields });
            const dotClass = fieldStatusConfig[displayStatus].dotColor;
            return (
              <li
                key={`${f.source}-${f.sourceKey}-${f.name}`}
                className="flex items-center gap-2 text-xs leading-tight min-w-0"
                title={f.displayName || f.sourceKey || f.name}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                <span
                  className={`truncate ${
                    f.status === "Mapped"
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {f.displayName || (
                    <span className="font-mono text-[var(--text-muted)]">{f.sourceKey || f.name}</span>
                  )}
                </span>
                <span className="ml-auto text-[var(--text-dim)] font-mono text-xs truncate max-w-[80px]">
                  <InlineSampleValue field={f} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "blue" | "orange" | "grey";
}) {
  const map = {
    green: { color: "#00bc7d", bg: "transparent" },
    blue: { color: "#2b7fff", bg: "rgba(43,127,255,0.06)" },
    orange: { color: "#fe9a00", bg: "rgba(254,154,0,0.06)" },
    grey: { color: "#71717a", bg: "transparent" },
  }[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] border text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
      style={{ color: map.color, borderColor: `${map.color}30`, backgroundColor: map.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: map.color }}
      />
      {label}
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
