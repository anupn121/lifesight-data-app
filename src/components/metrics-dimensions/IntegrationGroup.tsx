"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  INTEGRATION GROUP
// ═══════════════════════════════════════════════════════════════════════════
//
//  Wraps a set of DataSourceCards under an integration header. Layouts:
//
//  • Single data source (common for Paid Marketing where all streams are
//    consolidated into "Ad Insights"): show a SingleSourceIntegrationCard
//    that merges the integration header into the data source card itself.
//    Avoids redundant "Facebook → Ad Insights" labels.
//
//  • Multiple data sources (common for KPI/Organic where Shopify has Orders,
//    Customers, etc.): show the integration header above a 2-column grid of
//    DataSourceCards.
// ═══════════════════════════════════════════════════════════════════════════

import type { IntegrationGroup as IntegrationGroupData } from "./useFieldData";
import DataSourceCard from "./DataSourceCard";

interface IntegrationGroupProps {
  group: IntegrationGroupData;
  categoryColor: string;
  onViewAll: (dataSourceRawName: string) => void;
}

export default function IntegrationGroup({
  group,
  categoryColor,
  onViewAll,
}: IntegrationGroupProps) {
  const { name, color, dataSources } = group;

  // ─── Single data source: compact merged card ─────────────────────────
  if (dataSources.length === 1) {
    return (
      <div className="mb-4 last:mb-0">
        <SingleSourceIntegrationCard
          integrationName={name}
          integrationColor={color}
          dataSource={dataSources[0]}
          categoryColor={categoryColor}
          onViewAll={() => onViewAll(dataSources[0].rawName)}
        />
      </div>
    );
  }

  // ─── Multiple data sources: header + grid ────────────────────────────
  const { totalFields, mappedFields, progress } = group;

  return (
    <div className="mb-6 last:mb-0">
      {/* Integration header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          <span className="text-xs text-white font-bold">
            {name[0]?.toUpperCase()}
          </span>
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[var(--text-primary)] text-sm font-semibold">
            {name}
          </span>
          <span className="text-[var(--text-muted)] text-xs">
            · {dataSources.length} data sources
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[var(--text-muted)] text-xs">
            {mappedFields}/{totalFields} mapped
          </span>
          <div className="w-20">
            <div className="h-1 w-full bg-[var(--bg-card-inner)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? "#00bc7d" : categoryColor,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data source cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dataSources.map((ds) => (
          <DataSourceCard
            key={ds.rawName}
            dataSource={ds}
            categoryColor={categoryColor}
            onViewAll={() => onViewAll(ds.rawName)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single-source compact card ────────────────────────────────────────────
// Used when an integration has exactly one data source (most paid marketing
// platforms after consolidation). Merges the integration header into the
// data source card so we don't show "Facebook → Ad Insights" redundantly.

function SingleSourceIntegrationCard({
  integrationName,
  integrationColor,
  dataSource,
  categoryColor,
  onViewAll,
}: {
  integrationName: string;
  integrationColor: string;
  dataSource: import("./useFieldData").DataSourceGroup;
  categoryColor: string;
  onViewAll: () => void;
}) {
  const {
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
      {/* Header: integration icon + name + progress */}
      <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: integrationColor }}
        >
          <span className="text-xs text-white font-bold">
            {integrationName[0]?.toUpperCase()}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[var(--text-primary)] text-sm font-semibold truncate">
            {integrationName}
          </div>
          <div className="text-[var(--text-muted)] text-xs mt-0.5 flex items-center gap-1.5">
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

      {/* Body: side-by-side metrics / dimensions */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
        <CompactFieldColumn
          label="Metrics"
          count={mappedMetrics}
          total={metrics.length}
          accentColor={categoryColor}
          fields={topMetrics}
          emptyText="No metrics yet"
        />
        <CompactFieldColumn
          label="Dimensions"
          count={mappedDimensions}
          total={dimensions.length}
          accentColor="#6b7280"
          fields={topDimensions}
          emptyText="No dimensions yet"
        />
      </div>

      {/* Footer */}
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

function CompactFieldColumn({
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
