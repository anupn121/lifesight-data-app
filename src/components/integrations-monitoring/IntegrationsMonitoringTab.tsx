"use client";

import { useState, useCallback } from "react";
import type { IntegrationStatus, Integration, CatalogIntegration, DataCategory } from "../monitoringData";
import { allIntegrations, DATA_CATEGORY_LABELS } from "../monitoringData";
import { ATTENTION_STATUSES, SYNC_ERROR_STATUSES } from "./statusConfig";
import { catalogIntegrations } from "./catalogData";
import { IntegrationIconSmall, IntegrationIcon } from "./icons";
import IntegrationRow, { IntegrationTableHeader } from "./IntegrationRow";
import DetailView from "./DetailView";
import CatalogView from "./CatalogView";
import DataSourceWizard from "./DataSourceWizard";
import FileIntegrationWizard from "./FileIntegrationWizard";
import { SupportModal, RequestedModal, InviteUserModal } from "./modals";
import { IntegrationCard } from "./IntegrationCard";
import { getJspPlan, type JspIntegration } from "./jspData";
import PostSyncOnboarding from "./PostSyncOnboarding";

const FILE_INTEGRATION_NAMES = new Set(["Import CSV", "Google Sheets", "Amazon S3", "Google Cloud Storage", "SFTP", "Excel Upload"]);

const FILE_VIA_LABELS: Record<string, string> = {
  "Google Sheets": "Google Sheets",
  "Import CSV": "CSV",
  "Amazon S3": "Amazon S3",
  "Google Cloud Storage": "Google Cloud Storage",
  "SFTP": "SFTP",
  "Excel Upload": "Excel",
};

const WAREHOUSE_INTEGRATION_NAMES = new Set(["BigQuery", "Snowflake", "Amazon Redshift", "Databricks"]);

function createFileIntegration(aliasName: string, sourceName: string, catalogEntry?: CatalogIntegration): Integration {
  const viaLabel = FILE_VIA_LABELS[sourceName] || sourceName;
  const displayName = `${aliasName} (via ${viaLabel})`;
  const color = catalogEntry?.color || "#71717a";
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return {
    name: displayName,
    icon: catalogEntry?.icon || sourceName.slice(0, 2),
    color,
    connectionType: "Source",
    category: "Custom",
    status: "SYNCING",
    subtitle: `Syncing via ${viaLabel}`,
    refreshFrequency: "Daily",
    connectedDate: today,
    estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    timezone: "UTC",
    syncHealthDetail: ["Synced", "Synced", "Synced", "Synced", "Synced", "Synced", "Synced"],
    metricsDateRange: today,
    overviewMetrics: [
      { label: "Source", value: viaLabel },
      { label: "Status", value: "Healthy" },
      { label: "Frequency", value: "Daily" },
      { label: "Last Update", value: "Just now" },
    ],
    earliestDate: today,
    latestDate: today,
    reliableThrough: today,
    accounts: [
      { name: aliasName, status: "CONNECTED", lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Rows: "—", Frequency: "Daily", "Last Update": "Just now" } },
    ],
    accountColumns: ["Rows", "Frequency", "Last Update"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  };
}

export type IntMonView = "main" | "catalog" | "detail" | "data-wizard";

export default function IntegrationsMonitoringTab({
  view,
  onViewChange,
}: {
  view: IntMonView;
  onViewChange: (v: IntMonView) => void;
}) {
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [openKebabName, setOpenKebabName] = useState<string | null>(null);
  const [mainSearch, setMainSearch] = useState("");
  const [dataCategoryFilter, setDataCategoryFilter] = useState<DataCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [needsAttentionExpanded, setNeedsAttentionExpanded] = useState(true);
  const [syncErrorsExpanded, setSyncErrorsExpanded] = useState(true);
  const [connectedExpanded, setConnectedExpanded] = useState(true);
  const [requestedExpanded, setRequestedExpanded] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [postSyncIntegration, setPostSyncIntegration] = useState<string | null>(null);
  const [dynamicIntegrations, setDynamicIntegrations] = useState<Integration[]>([]);

  // JSP state
  const [jspPlan] = useState(getJspPlan());
  const [connectedJspIds, setConnectedJspIds] = useState<Set<string>>(new Set());
  const [wizardJspAlias, setWizardJspAlias] = useState("");
  const [wizardJspId, setWizardJspId] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; integrationName: string }>({ open: false, integrationName: "" });
  const [dataChoiceJsp, setDataChoiceJsp] = useState<JspIntegration | null>(null);
  const [dataChoiceStep, setDataChoiceStep] = useState<"choose" | "pick-file" | "pick-warehouse">("choose");
  const [setupExpanded, setSetupExpanded] = useState(true);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [showDismissWarning, setShowDismissWarning] = useState(false);

  // Derived JSP data
  const pendingJsp = jspPlan.integrations.filter((j) => j.status !== "connected" && !connectedJspIds.has(j.id));
  const nativeJsp = pendingJsp.filter((j) => j.type === "native");
  const fileJsp = pendingJsp.filter((j) => j.type === "file");
  const warehouseJsp = pendingJsp.filter((j) => j.type === "warehouse");
  const totalJsp = jspPlan.integrations.length;
  const connectedJspCount = jspPlan.integrations.filter((j) => j.status === "connected" || connectedJspIds.has(j.id)).length;

  // Modal states
  const [supportModal, setSupportModal] = useState<{ open: boolean; name: string; success: boolean }>({ open: false, name: "", success: false });
  const [requestedModal, setRequestedModal] = useState<{ open: boolean; integration: CatalogIntegration | null }>({ open: false, integration: null });

  // Data source wizard state
  const [wizardIntegration, setWizardIntegration] = useState<CatalogIntegration | null>(null);

  const toggleRow = (name: string) => {
    setExpandedRows((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getEffectiveStatus = useCallback((name: string, defaultStatus: IntegrationStatus): IntegrationStatus => {
    return integrationStatuses[name] ?? defaultStatus;
  }, [integrationStatuses]);

  // Combine static + dynamic integrations
  const allCombinedIntegrations = [...allIntegrations, ...dynamicIntegrations];

  // Derive lists
  const connectedMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return status === "CONNECTED" || status === "SYNCING";
  });

  const issuesMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return ATTENTION_STATUSES.includes(status);
  });

  const syncErrorMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return SYNC_ERROR_STATUSES.includes(status);
  });

  const requestedIntegrations = catalogIntegrations.filter((i) => i.isRequested);

  // Search + data category + status filter
  const filterBySearch = (integration: Integration) => {
    if (dataCategoryFilter && integration.dataCategory !== dataCategoryFilter) return false;
    if (statusFilter !== "all") {
      const effectiveStatus = getEffectiveStatus(integration.name, integration.status);
      if (statusFilter === "healthy" && effectiveStatus !== "CONNECTED" && effectiveStatus !== "SYNCING") return false;
      if (statusFilter === "attention" && !ATTENTION_STATUSES.includes(effectiveStatus)) return false;
      if (statusFilter === "error" && !SYNC_ERROR_STATUSES.includes(effectiveStatus)) return false;
    }
    if (!mainSearch) return true;
    const q = mainSearch.toLowerCase();
    return (
      integration.name.toLowerCase().includes(q) ||
      integration.category.toLowerCase().includes(q) ||
      integration.accounts.some((a) => a.name.toLowerCase().includes(q))
    );
  };

  const filteredConnected = connectedMonitoring.filter(filterBySearch);
  const filteredIssues = issuesMonitoring.filter(filterBySearch);
  const filteredSyncErrors = syncErrorMonitoring.filter(filterBySearch);

  const handleViewDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    onViewChange("detail");
  };

  const handleConnect = (name: string) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [name]: "CONNECTED",
    }));
  };

  const handleStartWizard = (integration: CatalogIntegration) => {
    setWizardIntegration(integration);
    onViewChange("data-wizard");
  };

  const handleSimulateSyncComplete = (name: string) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [name]: "CONNECTED",
    }));
    setPostSyncIntegration(name);
  };

  const handleFileIntegrationComplete = useCallback((aliasName: string, sourceName: string) => {
    const cat = catalogIntegrations.find((c) => c.name === sourceName);
    const newIntegration = createFileIntegration(aliasName, sourceName, cat);
    setDynamicIntegrations((prev) => [...prev, newIntegration]);
    setIntegrationStatuses((prev) => ({ ...prev, [newIntegration.name]: "SYNCING" }));
  }, []);

  // Helper: launch wizard for a JSP entry
  const handleStartJspWizard = (jspEntry: JspIntegration) => {
    setWizardJspId(jspEntry.id);

    if (jspEntry.type === "native") {
      // Native: go straight to the wizard for that specific integration
      const catalogEntry = catalogIntegrations.find((c) => c.name === jspEntry.integrationName);
      if (!catalogEntry) return;
      setWizardJspAlias(jspEntry.alias || "");
      handleStartWizard(catalogEntry);
    } else if (jspEntry.source) {
      // Non-native with known source: go directly to that source's wizard
      const catalogEntry = catalogIntegrations.find((c) => c.name === jspEntry.source);
      if (!catalogEntry) return;
      setWizardJspAlias(jspEntry.integrationName);
      handleStartWizard(catalogEntry);
    } else {
      // Non-native with unknown source: show data source choice modal
      setWizardJspAlias(jspEntry.integrationName);
      setDataChoiceJsp(jspEntry);
      setDataChoiceStep(jspEntry.type === "file" ? "pick-file" : jspEntry.type === "warehouse" ? "pick-warehouse" : "choose");
    }
  };

  // Helper: pick a specific source from the data choice modal
  const handleDataChoicePick = (sourceName: string) => {
    const catalogEntry = catalogIntegrations.find((c) => c.name === sourceName);
    if (!catalogEntry || !dataChoiceJsp) return;
    setDataChoiceJsp(null);
    handleStartWizard(catalogEntry);
  };

  // ─── DATA SOURCE WIZARD ──────────────────────────────────────────────────
  if (view === "data-wizard" && wizardIntegration) {
    const isFileIntegration = FILE_INTEGRATION_NAMES.has(wizardIntegration.name);
    const commonProps = {
      integration: wizardIntegration,
      onBack: () => { setWizardIntegration(null); setWizardJspAlias(""); setWizardJspId(null); onViewChange("catalog"); },
      onGoHome: () => { setWizardIntegration(null); setWizardJspAlias(""); setWizardJspId(null); onViewChange("main"); },
      onInviteUser: (name: string) => setInviteModal({ open: true, integrationName: name }),
    };
    if (isFileIntegration) {
      return (
        <>
          <FileIntegrationWizard
            {...commonProps}
            initialAlias={wizardJspAlias}
            onComplete={(aliasName: string) => {
              handleFileIntegrationComplete(aliasName, wizardIntegration.name);
              if (wizardJspId) setConnectedJspIds((prev) => new Set(prev).add(wizardJspId));
              setWizardIntegration(null);
              setWizardJspAlias("");
              setWizardJspId(null);
              onViewChange("main");
            }}
          />
          <InviteUserModal
            open={inviteModal.open}
            integrationName={inviteModal.integrationName}
            onClose={() => setInviteModal({ open: false, integrationName: "" })}
            onSubmit={() => {}}
          />
        </>
      );
    }
    return (
      <>
        <DataSourceWizard
          {...commonProps}
          initialAlias={wizardJspAlias}
          onComplete={(name: string) => {
            handleConnect(name);
            if (wizardJspId) setConnectedJspIds((prev) => new Set(prev).add(wizardJspId));
            setWizardIntegration(null);
            setWizardJspAlias("");
            setWizardJspId(null);
            onViewChange("main");
          }}
        />
        <InviteUserModal
          open={inviteModal.open}
          integrationName={inviteModal.integrationName}
          onClose={() => setInviteModal({ open: false, integrationName: "" })}
          onSubmit={() => {}}
        />
      </>
    );
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail" && selectedIntegration) {
    const cat = catalogIntegrations.find((c) => c.name === selectedIntegration.name);
    return (
      <DetailView
        integration={selectedIntegration}
        catalogEntry={cat}
        onBack={() => onViewChange("main")}
      />
    );
  }

  // ─── CATALOG VIEW ─────────────────────────────────────────────────────────
  if (view === "catalog") {
    return (
      <CatalogView
        onBack={() => onViewChange("main")}
        getEffectiveStatus={getEffectiveStatus}
        onStartWizard={handleStartWizard}
      />
    );
  }

  // ─── SHARED JSP SETUP SECTION ─────────────────────────────────────────────
  // Renders the "Your Integration Setup" section identically in both
  // empty state and connected state. Accepts `collapsible` to control
  // whether the section can be collapsed/dismissed.

  const progressPct = totalJsp > 0 ? Math.round((connectedJspCount / totalJsp) * 100) : 0;
  const remainingJsp = totalJsp - connectedJspCount;

  const renderJspSetupContent = () => (
    <>
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--text-muted)] text-sm">Connect your data sources to get started with {jspPlan.clientName}</p>
            <span className="text-[var(--text-muted)] text-xs">{progressPct}%</span>
          </div>
          <div className="w-full bg-[var(--bg-card-inner)] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "#00bc7d"
                  : "linear-gradient(90deg, #6941c6, #a855f7)",
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center px-4 py-2 bg-[var(--bg-card-inner)] rounded-xl min-w-[80px]">
          <span className="text-[var(--text-primary)] text-xl font-bold leading-none">{connectedJspCount}<span className="text-[var(--text-dim)] text-sm font-normal">/{totalJsp}</span></span>
          <span className="text-[var(--text-dim)] text-[10px] mt-0.5">{remainingJsp === 0 ? "All connected" : `${remainingJsp} remaining`}</span>
        </div>
      </div>

      {/* Native Integrations sub-section */}
      {nativeJsp.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[#6941c6]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Native Integrations</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{nativeJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {nativeJsp.map((jsp) => {
              const cat = catalogIntegrations.find((c) => c.name === jsp.integrationName);
              if (!cat) return null;
              return (
                <IntegrationCard
                  key={jsp.id}
                  integration={cat}
                  onConnect={() => handleStartJspWizard(jsp)}
                  showPartnerBadge={cat.isPartner}
                  descriptionOverride={`Connect ${jsp.integrationName} to use this integration with Lifesight.`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Files & Spreadsheets sub-section */}
      {fileJsp.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[#2b7fff]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Files &amp; Spreadsheets</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{fileJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {fileJsp.map((jsp) => {
              const sourceName = jsp.source;
              const cat = sourceName ? catalogIntegrations.find((c) => c.name === sourceName) : null;
              const desc = sourceName
                ? `Connect ${jsp.integrationName} using ${sourceName} to use this integration with Lifesight.`
                : `Connect ${jsp.integrationName} to use this integration with Lifesight.`;
              if (cat) {
                return (
                  <IntegrationCard
                    key={jsp.id}
                    integration={cat}
                    onConnect={() => handleStartJspWizard(jsp)}
                    descriptionOverride={desc}
                  />
                );
              }
              // Unknown source — render a card that opens the data choice modal
              return (
                <div
                  key={jsp.id}
                  onClick={() => handleStartJspWizard(jsp)}
                  className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-5 py-5 flex items-start gap-3 hover:border-[#6941c6]/40 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2b7fff]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#2b7fff" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                      <path d="M12 3v4h4" stroke="#2b7fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5 flex-1">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{jsp.integrationName}</span>
                    <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Warehouses sub-section */}
      {warehouseJsp.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[#6941c6]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Data Warehouses</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{warehouseJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {warehouseJsp.map((jsp) => {
              const sourceName = jsp.source;
              const cat = sourceName ? catalogIntegrations.find((c) => c.name === sourceName) : null;
              const desc = sourceName
                ? `Connect ${jsp.integrationName} using ${sourceName} to use this integration with Lifesight.`
                : `Connect ${jsp.integrationName} to use this integration with Lifesight.`;
              if (cat) {
                return (
                  <IntegrationCard
                    key={jsp.id}
                    integration={cat}
                    onConnect={() => handleStartJspWizard(jsp)}
                    descriptionOverride={desc}
                  />
                );
              }
              // Unknown source — render a card that opens the data choice modal
              return (
                <div
                  key={jsp.id}
                  onClick={() => handleStartJspWizard(jsp)}
                  className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-5 py-5 flex items-start gap-3 hover:border-[#6941c6]/40 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6941c6]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                      <path d="M3 5v10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                      <path d="M3 10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5 flex-1">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{jsp.integrationName}</span>
                    <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  // ─── MAIN VIEW ────────────────────────────────────────────────────────────

  // JSP-driven empty state (dev toggle)
  if (showEmptyState) {
    return (
      <div className="flex flex-col gap-5">
        {/* Dev toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowEmptyState(false)}
            className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors"
          >
            Show connected state
          </button>
        </div>

        {/* Your Integration Setup — full page (not collapsible in empty state) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
          <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-3">Your Integration Setup</h2>
          {renderJspSetupContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar + data category filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
            <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={mainSearch}
            onChange={(e) => setMainSearch(e.target.value)}
            placeholder="Search"
            className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
          />
        </div>
        <select
          value={dataCategoryFilter ?? "all"}
          onChange={(e) => setDataCategoryFilter(e.target.value === "all" ? null : e.target.value as DataCategory)}
          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none focus:border-[#6941c6] transition-colors min-w-[160px] appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="all">All Categories</option>
          {(Object.entries(DATA_CATEGORY_LABELS) as [DataCategory, { label: string; color: string }][]).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none focus:border-[#6941c6] transition-colors min-w-[160px] appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="all">All Statuses</option>
          <option value="healthy">Healthy</option>
          <option value="attention">Needs Attention</option>
          <option value="error">Sync Error</option>
        </select>
        <button
          onClick={() => setShowEmptyState(true)}
          className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto"
        >
          Show empty state
        </button>
        {/* Re-show setup link (visible when dismissed) */}
        {setupDismissed && pendingJsp.length > 0 && (
          <button
            onClick={() => { setSetupDismissed(false); setSetupExpanded(true); }}
            className="text-[10px] text-[#6941c6] hover:text-[#7c5bd2] border border-dashed border-[#6941c6]/30 rounded px-2 py-0.5 transition-colors"
          >
            Show Integration Setup ({pendingJsp.length})
          </button>
        )}
      </div>

      {/* ── Your Integration Setup (collapsible + dismissible) ────────── */}
      {pendingJsp.length > 0 && !setupDismissed && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
          {/* Collapsible header */}
          <div className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none" onClick={() => setSetupExpanded(!setupExpanded)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${setupExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-[var(--text-primary)] text-lg font-semibold flex-1">Your Integration Setup</h2>
            <span className="text-[var(--text-muted)] text-sm mr-2">{connectedJspCount} / {totalJsp} connected</span>
            {/* Dismiss button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDismissWarning(true); }}
              className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--hover-item)]"
              title="Dismiss setup section"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          {/* Expandable content */}
          {setupExpanded && (
            <div className="px-6 pb-6">
              {renderJspSetupContent()}
            </div>
          )}
        </div>
      )}

      {/* ── Needs Attention Section ───────────────────────────────────────── */}
      {filteredIssues.length > 0 && (
        <div>
          <button
            onClick={() => setNeedsAttentionExpanded(!needsAttentionExpanded)}
            className="flex items-center gap-2 mb-3 group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${needsAttentionExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="w-1 h-4 rounded-full bg-[#fe9a00]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Needs Attention</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{filteredIssues.length}</span>
          </button>
          {needsAttentionExpanded && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-visible">
              <IntegrationTableHeader />
              {filteredIssues.map((integration) => {
                const cat = catalogIntegrations.find((c) => c.name === integration.name);
                return (
                  <IntegrationRow
                    key={integration.name}
                    integration={integration}
                    catalogEntry={cat}
                    effectiveStatus={getEffectiveStatus(integration.name, integration.status)}
                    isExpanded={expandedRows[integration.name] ?? false}
                    openKebab={openKebabName === integration.name}
                    onToggleExpand={() => toggleRow(integration.name)}
                    onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                    onViewDetails={() => handleViewDetails(integration)}
                    onReportIssue={() => {
                      setOpenKebabName(null);
                      setSupportModal({ open: true, name: integration.name, success: false });
                    }}
                    variant="attention"
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Healthy Integrations ──────────────────────────────────────────── */}
      {filteredConnected.length > 0 && (
        <div>
          <button
            onClick={() => setConnectedExpanded(!connectedExpanded)}
            className="flex items-center gap-2 mb-3 group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${connectedExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="w-1 h-4 rounded-full bg-[#00bc7d]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Healthy</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{filteredConnected.length}</span>
          </button>
          {connectedExpanded && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-visible">
            <IntegrationTableHeader />
            {filteredConnected.map((integration) => {
              const cat = catalogIntegrations.find((c) => c.name === integration.name);
              const effectiveStatus = getEffectiveStatus(integration.name, integration.status);
              return (
                <IntegrationRow
                  key={integration.name}
                  integration={integration}
                  catalogEntry={cat}
                  effectiveStatus={effectiveStatus}
                  isExpanded={expandedRows[integration.name] ?? false}
                  openKebab={openKebabName === integration.name}
                  onToggleExpand={() => toggleRow(integration.name)}
                  onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                  onViewDetails={() => handleViewDetails(integration)}
                  onReportIssue={() => {
                    setOpenKebabName(null);
                    setSupportModal({ open: true, name: integration.name, success: false });
                  }}
                  onSimulateSyncComplete={effectiveStatus === "SYNCING" ? () => handleSimulateSyncComplete(integration.name) : undefined}
                />
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ── Sync Errors Section ────────────────────────────────────────────── */}
      {filteredSyncErrors.length > 0 && (
        <div>
          <button
            onClick={() => setSyncErrorsExpanded(!syncErrorsExpanded)}
            className="flex items-center gap-2 mb-3 group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${syncErrorsExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="w-1 h-4 rounded-full bg-[#2b7fff]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Sync Errors</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{filteredSyncErrors.length}</span>
          </button>
          {syncErrorsExpanded && (
            <>
              <div className="flex items-start gap-2 bg-[#2b7fff]/5 border border-[#2b7fff]/20 rounded-lg px-4 py-3 mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
                  <path d="M8 5.5v3" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.75" fill="#2b7fff" />
                </svg>
                <p className="text-[#2b7fff] text-xs leading-relaxed">
                  These sync issues are on our end — no action needed from you. Our team is actively working on a fix and we&apos;ll notify you once resolved.
                </p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-visible">
                <IntegrationTableHeader />
                {filteredSyncErrors.map((integration) => {
                  const cat = catalogIntegrations.find((c) => c.name === integration.name);
                  return (
                    <IntegrationRow
                      key={integration.name}
                      integration={integration}
                      catalogEntry={cat}
                      effectiveStatus={getEffectiveStatus(integration.name, integration.status)}
                      isExpanded={expandedRows[integration.name] ?? false}
                      openKebab={openKebabName === integration.name}
                      onToggleExpand={() => toggleRow(integration.name)}
                      onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                      onViewDetails={() => handleViewDetails(integration)}
                      onReportIssue={() => {
                        setOpenKebabName(null);
                        setSupportModal({ open: true, name: integration.name, success: false });
                      }}
                      variant="attention"
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Requested Integrations ────────────────────────────────────────── */}
      {requestedIntegrations.length > 0 && (
        <div>
          <button
            onClick={() => setRequestedExpanded(!requestedExpanded)}
            className="flex items-center gap-2 mb-3 group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${requestedExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="w-1 h-4 rounded-full bg-[#a855f7]" />
            <span className="text-[var(--text-primary)] text-sm font-semibold">Requested Integrations</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{requestedIntegrations.length}</span>
          </button>
          {requestedExpanded && (
          <div className="grid grid-cols-4 gap-3">
            {requestedIntegrations.map((integration) => (
              <button
                key={integration.name}
                onClick={() => setRequestedModal({ open: true, integration })}
                className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-5 py-4 flex items-center gap-3 hover:border-[#a855f7]/40 transition-colors text-left"
              >
                <IntegrationIconSmall integration={integration} />
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium block">{integration.name}</span>
                  {integration.requestedDate && (
                    <span className="text-[var(--text-dim)] text-[10px] mt-0.5 block">
                      Requested {new Date(integration.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-semibold border border-[#a855f7]/20 flex-shrink-0">
                  Requested
                </span>
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <SupportModal
        open={supportModal.open}
        name={supportModal.name}
        success={supportModal.success}
        onClose={() => setSupportModal({ open: false, name: "", success: false })}
        onSubmit={() => setSupportModal((prev) => ({ ...prev, success: true }))}
      />

      <RequestedModal
        open={requestedModal.open}
        integration={requestedModal.integration}
        onClose={() => setRequestedModal({ open: false, integration: null })}
      />

      <InviteUserModal
        open={inviteModal.open}
        integrationName={inviteModal.integrationName}
        onClose={() => setInviteModal({ open: false, integrationName: "" })}
        onSubmit={() => {}}
      />

      {/* ── Dismiss Setup Warning Modal ─────────────────────────────────── */}
      {showDismissWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDismissWarning(false)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L1 18h18L10 2z" stroke="#fe9a00" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  <path d="M10 8v4" stroke="#fe9a00" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="14.5" r="0.75" fill="#fe9a00" />
                </svg>
              </div>
              <h3 className="text-[var(--text-primary)] text-base font-semibold">Hide Integration Setup?</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-5 leading-relaxed">
              You still have {pendingJsp.length} pending integration{pendingJsp.length !== 1 ? "s" : ""}. You can bring this section back anytime from the toolbar above.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDismissWarning(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setSetupDismissed(true); setShowDismissWarning(false); }}
                className="px-4 py-2 rounded-lg bg-[#fe9a00] hover:bg-[#e58c00] text-white text-sm font-medium transition-colors"
              >
                Hide Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Source Choice Modal ──────────────────────────────────────── */}
      {dataChoiceJsp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDataChoiceJsp(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl max-w-lg w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                  {dataChoiceStep === "choose"
                    ? `Connect "${dataChoiceJsp.alias || dataChoiceJsp.integrationName}"`
                    : dataChoiceStep === "pick-file"
                      ? "Choose a File Source"
                      : "Choose a Data Warehouse"}
                </h3>
                <button
                  onClick={() => setDataChoiceJsp(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </div>

              {dataChoiceStep === "choose" ? (
                <>
                  <p className="text-[var(--text-muted)] text-sm mb-5">
                    How would you like to bring this data into Lifesight?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDataChoiceStep("pick-file")}
                      className="bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-xl p-5 text-left hover:border-[#6941c6]/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#2b7fff]/10 flex items-center justify-center mb-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#2b7fff" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                          <path d="M12 3v4h4" stroke="#2b7fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                      <span className="text-[var(--text-primary)] text-sm font-semibold block mb-1">Files &amp; Spreadsheets</span>
                      <span className="text-[var(--text-dim)] text-xs leading-relaxed block">Upload CSV, connect Google Sheets, Excel, or cloud storage</span>
                    </button>
                    <button
                      onClick={() => setDataChoiceStep("pick-warehouse")}
                      className="bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-xl p-5 text-left hover:border-[#6941c6]/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#6941c6]/10 flex items-center justify-center mb-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                          <path d="M3 5v10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                          <path d="M3 10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5" stroke="#6941c6" strokeWidth="1.5" fill="none" />
                        </svg>
                      </div>
                      <span className="text-[var(--text-primary)] text-sm font-semibold block mb-1">Data Warehouses</span>
                      <span className="text-[var(--text-dim)] text-xs leading-relaxed block">Connect BigQuery, Snowflake, Redshift, or Databricks</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[var(--text-muted)] text-sm mb-4">
                    Select a source to connect <strong className="text-[var(--text-primary)]">{dataChoiceJsp.integrationName}</strong>
                  </p>
                  {/* Show Back only if we came from the choose step (type wasn't pre-determined) */}
                  {dataChoiceJsp.type !== "file" && dataChoiceJsp.type !== "warehouse" && (
                    <button
                      onClick={() => setDataChoiceStep("choose")}
                      className="text-[var(--text-muted)] text-xs hover:text-[#6941c6] mb-4 flex items-center gap-1 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Back
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {catalogIntegrations
                      .filter((c) =>
                        dataChoiceStep === "pick-file"
                          ? FILE_INTEGRATION_NAMES.has(c.name)
                          : WAREHOUSE_INTEGRATION_NAMES.has(c.name)
                      )
                      .map((source) => (
                        <button
                          key={source.name}
                          onClick={() => handleDataChoicePick(source.name)}
                          className="bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-xl px-5 py-4 flex items-start gap-3 hover:border-[#6941c6]/50 transition-colors text-left"
                        >
                          <IntegrationIcon integration={source} />
                          <div className="min-w-0 pt-0.5 flex-1">
                            <span className="text-[var(--text-primary)] text-sm font-medium block">{source.name}</span>
                            <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{source.description}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Post-Sync Onboarding ──────────────────────────────────────────── */}
      {postSyncIntegration && (
        <PostSyncOnboarding
          integrationName={postSyncIntegration}
          onComplete={() => setPostSyncIntegration(null)}
        />
      )}
    </div>
  );
}
