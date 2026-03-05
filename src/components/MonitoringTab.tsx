"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  type IntegrationStatus,
  type IntegrationCategory,
  type AccountStatus,
  type Integration,
  allIntegrations,
  ALL_CATEGORIES,
  ALL_STATUSES,
  STATUS_LABELS,
} from "./monitoringData";

// ─── Status Config ──────────────────────────────────────────────────────────
const statusConfig: Record<IntegrationStatus, { color: string; dotColor: string; bg: string; borderColor: string }> = {
  NOT_CONNECTED: { color: "text-[#71717a]", dotColor: "bg-[#71717a]", bg: "", borderColor: "" },
  SETUP_INCOMPLETE: { color: "text-[#fe9a00]", dotColor: "bg-[#fe9a00]", bg: "bg-[#fe9a00]/5", borderColor: "border-[#fe9a00]/30" },
  SYNCING: { color: "text-[#a855f7]", dotColor: "bg-[#a855f7]", bg: "bg-[#a855f7]/5", borderColor: "border-[#a855f7]/30" },
  CONNECTED: { color: "text-[#00bc7d]", dotColor: "bg-[#00bc7d]", bg: "", borderColor: "" },
  SYNC_ERROR: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]", bg: "bg-[#ff2056]/5", borderColor: "border-[#ff2056]/30" },
  ACTION_REQUIRED: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]", bg: "bg-[#ff2056]/5", borderColor: "border-[#ff2056]/30" },
};

const accountStatusConfig: Record<AccountStatus, { color: string; dotColor: string }> = {
  NOT_CONNECTED: { color: "text-[var(--text-dim)]", dotColor: "bg-[#71717a]" },
  SETUP_INCOMPLETE: { color: "text-[#fe9a00]", dotColor: "bg-[#fe9a00]" },
  SYNCING: { color: "text-[#a855f7]", dotColor: "bg-[#a855f7]" },
  CONNECTED: { color: "text-[#00bc7d]", dotColor: "bg-[#00bc7d]" },
  SYNC_ERROR: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]" },
  ACTION_REQUIRED: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]" },
};

const ATTENTION_STATUSES: IntegrationStatus[] = ["SYNC_ERROR", "ACTION_REQUIRED", "SETUP_INCOMPLETE"];

// ─── Status Legend Data ─────────────────────────────────────────────────────
const statusLegendItems: {
  status: string;
  dotColor: string;
  description: string;
  requiresAction: boolean;
  shownIn: string;
}[] = [
  { status: "Not Connected", dotColor: "bg-[#71717a]", description: "This integration is available but hasn't been set up yet.", requiresAction: false, shownIn: "Monitoring & Integrations" },
  { status: "Setup Incomplete", dotColor: "bg-[#fe9a00]", description: "You started connecting this source but didn't finish. Resume setup to start syncing.", requiresAction: true, shownIn: "Monitoring & Integrations" },
  { status: "Syncing", dotColor: "bg-[#a855f7]", description: "Your data is being pulled in. This may take a few minutes for the initial sync.", requiresAction: false, shownIn: "Monitoring & Integrations" },
  { status: "Connected", dotColor: "bg-[#00bc7d]", description: "Everything is working. Your data is up to date.", requiresAction: false, shownIn: "Monitoring & Integrations" },
  { status: "Sync Error", dotColor: "bg-[#ff2056]", description: "Something went wrong during the last sync. We're looking into it — no action needed from you.", requiresAction: false, shownIn: "Monitoring & Integrations" },
  { status: "Action Required", dotColor: "bg-[#ff2056]", description: "There's an issue that needs your attention. Check the details below to resolve it.", requiresAction: true, shownIn: "Monitoring & Integrations" },
];

// ─── Helper Components ──────────────────────────────────────────────────────
const InfoIcon = ({ tooltip }: { tooltip?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block ml-1 opacity-40 cursor-help" {...(tooltip ? { title: tooltip } : {})}>
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
      {STATUS_LABELS[status]}
    </span>
  );
};

const AccountStatusBadge = ({ status }: { status: AccountStatus }) => {
  const cfg = accountStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {STATUS_LABELS[status]}
    </span>
  );
};

// ─── Status Legend Button ───────────────────────────────────────────────────
function StatusLegendButton() {
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-medium hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
          <path d="M6 8.5V6M6 3.5H6.005" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Status Guide
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-[var(--dropdown-bg)] border border-[var(--border-secondary)] rounded-xl shadow-xl z-50 w-[340px] py-3 px-4">
          <p className="text-[var(--text-primary)] text-xs font-semibold mb-3">Integration Statuses</p>
          <div className="flex flex-col gap-2.5">
            {statusLegendItems.map((item) => (
              <div key={item.status} className="flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${item.dotColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] text-xs font-medium">{item.status}</span>
                    {item.requiresAction && (
                      <span className="text-[#fe9a00] text-[9px] font-semibold bg-[#fe9a00]/10 px-1.5 py-0.5 rounded-full">Requires Action</span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)] text-[10px] mt-0.5">{item.description}</p>
                  <p className="text-[var(--text-dim)] text-[9px] mt-0.5">{item.shownIn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Group Header ───────────────────────────────────────────────────────────
function GroupHeader({ accentColor, label, count, description }: { accentColor: string; label: string; count: number; description: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`w-1 h-4 rounded-full ${accentColor}`} />
      <span className="text-[var(--text-primary)] text-sm font-semibold">{label}</span>
      <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{count}</span>
      <span className="text-[var(--text-dim)] text-[10px]">{description}</span>
    </div>
  );
}

// ─── Dropdown Components ────────────────────────────────────────────────────
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-badge)] text-xs text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors"
      >
        <span className="text-[var(--text-dim)]">{label}:</span>
        <span>{displayText}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--dropdown-bg)] border border-[var(--border-secondary)] rounded-lg shadow-xl z-50 min-w-[200px] py-1 max-h-[280px] overflow-y-auto">
          <button
            onClick={() => onChange([])}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2 ${selected.length === 0 ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${selected.length === 0 ? "bg-[#6941c6] border-[#6941c6] text-[var(--text-primary)]" : "border-[var(--border-secondary)]"}`}>
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
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2 ${isChecked ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${isChecked ? "bg-[#6941c6] border-[#6941c6] text-[var(--text-primary)]" : "border-[var(--border-secondary)]"}`}>
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
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [attentionExpanded, setAttentionExpanded] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleRow = (name: string) => {
    setExpandedRows((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const scrollToIntegration = useCallback((name: string) => {
    setExpandedRows((prev) => ({ ...prev, [name]: true }));
    setTimeout(() => {
      cardRefs.current[name]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // ─── Filtered integrations ──────────────────────────────────────────────
  const filtered = allIntegrations.filter((i) => {
    if (categoryFilter.length > 0 && !categoryFilter.includes(i.category)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(STATUS_LABELS[i.status])) return false;
    return true;
  });

  // ─── Derived counts ─────────────────────────────────────────────────────
  const attentionOrder: Record<string, number> = { ACTION_REQUIRED: 0, SYNC_ERROR: 1, SETUP_INCOMPLETE: 2 };
  const needsAttention = allIntegrations
    .filter((i) => ATTENTION_STATUSES.includes(i.status))
    .sort((a, b) => (attentionOrder[a.status] ?? 99) - (attentionOrder[b.status] ?? 99));
  const attentionSources = needsAttention.filter((i) => i.connectionType === "Source").length;
  const attentionDests = needsAttention.filter((i) => i.connectionType === "Destination").length;

  const sources = allIntegrations.filter((i) => i.connectionType === "Source");
  const destinations = allIntegrations.filter((i) => i.connectionType === "Destination");

  const countByStatus = (list: Integration[]) => ({
    connected: list.filter((i) => i.status === "CONNECTED").length,
    syncing: list.filter((i) => i.status === "SYNCING").length,
    syncError: list.filter((i) => i.status === "SYNC_ERROR").length,
    actionRequired: list.filter((i) => i.status === "ACTION_REQUIRED").length,
    setupIncomplete: list.filter((i) => i.status === "SETUP_INCOMPLETE").length,
    notConnected: list.filter((i) => i.status === "NOT_CONNECTED").length,
  });

  const srcCounts = countByStatus(sources);
  const dstCounts = countByStatus(destinations);

  // Split filtered into groups
  const needsAttentionFiltered = filtered
    .filter((i) => ATTENTION_STATUSES.includes(i.status))
    .sort((a, b) => (attentionOrder[a.status] ?? 99) - (attentionOrder[b.status] ?? 99));
  const syncInProgressFiltered = filtered.filter((i) => i.status === "SYNCING");
  const healthyFiltered = filtered.filter((i) => i.status === "CONNECTED");

  return (
    <div className="flex flex-col gap-5">

      {/* ─── 1. Alert Banner (collapsible) ─────────────────────────────── */}
      {needsAttention.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[#fe9a00]/20 rounded-2xl relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-[#fe9a00]" />
          <button
            type="button"
            onClick={() => setAttentionExpanded((prev) => !prev)}
            className="w-full px-6 py-5 flex items-center gap-4 text-left cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#fe9a00]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="#FE9A00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-primary)] text-lg font-semibold">{needsAttention.length} Integration(s) need attention</p>
              <p className="text-[var(--text-muted)] text-sm">
                {attentionSources > 0 && `${attentionSources} source(s)`}
                {attentionSources > 0 && attentionDests > 0 && " \u00b7 "}
                {attentionDests > 0 && `${attentionDests} destination(s)`}
              </p>
            </div>
            <ChevronDown open={attentionExpanded} />
          </button>
          {attentionExpanded && (
            <div className="px-6 pb-5 flex flex-col gap-2">
              {needsAttention.map((integration) => {
                const cfg = statusConfig[integration.status];
                return (
                  <div
                    key={integration.name}
                    className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg px-4 py-3 flex items-center gap-3"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}20` }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: integration.color }}>
                        <span className="text-[6px] text-white font-bold">{integration.icon}</span>
                      </div>
                    </div>
                    <span className="text-[var(--text-primary)] text-sm font-semibold whitespace-nowrap">{integration.name}</span>
                    <StatusBadge status={integration.status} />
                    <span className="text-[var(--text-dim)] text-xs truncate flex-1 min-w-0">
                      {integration.status === "SYNC_ERROR"
                        ? `Something went wrong on our end — data reliable through ${integration.reliableThrough}`
                        : integration.alertMessage || integration.subtitle}
                    </span>
                    <button
                      onClick={() => scrollToIntegration(integration.name)}
                      className="flex-shrink-0 text-[#6941c6] hover:text-[#7c5bd2] text-xs font-medium px-3 py-1.5 rounded-lg border border-[#6941c6]/30 hover:border-[#6941c6]/50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 2. Summary Stats Row ────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
        <div className="flex gap-12">
          <div>
            <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-2">Sources <InfoIcon tooltip="Status breakdown of all connected source integrations" /></p>
            <div className="flex items-center gap-4 flex-wrap">
              {srcCounts.connected > 0 && <StatusDot color="bg-[#00bc7d]" label={`${srcCounts.connected} Connected`} />}
              {srcCounts.syncing > 0 && <StatusDot color="bg-[#a855f7]" label={`${srcCounts.syncing} Syncing`} />}
              {srcCounts.syncError > 0 && <StatusDot color="bg-[#ff2056]" label={`${srcCounts.syncError} Sync Error`} />}
              {srcCounts.actionRequired > 0 && <StatusDot color="bg-[#ff2056]" label={`${srcCounts.actionRequired} Action Required`} />}
              {srcCounts.setupIncomplete > 0 && <StatusDot color="bg-[#fe9a00]" label={`${srcCounts.setupIncomplete} Setup Incomplete`} />}
              {srcCounts.notConnected > 0 && <StatusDot color="bg-[#71717a]" label={`${srcCounts.notConnected} Not Connected`} />}
            </div>
          </div>
          <div className="border-l border-[var(--border-primary)] pl-12">
            <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-2">Destinations <InfoIcon tooltip="Status breakdown of all connected destination integrations" /></p>
            <div className="flex items-center gap-4 flex-wrap">
              {dstCounts.connected > 0 && <StatusDot color="bg-[#00bc7d]" label={`${dstCounts.connected} Connected`} />}
              {dstCounts.syncing > 0 && <StatusDot color="bg-[#a855f7]" label={`${dstCounts.syncing} Syncing`} />}
              {dstCounts.syncError > 0 && <StatusDot color="bg-[#ff2056]" label={`${dstCounts.syncError} Sync Error`} />}
              {dstCounts.actionRequired > 0 && <StatusDot color="bg-[#ff2056]" label={`${dstCounts.actionRequired} Action Required`} />}
              {dstCounts.setupIncomplete > 0 && <StatusDot color="bg-[#fe9a00]" label={`${dstCounts.setupIncomplete} Setup Incomplete`} />}
              {dstCounts.notConnected > 0 && <StatusDot color="bg-[#71717a]" label={`${dstCounts.notConnected} Not Connected`} />}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Filter Bar ───────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
        <div className="flex items-center gap-2">
          <MultiSelectDropdown
            label="Category"
            selected={categoryFilter}
            options={ALL_CATEGORIES as unknown as string[]}
            onChange={setCategoryFilter}
          />
          <MultiSelectDropdown
            label="Status"
            selected={statusFilter}
            options={ALL_STATUSES.map((s) => STATUS_LABELS[s])}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* ─── 4. Integrations List ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#6941c6] rounded-full" />
            <h3 className="text-[var(--text-primary)] text-lg font-semibold">Integrations ({filtered.length})</h3>
            <InfoIcon tooltip="Detailed view of each integration with accounts, metrics, and sync status" />
          </div>
          <StatusLegendButton />
        </div>

        {/* Needs Attention Group */}
        {needsAttentionFiltered.length > 0 && (
          <div className="mb-5">
            <GroupHeader
              accentColor="bg-[#fe9a00]"
              label="Needs Attention"
              count={needsAttentionFiltered.length}
              description="Integrations requiring immediate action"
            />
            <div className="flex flex-col gap-3">
              {needsAttentionFiltered.map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isExpanded={expandedRows[integration.name] ?? false}
                  onToggle={() => toggleRow(integration.name)}
                  cardRef={(el) => { cardRefs.current[integration.name] = el; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sync in Progress Group */}
        {syncInProgressFiltered.length > 0 && (
          <div className="mb-5">
            <GroupHeader
              accentColor="bg-[#a855f7]"
              label="Sync in Progress"
              count={syncInProgressFiltered.length}
              description="Initial sync underway — data available soon"
            />
            <div className="flex flex-col gap-3">
              {syncInProgressFiltered.map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isExpanded={expandedRows[integration.name] ?? false}
                  onToggle={() => toggleRow(integration.name)}
                  cardRef={(el) => { cardRefs.current[integration.name] = el; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Healthy Group */}
        {healthyFiltered.length > 0 && (
          <div>
            <GroupHeader
              accentColor="bg-[#00bc7d]"
              label="Healthy"
              count={healthyFiltered.length}
              description="All syncs running normally"
            />
            <div className="flex flex-col gap-3">
              {healthyFiltered.map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isExpanded={expandedRows[integration.name] ?? false}
                  onToggle={() => toggleRow(integration.name)}
                  cardRef={(el) => { cardRefs.current[integration.name] = el; }}
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
    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
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
  cardRef,
}: {
  integration: Integration;
  isExpanded: boolean;
  onToggle: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  const cfg = statusConfig[integration.status];
  const isSyncError = integration.status === "SYNC_ERROR";
  const isFailed = isSyncError || integration.status === "ACTION_REQUIRED";
  const isSyncing = integration.status === "SYNCING";

  return (
    <div ref={cardRef} className={`bg-[var(--bg-card)] border rounded-xl overflow-hidden ${cfg.borderColor || "border-[var(--border-primary)]"}`}>
      {/* Collapsed Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--hover-bg)] transition-colors"
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
              <span className="text-[var(--text-primary)] text-sm font-semibold">{integration.name}</span>
              <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase">
                {integration.connectionType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-dim)] text-xs">{integration.subtitle}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-badge)] border border-[var(--border-secondary)] text-[var(--text-dim)] text-[10px]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
                  <path d="M5 2.5V5L6.5 6.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                </svg>
                {integration.refreshFrequency}
              </span>
            </div>
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
        <div className="border-t border-[var(--border-subtle)] px-5 pb-5">
          {/* Sync Error banner — reassuring, with data boundary dates */}
          {isSyncError && (
            <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-xl px-5 py-5 mt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#ff2056]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 5.33V8M8 10.67H8.007M14.67 8C14.67 11.68 11.68 14.67 8 14.67C4.32 14.67 1.33 11.68 1.33 8C1.33 4.32 4.32 1.33 8 1.33C11.68 1.33 14.67 4.32 14.67 8Z" stroke="#FF2056" strokeWidth="1.33" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-semibold">We're on it</p>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5 leading-relaxed">Something went wrong on our end. No action needed from you — we're working on a fix and will update you once it's resolved.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg px-4 py-3">
                  <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">Data reliable through</p>
                  <p className="text-[#00bc7d] text-sm font-semibold">{integration.reliableThrough}</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg px-4 py-3">
                  <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">Syncing paused since</p>
                  <p className="text-[#ff2056] text-sm font-semibold">{integration.latestDate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alert banner for non-sync-error statuses */}
          {!isSyncError && integration.alertMessage && (
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
                Check Status
              </button>
            </div>
          )}

          {/* Sync-in-Progress view */}
          {isSyncing ? (
            <SyncInProgressPanel integration={integration} />
          ) : (
            <>
              {/* Overview Metrics Header */}
              <div className="mt-4 mb-3">
                <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">
                  {isSyncError ? "Last Synced Metrics" : isFailed ? "Last Known Metrics (Stale)" : "Overview Metrics"}
                </p>
                {integration.metricsDateRange && integration.metricsDateRange !== "—" && (
                  <p className={`text-[10px] mt-0.5 ${isFailed && !isSyncError ? "text-[#ff6b8a]" : "text-[var(--text-dim)]"}`}>
                    {integration.metricsDateRange}
                  </p>
                )}
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-4 gap-3">
                {integration.overviewMetrics.map((metric) => (
                  <div key={metric.label} className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-4">
                    <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">{metric.label}</p>
                    <p className={`text-xl font-bold ${isFailed ? "text-[var(--text-dim)]" : "text-[var(--text-primary)]"}`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Date Coverage with Timezone */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Date Coverage</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--bg-badge)] border border-[var(--border-secondary)] text-[var(--text-dim)] text-[9px] font-medium">
                    {integration.timezone}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Earliest Date", value: integration.earliestDate, tooltip: "The oldest date with available data from this integration" },
                    { label: "Latest Date", value: integration.latestDate, tooltip: "The most recent date with synced data" },
                    { label: "Reliable Through", value: integration.reliableThrough, tooltip: "Data is considered complete and accurate up to this date" },
                  ].map((item) => (
                    <div key={item.label} className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-4">
                      <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">{item.label} <InfoIcon tooltip={item.tooltip} /></p>
                      <p className={`text-sm font-semibold ${item.label === "Reliable Through" && item.value !== integration.latestDate ? "text-[#00bc7d]" : "text-[var(--text-primary)]"}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Table */}
              {integration.accounts.length > 0 && (
                <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden mt-4">
                  <div className="grid border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]" style={{ gridTemplateColumns: `2fr 1fr 1.5fr 1fr ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Account</span></div>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Last Refreshed</span></div>
                    <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Data Until</span></div>
                    {integration.accountColumns.map((col) => (
                      <div key={col} className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">{col}</span></div>
                    ))}
                  </div>
                  {integration.accounts.map((account) => (
                    <div key={account.name} className="grid border-b border-[var(--border-subtle)] last:border-b-0" style={{ gridTemplateColumns: `2fr 1fr 1.5fr 1fr ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
                      <div className="px-4 py-2.5"><span className="text-[var(--text-primary)] text-xs">{account.name}</span></div>
                      <div className="px-4 py-2.5"><AccountStatusBadge status={account.status} /></div>
                      <div className="px-4 py-2.5"><span className={`text-xs ${account.lastRefreshed === "Not selected" ? "text-[var(--text-dim)] italic" : "text-[var(--text-secondary)]"}`}>{account.lastRefreshed}</span></div>
                      <div className="px-4 py-2.5">
                        <span className={`text-xs ${account.status === "CONNECTED" ? "text-[#00bc7d]" : account.dataUntil === "—" ? "text-[var(--text-dim)]" : "text-[#fe9a00]"}`}>
                          {account.dataUntil}
                        </span>
                      </div>
                      {integration.accountColumns.map((col) => (
                        <div key={col} className="px-4 py-2.5"><span className={`text-xs ${account.metrics[col] === "—" ? "text-[var(--text-dim)]" : "text-[var(--text-secondary)]"}`}>{account.metrics[col] || "\u2014"}</span></div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* View Details */}
          <div className="flex justify-end mt-4">
            <button className="flex items-center gap-2 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg px-4 py-2 text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--hover-item)] transition-colors">
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

// ─── Sync-in-Progress Panel ─────────────────────────────────────────────────
function SyncInProgressPanel({ integration }: { integration: Integration }) {
  return (
    <div className="mt-4">
      {/* Progress Panel */}
      <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#a855f7]/15 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-spin">
              <path d="M10 2V4M10 16V18M4 10H2M18 10H16M5.17 5.17L3.76 3.76M16.24 3.76L14.83 5.17M14.83 14.83L16.24 16.24M3.76 16.24L5.17 14.83" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[var(--text-primary)] text-sm font-semibold">Initial Sync in Progress</p>
            <p className="text-[var(--text-muted)] text-xs">Historical data is being pulled. Metrics will appear once the sync completes.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Sync Progress</span>
            <span className="text-[#a855f7] text-xs font-medium">~60%</span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-card-inner)] rounded-full overflow-hidden">
            <div className="h-full bg-[#a855f7] rounded-full transition-all" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-3">
            <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">Connected Date</p>
            <p className="text-[var(--text-primary)] text-sm font-semibold">{integration.connectedDate}</p>
          </div>
          <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-3">
            <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider mb-1">Estimated Completion</p>
            <p className="text-[#a855f7] text-sm font-semibold">{integration.estimatedCompletionDate}</p>
          </div>
        </div>
      </div>

      {/* Simplified Account Table */}
      {integration.accounts.length > 0 && (
        <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden mt-4">
          <div className="grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]">
            <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Account</span></div>
            <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
            <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Sync State</span></div>
          </div>
          {integration.accounts.map((account) => (
            <div key={account.name} className="grid grid-cols-3 border-b border-[var(--border-subtle)] last:border-b-0">
              <div className="px-4 py-2.5"><span className="text-[var(--text-primary)] text-xs">{account.name}</span></div>
              <div className="px-4 py-2.5"><AccountStatusBadge status={account.status} /></div>
              <div className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[#a855f7] text-xs">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
                    <path d="M6 1V2.5M6 9.5V11M2.5 6H1M11 6H9.5M3.17 3.17L2.11 2.11M9.89 2.11L8.83 3.17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  Syncing...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
