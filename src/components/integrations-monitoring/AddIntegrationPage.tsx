"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import type { CatalogIntegration, IntegrationStatus } from "../monitoringData";
import { catalogIntegrations, plannedIntegrations, type PlannedIntegration } from "./catalogData";
import { IntegrationIcon } from "./icons";
import DataSourceWizard from "./DataSourceWizard";
import FileIntegrationWizard from "./FileIntegrationWizard";
import { RequestFormModal, InviteUserModal } from "./modals";
import { IntegrationCard, InfoTooltip } from "./IntegrationCard";
import { getJspPlan, getJspEntryForIntegration } from "./jspData";
import PostSyncOnboarding from "./PostSyncOnboarding";

// ─── Types ──────────────────────────────────────────────────────────────────

type AddIntegrationTab = "recommended" | "native" | "files" | "warehouses" | "wishlist";

const TAB_LABELS: Record<AddIntegrationTab, string> = {
  recommended: "Recommended",
  native: "Native Integrations",
  files: "Files & Spreadsheets",
  warehouses: "Data Warehouses",
  wishlist: "App Wishlist",
};

// ─── Classification helpers ─────────────────────────────────────────────────

const FILE_NAMES = new Set(["Import CSV", "Google Sheets", "Amazon S3", "Google Cloud Storage", "SFTP", "Excel Upload"]);
const WAREHOUSE_NAMES = new Set(["BigQuery", "Snowflake", "Amazon Redshift", "Databricks"]);

function getTabsForIntegration(i: CatalogIntegration): AddIntegrationTab[] {
  const tabs: AddIntegrationTab[] = [];
  if (i.isRecommended) tabs.push("recommended");
  if (FILE_NAMES.has(i.name)) tabs.push("files");
  else if (WAREHOUSE_NAMES.has(i.name)) tabs.push("warehouses");
  if (!i.isRequested) tabs.push("native");
  return tabs;
}

function getIntegrationsForTab(tab: AddIntegrationTab, integrations: CatalogIntegration[], statuses: Record<string, IntegrationStatus>): CatalogIntegration[] {
  if (tab === "wishlist") return []; // wishlist handled separately with planned integrations
  return integrations.filter((i) => {
    const effectiveStatus = statuses[i.name] ?? i.status;
    // Only show not-connected integrations
    if (effectiveStatus === "CONNECTED" || effectiveStatus === "SYNCING") return false;
    if (i.isRequested) return false;
    const tabs = getTabsForIntegration(i);
    return tabs.includes(tab);
  });
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-6 right-6 z-[200] animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-start gap-3 px-5 py-4 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-primary)] max-w-[345px]">
        <div className="w-6 h-6 rounded-full bg-[#00bc7d]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="#00bc7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[var(--text-primary)] text-sm font-medium block">{message}</span>
          <span className="text-[var(--text-muted)] text-xs mt-1 block">Data sync will take 24-48 hours. An email will be sent when successful.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AddIntegrationPage() {
  const [activeTab, setActiveTab] = useState<AddIntegrationTab>("recommended");
  const [search, setSearch] = useState("");
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [wizardIntegration, setWizardIntegration] = useState<CatalogIntegration | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [requestFormModal, setRequestFormModal] = useState<{ open: boolean; name: string; details: string }>({ open: false, name: "", details: "" });
  const [onboardingFor, setOnboardingFor] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; integrationName: string }>({ open: false, integrationName: "" });
  const jspPlan = useMemo(() => getJspPlan(), []);

  // Wishlist: track which planned integrations have been requested
  const [requestedPlanned, setRequestedPlanned] = useState<Set<string>>(new Set());
  const [wishlistModal, setWishlistModal] = useState<{ open: boolean; name: string; description: string }>({ open: false, name: "", description: "" });

  // Check if recommended tab has items
  const recommendedItems = useMemo(
    () => getIntegrationsForTab("recommended", catalogIntegrations, integrationStatuses),
    [integrationStatuses]
  );
  const hasRecommended = recommendedItems.length > 0;

  // If recommended tab becomes empty, switch away
  useEffect(() => {
    if (activeTab === "recommended" && !hasRecommended) {
      setActiveTab("native");
    }
  }, [hasRecommended, activeTab]);

  // Tab counts (filtered by search)
  const tabCounts = useMemo(() => {
    const counts: Record<AddIntegrationTab, number> = {
      recommended: 0,
      native: 0,
      files: 0,
      warehouses: 0,
      wishlist: 0,
    };
    const tabs: AddIntegrationTab[] = ["recommended", "native", "files", "warehouses", "wishlist"];
    for (const tab of tabs) {
      if (tab === "wishlist") {
        const available = plannedIntegrations.filter((p) => !requestedPlanned.has(p.name));
        if (search) {
          const q = search.toLowerCase();
          counts[tab] = available.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).length;
        } else {
          counts[tab] = available.length;
        }
        continue;
      }
      const items = getIntegrationsForTab(tab, catalogIntegrations, integrationStatuses);
      if (search) {
        const q = search.toLowerCase();
        counts[tab] = items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)).length;
      } else {
        counts[tab] = items.length;
      }
    }
    return counts;
  }, [search, integrationStatuses, requestedPlanned]);

  // Smart search: auto-switch to tab with most matches
  useEffect(() => {
    if (!search) return;
    const tabs: AddIntegrationTab[] = hasRecommended
      ? ["recommended", "native", "files", "warehouses", "wishlist"]
      : ["native", "files", "warehouses", "wishlist"];

    let bestTab = activeTab;
    let bestCount = tabCounts[activeTab];
    for (const tab of tabs) {
      if (tabCounts[tab] > bestCount) {
        bestCount = tabCounts[tab];
        bestTab = tab;
      }
    }
    if (bestCount > 0 && bestTab !== activeTab) {
      setActiveTab(bestTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tabCounts, hasRecommended]);

  // Current tab items filtered by search
  const currentItems = useMemo(() => {
    const items = getIntegrationsForTab(activeTab, catalogIntegrations, integrationStatuses);
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }, [activeTab, search, integrationStatuses]);

  const handleConnect = useCallback((integration: CatalogIntegration) => {
    setToast(`Connecting ${integration.name}...`);
    setWizardIntegration(integration);
  }, []);

  const handleWizardComplete = useCallback((name: string) => {
    // For file integrations, format as "AliasName (via Source)"
    const source = wizardIntegration;
    let displayName = name;
    if (source && FILE_NAMES.has(source.name)) {
      const viaLabel: Record<string, string> = {
        "Google Sheets": "Google Sheets",
        "Import CSV": "CSV",
        "Amazon S3": "Amazon S3",
        "Google Cloud Storage": "Google Cloud Storage",
        "SFTP": "SFTP",
        "Excel Upload": "Excel",
      };
      displayName = `${name} (via ${viaLabel[source.name] || source.name})`;
    }
    setIntegrationStatuses((prev) => ({ ...prev, [displayName]: "CONNECTED" }));
    setWizardIntegration(null);
    setOnboardingFor(displayName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardIntegration]);

  const handleRequestPlanned = useCallback((name: string) => {
    setRequestedPlanned((prev) => new Set(prev).add(name));
    setToast(`Request submitted for ${name}`);
  }, []);

  // ─── Wizard view ────────────────────────────────────────────────────────
  if (wizardIntegration) {
    const isFileIntegration = FILE_NAMES.has(wizardIntegration.name);
    const jspEntry = getJspEntryForIntegration(wizardIntegration.name, jspPlan);
    const jspAlias = jspEntry?.alias || "";
    return (
      <div className="flex flex-col min-h-full">
        {isFileIntegration ? (
          <FileIntegrationWizard
            integration={wizardIntegration}
            initialAlias={jspAlias}
            onBack={() => setWizardIntegration(null)}
            onGoHome={() => setWizardIntegration(null)}
            onComplete={(name) => handleWizardComplete(name)}
            onInviteUser={(name) => setInviteModal({ open: true, integrationName: name })}
          />
        ) : (
          <DataSourceWizard
            integration={wizardIntegration}
            initialAlias={jspAlias}
            onBack={() => setWizardIntegration(null)}
            onGoHome={() => setWizardIntegration(null)}
            onComplete={(name) => handleWizardComplete(name)}
            onInviteUser={(name) => setInviteModal({ open: true, integrationName: name })}
          />
        )}
        <InviteUserModal
          open={inviteModal.open}
          integrationName={inviteModal.integrationName}
          onClose={() => setInviteModal({ open: false, integrationName: "" })}
          onSubmit={() => {}}
        />
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  // ─── Visible tabs ────────────────────────────────────────────────────────
  const visibleTabs: AddIntegrationTab[] = hasRecommended
    ? ["recommended", "native", "files", "warehouses", "wishlist"]
    : ["native", "files", "warehouses", "wishlist"];

  return (
    <div className="flex flex-col gap-0 min-h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Integrations
          </Link>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[var(--text-primary)] font-medium">Add Integration</span>
        </div>
        <div className="relative w-72">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
            <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
        </div>
      </div>

      {/* ── Tab Strip ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-[var(--border-primary)] -mx-4 px-4">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab ? "text-[#027b8e]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {TAB_LABELS[tab]}
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              search && tabCounts[tab] > 0
                ? "bg-[#027b8e]/10 text-[#027b8e]"
                : "bg-[var(--bg-badge)] text-[var(--text-muted)]"
            }`}>
              {tabCounts[tab]}
            </span>
            {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#027b8e] rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex-1">
        {activeTab === "recommended" && (
          <RecommendedTab items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "native" && (
          <NativeTab items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "files" && (
          <FilesTab items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "warehouses" && (
          <WarehousesTab items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "wishlist" && (
          <WishlistTab
            search={search}
            requestedPlanned={requestedPlanned}
            onCardClick={(name) => setWishlistModal({ open: true, name, description: "" })}
            onOpenCustomRequest={() => setRequestFormModal({ open: true, name: "", details: "" })}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RequestFormModal
        open={requestFormModal.open}
        name={requestFormModal.name}
        details={requestFormModal.details}
        onClose={() => setRequestFormModal({ open: false, name: "", details: "" })}
        onChangeName={(v) => setRequestFormModal((prev) => ({ ...prev, name: v }))}
        onChangeDetails={(v) => setRequestFormModal((prev) => ({ ...prev, details: v }))}
        onSubmit={() => setRequestFormModal({ open: false, name: "", details: "" })}
      />

      {/* Wishlist Request Modal */}
      {wishlistModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setWishlistModal({ open: false, name: "", description: "" })}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[12px] max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const planned = plannedIntegrations.find((p) => p.name === wishlistModal.name);
                  return planned ? (
                    <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${planned.color}18` }}>
                      <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: planned.color }}>
                        <span className="text-[8px] text-white font-bold uppercase leading-none">{planned.icon || planned.name.slice(0, 2)}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div>
                  <h3 className="text-[var(--text-primary)] text-base font-semibold">{wishlistModal.name}</h3>
                  <p className="text-[var(--text-muted)] text-xs">Tell us what data you need</p>
                </div>
              </div>
              <textarea
                value={wishlistModal.description}
                onChange={(e) => setWishlistModal((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What data would you like to fetch from this integration?"
                rows={4}
                className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-primary)]">
              <button
                onClick={() => setWishlistModal({ open: false, name: "", description: "" })}
                className="px-4 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[var(--text-secondary)] text-[12px] font-medium hover:bg-[var(--hover-item)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRequestPlanned(wishlistModal.name);
                  setWishlistModal({ open: false, name: "", description: "" });
                }}
                disabled={!wishlistModal.description.trim()}
                className="px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-sync onboarding */}
      {onboardingFor && (
        <PostSyncOnboarding
          integrationName={onboardingFor}
          onComplete={() => {
            setOnboardingFor(null);
            setToast(`${onboardingFor} is ready!`);
          }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Tab: Recommended ───────────────────────────────────────────────────────

function RecommendedTab({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  if (items.length === 0) {
    return <EmptyTabState message="All recommended integrations have been connected!" />;
  }
  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        These integrations were identified during your workspace setup. Connect them to get started quickly.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {items.map((i) => (
          <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Native ────────────────────────────────────────────────────────────

function NativeTab({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  const grouped = useMemo(() => {
    const acc: Record<string, CatalogIntegration[]> = {};
    for (const i of items) {
      (acc[i.category] = acc[i.category] || []).push(i);
    }
    return acc;
  }, [items]);

  if (items.length === 0) {
    return <EmptyTabState message="No integrations match your search." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, integrations]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[var(--text-primary)] text-sm font-semibold">{category}</span>
              <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{integrations.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {integrations.map((i) => (
                <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} showPartnerBadge={i.isPartner} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Tab: Files & Spreadsheets ──────────────────────────────────────────────

function FilesTab({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  if (items.length === 0) {
    return <EmptyTabState message="No file integrations match your search." />;
  }
  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Import data from files and spreadsheets into your platform.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {items.map((i) => (
          <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Data Warehouses ───────────────────────────────────────────────────

function WarehousesTab({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  if (items.length === 0) {
    return <EmptyTabState message="No warehouse integrations match your search." />;
  }
  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Connect your data warehouse to sync tables and views directly into Lifesight.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Wishlist ──────────────────────────────────────────────────────────

function WishlistTab({
  search,
  requestedPlanned,
  onCardClick,
  onOpenCustomRequest,
}: {
  search: string;
  requestedPlanned: Set<string>;
  onCardClick: (name: string) => void;
  onOpenCustomRequest: () => void;
}) {
  // Filter out already-requested planned integrations
  const available = useMemo(() => {
    let items = plannedIntegrations.filter((p) => !requestedPlanned.has(p.name));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return items;
  }, [search, requestedPlanned]);

  // Already-requested items from catalogData
  const existingRequested = useMemo(() => {
    return catalogIntegrations.filter((i) => i.isRequested);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[var(--text-muted)] text-sm">
          Integrations we have planned. Request the ones you need, or submit a custom request.
        </p>
        <button
          onClick={onOpenCustomRequest}
          className="flex items-center gap-2 px-4 h-[28px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium rounded-[6px] transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Custom Request
        </button>
      </div>

      {/* Available planned integrations */}
      {available.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {available.map((p) => (
            <PlannedIntegrationCard key={p.name} integration={p} onClick={() => onCardClick(p.name)} />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-8 text-center mb-6">
          <p className="text-[var(--text-muted)] text-sm">
            {requestedPlanned.size > 0
              ? "You've requested all planned integrations! Use Custom Request for anything else."
              : "No planned integrations match your search."}
          </p>
        </div>
      )}

      {/* Already requested */}
      {existingRequested.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[var(--text-primary)] text-sm font-semibold">Previously Requested</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{existingRequested.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {existingRequested.map((i) => (
              <div
                key={i.name}
                className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-4 flex items-center gap-3"
              >
                <IntegrationIcon integration={i} />
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium block">{i.name}</span>
                  {i.requestedDate && (
                    <span className="text-[var(--text-dim)] text-[10px] mt-0.5 block">
                      Requested {new Date(i.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-semibold border border-[#a855f7]/20 flex-shrink-0">
                  Requested
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Planned Integration Card ───────────────────────────────────────────────

function PlannedIntegrationCard({ integration, onClick }: { integration: PlannedIntegration; onClick: () => void }) {
  const abbr = integration.icon || integration.name.slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-5 flex items-start gap-3 hover:border-[var(--border-secondary)] cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
        <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: integration.color }}>
          <span className="text-[8px] text-white font-bold uppercase leading-none">{abbr}</span>
        </div>
      </div>
      <div className="min-w-0 pt-0.5 flex-1">
        <span className="text-[var(--text-primary)] text-sm font-medium block">{integration.name}</span>
        <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{integration.description}</p>
        <span className="text-[var(--text-label)] text-[10px] mt-2 block">{integration.category}</span>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────
// IntegrationCard and InfoTooltip are imported from ./IntegrationCard.tsx

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-12 text-center">
      <div className="w-16 h-16 bg-[var(--bg-badge)] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--text-dim)" strokeWidth="1.5" />
          <path d="M24 24l-5-5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[var(--text-muted)] text-sm">{message}</p>
    </div>
  );
}
