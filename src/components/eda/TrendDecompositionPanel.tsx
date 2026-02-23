"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeSeasonalDecomposition, computeStats } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateTrendDecompositionInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

function LineChart({
  data,
  color,
  label,
  width = 600,
  height = 100,
}: {
  data: number[];
  color: string;
  label: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;

  const pad = { top: 16, right: 12, bottom: 20, left: 12 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = pad.top + plotH - ((v - minVal) / range) * plotH;
    return `${x},${y}`;
  });

  const linePath = `M${points.join("L")}`;
  const areaPath = `${linePath}L${pad.left + plotW},${pad.top + plotH}L${pad.left},${pad.top + plotH}Z`;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
      <svg
        width={width}
        height={height}
        className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30"
        style={{ maxWidth: "100%" }}
        viewBox={`0 0 ${width} ${height}`}
      >
        <path d={areaPath} fill={color} opacity={0.1} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />
        <text x={pad.left + 2} y={height - 4} fontSize="8" fill="var(--text-dim)">0</text>
        <text x={pad.left + plotW} y={height - 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          {data.length - 1}
        </text>
        <text x={pad.left + 2} y={pad.top - 4} fontSize="8" fill="var(--text-dim)">
          {maxVal.toFixed(0)}
        </text>
        <text x={pad.left + 2} y={pad.top + plotH - 2} fontSize="8" fill="var(--text-dim)">
          {minVal.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}

export default function TrendDecompositionPanel({ dataset }: Props) {
  const firstNumericIdx = useMemo(() => {
    return dataset.columns.findIndex(
      (col) => dataset.columnTypes[col] !== "date" && dataset.columnTypes[col] !== "string"
    );
  }, [dataset]);

  const decomposition = useMemo(() => {
    if (firstNumericIdx < 0) return null;
    const raw = getNumericColumn(dataset, firstNumericIdx);
    const nums = raw.map((v) => v ?? 0);
    if (nums.length < 4) return null;
    const period = Math.max(2, Math.min(12, Math.floor(nums.length / 4)));
    return { ...computeSeasonalDecomposition(nums, period), original: nums };
  }, [dataset, firstNumericIdx]);

  const aiInsight = useMemo(() => {
    if (!decomposition) {
      return generateTrendDecompositionInsight("flat", 0);
    }
    const { trend, seasonal, original } = decomposition;
    const n = trend.length;
    const q = Math.floor(n / 4);

    const firstQMean = trend.slice(0, q).reduce((s, v) => s + v, 0) / q;
    const lastQMean = trend.slice(n - q).reduce((s, v) => s + v, 0) / q;
    const pctChange = firstQMean !== 0 ? ((lastQMean - firstQMean) / Math.abs(firstQMean)) * 100 : 0;
    const trendDirection: "up" | "down" | "flat" =
      pctChange > 5 ? "up" : pctChange < -5 ? "down" : "flat";

    const seasonalStd = computeStats(seasonal).std;
    const originalStd = computeStats(original).std;
    const seasonalStrength = originalStd > 0 ? seasonalStd / originalStd : 0;

    return generateTrendDecompositionInsight(trendDirection, seasonalStrength);
  }, [decomposition]);

  if (firstNumericIdx < 0) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-4">
        No numeric columns available for trend decomposition.
      </div>
    );
  }

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-label)] font-medium">
            Column: {dataset.columns[firstNumericIdx]}
          </span>
        </div>
        {decomposition && (
          <div className="flex flex-col gap-2">
            <LineChart data={decomposition.trend} color="#2b7fff" label="Trend" />
            <LineChart data={decomposition.seasonal} color="#f59e0b" label="Seasonal" />
            <LineChart data={decomposition.residual} color="#6941c6" label="Residual" />
          </div>
        )}
      </div>
    </AIInsightCard>
  );
}
