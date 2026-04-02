"use client";

import type { PlatformData } from "./useFieldData";

interface PlatformRowProps {
  platform: PlatformData;
  categoryColor: string;
  onViewAll: (platformName: string) => void;
}

export default function PlatformRow({ platform, categoryColor, onViewAll }: PlatformRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px] items-center border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--hover-item)] transition-colors">
      {/* Platform name + icon */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 min-w-0">
        <span
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: platform.color }}
        >
          <span className="text-[8px] text-white font-bold">{platform.name[0]}</span>
        </span>
        <span className="text-[var(--text-primary)] text-xs font-medium truncate">{platform.name}</span>
      </div>

      {/* Key metric pills */}
      <div className="flex items-center gap-1 px-3 py-2.5 min-w-0 flex-wrap">
        {platform.keyMetrics.slice(0, 4).map((metric) => (
          <span
            key={metric}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] flex-shrink-0"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {metric}
          </span>
        ))}
      </div>

      {/* Mapping count */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <span className={`text-xs font-medium ${
          platform.mapped === platform.total ? "text-[#00bc7d]" : "text-[var(--text-secondary)]"
        }`}>
          {platform.mapped}/{platform.total}
        </span>
        <span className="text-[var(--text-label)] text-[10px]">mapped</span>
      </div>

      {/* View All button */}
      <div className="px-3 py-2.5 flex items-center justify-end">
        <button
          onClick={() => onViewAll(platform.name)}
          className="border border-[#027b8e]/30 text-[#027b8e] hover:bg-[#027b8e]/10 rounded-[6px] h-[28px] px-3 text-[12px] font-medium transition-colors flex items-center gap-1.5"
        >
          View All
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
