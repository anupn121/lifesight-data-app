"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import TabBar, { TabId } from "@/components/TabBar";
import MonitoringTab from "@/components/MonitoringTab";
import IntegrationsTab from "@/components/IntegrationsTab";
import MetricsDimensionsTab from "@/components/MetricsDimensionsTab";
import MapperTab from "@/components/MapperTab";
import DataModelsTab from "@/components/DataModelsTab";
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
  const [activeTab, setActiveTab] = useState<TabId>("monitoring");
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [tactics, setTactics] = useState<string[]>(INITIAL_TACTICS);
  const [dataModels, setDataModels] = useState<DataModel[]>(sampleDataModels);

  const renderTabContent = () => {
    switch (activeTab) {
      case "monitoring":
        return <MonitoringTab />;
      case "integrations":
        return <IntegrationsTab />;
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
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          {/* Page Title */}
          <div className="mb-3">
            <h1 className="text-white text-xl font-semibold tracking-[-0.5px]">Data</h1>
            <p className="text-[#9ca3af] text-sm mt-1">Track connection status, sync progress, and data completeness across all connected sources</p>
          </div>

          {/* Tab Bar */}
          <div className="mb-4">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="pb-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
