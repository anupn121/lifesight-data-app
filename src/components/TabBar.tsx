"use client";

import { useState, useEffect } from "react";

export type TabId = "monitoring" | "integrations" | "integrations-monitoring" | "metrics-dimensions" | "tactic-mapper" | "data-models";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const visibleTabs: { id: TabId; label: string }[] = [
  { id: "integrations-monitoring", label: "Integrations" },
  { id: "metrics-dimensions", label: "Metrics & Dimensions" },
  { id: "tactic-mapper", label: "Tactic Mapper" },
  { id: "data-models", label: "Data Models" },
];

const hiddenTabs: { id: TabId; label: string }[] = [
  { id: "monitoring", label: "Monitoring (Legacy)" },
  { id: "integrations", label: "Integrations (Legacy)" },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        setShowHidden((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const tabs = showHidden ? [...visibleTabs, ...hiddenTabs] : visibleTabs;

  return (
    <div className="border-b border-[var(--border-tab)] flex items-start">
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-1 pt-px pb-[11px] text-sm font-semibold leading-5 transition-colors ${
              activeTab === tab.id
                ? "text-[#6941c6] border-b-2 border-[#6941c6]"
                : "text-[var(--text-label)] hover:text-[var(--text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
