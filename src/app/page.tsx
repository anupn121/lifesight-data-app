"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import TabBar, { TabId } from "@/components/TabBar";
import MonitoringTab from "@/components/MonitoringTab";
import IntegrationsTab from "@/components/IntegrationsTab";
import MetricsDimensionsTab from "@/components/MetricsDimensionsTab";
import MapperTab from "@/components/MapperTab";
import DataModelsTab from "@/components/DataModelsTab";
import IntegrationsMonitoringTab, { type IntMonView } from "@/components/integrations-monitoring";
import { type ProductMode } from "@/components/productMode";
import { initialFields, type Field } from "@/components/fieldsData";
import { sampleDataModels, type DataModel } from "@/components/dataModelsData";


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

// Locked to the full suite — no picker, no landing page. Previously users
// saw a "Choose your measurement use case" landing screen; now every tab is
// available from the start.
const LOCKED_PRODUCT_MODE: ProductMode = "mta_mmm_experiments";

export default function DataPage() {
  const [productMode] = useState<ProductMode>(LOCKED_PRODUCT_MODE);
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

  // Product mode is locked to the full suite; no picker, no persistence.

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

  const inSubview = activeTab === "integrations-monitoring" && (intMonView === "catalog" || intMonView === "data-wizard" || intMonView === "custom-source-picker");

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-[16px] pt-5">
          <>
              {/* Page Title -- hidden when in catalog/wizard subviews */}
              {!inSubview && (
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-[var(--text-primary)] text-[20px] font-semibold tracking-[-0.3px]">Data</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeTab === "integrations-monitoring" && intMonView === "main" && (
                      <button
                        onClick={() => setIntMonView("catalog")}
                        className="flex items-center gap-2 px-4 bg-[#027b8e] hover:bg-[#025e6d] text-white text-[12px] font-medium rounded-[6px] h-[28px] transition-all duration-150"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Add Integration
                      </button>
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
