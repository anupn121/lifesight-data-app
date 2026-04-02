"use client";

import { useState } from "react";
import type { Integration, CatalogIntegration } from "../monitoringData";
import { STATUS_LABELS } from "../monitoringData";
import { IntegrationIcon } from "./icons";
import { statusConfig } from "./statusConfig";
import { heatmapDates } from "../monitoringData";

type DetailTab = "overview" | "status" | "configure";

const heatmapColor: Record<string, string> = {
  healthy: "bg-[#00bc7d]",
  warning: "bg-[#fe9a00]",
  failed: "bg-[#ff2056]",
  pending: "bg-[var(--bg-badge)]",
};

export default function DetailView({
  integration,
  catalogEntry,
  onBack,
}: {
  integration: Integration;
  catalogEntry?: CatalogIntegration;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "status", label: "Status" },
    { id: "configure", label: "Configure" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[#027b8e] hover:text-[#02899e] text-sm font-medium transition-colors self-start"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Integrations
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        {catalogEntry ? (
          <IntegrationIcon integration={catalogEntry} />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${integration.color}18` }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: integration.color }}>
              <span className="text-[8px] text-white font-bold">{integration.icon}</span>
            </div>
          </div>
        )}
        <div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">{integration.name}</h2>
          <p className="text-[var(--text-muted)] text-xs">{integration.subtitle}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${statusConfig[integration.status].color} ${statusConfig[integration.status].borderColor || "border-current/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[integration.status].dotColor}`} />
            {STATUS_LABELS[integration.status]}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t.id
                ? "text-[#027b8e]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#027b8e] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab integration={integration} />}
      {tab === "status" && <StatusTab integration={integration} />}
      {tab === "configure" && <ConfigureTab integration={integration} />}
    </div>
  );
}

function OverviewTab({ integration }: { integration: Integration }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Earliest Date", value: integration.earliestDate },
          { label: "Latest Date", value: integration.latestDate },
          { label: "Refresh Frequency", value: integration.refreshFrequency },
          { label: "Timezone", value: integration.timezone },
        ].map((card) => (
          <div key={card.label} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-4 py-3">
            <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">{card.label}</span>
            <span className="text-[#00bc7d] text-sm font-semibold">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Overview metrics */}
      {integration.overviewMetrics.length > 0 && (
        <div>
          <span className="text-[var(--text-primary)] text-sm font-semibold mb-3 block">Overview Metrics</span>
          <div className="grid grid-cols-4 gap-3">
            {integration.overviewMetrics.map((m) => (
              <div key={m.label} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-4 py-3">
                <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">{m.label}</span>
                <span className="text-[#00bc7d] text-lg font-bold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accounts table */}
      {integration.accounts.length > 0 && (
        <div>
          <span className="text-[var(--text-primary)] text-sm font-semibold mb-3 block">Accounts</span>
          <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
            <div className="grid bg-[var(--bg-card-inner)] border-b border-[var(--border-subtle)]" style={{ gridTemplateColumns: `minmax(160px, 1.5fr) 100px ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
              <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Account</span></div>
              <div className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Status</span></div>
              {integration.accountColumns.map((col) => (
                <div key={col} className="px-4 py-2.5"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">{col}</span></div>
              ))}
            </div>
            {integration.accounts.map((account) => (
              <div key={account.name} className="grid border-b border-[var(--border-subtle)] last:border-b-0" style={{ gridTemplateColumns: `minmax(160px, 1.5fr) 100px ${integration.accountColumns.map(() => "1fr").join(" ")}` }}>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusTab({ integration }: { integration: Integration }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Alert */}
      {integration.alertMessage && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${
          integration.alertType === "error"
            ? "bg-[#ff2056]/5 border-[#ff2056]/20 text-[#ff2056]"
            : "bg-[#fe9a00]/5 border-[#fe9a00]/20 text-[#fe9a00]"
        }`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM8 4.5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {integration.alertMessage}
        </div>
      )}

      {/* Sync health heatmap */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
        <span className="text-[var(--text-primary)] text-sm font-semibold mb-4 block">Sync Health (Last 7 Days)</span>
        <div className="flex gap-2 mb-3">
          {integration.syncHealthDays.map((status, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-8 rounded-md ${heatmapColor[status]}`} />
              <span className="text-[var(--text-dim)] text-[10px]">{heatmapDates[i]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {Object.entries(heatmapColor).map(([label, cls]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${cls}`} />
              <span className="text-[var(--text-dim)] text-[10px] capitalize">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync health details */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
        <span className="text-[var(--text-primary)] text-sm font-semibold mb-3 block">Sync Details</span>
        <div className="flex flex-col gap-2">
          {integration.syncHealthDetail.map((detail, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-[var(--text-dim)] text-xs w-16 flex-shrink-0">{heatmapDates[i]}</span>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${heatmapColor[integration.syncHealthDays[i]]}`} />
              <span className="text-[var(--text-secondary)] text-xs">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account-level status breakdown */}
      {integration.accounts.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
          <span className="text-[var(--text-primary)] text-sm font-semibold mb-3 block">Account Status</span>
          <div className="flex flex-col gap-2">
            {integration.accounts.map((account) => (
              <div key={account.name} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-b-0">
                <span className="text-[var(--text-primary)] text-xs">{account.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-dim)] text-xs">Last: {account.lastRefreshed}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs ${statusConfig[account.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[account.status].dotColor}`} />
                    {STATUS_LABELS[account.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigureTab({ integration }: { integration: Integration }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
        <span className="text-[var(--text-primary)] text-sm font-semibold mb-4 block">Connection Details</span>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Connected Date", value: integration.connectedDate || integration.earliestDate },
            { label: "Refresh Frequency", value: integration.refreshFrequency },
            { label: "Timezone", value: integration.timezone },
            { label: "Connection Type", value: integration.connectionType },
          ].map((item) => (
            <div key={item.label}>
              <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">{item.label}</span>
              <span className="text-[var(--text-primary)] text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5">
        <span className="text-[var(--text-primary)] text-sm font-semibold mb-4 block">Configuration</span>
        <p className="text-[var(--text-muted)] text-sm mb-4">Configuration options for this integration will appear here.</p>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors font-medium">
            Re-authenticate
          </button>
          <button className="px-4 py-2 rounded-lg border border-[#ff2056]/30 text-sm text-[#ff2056] hover:bg-[#ff2056]/5 transition-colors font-medium">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
