"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  CATEGORY HIERARCHY SECTION
// ═══════════════════════════════════════════════════════════════════════════
//
//  A category "super-row" that expands to reveal its integration rows. Uses
//  the Integrations-tab row grammar:
//  • Gradient icon tile (category color)
//  • Category name + plain-English promise
//  • Stats cluster: integrations · fields · mapped · suggestions
//  • Status pill (Ready / In progress / Needs attention / Suggestions)
//  • Chevron + inline expand
//  • Stacked progress bar (mapped | suggested | unmapped)
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { CategoryHierarchy } from "./useFieldData";
import type { MetricCategory } from "../fieldsData";
import IntegrationGroup from "./IntegrationGroup";
import type { ScopeDimension, ScopeFilter } from "./scopeTypes";

interface CategoryHierarchySectionProps {
  data: CategoryHierarchy;
  defaultExpanded?: boolean;
  onViewDataSource: (integrationName: string, dataSourceRawName: string) => void;
  onViewCategory: () => void;
  onConnectSource?: () => void;
  scopeFilter?: ScopeFilter;
  onToggleScopeFilter?: (dimension: ScopeDimension, value: string) => void;
  onAddField?: (integration: string) => void;
}

/* Concrete, recognizable examples for each category — shown in empty state */
const CATEGORY_EXAMPLES: Record<MetricCategory, string> = {
  kpi: "Revenue, Orders, Conversions, Store visits",
  paid_marketing: "Ad spend, Impressions, Clicks, CPC",
  organic: "Email opens, Organic social impressions, SEO clicks",
  contextual: "Weather, Holidays, Product launches, Fuel prices",
};

const CATEGORY_ICONS: Record<MetricCategory, string> = {
  kpi: "💵",
  paid_marketing: "💰",
  organic: "🌱",
  contextual: "🌡",
};

export default function CategoryHierarchySection({
  data,
  defaultExpanded = false,
  onViewDataSource,
  onViewCategory,
  onConnectSource,
  scopeFilter,
  onToggleScopeFilter,
  onAddField,
}: CategoryHierarchySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // ─── Empty category ────────────────────────────────────────────────────
  if (data.integrations.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[var(--border-secondary)] bg-[var(--bg-card)] px-5 py-5">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: `linear-gradient(135deg, ${data.color}20, ${data.color}05)` }}
          >
            <span style={{ filter: "grayscale(0.3)" }}>{CATEGORY_ICONS[data.category]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--text-primary)] text-sm font-semibold">{data.label}</div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed mt-1">
              None of your connected integrations have {data.label} fields.
            </p>
            <p className="text-[var(--text-dim)] text-xs mt-1.5">
              Examples: {CATEGORY_EXAMPLES[data.category]}
            </p>
          </div>
          {onConnectSource && (
            <button
              onClick={onConnectSource}
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#027b8e] hover:bg-[#02899e] text-white rounded-[6px] h-[30px] px-3.5 text-xs font-semibold transition-colors"
            >
              Connect a source
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isComplete = data.progress === 100 && data.totalFields > 0;
  const mappedPct = data.totalFields ? (data.mappedFields / data.totalFields) * 100 : 0;

  return (
    <div className="rounded-[12px] border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
      {/* ─── Header row ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--hover-bg)] transition-colors text-left"
      >
        {/* Chevron */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Gradient icon tile */}
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: `linear-gradient(135deg, ${data.color}35, ${data.color}10)` }}
        >
          <span>{CATEGORY_ICONS[data.category]}</span>
        </div>

        {/* Name + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] text-base font-semibold">{data.label}</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-0.5 leading-relaxed">{data.description}</p>

          {/* Stats row + stacked bar */}
          <div className="mt-2.5 flex items-center gap-4">
            <div className="flex h-1.5 w-full max-w-[260px] rounded-full overflow-hidden bg-[var(--bg-card-inner)]">
              <div style={{ width: `${mappedPct}%`, backgroundColor: "#00bc7d" }} className="h-full transition-all duration-500" />
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <StatChip value={data.integrations.length} label={data.integrations.length === 1 ? "integration" : "integrations"} />
              <StatChip value={data.totalFields} label={data.totalFields === 1 ? "field" : "fields"} />
              <StatChip value={data.mappedFields} label="mapped" accent="#00bc7d" />
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex-shrink-0">
          {isComplete ? (
            <StatusPill label="Ready" tone="green" />
          ) : data.mappedFields > 0 ? (
            <StatusPill label={`${Math.round(data.progress)}%`} tone="orange" />
          ) : (
            <StatusPill label="Needs mapping" tone="grey" />
          )}
        </div>
      </button>

      {/* ─── Expanded body ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)] px-5 py-5">
          {data.integrations.map((intGroup, idx) => (
            <IntegrationGroup
              key={intGroup.name}
              group={intGroup}
              categoryColor={data.color}
              onViewAll={(dsRaw) => onViewDataSource(intGroup.name, dsRaw)}
              defaultExpanded={idx === 0 && data.integrations.length === 1}
              scopeFilter={scopeFilter}
              onToggleScopeFilter={onToggleScopeFilter}
              onAddField={onAddField}
            />
          ))}

          {/* Footer */}
          <div className="mt-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={onViewCategory}
              className="inline-flex items-center gap-1 text-[#027b8e] hover:text-[#02899e] text-xs font-semibold transition-colors"
            >
              View all {data.label} fields
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────

function StatChip({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`font-semibold ${accent ? "" : "text-[var(--text-secondary)]"}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      <span className="text-[var(--text-muted)]">{label}</span>
    </span>
  );
}

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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: map.color, borderColor: `${map.color}30`, backgroundColor: map.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: map.color }} />
      {label}
    </span>
  );
}
