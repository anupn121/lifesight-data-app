"use client";

import { useState, useRef, useEffect } from "react";
import {
  type IntegrationStatus,
  type ConnectionType,
  type IntegrationCategory,
  type AccountStatus,
  type SyncHealthStatus,
  type Integration,
  allIntegrations,
  heatmapDates,
  ALL_CATEGORIES,
  ALL_STATUSES,
} from "./monitoringData";

// ─── Status Config ──────────────────────────────────────────────────────────
const statusConfig: Record<IntegrationStatus, { color: string; dotColor: string; bg: string; borderColor: string }> = {
  Active: { color: "text-[#00bc7d]", dotColor: "bg-[#00bc7d]", bg: "", borderColor: "" },
  Warning: { color: "text-[#fe9a00]", dotColor: "bg-[#fe9a00]", bg: "bg-[#fe9a00]/5", borderColor: "border-[#fe9a00]/30" },
  Reconnect: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]", bg: "bg-[#ff2056]/5", borderColor: "border-[#ff2056]/30" },
  Failed: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]", bg: "bg-[#ff2056]/5", borderColor: "border-[#ff2056]/30" },
};

const accountStatusConfig: Record<AccountStatus, { color: string; dotColor: string }> = {
  Active: { color: "text-[#00bc7d]", dotColor: "bg-[#00bc7d]" },
  Stale: { color: "text-[#fe9a00]", dotColor: "bg-[#fe9a00]" },
  Inactive: { color: "text-[#71717a]", dotColor: "bg-[#71717a]" },
  Error: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]" },
};

const syncHealthConfig: Record<SyncHealthStatus, { bg: string; text: string; icon: string }> = {
  healthy: { bg: "bg-[#00bc7d]/15", text: "text-[#00bc7d]", icon: "\u2713" },
  warning: { bg: "bg-[#fe9a00]/15", text: "text-[#fe9a00]", icon: "\u26a0" },
  failed: { bg: "bg-[#ff2056]/15", text: "text-[#ff2056]", icon: "\u2717" },
};

// ─── Helper Components ──────────────────────────────────────────────────────
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block ml-1 opacity-40">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
    <path d="M7 9.5V7M7 4.5H7.005" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatusBadge = ({ status }: { status: IntegrationStatus }) => {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.borderColor || "border-current/20"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {status}
    </span>
  );
};

const AccountStatusBadge = ({ status }: { status: AccountStatus }) => {
  const cfg = accountStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {status}
    </span>
  );
};

// ─── Dropdown Components ────────────────────────────────────────────────────
function SingleSelectDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] bg-[#1f1f21] text-xs text-[#d1d5dc] hover:border-[#555] transition-colors"
      >
        <span className="text-[#71717a]">{label}:</span>
        <span>{value}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#1a1a1c] border border-[#333] rounded-lg shadow-xl z-50 min-w-[160px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${value === opt ? "text-white font-medium" : "text-[#9ca3af]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  label,
  selected,
  options,
  onChange,
}: {
  label: string;
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const displayText = selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] bg-[#1f1f21] text-xs text-[#d1d5dc] hover:border-[#555] transition-colors"
      >
        <span className="text-[#71717a]">{label}:</span>
        <span>{displayText}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#1a1a1c] border border-[#333] rounded-lg shadow-xl z-50 min-w-[200px] py-1 max-h-[280px] overflow-y-auto">
          <button
            onClick={() => onChange([])}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${selected.length === 0 ? "text-white font-medium" : "text-[#9ca3af]"}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${selected.length === 0 ? "bg-[#6941c6] border-[#6941c6] text-white" : "border-[#555]"}`}>
              {selected.length === 0 && "\u2713"}
            </span>
            All
          </button>
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${isChecked ? "text-white font-medium" : "text-[#9ca3af]"}`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${isChecked ? "bg-[#6941c6] border-[#6941c6] text-white" : "border-[#555]"}`}>
                  {isChecked && "\u2713"}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MonitoringTab() {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [connectionTypeFilter, setConnectionTypeFilter] = useState<"All" | ConnectionType>("All");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const toggleRow = (name: string) => {
    setExpandedRows((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // ─── Filtered integrations ──────────────────────────────────────────────
  const filtered = allIntegrations.filter((i) => {
    if (connectionTypeFilter !== "All" && i.connectionType !== connectionTypeFilter) return false;
    if (categoryFilter.length > 0 && !categoryFilter.includes(i.category)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(i.status)) return false;
    return true;
  });

  // ─── Derived counts ─────────────────────────────────────────────────────
  const needsAttention = allIntegrations.filter((i) => ["Warning", "Reconnect", "Failed"].includes(i.status));
  const attentionSources = needsAttention.filter((i) => i.connectionType === "Source").length;
  const attentionDests = needsAttention.filter((i) => i.connectionType === "Destination").length;

  const sources = allIntegrations.filter((i) => i.connectionType === "Source");
  const destinations = allIntegrations.filter((i) => i.connectionType === "Destination");

  const countByStatus = (list: Integration[]) => ({
    active: list.filter((i) => i.status === "Active").length,
    warning: list.filter((i) => i.status === "Warning").length,
    reconnect: list.filter((i) => i.status === "Reconnect").length,
    failed: list.filter((i) => i.status === "Failed").length,
  });

  const srcCounts = countByStatus(sources);
  const dstCounts = countByStatus(destinations);

  // Split filtered into groups
  const needsAttentionFiltered = filtered.filter((i) => ["Warning", "Reconnect", "Failed"].includes(i.status));
  const healthyFiltered = filtered.filter((i) => i.status === "Active");

  return (
    <div className="flex flex-col gap-5">

      {/* ─── 1. Alert Banner ─────────────────────────────────────────────── */}
      {needsAttention.length > 0 && (
        <div className="bg-[#0f0f10] border border-[#fe9a00]/20 rounded-2xl relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-[#fe9a00]" />
          <div className="px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#fe9a00]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="#FE9A00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white text-lg font-semibold">{needsAttention.length} Integration(s) need attention</p>
              <p className="text-[#9ca3af] text-sm">
                {attentionSources > 0 && `${attentionSources} source(s)`}
                {attentionSources > 0 && attentionDests > 0 && " \u00b7 "}
                {attentionDests > 0 && `${attentionDests} destination(s)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. Summary Stats Row ────────────────────────────────────────── */}
      <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-5">
        <div className="flex gap-12">
          <div>
            <p className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider mb-2">Sources <InfoIcon /></p>
            <div className="flex items-center gap-4 flex-wrap">
              {srcCounts.active > 0 && <StatusDot color="bg-[#00bc7d]" label={`${srcCounts.active} Active`} />}
              {srcCounts.warning > 0 && <StatusDot color="bg-[#fe9a00]" label={`${srcCounts.warning} Warning`} />}
              {srcCounts.reconnect > 0 && <StatusDot color="bg-[#ff2056]" label={`${srcCounts.reconnect} Reconnect`} />}
              {srcCounts.failed > 0 && <StatusDot color="bg-[#ff2056]" label={`${srcCounts.failed} Failed`} />}
            </div>
          </div>
          <div className="border-l border-[#1f1f21] pl-12">
            <p className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider mb-2">Destinations <InfoIcon /></p>
            <div className="flex items-center gap-4 flex-wrap">
              {dstCounts.active > 0 && <StatusDot color="bg-[#00bc7d]" label={`${dstCounts.active} Active`} />}
              {dstCounts.warning > 0 && <StatusDot color="bg-[#fe9a00]" label={`${dstCounts.warning} Warning`} />}
              {dstCounts.reconnect > 0 && <StatusDot color="bg-[#ff2056]" label={`${dstCounts.reconnect} Reconnect`} />}
              {dstCounts.failed > 0 && <StatusDot color="bg-[#ff2056]" label={`${dstCounts.failed} Failed`} />}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Filter Bar ───────────────────────────────────────────────── */}
      <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4">
        <div className="flex items-center gap-2">
          <SingleSelectDropdown
            label="Connection Type"
            value={connectionTypeFilter}
            options={["All", "Source", "Destination"]}
            onChange={(v) => setConnectionTypeFilter(v as "All" | ConnectionType)}
          />
          <MultiSelectDropdown
            label="Category"
            selected={categoryFilter}
            options={ALL_CATEGORIES as unknown as string[]}
            onChange={setCategoryFilter}
          />
          <MultiSelectDropdown
            label="Status"
            selected={statusFilter}
            options={ALL_STATUSES as unknown as string[]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* ─── 4. Sync Health Timeline (Heatmap) ───────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#6941c6] rounded-full" />
          <h3 className="text-white text-lg font-semibold">Sync Health Timeline</h3>
          <InfoIcon />
        </div>
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-6">
          {/* Header row */}
          <div className="grid gap-1" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
            <div />
            {heatmapDates.map((d) => (
              <div key={d} className="text-center text-[#71717a] text-[10px] font-medium pb-2">{d}</div>
            ))}
          </div>
          {/* Data rows */}
          {filtered.map((integration) => {
            const sCfg = statusConfig[integration.status];
            return (
              <div key={integration.name} className="grid gap-1 mb-1" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
                <div className="flex items-center gap-2 pr-3">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sCfg.dotColor}`} />
                  <span className="text-[#d1d5dc] text-xs truncate">{integration.name}</span>
                </div>
                {integration.syncHealthDays.map((status, idx) => {
                  const hCfg = syncHealthConfig[status];
                  return (
                    <div key={idx} className={`${hCfg.bg} rounded flex items-center justify-center py-2`}>
                      <span className={`text-xs font-medium ${hCfg.text}`}>{hCfg.icon}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-white/5">
            <span className="inline-flex items-center gap-1.5 text-[#9ca3af] text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00bc7d]/30" /> Healthy
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#9ca3af] text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#fe9a00]/30" /> Warning
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#9ca3af] text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ff2056]/30" /> Failed
            </span>
          </div>
        </div>
      </div>

      {/* ─── 5. Integrations List ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#6941c6] rounded-full" />
          <h3 className="text-white text-lg font-semibold">Integrations ({filtered.length})</h3>
          <InfoIcon />
        </div>

        {/* Needs Attention Group */}
        {needsAttentionFiltered.length > 0 && (
          <div className="mb-4">
            <p className="text-[#fe9a00] text-[10px] font-semibold uppercase tracking-wider mb-2">Needs Attention</p>
            <div className="flex flex-col gap-3">
              {needsAttentionFiltered.map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isExpanded={expandedRows[integration.name] ?? false}
                  onToggle={() => toggleRow(integration.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Healthy Group */}
        {healthyFiltered.length > 0 && (
          <div>
            <p className="text-[#00bc7d] text-[10px] font-semibold uppercase tracking-wider mb-2">Healthy</p>
            <div className="flex flex-col gap-3">
              {healthyFiltered.map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isExpanded={expandedRows[integration.name] ?? false}
                  onToggle={() => toggleRow(integration.name)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StatusDot inline ───────────────────────────────────────────────────────
function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[#9ca3af] text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

// ─── Integration Card ───────────────────────────────────────────────────────
function IntegrationCard({
  integration,
  isExpanded,
  onToggle,
}: {
  integration: Integration;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cfg = statusConfig[integration.status];
  const isFailed = integration.status === "Failed";

  return (
    <div className={`bg-[#0f0f10] border rounded-xl overflow-hidden ${cfg.borderColor || "border-[#1f1f21]"}`}>
      {/* Collapsed Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${integration.color}20` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: integration.color }}>
              <span className="text-[8px] text-white font-bold">{integration.icon}</span>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{integration.name}</span>
              <span className="bg-[#1f1f21] text-[#9ca3af] text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase">
                {integration.connectionType}
              </span>
            </div>
            <span className="text-[#71717a] text-xs">{integration.subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={integration.status} />
          <ChevronDown open={isExpanded} />
        </div>
      </button>

      {/* Expanded Detail */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: isExpanded ? "1200px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className="border-t border-white/5 px-5 pb-5">
          {/* Alert banner */}
          {integration.alertMessage && (
            <div className={`${integration.alertType === "error" ? "bg-[#ff2056]/10 border-[#ff2056]/20" : "bg-[#fe9a00]/10 border-[#fe9a00]/20"} border rounded-lg px-4 py-3 mt-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 5.33V8M8 10.67H8.007M14.67 8C14.67 11.68 11.68 14.67 8 14.67C4.32 14.67 1.33 11.68 1.33 8C1.33 4.32 4.32 1.33 8 1.33C11.68 1.33 14.67 4.32 14.67 8Z" stroke={integration.alertType === "error" ? "#FF2056" : "#FE9A00"} strokeWidth="1.33" strokeLinecap="round" />
                </svg>
                <span className={`text-xs ${integration.alertType === "error" ? "text-[#ff6b8a]" : "text-[#fbbf24]"}`}>
                  {integration.alertMessage}
                </span>
              </div>
              <button className={`${integration.alertType === "error" ? "bg-[#ff2056] hover:bg-[#e01b4c]" : "bg-[#fe9a00] hover:bg-[#e58a00]"} text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors`}>
                {integration.alertType === "error" ? "View Error" : "Check Status"}
              </button>
            </div>
          )}

          {/* Overview Metrics Header */}
          <div className="flex items-center gap-3 mt-4 mb-3">
            <p className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider">
              {isFailed ? "Last Known Metrics (Stale)" : "Overview Metrics (Last 24h)"}
            </p>
            {isFailed && (
              <span className="bg-[#ff2056]/10 text-[#ff6b8a] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#ff2056]/20">
                Data frozen since {integration.latestDate}
              </span>
            )}
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-4 gap-3">
            {integration.overviewMetrics.map((metric) => (
              <div key={metric.label} className="bg-[#161618] border border-[#1f1f21] rounded-lg p-4">
                <p className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider mb-1">{metric.label}</p>
                <p className={`text-xl font-bold ${isFailed ? "text-[#71717a]" : "text-white"}`}>{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Date Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Earliest Date", value: integration.earliestDate },
              { label: "Latest Date", value: integration.latestDate },
              { label: "Reliable Through", value: integration.reliableThrough },
            ].map((item) => (
              <div key={item.label} className="bg-[#161618] border border-[#1f1f21] rounded-lg p-4">
                <p className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider mb-1">{item.label} <InfoIcon /></p>
                <p className={`text-sm font-semibold ${item.label === "Reliable Through" && item.value !== integration.latestDate ? "text-[#00bc7d]" : "text-white"}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Account Table */}
          {integration.accounts.length > 0 && (
            <div className="border border-[#1f1f21] rounded-lg overflow-hidden mt-4">
              <div className="grid border-b border-[#eaecf0]/10 bg-[#161618]" style={{ gridTemplateColumns: `2fr 1fr 1.5fr 1fr ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
                <div className="px-4 py-2.5"><span className="text-[#475467] text-[10px] font-semibold uppercase tracking-wider">Account</span></div>
                <div className="px-4 py-2.5"><span className="text-[#475467] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
                <div className="px-4 py-2.5"><span className="text-[#475467] text-[10px] font-semibold uppercase tracking-wider">Last Refreshed</span></div>
                <div className="px-4 py-2.5"><span className="text-[#475467] text-[10px] font-semibold uppercase tracking-wider">Data Until</span></div>
                {integration.accountColumns.map((col) => (
                  <div key={col} className="px-4 py-2.5"><span className="text-[#475467] text-[10px] font-semibold uppercase tracking-wider">{col}</span></div>
                ))}
              </div>
              {integration.accounts.map((account) => (
                <div key={account.name} className="grid border-b border-white/5 last:border-b-0" style={{ gridTemplateColumns: `2fr 1fr 1.5fr 1fr ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
                  <div className="px-4 py-2.5"><span className="text-white text-xs">{account.name}</span></div>
                  <div className="px-4 py-2.5"><AccountStatusBadge status={account.status} /></div>
                  <div className="px-4 py-2.5"><span className="text-[#d1d5dc] text-xs">{account.lastRefreshed}</span></div>
                  <div className="px-4 py-2.5">
                    <span className={`text-xs ${account.status === "Active" ? "text-[#00bc7d]" : "text-[#fe9a00]"}`}>
                      {account.dataUntil}
                    </span>
                  </div>
                  {integration.accountColumns.map((col) => (
                    <div key={col} className="px-4 py-2.5"><span className="text-[#d1d5dc] text-xs">{account.metrics[col] || "\u2014"}</span></div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* View Details */}
          <div className="flex justify-end mt-4">
            <button className="flex items-center gap-2 bg-[#1f1f21] border border-[#333] rounded-lg px-4 py-2 text-[#d1d5dc] text-xs font-medium hover:bg-[#2a2a2d] transition-colors">
              View Details
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
