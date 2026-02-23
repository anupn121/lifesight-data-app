"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeAdstockDecay } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateAdstockInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface AdstockRow {
  channel: string;
  decayRate: number;
  halfLife: number;
}

export default function AdstockEstimatePanel({ dataset }: Props) {
  const adstockData = useMemo(() => {
    const results: AdstockRow[] = [];

    dataset.columns.forEach((col, i) => {
      if (!col.startsWith("Spend:")) return;
      const vals = getNumericColumn(dataset, i);
      const { decayRate, halfLife } = computeAdstockDecay(vals);
      results.push({
        channel: col.replace("Spend: ", ""),
        decayRate,
        halfLife,
      });
    });

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (adstockData.length === 0) return { insight: "No spend channels found for adstock analysis.", confidence: "Low" as const, recommendations: [] };
    const avgDecay = adstockData.reduce((s, d) => s + d.decayRate, 0) / adstockData.length;
    const avgHalfLife = adstockData.reduce((s, d) => s + d.halfLife, 0) / adstockData.length;
    return generateAdstockInsight(avgDecay, avgHalfLife);
  }, [adstockData]);

  // Mini decay curve SVG
  const miniW = 80;
  const miniH = 30;
  const renderDecayCurve = (decayRate: number) => {
    const points: string[] = [];
    const steps = 20;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = 2 + t * (miniW - 4);
      const y = 2 + (1 - Math.pow(decayRate, s * 0.8)) * (miniH - 4);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  const halfLifeColor = (hl: number) => {
    if (hl < 2) return "#ef4444";
    if (hl > 4) return "#00bc7d";
    return "var(--text-primary)";
  };

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      {adstockData.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">No spend channels found for adstock analysis.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left text-[var(--text-label)] font-medium py-2 pr-4">Channel</th>
                <th className="text-right text-[var(--text-label)] font-medium py-2 pr-4">Decay Rate</th>
                <th className="text-right text-[var(--text-label)] font-medium py-2 pr-4">Half-Life (periods)</th>
                <th className="text-center text-[var(--text-label)] font-medium py-2">Decay Curve</th>
              </tr>
            </thead>
            <tbody>
              {adstockData.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-primary)]/50">
                  <td className="py-2 pr-4">
                    <span className="text-[var(--text-primary)] font-medium">{row.channel}</span>
                  </td>
                  <td className="text-right text-[var(--text-primary)] tabular-nums py-2 pr-4">
                    {row.decayRate.toFixed(3)}
                  </td>
                  <td className="text-right tabular-nums py-2 pr-4" style={{ color: halfLifeColor(row.halfLife) }}>
                    {row.halfLife.toFixed(1)}
                  </td>
                  <td className="py-2">
                    <div className="flex justify-center">
                      <svg width={miniW} height={miniH} className="rounded border border-[var(--border-primary)]/50 bg-[var(--hover-item)]/30">
                        <polyline
                          points={renderDecayCurve(row.decayRate)}
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AIInsightCard>
  );
}
