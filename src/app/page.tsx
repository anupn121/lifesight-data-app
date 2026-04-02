"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import TabBar, { TabId } from "@/components/TabBar";
import MonitoringTab from "@/components/MonitoringTab";
import IntegrationsTab from "@/components/IntegrationsTab";
import MetricsDimensionsTab from "@/components/MetricsDimensionsTab";
import MapperTab from "@/components/MapperTab";
import DataModelsTab from "@/components/DataModelsTab";
import IntegrationsMonitoringTab, { type IntMonView } from "@/components/integrations-monitoring";
import LandingPage from "@/components/LandingPage";
import { type ProductMode, PRODUCT_MODES } from "@/components/productMode";
import { initialFields, type Field } from "@/components/fieldsData";
import { sampleDataModels, type DataModel } from "@/components/dataModelsData";

const LS_KEY = "lifesight_product_mode";

const INITIAL_TACTICS = [
  "Meta MOF",
  "Meta",
  "TV",
  "Instagram Outcome Leads",
  "Meta Outcome Awareness",
  "Instagram Video",
  "Google 2D",
  "Google 3D",
  "Google Shopping",
  "Google 1D",
  "Facebook Retargeting",
  "TikTok Awareness",
];

export default function DataPage() {
  const [productMode, setProductMode] = useState<ProductMode | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("integrations-monitoring");
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [tactics, setTactics] = useState<string[]>(INITIAL_TACTICS);
  const [dataModels, setDataModels] = useState<DataModel[]>(sampleDataModels);
  const [intMonView, setIntMonView] = useState<IntMonView>("main");
  const [hasConnectedIntegration, setHasConnectedIntegration] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Demo mode toggle: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsDemoMode((prev) => {
          const next = !prev;
          if (next) {
            setFields([]);
            setTactics([]);
            setDataModels([]);
            setHasConnectedIntegration(false);
          } else {
            setFields(initialFields);
            setTactics(INITIAL_TACTICS);
            setDataModels(sampleDataModels);
            setHasConnectedIntegration(true);
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleFieldsCreated = useCallback((newFields: Field[]) => {
    setFields((prev) => [...prev, ...newFields]);
  }, []);

  const handleTacticsCreated = useCallback((newTactics: string[]) => {
    setTactics((prev) => Array.from(new Set([...prev, ...newTactics])));
  }, []);

  // Hydrate product mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && stored in PRODUCT_MODES) {
        setProductMode(stored as ProductMode);
        setShowLanding(false);
        setActiveTab(PRODUCT_MODES[stored as ProductMode].visibleTabs[0]);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSelectMode = useCallback((mode: ProductMode) => {
    setProductMode(mode);
    setShowLanding(false);
    setActiveTab(PRODUCT_MODES[mode].visibleTabs[0]);
    try { localStorage.setItem(LS_KEY, mode); } catch { /* noop */ }
  }, []);

  const handleChangeMode = useCallback(() => {
    setProductMode(null);
    setShowLanding(true);
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "monitoring":
        return <MonitoringTab />;
      case "integrations":
        return <IntegrationsTab />;
      case "integrations-monitoring":
        return <IntegrationsMonitoringTab view={intMonView} onViewChange={setIntMonView} onConnectionChange={setHasConnectedIntegration} isDemoMode={isDemoMode} onFieldsCreated={handleFieldsCreated} onTacticsCreated={handleTacticsCreated} />;
      case "metrics-dimensions":
        return <MetricsDimensionsTab fields={fields} onFieldsChange={setFields} hasConnectedIntegration={hasConnectedIntegration} onNavigateToIntegrations={() => setActiveTab("integrations-monitoring")} />;
      case "tactic-mapper":
        return <MapperTab fields={fields} tactics={tactics} onTacticsChange={setTactics} hasConnectedIntegration={hasConnectedIntegration} onNavigateToIntegrations={() => setActiveTab("integrations-monitoring")} />;
      case "data-models":
        return (
          <DataModelsTab
            fields={fields}
            tactics={tactics}
            dataModels={dataModels}
            onDataModelsChange={setDataModels}
            hasConnectedIntegration={hasConnectedIntegration}
            onNavigateToIntegrations={() => setActiveTab("integrations-monitoring")}
            isDemoMode={isDemoMode}
          />
        );
    }
  };

  const modeConfig = productMode ? PRODUCT_MODES[productMode] : null;

  // Show landing page when no mode is selected
  const isLanding = showLanding && !productMode;
  const inSubview = activeTab === "integrations-monitoring" && (intMonView === "catalog" || intMonView === "data-wizard");

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-[16px] pt-5">
          {isLanding ? (
            /* ─── Landing Page ───────────────────────────────────────────── */
            <div className="pt-8">
              <LandingPage onSelectMode={handleSelectMode} />
            </div>
          ) : (
            <>
              {/* Page Title -- hidden when in catalog/wizard subviews */}
              {!inSubview && (
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-[var(--text-primary)] text-[20px] font-semibold tracking-[-0.3px]">Data</h1>
                    <p className="text-[var(--text-secondary)] text-[12px] mt-0.5">Manage connections, define metrics, map tactics, and configure data models</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Product mode badge + change button */}
                    {modeConfig && (
                      <button
                        onClick={handleChangeMode}
                        className="flex items-center gap-2 px-3 h-[28px] rounded-[6px] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-card)] text-[12px] transition-all duration-150"
                      >
                        <span
                          className="w-[7px] h-[7px] rounded-full"
                          style={{ background: modeConfig.color }}
                        />
                        <span className="text-[var(--text-secondary)]">{modeConfig.shortLabel}</span>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)]">
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    {activeTab === "integrations-monitoring" && intMonView === "main" && (
                      <Link
                        href="/add-integration"
                        className="flex items-center gap-2 px-4 bg-[#027b8e] hover:bg-[#025e6d] text-white text-[12px] font-medium rounded-[6px] h-[28px] transition-all duration-150"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Add Integration
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Bar -- hidden when in catalog/wizard subviews */}
              {!inSubview && (
                <div className="mb-5">
                  <TabBar
                    activeTab={activeTab}
                    onTabChange={(tab) => { setActiveTab(tab); if (tab !== "integrations-monitoring") setIntMonView("main"); }}
                    productMode={productMode}
                  />
                </div>
              )}

              {/* Tab Content */}
              <div className="pb-8">
                {renderTabContent()}
              </div>
            </>
          )}
        </main>
      </div>
      {isDemoMode && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#ff2056]/90 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wider">
          DEMO MODE
        </div>
      )}
    </div>
  );
}
