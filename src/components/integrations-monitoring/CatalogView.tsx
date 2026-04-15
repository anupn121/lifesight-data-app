"use client";

import { useState, useMemo, useEffect } from "react";
import type { CatalogIntegration, IntegrationStatus } from "../monitoringData";
import { IntegrationIcon } from "./icons";
import { catalogIntegrations, plannedIntegrations } from "./catalogData";
import { IntegrationCard } from "./IntegrationCard";
import { RequestFormModal } from "./modals";

// ─── Types ─────────────────────────────────────────────────────────────────

type CatalogTab = "native" | "files" | "warehouses" | "wishlist";

const TAB_LABELS: Record<CatalogTab, string> = {
  native: "Native Integrations",
  files: "Files & Spreadsheets",
  warehouses: "Data Warehouses",
  wishlist: "App Wishlist",
};

// ─── Classification ────────────────────────────────────────────────────────

const FILE_NAMES = new Set(["CSV", "Google Sheets", "Amazon S3", "Google Cloud Storage", "SFTP", "Excel Upload"]);
const WAREHOUSE_NAMES = new Set(["BigQuery", "Snowflake", "Amazon Redshift", "Databricks"]);

function classifyIntegration(i: CatalogIntegration): CatalogTab {
  if (FILE_NAMES.has(i.name)) return "files";
  if (WAREHOUSE_NAMES.has(i.name)) return "warehouses";
  return "native";
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function CatalogView({
  onBack,
  getEffectiveStatus,
  onStartWizard,
  jspIntegrationNames,
}: {
  onBack: () => void;
  getEffectiveStatus: (name: string, defaultStatus: IntegrationStatus) => IntegrationStatus;
  onStartWizard: (integration: CatalogIntegration) => void;
  jspIntegrationNames?: Set<string>;
}) {
  const [activeTab, setActiveTab] = useState<CatalogTab>("native");
  const [search, setSearch] = useState("");
  const [requestFormModal, setRequestFormModal] = useState<{ open: boolean; name: string; details: string }>({ open: false, name: "", details: "" });
  const [requestedPlanned, setRequestedPlanned] = useState<Set<string>>(new Set());
  const [wishlistModal, setWishlistModal] = useState<{ open: boolean; name: string; description: string }>({ open: false, name: "", description: "" });

  // Available (not-connected, not-requested) integrations
  const available = useMemo(() => {
    return catalogIntegrations.filter((i) => {
      const status = getEffectiveStatus(i.name, i.status);
      return status === "NOT_CONNECTED" && !i.isRequested;
    });
  }, [getEffectiveStatus]);

  // Tab items
  const getTabItems = (tab: CatalogTab): CatalogIntegration[] => {
    if (tab === "wishlist") return [];
    return available.filter((i) => classifyIntegration(i) === tab);
  };

  // Tab counts (filtered by search)
  const tabCounts = useMemo(() => {
    const counts: Record<CatalogTab, number> = { native: 0, files: 0, warehouses: 0, wishlist: 0 };
    const q = search.toLowerCase();
    for (const tab of ["native", "files", "warehouses"] as CatalogTab[]) {
      const items = getTabItems(tab);
      counts[tab] = search
        ? items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)).length
        : items.length;
    }
    const wishlistAvailable = plannedIntegrations.filter((p) => !requestedPlanned.has(p.name));
    counts.wishlist = search
      ? wishlistAvailable.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).length
      : wishlistAvailable.length;
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, available, requestedPlanned]);

  // Smart search: auto-switch to tab with most matches
  useEffect(() => {
    if (!search) return;
    const tabs: CatalogTab[] = ["native", "files", "warehouses", "wishlist"];
    let bestTab = activeTab;
    let bestCount = tabCounts[activeTab];
    for (const tab of tabs) {
      if (tabCounts[tab] > bestCount) {
        bestCount = tabCounts[tab];
        bestTab = tab;
      }
    }
    if (bestCount > 0 && bestTab !== activeTab) setActiveTab(bestTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tabCounts]);

  // Current tab items filtered by search
  const currentItems = useMemo(() => {
    const items = getTabItems(activeTab);
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, available]);

  const handleConnect = (integration: CatalogIntegration) => {
    onStartWizard(integration);
  };

  return (
    <div className="flex flex-col gap-0 min-h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5 text-sm">
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Integrations
          </button>
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
        {(["native", "files", "warehouses", "wishlist"] as CatalogTab[]).map((tab) => (
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
        {activeTab === "native" && (
          <NativeContent items={currentItems} onConnect={handleConnect} jspNames={jspIntegrationNames} />
        )}
        {activeTab === "files" && (
          <FilesContent items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "warehouses" && (
          <WarehousesContent items={currentItems} onConnect={handleConnect} />
        )}
        {activeTab === "wishlist" && (
          <WishlistContent
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
                  setRequestedPlanned((prev) => new Set(prev).add(wishlistModal.name));
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
    </div>
  );
}

// ─── Native Integrations Tab ────────────────────────────────────────────────

function NativeContent({ items, onConnect, jspNames }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void; jspNames?: Set<string> }) {
  const grouped = useMemo(() => {
    const acc: Record<string, CatalogIntegration[]> = {};
    for (const i of items) {
      (acc[i.category] = acc[i.category] || []).push(i);
    }
    return acc;
  }, [items]);

  if (items.length === 0) return <EmptyTabState message="No integrations match your search." />;

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
                <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} showPartnerBadge={i.isPartner} isInSetupPlan={jspNames?.has(i.name)} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Files & Spreadsheets Tab ───────────────────────────────────────────────

function FilesContent({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  if (items.length === 0) return <EmptyTabState message="No file integrations match your search." />;
  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">Import data from files and spreadsheets into your platform.</p>
      <div className="grid grid-cols-3 gap-4">
        {items.map((i) => (
          <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Data Warehouses Tab ────────────────────────────────────────────────────

function WarehousesContent({ items, onConnect }: { items: CatalogIntegration[]; onConnect: (i: CatalogIntegration) => void }) {
  if (items.length === 0) return <EmptyTabState message="No warehouse integrations match your search." />;
  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">Connect your data warehouse to sync tables and views directly into Lifesight.</p>
      <div className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <IntegrationCard key={i.name} integration={i} onConnect={() => onConnect(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Wishlist Tab ───────────────────────────────────────────────────────────

function WishlistContent({
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
  const available = useMemo(() => {
    let items = plannedIntegrations.filter((p) => !requestedPlanned.has(p.name));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return items;
  }, [search, requestedPlanned]);

  const existingRequested = useMemo(() => catalogIntegrations.filter((i) => i.isRequested), []);

  return (
    <div>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Integrations we&apos;re planning to build. Vote or request new ones to help us prioritize.
      </p>

      {available.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {available.map((p) => (
            <button
              key={p.name}
              onClick={() => onCardClick(p.name)}
              className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-5 text-left hover:border-[var(--border-secondary)] transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${p.color}18` }}>
                  <div className="w-5 h-5 rounded-[4px] flex items-center justify-center" style={{ backgroundColor: p.color }}>
                    <span className="text-[7px] text-white font-bold uppercase leading-none">{p.icon || p.name.slice(0, 2)}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium block truncate">{p.name}</span>
                  <span className="text-[var(--text-dim)] text-[10px]">{p.category}</span>
                </div>
              </div>
              <p className="text-[var(--text-dim)] text-xs leading-relaxed">{p.description}</p>
              <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#027b8e]/8 text-[#027b8e] border border-[#027b8e]/15">
                Request
              </span>
            </button>
          ))}
        </div>
      )}

      {existingRequested.length > 0 && (
        <div className="mb-6">
          <span className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider block mb-3">Already Requested</span>
          <div className="grid grid-cols-3 gap-4">
            {existingRequested.map((i) => (
              <div key={i.name} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-4 flex items-center gap-3 opacity-60">
                <IntegrationIcon integration={i} />
                <div className="min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium block">{i.name}</span>
                  <span className="text-[var(--text-dim)] text-xs">Requested</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom request CTA */}
      <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-[8px] p-6 text-center">
        <p className="text-[var(--text-muted)] text-sm mb-3">Don&apos;t see what you need?</p>
        <button
          onClick={onOpenCustomRequest}
          className="px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
        >
          Request Integration
        </button>
      </div>
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

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
