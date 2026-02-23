"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeADF, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateStationarityInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function StationarityCheckPanel({ dataset }: Props) {
  const results = useMemo(() => {
    const out: { name: string; statistic: number; pValue: number; isStationary: boolean }[] = [];
    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      const vals = getNumericColumn(dataset, ci);
      const adf = computeADF(vals);
      out.push({ name: col, ...adf });
    });
    return out;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const stationaryCount = results.filter(r => r.isStationary).length;
    return generateStationarityInsight(stationaryCount, results.length);
  }, [results]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Variable</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">ADF Statistic</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">p-value</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-2 border-b border-[var(--border-primary)]">Stationary?</th>
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{r.name}</td>
                <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">{r.statistic.toFixed(3)}</td>
                <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">{r.pValue.toFixed(3)}</td>
                <td className="text-center px-3 py-2">
                  {r.isStationary ? (
                    <span className="text-[#00bc7d] font-medium">Stationary</span>
                  ) : (
                    <span className="text-[#ef4444] font-medium">Non-stationary</span>
                  )}
                </td>
                <td className="text-[var(--text-muted)] px-3 py-2 text-[10px]">
                  {r.isStationary ? "Ready for modeling" : "Apply d=1 differencing"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
