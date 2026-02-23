"use client";

import { useState } from "react";
import type { AIInsight } from "./edaTypes";

interface AIInsightCardProps {
  insight: string;
  confidence: AIInsight["confidence"];
  recommendations?: string[];
  children: React.ReactNode;
}

const confidenceColors = {
  High: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/30",
  Medium: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  Low: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
};

export default function AIInsightCard({ insight, confidence, recommendations, children }: AIInsightCardProps) {
  const [showRecs, setShowRecs] = useState(false);

  return (
    <div className="flex flex-col gap-3 pt-3">
      {/* AI Insight bar */}
      <div className="bg-[#6941c6]/5 border-l-2 border-l-[#6941c6] rounded-r-lg px-3 py-2.5">
        <div className="flex items-start gap-2">
          {/* Sparkle icon */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#6941c6" opacity="0.7" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-[#6941c6] uppercase tracking-wider">AI Insight</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${confidenceColors[confidence]}`}>
                {confidence}
              </span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{insight}</p>
          </div>
        </div>
        {recommendations && recommendations.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowRecs(!showRecs)}
              className="flex items-center gap-1 text-[10px] text-[#6941c6] hover:underline font-medium"
            >
              <svg
                width="8" height="8" viewBox="0 0 8 8" fill="none"
                className={`transition-transform ${showRecs ? "rotate-90" : ""}`}
              >
                <path d="M2 1L6 4L2 7" stroke="#6941c6" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </svg>
              Recommendations ({recommendations.length})
            </button>
            {showRecs && (
              <ul className="mt-1.5 space-y-1 pl-4">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-[11px] text-[var(--text-muted)] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[#6941c6] mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* Panel content */}
      {children}
    </div>
  );
}
