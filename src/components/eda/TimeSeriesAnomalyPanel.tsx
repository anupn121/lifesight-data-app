"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeMovingAverage, computeRollingZScore } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateTimeSeriesAnomalyInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function TimeSeriesAnomalyPanel({ dataset }: Props) {
  const firstNumericIdx = useMemo(() => {
    return dataset.columns.findIndex(
      (col) => dataset.columnTypes[col] !== "date" && dataset.columnTypes[col] !== "string"
    );
  }, [dataset]);

  const values = useMemo(() => {
    if (firstNumericIdx < 0) return [];
    return getNumericColumn(dataset, firstNumericIdx).map((v) => v ?? 0);
  }, [dataset, firstNumericIdx]);

  const analysis = useMemo(() => {
    if (values.length < 4) return null;

    const window = Math.max(3, Math.min(7, Math.floor(values.length / 10)));
    const expected = computeMovingAverage(values, window);
    const zScores = computeRollingZScore(values, window);

    // Compute rolling std for confidence band
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window);
      const slice = values.slice(start, i + 1);
      const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
      const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length);
      upperBand.push(expected[i] + 2 * std);
      lowerBand.push(expected[i] - 2 * std);
    }

    const anomalies = values
      .map((v, i) => ({ index: i, value: v, zScore: zScores[i] }))
      .filter((a) => Math.abs(a.zScore) > 2);

    return { expected, upperBand, lowerBand, anomalies };
  }, [values]);

  const aiInsight = useMemo(() => {
    if (!analysis) return generateTimeSeriesAnomalyInsight(0, 0);
    return generateTimeSeriesAnomalyInsight(analysis.anomalies.length, values.length);
  }, [analysis, values.length]);

  if (firstNumericIdx < 0 || values.length === 0 || !analysis) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-4">
        No numeric columns available for anomaly detection.
      </div>
    );
  }

  const { expected, upperBand, lowerBand, anomalies } = analysis;

  const width = 600;
  const height = 180;
  const pad = { top: 16, right: 12, bottom: 24, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = [...values, ...upperBand, ...lowerBand];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => pad.left + (i / Math.max(values.length - 1, 1)) * plotW;
  const toY = (v: number) => pad.top + plotH - ((v - minVal) / range) * plotH;

  // Build paths
  const actualPath = `M${values.map((v, i) => `${toX(i)},${toY(v)}`).join("L")}`;
  const expectedPath = `M${expected.map((v, i) => `${toX(i)},${toY(v)}`).join("L")}`;

  // Confidence band area: upper forward, lower backward
  const upperForward = upperBand.map((v, i) => `${toX(i)},${toY(v)}`);
  const lowerBackward = lowerBand.map((v, i) => `${toX(i)},${toY(v)}`).reverse();
  const bandPathCorrect = `M${upperForward.join("L")}L${lowerBackward.join("L")}Z`;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-label)] font-medium">
            Column: {dataset.columns[firstNumericIdx]}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${
            anomalies.length > 0
              ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
              : "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20"
          }`}>
            {anomalies.length} anomal{anomalies.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        <svg
          width={width}
          height={height}
          className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30"
          style={{ maxWidth: "100%" }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Confidence band */}
          <path d={bandPathCorrect} fill="#2b7fff" opacity={0.1} />

          {/* Actual values line (thin, muted) */}
          <path d={actualPath} fill="none" stroke="var(--text-dim)" strokeWidth={0.75} opacity={0.5} />

          {/* Expected (moving average) line */}
          <path d={expectedPath} fill="none" stroke="#2b7fff" strokeWidth={1.5} />

          {/* Anomaly dots */}
          {anomalies.map((a) => (
            <circle
              key={a.index}
              cx={toX(a.index)}
              cy={toY(a.value)}
              r={3.5}
              fill="#ef4444"
              stroke="white"
              strokeWidth={1}
            >
              <title>Index {a.index}: {a.value.toFixed(0)} (z={a.zScore.toFixed(2)})</title>
            </circle>
          ))}

          {/* Y-axis labels */}
          <text x={pad.left - 4} y={pad.top + 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {maxVal.toFixed(0)}
          </text>
          <text x={pad.left - 4} y={pad.top + plotH} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {minVal.toFixed(0)}
          </text>

          {/* X-axis labels */}
          <text x={pad.left} y={height - 4} fontSize="8" fill="var(--text-dim)">0</text>
          <text x={pad.left + plotW} y={height - 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {values.length - 1}
          </text>
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[9px] text-[var(--text-dim)]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 border-t-2" style={{ borderColor: "#2b7fff" }} />
            Expected (MA)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "rgba(43,127,255,0.1)", border: "1px solid #2b7fff" }} />
            95% band
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            Anomaly (|z| &gt; 2)
          </span>
        </div>
      </div>
    </AIInsightCard>
  );
}
