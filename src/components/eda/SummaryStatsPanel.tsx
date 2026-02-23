"use client";

import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import { useMemo } from "react";
import AIInsightCard from "./AIInsightCard";
import { generateSummaryStatsInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function SummaryStatsPanel({ dataset }: Props) {
  const stats = useMemo(() => {
    const results: { name: string; stats: ReturnType<typeof computeStats> }[] = [];
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      const vals = getNumericColumn(dataset, i);
      results.push({ name: col, stats: computeStats(vals) });
    });
    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const highSkew = stats.filter(s => Math.abs(s.stats.skewness) > 1).length;
    const highKurt = stats.filter(s => Math.abs(s.stats.kurtosis) > 2).length;
    return generateSummaryStatsInsight(stats.length, highSkew, highKurt);
  }, [stats]);

  const metrics = ["count", "missing", "mean", "std", "min", "q1", "median", "q3", "max", "skewness", "kurtosis"] as const;
  const labels: Record<string, string> = {
    count: "Count", missing: "Missing", mean: "Mean", std: "Std Dev",
    min: "Min", q1: "Q1", median: "Median", q3: "Q3", max: "Max",
    skewness: "Skew", kurtosis: "Kurtosis",
  };

  const fmt = (v: number, key: string) => {
    if (key === "count" || key === "missing") return v.toString();
    if (Math.abs(v) >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
    return v.toFixed(2);
  };

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="sticky left-0 bg-[var(--hover-item)] text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Variable</th>
              {metrics.map((m) => (
                <th key={m} className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">{labels[m]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                <td className="sticky left-0 bg-[var(--bg-card)] text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{s.name}</td>
                {metrics.map((m) => (
                  <td key={m} className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">{fmt(s.stats[m], m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
