"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
import { SupportModal, RequestedModal } from "./modals";
import PostSyncOnboarding from "./PostSyncOnboarding";

const FILE_INTEGRATION_NAMES = new Set(["Import CSV", "Google Sheets", "Amazon S3", "Google Cloud Storage", "SFTP", "Excel Upload"]);

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
  const [needsAttentionExpanded, setNeedsAttentionExpanded] = useState(true);
  const [syncErrorsExpanded, setSyncErrorsExpanded] = useState(true);
  const [connectedExpanded, setConnectedExpanded] = useState(true);
  const [requestedExpanded, setRequestedExpanded] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [postSyncIntegration, setPostSyncIntegration] = useState<string | null>(null);

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

  // Derive lists
  const connectedMonitoring = allIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return status === "CONNECTED" || status === "SYNCING";
  });

  const issuesMonitoring = allIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return ATTENTION_STATUSES.includes(status);
  });

  const syncErrorMonitoring = allIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return SYNC_ERROR_STATUSES.includes(status);
  });

  const requestedIntegrations = catalogIntegrations.filter((i) => i.isRequested);

  // Search + data category filter
  const filterBySearch = (integration: Integration) => {
    if (dataCategoryFilter && integration.dataCategory !== dataCategoryFilter) return false;
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

  // ─── DATA SOURCE WIZARD ──────────────────────────────────────────────────
  if (view === "data-wizard" && wizardIntegration) {
    const isFileIntegration = FILE_INTEGRATION_NAMES.has(wizardIntegration.name);
    const wizardProps = {
      integration: wizardIntegration,
      onBack: () => { setWizardIntegration(null); onViewChange("catalog"); },
      onGoHome: () => { setWizardIntegration(null); onViewChange("main"); },
      onComplete: (name: string) => { handleConnect(name); setWizardIntegration(null); onViewChange("main"); },
    };
    return isFileIntegration ? <FileIntegrationWizard {...wizardProps} /> : <DataSourceWizard {...wizardProps} />;
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

  // ─── Recommended integrations for empty state ─────────────────────────────
  const recommendedIntegrations = catalogIntegrations.filter((i) => i.isRecommended);

  // ─── MAIN VIEW ────────────────────────────────────────────────────────────

  // Empty state (dev toggle)
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

        {/* Hero */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-[#6941c6]/10 rounded-full flex items-center justify-center mb-6">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 6v24M6 18h24" stroke="#6941c6" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="18" cy="18" r="14" stroke="#6941c6" strokeWidth="1.5" fill="none" opacity="0.3" />
            </svg>
          </div>
          <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Connect your first integration</h2>
          <p className="text-[var(--text-muted)] text-sm text-center max-w-md mb-6">
            Set up your data sources to start tracking performance across all your marketing channels.
          </p>
          <Link
            href="/add-integration"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Integration
          </Link>
        </div>

        {/* Recommended quick-connect cards */}
        {recommendedIntegrations.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#6941c6]/10 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.76 3.57L13 5.24l-3 2.92.71 4.13L7 10.27 3.29 12.29 4 8.16 1 5.24l4.24-.67L7 1z" fill="#6941c6" />
                </svg>
              </div>
              <h3 className="text-[var(--text-primary)] text-base font-semibold">Recommended for you</h3>
              <span className="bg-[#6941c6]/10 text-[#6941c6] text-[10px] font-semibold px-2 py-0.5 rounded-full">{recommendedIntegrations.length}</span>
            </div>
            <p className="text-[var(--text-muted)] text-xs mb-4 ml-[34px]">Based on your workspace setup. Connect these to get started quickly.</p>
            <div className="grid grid-cols-2 gap-3">
              {recommendedIntegrations.map((integration) => (
                <Link
                  key={integration.name}
                  href="/add-integration"
                  className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-5 py-5 flex items-start gap-3 hover:border-[#6941c6]/50 hover:shadow-[0_0_0_1px_rgba(105,65,198,0.1)] transition-all"
                >
                  <IntegrationIcon integration={integration} />
                  <div className="min-w-0 pt-0.5 flex-1">
                    <span className="text-[var(--text-primary)] text-sm font-medium">{integration.name}</span>
                    <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{integration.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDataCategoryFilter(null)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
              dataCategoryFilter === null
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent"
                : "bg-transparent text-[var(--text-muted)] border-[var(--border-secondary)] hover:border-[var(--text-dim)]"
            }`}
          >
            All
          </button>
          {(Object.entries(DATA_CATEGORY_LABELS) as [DataCategory, { label: string; color: string }][]).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setDataCategoryFilter(dataCategoryFilter === key ? null : key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                dataCategoryFilter === key
                  ? "border-transparent text-white"
                  : "bg-transparent text-[var(--text-muted)] border-[var(--border-secondary)] hover:border-[var(--text-dim)]"
              }`}
              style={dataCategoryFilter === key ? { backgroundColor: color } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowEmptyState(true)}
          className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto"
        >
          Show empty state
        </button>
      </div>

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
          <div className="grid grid-cols-3 gap-3">
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
