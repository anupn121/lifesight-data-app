"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeSaturationCurve } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateSpendResponseInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface CurveData {
  channel: string;
  points: { x: number; y: number }[];
  a: number;
  b: number;
  r2: number;
  maxSpend: number;
}

export default function SpendResponseCurvePanel({ dataset }: Props) {
  const curveData = useMemo(() => {
    // Find spend columns and first KPI column
    const spendIndices: { idx: number; name: string }[] = [];
    let kpiIdx = -1;

    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      if (col.startsWith("Spend:")) {
        spendIndices.push({ idx: i, name: col });
      } else if (kpiIdx === -1 && (type === "integer" || type === "currency")) {
        kpiIdx = i;
      }
    });

    if (kpiIdx === -1 || spendIndices.length === 0) return [];

    const kpiVals = getNumericColumn(dataset, kpiIdx);

    const results: CurveData[] = [];
    for (const spend of spendIndices) {
      const spendVals = getNumericColumn(dataset, spend.idx);

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

      const { a, b, r2 } = computeSaturationCurve(xArr, yArr);
      const maxSpend = Math.max(...xArr);
      results.push({
        channel: spend.name.replace("Spend: ", ""),
        points,
        a,
        b,
        r2,
        maxSpend,
      });
    }

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (curveData.length === 0) return { insight: "No spend-KPI relationships to analyze.", confidence: "Low" as const, recommendations: [] };
    const saturatedChannels = curveData.filter(d => d.b * d.maxSpend > 2).length;
    return generateSpendResponseInsight(saturatedChannels, curveData.length);
  }, [curveData]);

  const chartW = 280;
  const chartH = 150;
  const pad = { top: 12, right: 12, bottom: 20, left: 36 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      {curveData.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">No spend columns found to plot response curves.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {curveData.map((cd, idx) => {
            const minX = Math.min(...cd.points.map(p => p.x));
            const maxX = Math.max(...cd.points.map(p => p.x));
            const minY = Math.min(...cd.points.map(p => p.y));
            const maxY = Math.max(...cd.points.map(p => p.y));
            const rangeX = maxX - minX || 1;
            const rangeY = maxY - minY || 1;

            const scaleX = (v: number) => pad.left + ((v - minX) / rangeX) * plotW;
            const scaleY = (v: number) => pad.top + plotH - ((v - minY) / rangeY) * plotH;

            // Generate fitted curve points
            const curvePoints: string[] = [];
            const steps = 50;
            for (let s = 0; s <= steps; s++) {
              const xVal = minX + (rangeX * s) / steps;
              const yVal = cd.a * (1 - Math.exp(-cd.b * xVal));
              const clampedY = Math.max(minY, Math.min(maxY, yVal));
              curvePoints.push(`${scaleX(xVal).toFixed(1)},${scaleY(clampedY).toFixed(1)}`);
            }

            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-label)] font-medium truncate" title={cd.channel}>
                    {cd.channel}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] tabular-nums">
                    R² = {cd.r2.toFixed(3)}
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

                  {/* Fitted saturation curve */}
                  <polyline
                    points={curvePoints.join(" ")}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2"
                  />

                  {/* Data points */}
                  {cd.points.map((p, pi) => (
                    <circle
                      key={pi}
                      cx={scaleX(p.x)}
                      cy={scaleY(p.y)}
                      r={2.5}
                      fill="#6941c6"
                      opacity={0.4}
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
