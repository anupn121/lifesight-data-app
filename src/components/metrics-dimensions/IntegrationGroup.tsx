"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  INTEGRATION GROUP
// ═══════════════════════════════════════════════════════════════════════════
//
//  Collapsible row following the Integrations-tab row grammar:
//  • Gradient icon tile (brand color)
//  • Integration name + field-count label
//  • Stacked mini progress bar (mapped / suggested / unmapped)
//  • Status pill ("Ready" / "In progress" / "Needs mapping" / "Suggestions")
//  • Chevron to expand
//
//  Expanded state renders the data sources as a responsive grid of
//  DataSourceCards. Single-source integrations (most Paid Marketing after
//  consolidation) skip the extra header and show the card directly.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import type { IntegrationGroup as IntegrationGroupData } from "./useFieldData";
import type { Field } from "../fieldsData";
import DataSourceCard from "./DataSourceCard";
import { ScopeBreakdown } from "./ScopeBreakdown";
import type { ScopeDimension, ScopeFilter } from "./scopeTypes";

interface IntegrationGroupProps {
  group: IntegrationGroupData;
  categoryColor: string;
  onViewAll: (dataSourceRawName: string) => void;
  defaultExpanded?: boolean;
  scopeFilter?: ScopeFilter;
  onToggleScopeFilter?: (dimension: ScopeDimension, value: string) => void;
  /** Called when the user clicks the "+ Add field" button on this integration's row. */
  onAddField?: (integration: string) => void;
}

export default function IntegrationGroup({
  group,
  categoryColor,
  onViewAll,
  defaultExpanded = false,
  scopeFilter,
  onToggleScopeFilter,
  onAddField,
}: IntegrationGroupProps) {
  const { name, color, dataSources, totalFields, mappedFields, progress } = group;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const allFields = useMemo<Field[]>(
    () => dataSources.flatMap((ds) => ds.fields),
    [dataSources],
  );

  const isComplete = progress === 100 && totalFields > 0;
  const mappedPct = totalFields ? (mappedFields / totalFields) * 100 : 0;

  return (
    <div className="rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden mb-3 last:mb-0">
      {/* ─── Row header ─────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-item)] transition-colors text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#027b8e]/40"
      >
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Gradient icon tile */}
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          <span className="text-sm text-white font-bold">{name[0]?.toUpperCase()}</span>
        </div>

        {/* Name + count */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] text-sm font-semibold truncate">{name}</span>
            <span className="text-[var(--text-dim)] text-xs flex-shrink-0">
              · {totalFields} field{totalFields === 1 ? "" : "s"}
              {dataSources.length > 1 && ` · ${dataSources.length} sources`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-1 w-full max-w-[280px] rounded-full overflow-hidden bg-[var(--bg-card-inner)]">
              <div style={{ width: `${mappedPct}%`, backgroundColor: "#00bc7d" }} className="h-full transition-all duration-500" />
            </div>
            <span className="text-[var(--text-muted)] text-xs flex-shrink-0">
              {mappedFields}/{totalFields} mapped
            </span>
          </div>
        </div>

        {/* Add field button (pre-fills this integration as the source) */}
        {onAddField && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddField(name);
            }}
            className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] border border-transparent text-[var(--text-muted)] hover:text-[#027b8e] hover:bg-[#027b8e]/8 hover:border-[#027b8e]/30 transition-colors text-xs font-semibold flex-shrink-0"
            title={`Add a field to ${name}`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add field
          </button>
        )}

        {/* Status pill */}
        <div className="flex-shrink-0">
          {isComplete ? (
            <StatusPill label="Ready" tone="green" />
          ) : mappedFields > 0 ? (
            <StatusPill label="In progress" tone="orange" />
          ) : (
            <StatusPill label="Needs mapping" tone="grey" />
          )}
        </div>
      </div>

      {/* ─── Scope breakdown chips (per integration) ───────────────────── */}
      <ScopeBreakdownRow
        fields={allFields}
        scopeFilter={scopeFilter}
        onToggleScopeFilter={onToggleScopeFilter}
      />

      {/* ─── Expanded body ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)] bg-[var(--bg-card-inner)] px-4 py-4">
          {dataSources.length === 1 ? (
            // Single source — full-width card
            <DataSourceCard
              dataSource={dataSources[0]}
              categoryColor={categoryColor}
              onViewAll={() => onViewAll(dataSources[0].rawName)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {dataSources.map((ds) => (
                <DataSourceCard
                  key={ds.rawName}
                  dataSource={ds}
                  categoryColor={categoryColor}
                  onViewAll={() => onViewAll(ds.rawName)}
                    />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scope breakdown (rendered only when fields carry scope tags) ─────────

function ScopeBreakdownRow({
  fields,
  scopeFilter,
  onToggleScopeFilter,
}: {
  fields: Field[];
  scopeFilter?: ScopeFilter;
  onToggleScopeFilter?: (dimension: ScopeDimension, value: string) => void;
}) {
  // Quick check — if no field in this integration has any scope, skip entirely
  const anyScope = fields.some((f) => f.accountScope && Object.keys(f.accountScope).some((k) => f.accountScope![k as keyof typeof f.accountScope]));
  if (!anyScope) return null;

  return (
    <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card-inner)]">
      <ScopeBreakdown
        fields={fields}
        filter={scopeFilter}
        onToggleFilter={onToggleScopeFilter}
      />
    </div>
  );
}

// ─── Status pill (shared grammar) ──────────────────────────────────────────

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
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] border text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: map.color, borderColor: `${map.color}30`, backgroundColor: map.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: map.color }} />
      {label}
    </span>
  );
}
