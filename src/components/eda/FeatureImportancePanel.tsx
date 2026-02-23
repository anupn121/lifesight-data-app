"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeFeatureImportance } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateFeatureImportanceInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function FeatureImportancePanel({ dataset }: Props) {
  const features = useMemo(() => {
    // Find first KPI column (not spend, not date, not string)
    let kpiIdx = -1;
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      if (col.startsWith("Spend:")) return;
      if (kpiIdx === -1 && (type === "integer" || type === "currency")) {
        kpiIdx = i;
      }
    });

    if (kpiIdx === -1) return [];

    return computeFeatureImportance(dataset, kpiIdx);
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (features.length === 0) return { insight: "No features available for importance analysis.", confidence: "Low" as const, recommendations: [] };
    return generateFeatureImportanceInsight(features[0].name, features[0].importance, features.length);
  }, [features]);

  const chartW = 500;
  const barH = 20;
  const gap = 4;
  const labelW = 180;
  const scoreW = 50;
  const barAreaW = chartW - labelW - scoreW - 16;
  const chartH = features.length * (barH + gap) + gap;

  const maxImportance = features.length > 0 ? features[0].importance : 1;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      {features.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">No features available for importance analysis.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg width={chartW} height={chartH}>
            {features.map((f, i) => {
              const y = gap + i * (barH + gap);
              const barW = maxImportance > 0 ? (f.importance / maxImportance) * barAreaW : 0;
              // Gradient: high rank = full opacity, low rank = 30%
              const opacity = features.length > 1 ? 1 - (i / (features.length - 1)) * 0.7 : 1;

              return (
                <g key={i}>
                  {/* Feature name */}
                  <text
                    x={labelW - 4}
                    y={y + barH / 2 + 1}
                    fontSize="10"
                    fill="var(--text-primary)"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    <title>{f.name}</title>
                    {f.name.length > 28 ? f.name.slice(0, 26) + "..." : f.name}
                  </text>
                  {/* Bar */}
                  <rect
                    x={labelW}
                    y={y}
                    width={Math.max(2, barW)}
                    height={barH}
                    rx={3}
                    fill="#6941c6"
                    opacity={opacity}
                  />
                  {/* Score */}
                  <text
                    x={labelW + barAreaW + 8}
                    y={y + barH / 2 + 1}
                    fontSize="9"
                    fill="var(--text-muted)"
                    dominantBaseline="middle"
                    className="tabular-nums"
                  >
                    {f.importance.toFixed(3)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </AIInsightCard>
  );
}
