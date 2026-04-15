"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  DATA SOURCE CARD
// ═══════════════════════════════════════════════════════════════════════════
//
//  A single card within an integration group showing:
//  • Data source name + progress (e.g., "Orders  3/5 mapped")
//  • Side-by-side METRICS / DIMENSIONS preview (top 5 each)
//  • "View all" link that opens the detailed field view
//
//  Fonts standardized: text-sm for primary, text-xs for secondary,
//  text-[11px] uppercase tracking-wider only for the column labels.
// ═══════════════════════════════════════════════════════════════════════════

import type { DataSourceGroup } from "./useFieldData";

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
    metrics,
    dimensions,
    mappedFields,
    mappedMetrics,
    mappedDimensions,
    totalFields,
    progress,
  } = dataSource;

  const isComplete = progress === 100;

  return (
    <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden hover:border-[var(--border-secondary)] transition-colors">
      {/* ─── Header: name + progress ──────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[var(--text-primary)] text-sm font-semibold truncate">
            {displayName}
          </div>
          <div className="text-[var(--text-muted)] text-xs mt-1 flex items-center gap-1.5">
            <span>
              {mappedFields}/{totalFields} mapped
            </span>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[#00bc7d] font-medium">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8.5L6 12.5L14 4.5"
                    stroke="#00bc7d"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Complete
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-24 flex-shrink-0">
          <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: isComplete ? "#00bc7d" : categoryColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Body: side-by-side metrics / dimensions ──────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
        {/* Metrics column */}
        <FieldColumn
          label="Metrics"
          count={mappedMetrics}
          total={metrics.length}
          accentColor={categoryColor}
          fields={topMetrics}
          emptyText="No metrics yet"
        />
        {/* Dimensions column */}
        <FieldColumn
          label="Dimensions"
          count={mappedDimensions}
          total={dimensions.length}
          accentColor="#6b7280"
          fields={topDimensions}
          emptyText="No dimensions yet"
        />
      </div>

      {/* ─── Footer: View All link ────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
        <span className="text-[var(--text-dim)] text-xs">
          {totalFields} {totalFields === 1 ? "field" : "fields"} available
        </span>
        <button
          onClick={onViewAll}
          className="text-[#027b8e] hover:text-[#02899e] text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          View all fields
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3.5 1.5L7 5L3.5 8.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Field Column Sub-component ────────────────────────────────────────────

function FieldColumn({
  label,
  count,
  total,
  accentColor,
  fields,
  emptyText,
}: {
  label: string;
  count: number;
  total: number;
  accentColor: string;
  fields: { name: string; displayName: string; status: string }[];
  emptyText: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-label)]">
          {label}
        </span>
        <span
          className="text-[11px] font-semibold px-1.5 py-[1px] rounded-[3px]"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
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
            const isMapped = f.status === "Mapped";
            return (
              <li
                key={f.name}
                className="flex items-center gap-2 text-xs truncate leading-tight"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isMapped ? accentColor : "#44445a",
                  }}
                />
                <span
                  className={`truncate ${
                    isMapped
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {f.displayName}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
