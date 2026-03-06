"use client";

import type { Integration, IntegrationStatus, CatalogIntegration } from "../monitoringData";
import { STATUS_LABELS } from "../monitoringData";
import { IntegrationIcon } from "./icons";
import { statusConfig } from "./statusConfig";
import KebabMenu from "./KebabMenu";

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.borderColor || "border-current/20"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function ChevronRight({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-90" : ""}`}
    >
      <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeaderTooltip({ tooltip }: { tooltip: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block ml-1 -mt-px text-[var(--text-dim)] flex-shrink-0"
    >
      <title>{tooltip}</title>
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function parseMetricValue(val: string): number | null {
  if (!val || val === "—") return null;
  const cleaned = val.replace(/[$,]/g, "").trim();
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*(K|M|B|k|m|b)?(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toUpperCase();
  const rest = match[3]?.trim();
  // Skip non-summable values like "1.2s", "15m ago", "Hourly"
  if (rest && !["", "s", "ms"].includes(rest)) return null;
  if (rest === "s" || rest === "ms") return null;
  const multiplier = suffix === "K" ? 1e3 : suffix === "M" ? 1e6 : suffix === "B" ? 1e9 : 1;
  return num * multiplier;
}

function formatMetricValue(total: number, sampleVal: string): string {
  const hasPrefix = sampleVal.startsWith("$");
  const prefix = hasPrefix ? "$" : "";
  let formatted: string;
  if (total >= 1e9) formatted = `${(total / 1e9).toFixed(1)}B`;
  else if (total >= 1e6) formatted = `${(total / 1e6).toFixed(1)}M`;
  else if (total >= 1e3) formatted = `${(total / 1e3).toFixed(1)}K`;
  else formatted = total % 1 === 0 ? total.toString() : total.toFixed(1);
  // Clean up trailing .0
  formatted = formatted.replace(/\.0([KMB]?)$/, "$1");
  return `${prefix}${formatted}`;
}

function aggregateMetrics(accounts: Integration["accounts"], columns: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const col of columns) {
    const values = accounts.map((a) => ({ parsed: parseMetricValue(a.metrics[col] || ""), raw: a.metrics[col] || "—" }));
    const parseable = values.filter((v) => v.parsed !== null);
    if (parseable.length === 0) {
      result[col] = "—";
    } else {
      const total = parseable.reduce((sum, v) => sum + v.parsed!, 0);
      result[col] = formatMetricValue(total, parseable[0].raw);
    }
  }
  return result;
}

export const TABLE_GRID = "grid grid-cols-[minmax(0,2.5fr)_repeat(4,minmax(0,1fr))_140px] gap-x-4";

export function IntegrationTableHeader() {
  return (
    <div className={`${TABLE_GRID} items-center px-5 py-2.5 border-b border-[var(--border-subtle)]`}>
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider pl-8 whitespace-nowrap">
        Integration Name
        <HeaderTooltip tooltip="Name of the connected data source or destination" />
      </span>
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
        Integration Status
        <HeaderTooltip tooltip="Current connection and sync health" />
      </span>
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
        Data Sources
        <HeaderTooltip tooltip="Number of data sources chosen for data sync" />
      </span>
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
        Last Data Sync
        <HeaderTooltip tooltip="Date of the most recent successful data sync" />
      </span>
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
        Refresh Frequency
        <HeaderTooltip tooltip="How often data is automatically refreshed" />
      </span>
      <span></span>
    </div>
  );
}

export default function IntegrationRow({
  integration,
  catalogEntry,
  effectiveStatus,
  isExpanded,
  openKebab,
  onToggleExpand,
  onToggleKebab,
  onViewDetails,
  onReportIssue,
  onSimulateSyncComplete,
  variant = "connected",
}: {
  integration: Integration;
  catalogEntry?: CatalogIntegration;
  effectiveStatus: IntegrationStatus;
  isExpanded: boolean;
  openKebab: boolean;
  onToggleExpand: () => void;
  onToggleKebab: () => void;
  onViewDetails: () => void;
  onReportIssue: () => void;
  onSimulateSyncComplete?: () => void;
  variant?: "connected" | "attention";
}) {
  const cfg = statusConfig[effectiveStatus];
  const leftBorderColor = variant === "attention" ? (cfg.borderLeftColor || "#fe9a00") : "transparent";

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0" style={{ borderLeft: `3px solid ${leftBorderColor}` }}>
      {/* Table row */}
      <div
        className={`${TABLE_GRID} items-center px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer`}
        onClick={onToggleExpand}
      >
        {/* Name column */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-0.5 flex-shrink-0">
            <ChevronRight open={isExpanded} />
          </div>
          {catalogEntry ? (
            <IntegrationIcon integration={catalogEntry} />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
              <span className="text-[8px] font-bold" style={{ color: integration.color }}>{integration.icon}</span>
            </div>
          )}
          <span className="text-[var(--text-primary)] text-sm font-medium truncate">{integration.name}</span>
        </div>

        {/* Status column */}
        <div>
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Accounts column */}
        <div>
          <span className="text-[var(--text-secondary)] text-xs">{integration.accounts.length}</span>
        </div>

        {/* Last Sync column */}
        <div>
          <span className="text-[var(--text-secondary)] text-xs">{integration.latestDate}</span>
        </div>

        {/* Frequency column */}
        <div>
          {effectiveStatus !== "SYNCING" && (
            <span className="text-[var(--text-dim)] text-xs">{integration.refreshFrequency}</span>
          )}
        </div>

        {/* Actions column */}
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#6941c6] border border-[#6941c6]/30 hover:border-[#6941c6]/50 hover:bg-[#6941c6]/5 text-[11px] font-medium transition-colors whitespace-nowrap"
          >
            View Details
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {onSimulateSyncComplete && (
            <button
              onClick={onSimulateSyncComplete}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[var(--text-dim)] border border-dashed border-[var(--border-secondary)] hover:border-[#a855f7]/50 hover:text-[#a855f7] text-[10px] font-medium transition-colors whitespace-nowrap"
            >
              Simulate Sync
            </button>
          )}
          <KebabMenu
            open={openKebab}
            onToggle={onToggleKebab}
            onConfigure={() => {}}
            onStatus={() => {}}
            onDelete={() => {}}
            onReportIssue={onReportIssue}
          />
        </div>
      </div>

      {/* Expanded: Data Source Table */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: isExpanded ? "1000px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className="border-t border-[var(--border-subtle)] px-5 pb-4 ml-8">
          {/* Syncing info — only shown in expanded view */}
          {effectiveStatus === "SYNCING" && (integration.connectedDate || integration.estimatedCompletionDate) && (
            <div className="mt-3 mb-1 flex items-center gap-3 text-[10px] text-[var(--text-dim)]">
              {integration.connectedDate && (
                <span className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 3v3.5l2 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Integrated {integration.connectedDate}
                </span>
              )}
              {integration.estimatedCompletionDate && (
                <span className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                    <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" />
                    <circle cx="6" cy="6" r="3" stroke="#a855f7" strokeWidth="1" />
                  </svg>
                  <span className="text-[#a855f7]">ETA {integration.estimatedCompletionDate}</span>
                </span>
              )}
            </div>
          )}

          {/* Alert if present */}
          {integration.alertMessage && (
            <div className={`mt-3 mb-3 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${
              integration.alertType === "error"
                ? "bg-[#ff2056]/5 border-[#ff2056]/20 text-[#ff2056]"
                : "bg-[#fe9a00]/5 border-[#fe9a00]/20 text-[#fe9a00]"
            }`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {integration.alertMessage}
            </div>
          )}

          {integration.accounts.length > 0 && (() => {
            const isAdChannel = integration.category === "Advertising";
            const gridCols = `minmax(160px, 1.5fr) 100px ${integration.accountColumns.map(() => "1fr").join(" ")}${isAdChannel ? " 100px 100px" : ""}`;
            return (
            <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
              {/* Header */}
              <div className={`grid border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]`} style={{ gridTemplateColumns: gridCols }}>
                <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Data Source</span></div>
                <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
                {integration.accountColumns.map((col) => (
                  <div key={col} className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">{col}</span></div>
                ))}
                {isAdChannel && (
                  <>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Earliest</span></div>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Latest</span></div>
                  </>
                )}
              </div>
              {/* Overall row */}
              {integration.accounts.length > 1 && (() => {
                const totals = aggregateMetrics(integration.accounts, integration.accountColumns);
                return (
                  <div className="grid border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]" style={{ gridTemplateColumns: gridCols }}>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-primary)] text-xs font-semibold">Overall</span></div>
                    <div className="px-4 py-2.5">
                      <span className="text-[var(--text-muted)] text-xs">{integration.accounts.length} data sources</span>
                    </div>
                    {integration.accountColumns.map((col) => (
                      <div key={col} className="px-4 py-2.5">
                        <span className={`text-xs font-semibold ${totals[col] && totals[col] !== "—" ? "text-[var(--text-primary)]" : "text-[var(--text-dim)]"}`}>
                          {totals[col]}
                        </span>
                      </div>
                    ))}
                    {isAdChannel && (
                      <>
                        <div className="px-4 py-2.5" />
                        <div className="px-4 py-2.5" />
                      </>
                    )}
                  </div>
                );
              })()}
              {/* Data Source rows */}
              {integration.accounts.map((account) => (
                <div key={account.name} className="grid border-b border-[var(--border-subtle)] last:border-b-0" style={{ gridTemplateColumns: gridCols }}>
                  <div className="px-4 py-2.5"><span className="text-[var(--text-primary)] text-xs">{account.name}</span></div>
                  <div className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${statusConfig[account.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[account.status].dotColor}`} />
                      {STATUS_LABELS[account.status]}
                    </span>
                  </div>
                  {integration.accountColumns.map((col) => (
                    <div key={col} className="px-4 py-2.5">
                      <span className={`text-xs ${account.metrics[col] && account.metrics[col] !== "—" ? "text-[#00bc7d] font-medium" : "text-[var(--text-dim)]"}`}>
                        {account.metrics[col] || "—"}
                      </span>
                    </div>
                  ))}
                  {isAdChannel && (
                    <>
                      <div className="px-4 py-2.5">
                        <span className={`text-xs ${account.earliestDate && account.earliestDate !== "—" ? "text-[#00bc7d] font-medium" : "text-[var(--text-dim)]"}`}>
                          {account.earliestDate || "—"}
                        </span>
                      </div>
                      <div className="px-4 py-2.5">
                        <span className={`text-xs ${account.latestDate && account.latestDate !== "—" ? "text-[#00bc7d] font-medium" : "text-[var(--text-dim)]"}`}>
                          {account.latestDate || "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
