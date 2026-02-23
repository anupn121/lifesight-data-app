"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateBoxPlotInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface BoxPlotData {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outlierCount: number;
  outlierPct: number;
  whiskerLow: number;
  whiskerHigh: number;
}

export default function BoxPlotPanel({ dataset }: Props) {
  const boxData = useMemo(() => {
    const results: BoxPlotData[] = [];

    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;

      const vals = getNumericColumn(dataset, ci);
      const stats = computeStats(vals);
      if (stats.count === 0) return;

      const iqr = stats.q3 - stats.q1;
      const whiskerLow = Math.max(stats.min, stats.q1 - 1.5 * iqr);
      const whiskerHigh = Math.min(stats.max, stats.q3 + 1.5 * iqr);

      const outlierCount = vals.filter(
        (v) => v !== null && (v < whiskerLow || v > whiskerHigh)
      ).length;
      const outlierPct =
        stats.count > 0 ? (outlierCount / stats.count) * 100 : 0;

      results.push({
        name: col,
        min: stats.min,
        q1: stats.q1,
        median: stats.median,
        q3: stats.q3,
        max: stats.max,
        outlierCount,
        outlierPct,
        whiskerLow,
        whiskerHigh,
      });
    });

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const outlierVars = boxData.filter((d) => d.outlierCount > 0).length;
    const maxOutlierPct = Math.max(0, ...boxData.map((d) => d.outlierPct));
    return generateBoxPlotInsight(outlierVars, boxData.length, maxOutlierPct);
  }, [boxData]);

  // Layout constants
  const labelWidth = 160;
  const plotWidth = 400;
  const rowHeight = 36;
  const svgWidth = labelWidth + plotWidth + 20;
  const plotLeft = labelWidth + 10;
  const boxHeight = 16;

  // Global min/max for scaling
  const globalMin = Math.min(...boxData.map((d) => d.min));
  const globalMax = Math.max(...boxData.map((d) => d.max));
  const range = globalMax - globalMin || 1;

  const scaleX = (val: number) => {
    return plotLeft + ((val - globalMin) / range) * plotWidth;
  };

  return (
    <AIInsightCard
      insight={aiInsight.insight}
      confidence={aiInsight.confidence}
      recommendations={aiInsight.recommendations}
    >
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <svg
          width={svgWidth}
          height={boxData.length * rowHeight + 20}
          viewBox={`0 0 ${svgWidth} ${boxData.length * rowHeight + 20}`}
        >
          {boxData.map((d, i) => {
            const cy = i * rowHeight + rowHeight / 2 + 10;
            const boxTop = cy - boxHeight / 2;

            const wLowX = scaleX(d.whiskerLow);
            const q1X = scaleX(d.q1);
            const medX = scaleX(d.median);
            const q3X = scaleX(d.q3);
            const wHighX = scaleX(d.whiskerHigh);

            return (
              <g key={i}>
                {/* Row background on hover - subtle grid line */}
                <line
                  x1={plotLeft}
                  y1={cy}
                  x2={plotLeft + plotWidth}
                  y2={cy}
                  stroke="var(--border-primary)"
                  strokeWidth="0.5"
                  strokeDasharray="2,4"
                />

                {/* Variable name */}
                <text
                  x={labelWidth}
                  y={cy + 4}
                  textAnchor="end"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="500"
                >
                  {d.name.length > 22 ? d.name.slice(0, 20) + "..." : d.name}
                </text>

                {/* Whisker line (low to high) */}
                <line
                  x1={wLowX}
                  y1={cy}
                  x2={wHighX}
                  y2={cy}
                  stroke="#6941c6"
                  strokeWidth="1"
                />

                {/* Whisker caps */}
                <line
                  x1={wLowX}
                  y1={boxTop + 2}
                  x2={wLowX}
                  y2={boxTop + boxHeight - 2}
                  stroke="#6941c6"
                  strokeWidth="1"
                />
                <line
                  x1={wHighX}
                  y1={boxTop + 2}
                  x2={wHighX}
                  y2={boxTop + boxHeight - 2}
                  stroke="#6941c6"
                  strokeWidth="1"
                />

                {/* Box (Q1 to Q3) */}
                <rect
                  x={q1X}
                  y={boxTop}
                  width={Math.max(q3X - q1X, 2)}
                  height={boxHeight}
                  fill="#6941c6"
                  fillOpacity="0.2"
                  stroke="#6941c6"
                  strokeWidth="1"
                  rx="2"
                />

                {/* Median line */}
                <line
                  x1={medX}
                  y1={boxTop}
                  x2={medX}
                  y2={boxTop + boxHeight}
                  stroke="#6941c6"
                  strokeWidth="2"
                />

                {/* Outlier indicator */}
                {d.outlierCount > 0 && (
                  <text
                    x={svgWidth - 10}
                    y={cy + 4}
                    textAnchor="end"
                    fill="#fbbf24"
                    fontSize="9"
                  >
                    {d.outlierCount} outlier{d.outlierCount > 1 ? "s" : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </AIInsightCard>
  );
}
