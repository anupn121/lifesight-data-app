"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeSeasonalDecomposition, computeStats } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateSeasonalityInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function SeasonalityPanel({ dataset }: Props) {
  const firstNumericIdx = useMemo(() => {
    return dataset.columns.findIndex(
      (col) => dataset.columnTypes[col] !== "date" && dataset.columnTypes[col] !== "string"
    );
  }, [dataset]);

  const analysis = useMemo(() => {
    if (firstNumericIdx < 0) return null;
    const raw = getNumericColumn(dataset, firstNumericIdx);
    const nums = raw.map((v) => v ?? 0);
    if (nums.length < 8) return null;

    // Try candidate periods and pick the one with the strongest seasonal component
    const candidates = [7, 12, 4, 52].filter((p) => p < nums.length / 2);
    let bestPeriod = candidates[0] || 4;
    let bestStrength = 0;

    for (const period of candidates) {
      const decomp = computeSeasonalDecomposition(nums, period);
      const seasonalStd = computeStats(decomp.seasonal).std;
      const originalStd = computeStats(nums).std;
      const strength = originalStd > 0 ? seasonalStd / originalStd : 0;
      if (strength > bestStrength) {
        bestStrength = strength;
        bestPeriod = period;
      }
    }

    // Build heatmap data: rows = cycle position, cols = time period index
    const numCycles = Math.ceil(nums.length / bestPeriod);
    const grid: (number | null)[][] = [];
    for (let pos = 0; pos < bestPeriod; pos++) {
      const row: (number | null)[] = [];
      for (let cycle = 0; cycle < numCycles; cycle++) {
        const idx = cycle * bestPeriod + pos;
        row.push(idx < nums.length ? nums[idx] : null);
      }
      grid.push(row);
    }

    // Find min/max for color scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of grid) {
      for (const v of row) {
        if (v !== null) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
    }

    return { period: bestPeriod, strength: bestStrength, grid, numCycles, minVal, maxVal };
  }, [dataset, firstNumericIdx]);

  const aiInsight = useMemo(() => {
    if (!analysis) return generateSeasonalityInsight(4, 0);
    return generateSeasonalityInsight(analysis.period, analysis.strength);
  }, [analysis]);

  if (firstNumericIdx < 0 || !analysis) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-4">
        No numeric columns available for seasonality analysis.
      </div>
    );
  }

  const { period, grid, numCycles, minVal, maxVal } = analysis;
  const range = maxVal - minVal || 1;

  const cellW = Math.min(32, Math.max(16, Math.floor(540 / numCycles)));
  const cellH = Math.min(28, Math.max(16, Math.floor(200 / period)));
  const labelW = 40;
  const pad = { top: 24, left: labelW + 8, right: 8, bottom: 8 };
  const svgW = pad.left + numCycles * cellW + pad.right;
  const svgH = pad.top + period * cellH + pad.bottom;

  const periodLabels: Record<number, string[]> = {
    7: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    12: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    4: ["Q1", "Q2", "Q3", "Q4"],
    52: Array.from({ length: 52 }, (_, i) => `W${i + 1}`),
  };
  const yLabels = periodLabels[period] || Array.from({ length: period }, (_, i) => `P${i + 1}`);

  // Interpolate color from hover-item gray to #f59e0b
  function getCellColor(v: number | null): string {
    if (v === null) return "var(--hover-item)";
    const t = (v - minVal) / range;
    const r = Math.round(200 + t * (245 - 200));
    const g = Math.round(200 + t * (158 - 200));
    const b = Math.round(210 + t * (11 - 210));
    return `rgb(${r},${g},${b})`;
  }

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--text-label)] font-medium">
            Column: {dataset.columns[firstNumericIdx]}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">
            Period: {period}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20">
            Strength: {(analysis.strength * 100).toFixed(0)}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <svg
            width={svgW}
            height={svgH}
            className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30"
            style={{ maxWidth: "100%" }}
            viewBox={`0 0 ${svgW} ${svgH}`}
          >
            {/* Column headers */}
            {Array.from({ length: numCycles }, (_, c) => (
              <text
                key={`ch-${c}`}
                x={pad.left + c * cellW + cellW / 2}
                y={pad.top - 6}
                fontSize="8"
                fill="var(--text-dim)"
                textAnchor="middle"
              >
                {c + 1}
              </text>
            ))}

            {/* Row labels */}
            {grid.map((_, pos) => (
              <text
                key={`rl-${pos}`}
                x={pad.left - 6}
                y={pad.top + pos * cellH + cellH / 2 + 3}
                fontSize="8"
                fill="var(--text-dim)"
                textAnchor="end"
              >
                {yLabels[pos] || `P${pos + 1}`}
              </text>
            ))}

            {/* Heatmap cells */}
            {grid.map((row, pos) =>
              row.map((v, cycle) => (
                <rect
                  key={`c-${pos}-${cycle}`}
                  x={pad.left + cycle * cellW}
                  y={pad.top + pos * cellH}
                  width={cellW - 1}
                  height={cellH - 1}
                  fill={getCellColor(v)}
                  rx={2}
                >
                  <title>
                    {yLabels[pos] || `P${pos + 1}`}, Cycle {cycle + 1}: {v !== null ? v.toFixed(0) : "N/A"}
                  </title>
                </rect>
              ))
            )}
          </svg>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--text-dim)]">{minVal.toFixed(0)}</span>
          <div
            className="h-2 flex-1 rounded"
            style={{
              background: `linear-gradient(to right, rgb(200,200,210), rgb(245,158,11))`,
              maxWidth: 120,
            }}
          />
          <span className="text-[9px] text-[var(--text-dim)]">{maxVal.toFixed(0)}</span>
        </div>
      </div>
    </AIInsightCard>
  );
}
