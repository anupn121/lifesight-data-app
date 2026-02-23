"use client";

import { useState, useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateOutlierInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function OutlierDetectionPanel({ dataset }: Props) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const outlierData = useMemo(() => {
    const results: {
      name: string;
      outlierCount: number;
      pct: number;
      method: string;
      q1: number; q3: number; iqr: number;
      outlierValues: { index: number; value: number; date: string }[];
    }[] = [];

    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;

      const vals = getNumericColumn(dataset, ci);
      const stats = computeStats(vals);
      const iqr = stats.q3 - stats.q1;
      const lower = stats.q1 - 1.5 * iqr;
      const upper = stats.q3 + 1.5 * iqr;

      const outlierValues: { index: number; value: number; date: string }[] = [];
      vals.forEach((v, i) => {
        if (v !== null && (v < lower || v > upper)) {
          outlierValues.push({
            index: i,
            value: v,
            date: dataset.rows[i][0] as string,
          });
        }
      });

      results.push({
        name: col,
        outlierCount: outlierValues.length,
        pct: (outlierValues.length / vals.filter((v) => v !== null).length) * 100,
        method: "IQR (1.5x)",
        q1: stats.q1, q3: stats.q3, iqr,
        outlierValues,
      });
    });

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const total = outlierData.reduce((s, d) => s + d.outlierCount, 0);
    const withOutliers = outlierData.filter(d => d.outlierCount > 0).length;
    return generateOutlierInsight(total, withOutliers, outlierData.length);
  }, [outlierData]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="w-6 px-2 py-2 border-b border-[var(--border-primary)]" />
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Variable</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]"># Outliers</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">% Outliers</th>
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Method</th>
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] w-32">Strip Plot</th>
            </tr>
          </thead>
          <tbody>
            {outlierData.map((d, i) => {
              const allVals = getNumericColumn(dataset, dataset.columns.indexOf(d.name)).filter((v): v is number => v !== null);
              const min = Math.min(...allVals);
              const max = Math.max(...allVals);
              const range = max - min || 1;
              return (
                <>
                  <tr
                    key={`row-${i}`}
                    className="border-b border-[var(--border-primary)] hover:bg-[var(--hover-item)]/50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  >
                    <td className="px-2 py-2 text-center text-[var(--text-muted)]">
                      <svg
                        width="10" height="10" viewBox="0 0 10 10"
                        className={`transition-transform ${expandedRow === i ? "rotate-90" : ""}`}
                      >
                        <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </td>
                    <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{d.name}</td>
                    <td className="text-right px-3 py-2 tabular-nums">
                      <span className={d.outlierCount > 0 ? "text-[#fbbf24]" : "text-[#00bc7d]"}>{d.outlierCount}</span>
                    </td>
                    <td className="text-right px-3 py-2 tabular-nums">
                      <span className={d.pct > 5 ? "text-[#ef4444]" : d.pct > 0 ? "text-[#fbbf24]" : "text-[#00bc7d]"}>
                        {d.pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-[var(--text-muted)] px-3 py-2">{d.method}</td>
                    <td className="px-3 py-2">
                      <svg width="120" height="16" viewBox="0 0 120 16">
                        {/* IQR box */}
                        <rect
                          x={((d.q1 - min) / range) * 110 + 5}
                          y={3}
                          width={Math.max(((d.q3 - d.q1) / range) * 110, 2)}
                          height={10}
                          fill="#6941c6" opacity={0.15} rx={1}
                        />
                        {/* Strip dots */}
                        {allVals.slice(0, 50).map((v, j) => {
                          const isOutlier = v < d.q1 - 1.5 * d.iqr || v > d.q3 + 1.5 * d.iqr;
                          return (
                            <circle
                              key={j}
                              cx={((v - min) / range) * 110 + 5}
                              cy={8}
                              r={1.5}
                              fill={isOutlier ? "#ef4444" : "#6941c6"}
                              opacity={isOutlier ? 0.8 : 0.3}
                            />
                          );
                        })}
                      </svg>
                    </td>
                  </tr>
                  {expandedRow === i && d.outlierValues.length > 0 && (
                    <tr key={`detail-${i}`}>
                      <td colSpan={6} className="px-6 py-2 bg-[var(--hover-item)]/30">
                        <div className="flex flex-wrap gap-2">
                          {d.outlierValues.slice(0, 10).map((ov, j) => (
                            <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                              {ov.date}: {ov.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                            </span>
                          ))}
                          {d.outlierValues.length > 10 && (
                            <span className="text-[10px] text-[var(--text-muted)]">+{d.outlierValues.length - 10} more</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
