"use client";

import { useState } from "react";
import type { CatalogIntegration, IntegrationStatus } from "../monitoringData";
import { IntegrationIcon } from "./icons";
import FilterDropdown from "./FilterDropdown";
import { catalogIntegrations } from "./catalogData";
import { RequestFormModal } from "./modals";

type CatalogTab = "all" | "partner";

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
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("All Categories");
  const [requestFormModal, setRequestFormModal] = useState<{ open: boolean; name: string; details: string }>({ open: false, name: "", details: "" });

  const partnerIntegrations = catalogIntegrations.filter((i) => i.isPartner);

  const availableCatalog = catalogIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return status === "NOT_CONNECTED" && !i.isRequested && !i.isPartner;
  });

  const catalogCategories = Array.from(new Set(availableCatalog.map((i) => i.category))).sort();

  const filteredCatalog = availableCatalog.filter((i) => {
    if (catalogSearch && !i.name.toLowerCase().includes(catalogSearch.toLowerCase()) && !i.category.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
    if (catalogCategory !== "All Categories" && i.category !== catalogCategory) return false;
    return true;
  });

  const filteredPartner = partnerIntegrations.filter((i) => {
    if (catalogSearch && !i.name.toLowerCase().includes(catalogSearch.toLowerCase()) && !i.category.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
    return true;
  });

  const catalogGrouped = filteredCatalog.reduce<Record<string, CatalogIntegration[]>>((acc, i) => {
    (acc[i.category] = acc[i.category] || []).push(i);
    return acc;
  }, {});

  const handleConnect = (integration: CatalogIntegration) => {
    onStartWizard(integration);
  };

  return (
    <div className="flex flex-col">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border-primary)] pb-0 -mx-4 px-4">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0 shrink-0">
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Integrations
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[var(--text-primary)] font-medium">Add Integration</span>
        </div>

        {/* Center: Tab switcher */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <button
            onClick={() => setCatalogTab("all")}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              catalogTab === "all" ? "text-[#027b8e]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All Integrations
            {catalogTab === "all" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#027b8e] rounded-full" />}
          </button>
          <button
            onClick={() => setCatalogTab("partner")}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              catalogTab === "partner" ? "text-[#027b8e]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Partner Integrations
            <span className="ml-1.5 text-[10px] bg-[#2b7fff]/10 text-[#2b7fff] px-1.5 py-0.5 rounded-full font-semibold">{partnerIntegrations.length}</span>
            {catalogTab === "partner" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#027b8e] rounded-full" />}
          </button>
        </div>

        {/* Right: spacer to balance the layout */}
        <div className="min-w-0 shrink-0 w-[180px]" />
      </div>

      {/* ── Search & Filter ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mt-5">
        <div className="relative flex-1 max-w-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
            <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Search integrations..."
            className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
        </div>
        {catalogTab === "all" && (
          <FilterDropdown
            label="Categories"
            value={catalogCategory}
            options={catalogCategories}
            onChange={setCatalogCategory}
          />
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {catalogTab === "all" ? (
        <div className="flex flex-col gap-5 mt-5">
          {Object.keys(catalogGrouped).length > 0 ? (
            Object.entries(catalogGrouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, integrations]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[var(--text-primary)] text-sm font-semibold">{category}</span>
                    <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{integrations.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {integrations.map((integration) => {
                      const inSetup = jspIntegrationNames?.has(integration.name);
                      return (
                        <div key={integration.name} className={`bg-[var(--bg-card)] border rounded-[8px] px-5 py-4 flex items-center justify-between hover:border-[var(--border-secondary)] transition-colors relative ${inSetup ? "border-[var(--border-primary)] ring-1 ring-[#027b8e]/15" : "border-[var(--border-primary)]"}`}>
                          {inSetup && <span className="absolute top-2 right-2 text-[10px] font-medium text-[#027b8e] bg-[#027b8e]/8 px-2 py-[3px] rounded-[4px]">In your setup plan</span>}
                          <div className="flex items-center gap-3 min-w-0">
                            <IntegrationIcon integration={integration} />
                            <div className="min-w-0">
                              <span className="text-[var(--text-primary)] text-sm font-medium block">{integration.name}</span>
                              <p className="text-[var(--text-dim)] text-xs mt-0.5 truncate">{integration.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleConnect(integration)}
                            className="flex-shrink-0 ml-3 px-3.5 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
                          >
                            Connect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          ) : (
            <EmptyState search={catalogSearch} onSubmitRequest={() => setRequestFormModal({ open: true, name: catalogSearch, details: "" })} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 mt-5">
          {filteredPartner.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredPartner.map((integration) => (
                <div key={integration.name} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-5 flex flex-col hover:border-[var(--border-secondary)] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <IntegrationIcon integration={integration} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] text-sm font-medium">{integration.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#2b7fff]/10 text-[#2b7fff] text-[10px] font-semibold border border-[#2b7fff]/20">
                          Partner
                        </span>
                      </div>
                      <p className="text-[var(--text-dim)] text-xs mt-0.5 truncate">{integration.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(integration)}
                    className="w-full px-4 py-1.5 rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-xs font-medium transition-colors mt-auto"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-12 text-center">
              <p className="text-[var(--text-muted)] text-sm">No partner integrations match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RequestFormModal
        open={requestFormModal.open}
        name={requestFormModal.name}
        details={requestFormModal.details}
        onClose={() => setRequestFormModal({ open: false, name: "", details: "" })}
        onChangeName={(v) => setRequestFormModal((prev) => ({ ...prev, name: v }))}
        onChangeDetails={(v) => setRequestFormModal((prev) => ({ ...prev, details: v }))}
        onSubmit={() => setRequestFormModal({ open: false, name: "", details: "" })}
      />
    </div>
  );
}

function EmptyState({ search, onSubmitRequest }: { search: string; onSubmitRequest: () => void }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-12 text-center">
      <div className="w-16 h-16 bg-[var(--bg-badge)] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--text-dim)" strokeWidth="1.5" />
          <path d="M24 24l-5-5" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-[var(--text-primary)] text-base font-semibold mb-1">We don&apos;t support this yet</h3>
      <p className="text-[var(--text-muted)] text-sm mb-6">Can&apos;t find the integration you need? Build a custom connector or submit a request.</p>
      <div className="flex items-center justify-center gap-3">
        <button className="px-4 py-2 rounded-[6px] border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors font-medium">
          Build Custom Connector
        </button>
        <button
          onClick={onSubmitRequest}
          className="px-4 py-2 rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors"
        >
          Submit Request
        </button>
      </div>
    </div>
  );
}
