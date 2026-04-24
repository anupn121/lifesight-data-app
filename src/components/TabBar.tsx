"use client";

import { useState, useEffect } from "react";
import { type ProductMode, PRODUCT_MODES } from "./productMode";

export type TabId = "monitoring" | "integrations" | "integrations-monitoring" | "metrics-dimensions" | "tactic-mapper" | "data-models";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  productMode?: ProductMode | null;
}

const allTabs: { id: TabId; label: string }[] = [
  { id: "integrations-monitoring", label: "Integrations" },
  { id: "metrics-dimensions", label: "Data Transformation" },
  { id: "tactic-mapper", label: "Taxonomy" },
  { id: "data-models", label: "Data Models" },
];

const hiddenTabs: { id: TabId; label: string }[] = [
  { id: "monitoring", label: "Monitoring (Legacy)" },
  { id: "integrations", label: "Integrations (Legacy)" },
];

export default function TabBar({ activeTab, onTabChange, productMode }: TabBarProps) {
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

  // Filter tabs based on product mode
  const modeConfig = productMode ? PRODUCT_MODES[productMode] : null;
  const visibleTabSet = modeConfig ? new Set(modeConfig.visibleTabs) : null;
  const filteredTabs = visibleTabSet
    ? allTabs.filter((t) => visibleTabSet.has(t.id))
    : allTabs;

  const tabs = showHidden ? [...filteredTabs, ...hiddenTabs] : filteredTabs;

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--border-tab)] flex items-end">
        <div className="flex gap-[16px]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasWarning = modeConfig?.warningTabs.includes(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-[4px] pt-[1px] pb-[11px] text-[14px] font-semibold transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-label)] hover:text-[var(--text-muted)]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {hasWarning && modeConfig && (
                    <span className="relative group">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="inline-block opacity-50">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
                        <path d="M7 6v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        <circle cx="7" cy="4.5" r="0.5" fill="currentColor" />
                      </svg>
                      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[220px] px-2.5 py-1.5 rounded-[6px] bg-[var(--bg-card)] border border-[var(--border-primary)] text-[10px] text-[var(--text-muted)] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        {modeConfig.warningMessage}
                      </span>
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
