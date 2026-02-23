"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateDataProfileInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function DataProfilePanel({ dataset }: Props) {
  const profile = useMemo(() => {
    return dataset.columns.map((col, ci) => {
      const type = dataset.columnTypes[col];
      const isNumeric = type !== "date" && type !== "string";
      const values = dataset.rows.map((r) => r[ci]);
      const nonNull = values.filter((v) => v !== null);
      const uniqueSet = new Set(nonNull.map(String));
      const completeness = (nonNull.length / values.length) * 100;

      let min: string | number = "-";
      let max: string | number = "-";
      if (isNumeric) {
        const nums = getNumericColumn(dataset, ci);
        const stats = computeStats(nums);
        if (stats.count > 0) {
          min = stats.min;
          max = stats.max;
        }
      } else if (type === "date") {
        const dates = nonNull.map(String).sort();
        if (dates.length > 0) {
          min = dates[0];
          max = dates[dates.length - 1];
        }
      }

      return {
        name: col,
        type,
        uniqueCount: uniqueSet.size,
        completeness,
        min,
        max,
      };
    });
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const completenessAvg =
      profile.reduce((s, p) => s + p.completeness, 0) / profile.length;
    const numericCols = profile.filter(
      (p) => p.type !== "date" && p.type !== "string"
    ).length;
    return generateDataProfileInsight(completenessAvg, profile.length, numericCols);
  }, [profile]);

  const completenessColor = (pct: number) => {
    if (pct > 95) return "#00bc7d";
    if (pct > 80) return "#fbbf24";
    return "#ef4444";
  };

  const fmtMinMax = (v: string | number) => {
    if (typeof v === "number") {
      return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return v;
  };

  return (
    <AIInsightCard
      insight={aiInsight.insight}
      confidence={aiInsight.confidence}
      recommendations={aiInsight.recommendations}
    >
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Column
              </th>
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Type
              </th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Unique
              </th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Completeness
              </th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Min
              </th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">
                Max
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.map((p, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50"
              >
                <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                  {p.name}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#6941c6]/10 text-[#6941c6] border border-[#6941c6]/20">
                    {p.type}
                  </span>
                </td>
                <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">
                  {p.uniqueCount}
                </td>
                <td className="text-right px-3 py-2 tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[var(--border-primary)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(p.completeness, 100)}%`,
                          backgroundColor: completenessColor(p.completeness),
                        }}
                      />
                    </div>
                    <span style={{ color: completenessColor(p.completeness) }}>
                      {p.completeness.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">
                  {fmtMinMax(p.min)}
                </td>
                <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">
                  {fmtMinMax(p.max)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
