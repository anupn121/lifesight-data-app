"use client";

import { useState } from "react";
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

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("integrations-monitoring");
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [tactics, setTactics] = useState<string[]>(INITIAL_TACTICS);
  const [dataModels, setDataModels] = useState<DataModel[]>(sampleDataModels);
  const [intMonView, setIntMonView] = useState<IntMonView>("main");

  const renderTabContent = () => {
    switch (activeTab) {
      case "monitoring":
        return <MonitoringTab />;
      case "integrations":
        return <IntegrationsTab />;
      case "integrations-monitoring":
        return <IntegrationsMonitoringTab view={intMonView} onViewChange={setIntMonView} />;
      case "metrics-dimensions":
        return <MetricsDimensionsTab fields={fields} onFieldsChange={setFields} />;
      case "tactic-mapper":
        return <MapperTab fields={fields} tactics={tactics} onTacticsChange={setTactics} />;
      case "data-models":
        return (
          <DataModelsTab
            fields={fields}
            tactics={tactics}
            dataModels={dataModels}
            onDataModelsChange={setDataModels}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          {/* Page Title — hidden when in catalog/wizard subviews */}
          {!(activeTab === "integrations-monitoring" && (intMonView === "catalog" || intMonView === "data-wizard")) && (
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h1 className="text-[var(--text-primary)] text-xl font-semibold tracking-[-0.5px]">Data</h1>
                <p className="text-[var(--text-muted)] text-sm mt-1">Manage connections, define metrics, map tactics, and configure data models across your marketing stack</p>
              </div>
              {activeTab === "integrations-monitoring" && intMonView === "main" && (
                <Link
                  href="/add-integration"
                  className="flex items-center gap-2 px-4 py-2 bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add Integration
                </Link>
              )}
            </div>
          )}

          {/* Tab Bar — hidden when in catalog/wizard subviews */}
          {!(activeTab === "integrations-monitoring" && (intMonView === "catalog" || intMonView === "data-wizard")) && (
            <div className="mb-4">
              <TabBar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); if (tab !== "integrations-monitoring") setIntMonView("main"); }} />
            </div>
          )}

          {/* Tab Content */}
          <div className="pb-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
