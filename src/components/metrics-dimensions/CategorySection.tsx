"use client";

import { useState } from "react";
import type { CategoryData } from "./useFieldData";
import PlatformRow from "./PlatformRow";

interface CategorySectionProps {
  data: CategoryData;
  defaultExpanded?: boolean;
  onViewAll: (platformName: string) => void;
  onViewCategory: () => void;
}

export default function CategorySection({
  data,
  defaultExpanded = false,
  onViewAll,
  onViewCategory,
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const mappingPct = data.totalFields > 0 ? Math.round((data.mappedCount / data.totalFields) * 100) : 0;

  if (data.platforms.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-item)] transition-colors"
      >
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Category dot + label */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-[var(--text-primary)] text-[13px] font-semibold">{data.label}</span>

        {/* Platform count badge */}
        <span className="bg-[var(--hover-item)] text-[var(--text-secondary)] text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]">
          {data.platforms.length} {data.platforms.length === 1 ? "platform" : "platforms"}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mapping progress mini */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-1.5 bg-[var(--bg-badge)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${mappingPct}%`,
                backgroundColor: mappingPct === 100 ? "#00bc7d" : mappingPct > 50 ? "#fe9a00" : "#ff2056",
              }}
            />
          </div>
          <span className={`text-[10px] font-medium ${
            mappingPct === 100 ? "text-[#00bc7d]" : "text-[var(--text-muted)]"
          }`}>
            {data.mappedCount}/{data.totalFields}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)]">
          {/* Column header */}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px] border-b border-[var(--border-primary)]">
            <div className="px-4 py-2"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Platform</span></div>
            <div className="px-3 py-2"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Key Fields</span></div>
            <div className="px-3 py-2"><span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Mapping</span></div>
            <div className="px-3 py-2" />
          </div>

          {/* Platform rows */}
          {data.platforms.map((platform) => (
            <PlatformRow
              key={platform.name}
              platform={platform}
              categoryColor={data.color}
              onViewAll={onViewAll}
            />
          ))}

          {/* View all link */}
          <div className="px-4 py-2.5 border-t border-[var(--border-subtle)]">
            <button
              onClick={onViewCategory}
              className="text-[#027b8e] text-[11px] font-medium hover:underline transition-colors flex items-center gap-1"
            >
              View all {data.label} fields
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
