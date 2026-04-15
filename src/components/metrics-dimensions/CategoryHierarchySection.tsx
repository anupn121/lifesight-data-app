"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  CATEGORY HIERARCHY SECTION
// ═══════════════════════════════════════════════════════════════════════════
//
//  Replaces the old CategorySection with the three-level hierarchy:
//  Category → Integration → Data Source → (preview of metrics/dimensions)
//
//  Visual style mirrors the Integrations & Monitoring tab:
//  • Collapsible header with chevron, category dot, name, counts, progress
//  • Body: stack of IntegrationGroup components (each with data source cards)
//  • Footer: "View all <category> fields" link
//
//  Empty state: when a category has no integrations, shows a helpful card
//  with category-specific suggestions (Shopify for KPI, Facebook Ads for
//  Paid Marketing, etc.) and a "Connect a source" CTA.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { CategoryHierarchy } from "./useFieldData";
import IntegrationGroup from "./IntegrationGroup";

interface CategoryHierarchySectionProps {
  data: CategoryHierarchy;
  defaultExpanded?: boolean;
  onViewDataSource: (integrationName: string, dataSourceRawName: string) => void;
  onViewCategory: () => void;
  onConnectSource?: () => void;
}

/* Concrete, recognizable examples for each category. Shown in the empty
   state so users understand what the category means without needing the
   old suggestion-pill UI. Four examples per category gives the user enough
   pattern recognition without cluttering the card. */
const CATEGORY_EXAMPLES: Record<string, string> = {
  kpi: "revenue, orders, conversions, store visits",
  paid_marketing: "ad spend, impressions, clicks, CPC",
  organic: "email opens, organic social impressions, SEO clicks",
  contextual: "weather, holidays, product launches, fuel prices",
};

export default function CategoryHierarchySection({
  data,
  defaultExpanded = false,
  onViewDataSource,
  onViewCategory,
  onConnectSource,
}: CategoryHierarchySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // ─── Empty category ────────────────────────────────────────────────────
  // Simplified messaging: no "EMPTY" badge, no suggestion pills. The message
  // tells the user that none of their currently-connected integrations have
  // fields in this category. The CTA still lets them jump to Integrations.
  if (data.integrations.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
        <div className="flex items-start gap-4 px-5 py-5">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: data.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[var(--text-primary)] text-sm font-semibold mb-1">
              {data.label}
            </div>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-1">
              None of your connected integrations have {data.label} fields.
            </p>
            {CATEGORY_EXAMPLES[data.category] && (
              <p className="text-[var(--text-dim)] text-xs leading-relaxed">
                Examples: {CATEGORY_EXAMPLES[data.category]}
              </p>
            )}
          </div>
          {onConnectSource && (
            <button
              onClick={onConnectSource}
              className="flex-shrink-0 bg-[#027b8e] hover:bg-[#02899e] text-white rounded-[6px] flex items-center gap-1.5 px-3 h-[28px] text-xs font-semibold transition-colors"
            >
              Connect a source
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
      {/* ─── Header (collapsible) ─────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--hover-bg)] transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
        >
          <path
            d="M4.5 2.5L8 6L4.5 9.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] text-sm font-semibold">
              {data.label}
            </span>
            <span className="bg-[var(--hover-item)] text-[var(--text-secondary)] text-[11px] font-medium px-2 py-[2px] rounded-[4px]">
              {data.integrations.length}{" "}
              {data.integrations.length === 1 ? "integration" : "integrations"}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-1 leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Mapping progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-28">
            <div className="h-1.5 w-full bg-[var(--bg-card-inner)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${data.progress}%`,
                  backgroundColor:
                    data.progress === 100
                      ? "#00bc7d"
                      : data.progress > 50
                      ? data.color
                      : "#fe9a00",
                }}
              />
            </div>
          </div>
          <span
            className={`text-xs font-semibold ${
              data.progress === 100 ? "text-[#00bc7d]" : "text-[var(--text-muted)]"
            }`}
          >
            {data.mappedFields}/{data.totalFields}
          </span>
        </div>
      </button>

      {/* ─── Body: integration groups ─────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)] px-5 py-5">
          {data.integrations.map((intGroup) => (
            <IntegrationGroup
              key={intGroup.name}
              group={intGroup}
              categoryColor={data.color}
              onViewAll={(dsRaw) => onViewDataSource(intGroup.name, dsRaw)}
            />
          ))}

          {/* Footer: view all link */}
          <div className="mt-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={onViewCategory}
              className="text-[#027b8e] hover:text-[#02899e] text-xs font-semibold transition-colors flex items-center gap-1"
            >
              View all {data.label} fields
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
      )}
    </div>
  );
}
