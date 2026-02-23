"use client";

import type { MockDataset } from "../mockDataGenerator";
import { useMemo } from "react";
import AIInsightCard from "./AIInsightCard";
import { generateMissingDataInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function MissingDataPanel({ dataset }: Props) {
  const missingData = useMemo(() => {
    return dataset.columns.map((col, ci) => {
      const total = dataset.rows.length;
      let missing = 0;
      let maxGap = 0;
      let currentGap = 0;

      for (const row of dataset.rows) {
        if (row[ci] === null) {
          missing++;
          currentGap++;
          maxGap = Math.max(maxGap, currentGap);
        } else {
          currentGap = 0;
        }
      }

      return {
        name: col,
        type: dataset.columnTypes[col],
        missing,
        total,
        pct: (missing / total) * 100,
        maxGap,
      };
    });
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const withMissing = missingData.filter(d => d.missing > 0);
    const maxPct = Math.max(...missingData.map(d => d.pct), 0);
    const avgPct = missingData.length > 0
      ? missingData.reduce((s, d) => s + d.pct, 0) / missingData.length
      : 0;
    return generateMissingDataInsight(maxPct, avgPct, withMissing.length, missingData.length);
  }, [missingData]);

  // SVG heatmap of missingness pattern
  const heatmapData = useMemo(() => {
    const numCols = missingData.length;
    const numRows = dataset.rows.length;
    const blockH = Math.max(2, Math.min(4, 200 / numRows));
    const blockW = Math.max(8, Math.min(20, 600 / numCols));
    return { numCols, numRows, blockH, blockW };
  }, [missingData, dataset.rows.length]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--hover-item)]">
                <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Variable</th>
                <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">Missing</th>
                <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">% Missing</th>
                <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">Max Gap</th>
                <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] w-40">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {missingData.map((d, i) => (
                <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                  <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{d.name}</td>
                  <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">{d.missing} / {d.total}</td>
                  <td className="text-right px-3 py-2 tabular-nums">
                    <span className={d.pct > 10 ? "text-[#ef4444]" : d.pct > 5 ? "text-[#fbbf24]" : "text-[#00bc7d]"}>
                      {d.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">{d.maxGap}</td>
                  <td className="px-3 py-2">
                    <div className="w-full h-3 bg-[var(--hover-item)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(d.pct, 100)}%`,
                          backgroundColor: d.pct > 10 ? "#ef4444" : d.pct > 5 ? "#fbbf24" : "#00bc7d",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Missingness heatmap */}
        <div>
          <div className="text-[10px] font-semibold text-[var(--text-label)] mb-1">Missingness Heatmap</div>
          <div className="overflow-x-auto rounded border border-[var(--border-primary)]">
            <svg
              width={Math.min(heatmapData.numCols * heatmapData.blockW + 2, 700)}
              height={Math.min(heatmapData.numRows * heatmapData.blockH + 2, 200)}
              className="bg-[var(--hover-item)]/20"
            >
              {dataset.rows.map((row, ri) =>
                missingData.map((_, ci) => (
                  row[ci] === null ? (
                    <rect
                      key={`${ri}-${ci}`}
                      x={ci * heatmapData.blockW + 1}
                      y={ri * heatmapData.blockH + 1}
                      width={heatmapData.blockW - 1}
                      height={heatmapData.blockH - 1}
                      fill="#ef4444"
                      opacity={0.7}
                    />
                  ) : null
                ))
              )}
            </svg>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[9px] text-[var(--text-dim)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ef4444] rounded-sm" /> Missing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--hover-item)] rounded-sm border border-[var(--border-primary)]" /> Present</span>
          </div>
        </div>
      </div>
    </AIInsightCard>
  );
}
