"use client";

import { useMemo } from "react";
import type { DataModel } from "../dataModelsData";
import type { MockDataset } from "../mockDataGenerator";
import { computeVIF } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateMulticollinearityInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
  model: DataModel;
}

export default function MulticollinearityPanel({ dataset, model }: Props) {
  const vifData = useMemo(() => {
    const spendCols = dataset.columns
      .map((col, i) => ({ col, i }))
      .filter(({ col }) => col.startsWith("Spend:"));

    if (spendCols.length < 2) return null;

    const vifs = computeVIF(dataset, spendCols.map((s) => s.i));
    return spendCols.map((s, i) => ({
      name: s.col.replace("Spend: ", ""),
      vif: vifs[i],
    }));
  }, [dataset, model]);

  const aiInsight = useMemo(() => {
    if (!vifData) return { insight: "Need at least 2 spend variables for VIF analysis.", confidence: "Low" as const, recommendations: [] };
    const highVif = vifData.filter(d => d.vif >= 5);
    const maxVifEntry = vifData.reduce((max, d) => d.vif > max.vif ? d : max, vifData[0]);
    return generateMulticollinearityInsight(highVif.length, maxVifEntry.vif, maxVifEntry.name);
  }, [vifData]);

  if (!vifData) {
    return (
      <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
        <div className="text-[var(--text-muted)] text-xs text-center py-8">
          Need at least 2 spend variables for VIF analysis.
        </div>
      </AIInsightCard>
    );
  }

  const getColor = (vif: number) => {
    if (vif < 5) return "text-[#00bc7d]";
    if (vif < 10) return "text-[#fbbf24]";
    return "text-[#ef4444]";
  };

  const getLabel = (vif: number) => {
    if (vif < 5) return "Low";
    if (vif < 10) return "Moderate";
    return "High";
  };

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">Spend Variable</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">VIF</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-2 border-b border-[var(--border-primary)]">Collinearity</th>
            </tr>
          </thead>
          <tbody>
            {vifData.map((d, i) => (
              <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                <td className="text-[var(--text-primary)] font-medium px-3 py-2">{d.name}</td>
                <td className={`text-right px-3 py-2 tabular-nums font-medium ${getColor(d.vif)}`}>{d.vif.toFixed(2)}</td>
                <td className={`text-center px-3 py-2 ${getColor(d.vif)}`}>{getLabel(d.vif)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[10px] text-[var(--text-dim)] border-t border-[var(--border-primary)]">
          VIF &lt; 5: Low collinearity | 5-10: Moderate | &gt; 10: High (consider removing or combining)
        </div>
      </div>
    </AIInsightCard>
  );
}
