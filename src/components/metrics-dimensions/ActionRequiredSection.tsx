"use client";

import { useState } from "react";
import type { PlatformActionItem } from "./mandatoryMetrics";

interface ActionRequiredSectionProps {
  items: PlatformActionItem[];
  onMapNow: (platform: string, category: string) => void;
}

export default function ActionRequiredSection({ items, onMapNow }: ActionRequiredSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#00bc7d" strokeWidth="1.2"/>
            <path d="M5.5 8L7 9.5L10.5 6" stroke="#00bc7d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[#00bc7d] text-xs font-medium">All set! No action required.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-item)] transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5V12.5M1.5 7H12.5" stroke="#ff2056" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 4.5C7 4.5 8.5 5.5 8.5 7C8.5 8.5 7 9.5 7 9.5" stroke="#ff2056" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span className="text-[var(--text-primary)] text-[13px] font-semibold">Action Required</span>
        <span className="bg-[#ff2056]/10 text-[#ff2056] text-[10px] font-medium px-2 py-0.5 rounded-[4px]">
          {items.length}
        </span>
      </button>

      {/* Items */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)]">
          {items.map((item, idx) => (
            <div
              key={`${item.platform}-${item.category}-${idx}`}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--hover-item)] transition-colors"
            >
              {/* Platform icon */}
              <span
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: item.platformColor }}
              >
                <span className="text-[8px] text-white font-bold">{item.platform[0]}</span>
              </span>

              {/* Platform name + category pill */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[var(--text-primary)] text-xs font-medium truncate">{item.platform}</span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] flex-shrink-0"
                  style={{
                    backgroundColor: `${item.categoryColor}15`,
                    color: item.categoryColor,
                  }}
                >
                  {item.categoryLabel}
                </span>
              </div>

              {/* Missing items */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[var(--text-label)] text-[10px]">Missing:</span>
                <span className="text-[#fe9a00] text-[11px] font-medium">
                  {item.missingItems.join(", ")}
                </span>
              </div>

              {/* Map Now button */}
              <button
                onClick={() => onMapNow(item.platform, item.category)}
                className="flex-shrink-0 border border-[#ff2056]/30 text-[#ff2056] hover:bg-[#ff2056]/10 rounded-[6px] h-[28px] px-3 text-[12px] font-medium transition-colors flex items-center gap-1.5"
              >
                Map Now
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
