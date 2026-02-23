"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateOutlierImpactInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function pctChangeColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 2) return "#00bc7d";
  if (abs < 5) return "#fbbf24";
  return "#ef4444";
}

export default function OutlierImpactPanel({ dataset }: Props) {
  const impactData = useMemo(() => {
    const results: {
      name: string;
      full: { mean: number; std: number; min: number; max: number };
      trimmed: { mean: number; std: number; min: number; max: number };
      pctChangeMean: number;
      pctChangeStd: number;
    }[] = [];

    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;

      const raw = getNumericColumn(dataset, ci);
      const fullStats = computeStats(raw);

      // Trim outliers using IQR method
      const iqr = fullStats.q3 - fullStats.q1;
      const lower = fullStats.q1 - 1.5 * iqr;
      const upper = fullStats.q3 + 1.5 * iqr;
      const trimmed = raw.filter((v): v is number => v !== null && v >= lower && v <= upper);
      const trimmedWithNulls: (number | null)[] = trimmed;
      const trimmedStats = computeStats(trimmedWithNulls);

      const pctChangeMean = fullStats.mean !== 0
        ? ((trimmedStats.mean - fullStats.mean) / Math.abs(fullStats.mean)) * 100
        : 0;
      const pctChangeStd = fullStats.std !== 0
        ? ((trimmedStats.std - fullStats.std) / Math.abs(fullStats.std)) * 100
        : 0;

      results.push({
        name: col,
        full: { mean: fullStats.mean, std: fullStats.std, min: fullStats.min, max: fullStats.max },
        trimmed: { mean: trimmedStats.mean, std: trimmedStats.std, min: trimmedStats.min, max: trimmedStats.max },
        pctChangeMean,
        pctChangeStd,
      });
    });

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const avgPctChange = impactData.length > 0
      ? impactData.reduce((s, d) => s + Math.abs(d.pctChangeMean), 0) / impactData.length
      : 0;
    return generateOutlierImpactInsight(avgPctChange);
  }, [impactData]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]" rowSpan={2}>Variable</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-1.5 border-b border-[var(--border-primary)]" colSpan={4}>Full Data</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-1.5 border-b border-[var(--border-primary)]" colSpan={4}>Trimmed Data</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-1.5 border-b border-[var(--border-primary)]" colSpan={2}>% Change</th>
            </tr>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Mean</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Std</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Min</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Max</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Mean</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Std</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Min</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Max</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Mean</th>
              <th className="text-[var(--text-muted)] font-normal text-right px-2 py-1.5 border-b border-[var(--border-primary)]">Std</th>
            </tr>
          </thead>
          <tbody>
            {impactData.map((d, i) => (
              <tr key={i} className="border-b border-[var(--border-primary)] hover:bg-[var(--hover-item)]/50">
                <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{d.name}</td>
                <td className="text-[var(--text-primary)] text-right px-2 py-2 tabular-nums">{fmt(d.full.mean)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.full.std)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.full.min)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.full.max)}</td>
                <td className="text-[var(--text-primary)] text-right px-2 py-2 tabular-nums">{fmt(d.trimmed.mean)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.trimmed.std)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.trimmed.min)}</td>
                <td className="text-[var(--text-muted)] text-right px-2 py-2 tabular-nums">{fmt(d.trimmed.max)}</td>
                <td className="text-right px-2 py-2 tabular-nums font-medium" style={{ color: pctChangeColor(d.pctChangeMean) }}>
                  {d.pctChangeMean >= 0 ? "+" : ""}{d.pctChangeMean.toFixed(1)}%
                </td>
                <td className="text-right px-2 py-2 tabular-nums font-medium" style={{ color: pctChangeColor(d.pctChangeStd) }}>
                  {d.pctChangeStd >= 0 ? "+" : ""}{d.pctChangeStd.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
