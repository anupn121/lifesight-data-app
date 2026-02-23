"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeRollingZScore, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateSpendAnomalyInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function SpendAnomalyPanel({ dataset }: Props) {
  const channelData = useMemo(() => {
    const results: {
      name: string;
      values: number[];
      zScores: number[];
      anomalyCount: number;
    }[] = [];

    dataset.columns.forEach((col, ci) => {
      if (!col.startsWith("Spend:")) return;

      const raw = getNumericColumn(dataset, ci);
      const values = raw.map((v) => v ?? 0);
      const zScores = computeRollingZScore(values, 7);
      const anomalyCount = zScores.filter((z) => Math.abs(z) > 2).length;

      results.push({ name: col.replace("Spend: ", ""), values, zScores, anomalyCount });
    });

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const anomalyChannels = channelData.filter((c) => c.anomalyCount > 0).length;
    return generateSpendAnomalyInsight(anomalyChannels, channelData.length);
  }, [channelData]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <div className="p-3 space-y-2">
          {channelData.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">No spend channels found in dataset.</p>
          )}
          {channelData.map((channel, idx) => {
            const min = Math.min(...channel.values);
            const max = Math.max(...channel.values);
            const range = max - min || 1;
            const width = 500;
            const height = 30;
            const padding = 4;
            const plotW = width - padding * 2;
            const plotH = height - padding * 2;
            const n = channel.values.length;

            // Build polyline points
            const points = channel.values
              .map((v, i) => {
                const x = padding + (i / Math.max(n - 1, 1)) * plotW;
                const y = padding + plotH - ((v - min) / range) * plotH;
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-right">
                  <span className="text-xs text-[var(--text-primary)] font-medium truncate block">{channel.name}</span>
                  {channel.anomalyCount > 0 && (
                    <span className="text-[10px] text-[#ef4444]">{channel.anomalyCount} anomalies</span>
                  )}
                  {channel.anomalyCount === 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">No anomalies</span>
                  )}
                </div>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
                  {/* Background */}
                  <rect x={0} y={0} width={width} height={height} fill="var(--bg-card)" rx={4} />
                  {/* Timeline line */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke="var(--text-dim)"
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                  />
                  {/* Anomaly markers */}
                  {channel.values.map((v, i) => {
                    if (Math.abs(channel.zScores[i]) <= 2) return null;
                    const x = padding + (i / Math.max(n - 1, 1)) * plotW;
                    const y = padding + plotH - ((v - min) / range) * plotH;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={3.5}
                        fill="#ef4444"
                        opacity={0.85}
                        stroke="#ef4444"
                        strokeWidth={0.5}
                      />
                    );
                  })}
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </AIInsightCard>
  );
}
