"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, linearRegression } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateScatterPlotInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface ScatterData {
  spendName: string;
  kpiName: string;
  points: { x: number; y: number }[];
  regression: { slope: number; intercept: number; r2: number };
}

export default function ScatterPlotPanel({ dataset }: Props) {
  const scatterData = useMemo(() => {
    // Find spend columns and first KPI column
    const spendIndices: { idx: number; name: string }[] = [];
    let kpiIdx = -1;
    let kpiName = "";

    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      if (col.startsWith("Spend:")) {
        spendIndices.push({ idx: i, name: col });
      } else if (kpiIdx === -1 && (type === "currency" || type === "integer")) {
        kpiIdx = i;
        kpiName = col;
      }
    });

    if (kpiIdx === -1 || spendIndices.length === 0) return [];

    const kpiVals = getNumericColumn(dataset, kpiIdx);

    const results: ScatterData[] = [];
    for (const spend of spendIndices) {
      const spendVals = getNumericColumn(dataset, spend.idx);

      // Build paired data (no nulls)
      const xArr: number[] = [];
      const yArr: number[] = [];
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < Math.min(spendVals.length, kpiVals.length); i++) {
        if (spendVals[i] !== null && kpiVals[i] !== null) {
          xArr.push(spendVals[i]!);
          yArr.push(kpiVals[i]!);
          points.push({ x: spendVals[i]!, y: kpiVals[i]! });
        }
      }

      if (xArr.length < 3) continue;

      const reg = linearRegression(xArr, yArr);
      results.push({
        spendName: spend.name,
        kpiName,
        points,
        regression: reg,
      });
    }

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (scatterData.length === 0) return { insight: "No spend-KPI relationships to analyze.", confidence: "Low" as const, recommendations: [] };
    const avgR2 = scatterData.reduce((s, d) => s + d.regression.r2, 0) / scatterData.length;
    const strongCount = scatterData.filter(d => d.regression.r2 > 0.3).length;
    return generateScatterPlotInsight(avgR2, strongCount);
  }, [scatterData]);

  const chartW = 200;
  const chartH = 150;
  const pad = { top: 12, right: 12, bottom: 20, left: 30 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      {scatterData.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">No spend columns found to plot against KPIs.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {scatterData.map((sd, idx) => {
            const minX = Math.min(...sd.points.map(p => p.x));
            const maxX = Math.max(...sd.points.map(p => p.x));
            const minY = Math.min(...sd.points.map(p => p.y));
            const maxY = Math.max(...sd.points.map(p => p.y));
            const rangeX = maxX - minX || 1;
            const rangeY = maxY - minY || 1;

            const scaleX = (v: number) => pad.left + ((v - minX) / rangeX) * plotW;
            const scaleY = (v: number) => pad.top + plotH - ((v - minY) / rangeY) * plotH;

            // Regression line endpoints
            const regX1 = minX;
            const regX2 = maxX;
            const regY1 = sd.regression.intercept + sd.regression.slope * regX1;
            const regY2 = sd.regression.intercept + sd.regression.slope * regX2;

            // Clamp regression line to visible area
            const clampedRegY1 = Math.max(minY, Math.min(maxY, regY1));
            const clampedRegY2 = Math.max(minY, Math.min(maxY, regY2));

            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-label)] font-medium truncate" title={sd.spendName}>
                    {sd.spendName.replace("Spend: ", "")}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] tabular-nums">
                    R² = {sd.regression.r2.toFixed(3)}
                  </span>
                </div>
                <svg width={chartW} height={chartH} className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
                  {/* Y axis labels */}
                  <text x={pad.left - 4} y={pad.top + 4} fontSize="7" fill="var(--text-dim)" textAnchor="end">
                    {maxY >= 1000 ? (maxY / 1000).toFixed(0) + "k" : maxY.toFixed(0)}
                  </text>
                  <text x={pad.left - 4} y={pad.top + plotH} fontSize="7" fill="var(--text-dim)" textAnchor="end">
                    {minY >= 1000 ? (minY / 1000).toFixed(0) + "k" : minY.toFixed(0)}
                  </text>
                  {/* X axis labels */}
                  <text x={pad.left} y={chartH - 4} fontSize="7" fill="var(--text-dim)">
                    {minX >= 1000 ? (minX / 1000).toFixed(0) + "k" : minX.toFixed(0)}
                  </text>
                  <text x={pad.left + plotW} y={chartH - 4} fontSize="7" fill="var(--text-dim)" textAnchor="end">
                    {maxX >= 1000 ? (maxX / 1000).toFixed(0) + "k" : maxX.toFixed(0)}
                  </text>

                  {/* Regression line */}
                  <line
                    x1={scaleX(regX1)}
                    y1={scaleY(clampedRegY1)}
                    x2={scaleX(regX2)}
                    y2={scaleY(clampedRegY2)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />

                  {/* Data points */}
                  {sd.points.map((p, pi) => (
                    <circle
                      key={pi}
                      cx={scaleX(p.x)}
                      cy={scaleY(p.y)}
                      r={2.5}
                      fill="#6941c6"
                      opacity={0.5}
                    >
                      <title>{`(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </AIInsightCard>
  );
}
