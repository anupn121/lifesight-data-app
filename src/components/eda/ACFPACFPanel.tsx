"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeAutocorrelation, computePartialAutocorrelation } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateACFPACFInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

function BarChart({
  values,
  confBound,
  label,
  width = 290,
  height = 180,
}: {
  values: number[];
  confBound: number;
  label: string;
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;

  const pad = { top: 20, right: 12, bottom: 24, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxAbs = Math.max(1, ...values.map(Math.abs), confBound * 1.2);
  const barW = Math.max(2, (plotW / values.length) - 2);
  const zeroY = pad.top + plotH / 2;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-[var(--text-primary)]">{label}</span>
      <svg
        width={width}
        height={height}
        className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30"
        style={{ maxWidth: "100%" }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Zero line */}
        <line
          x1={pad.left}
          y1={zeroY}
          x2={pad.left + plotW}
          y2={zeroY}
          stroke="var(--text-dim)"
          strokeWidth={0.5}
        />

        {/* Confidence bands */}
        <line
          x1={pad.left}
          y1={zeroY - (confBound / maxAbs) * (plotH / 2)}
          x2={pad.left + plotW}
          y2={zeroY - (confBound / maxAbs) * (plotH / 2)}
          stroke="var(--text-dim)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <line
          x1={pad.left}
          y1={zeroY + (confBound / maxAbs) * (plotH / 2)}
          x2={pad.left + plotW}
          y2={zeroY + (confBound / maxAbs) * (plotH / 2)}
          stroke="var(--text-dim)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Bars */}
        {values.map((v, i) => {
          const x = pad.left + i * (plotW / values.length) + (plotW / values.length - barW) / 2;
          const barH = (Math.abs(v) / maxAbs) * (plotH / 2);
          const y = v >= 0 ? zeroY - barH : zeroY;
          const isSignificant = i > 0 && Math.abs(v) > confBound;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 0.5)}
              fill={isSignificant ? "#ef4444" : "#f59e0b"}
              opacity={0.85}
              rx={1}
            >
              <title>Lag {i}: {v.toFixed(3)}</title>
            </rect>
          );
        })}

        {/* Y-axis labels */}
        <text x={pad.left - 4} y={pad.top + 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          {maxAbs.toFixed(1)}
        </text>
        <text x={pad.left - 4} y={zeroY + 3} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          0
        </text>
        <text x={pad.left - 4} y={pad.top + plotH} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          {(-maxAbs).toFixed(1)}
        </text>

        {/* X-axis labels */}
        <text x={pad.left} y={height - 4} fontSize="8" fill="var(--text-dim)">0</text>
        <text x={pad.left + plotW} y={height - 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          {values.length - 1}
        </text>

        {/* Confidence bound label */}
        <text
          x={pad.left + plotW - 2}
          y={zeroY - (confBound / maxAbs) * (plotH / 2) - 3}
          fontSize="7"
          fill="var(--text-dim)"
          textAnchor="end"
        >
          95% CI
        </text>
      </svg>
    </div>
  );
}

export default function ACFPACFPanel({ dataset }: Props) {
  const firstNumericIdx = useMemo(() => {
    return dataset.columns.findIndex(
      (col) => dataset.columnTypes[col] !== "date" && dataset.columnTypes[col] !== "string"
    );
  }, [dataset]);

  const maxLag = 14;

  const acfValues = useMemo(() => {
    if (firstNumericIdx < 0) return [];
    return computeAutocorrelation(getNumericColumn(dataset, firstNumericIdx), maxLag);
  }, [dataset, firstNumericIdx]);

  const pacfValues = useMemo(() => {
    if (firstNumericIdx < 0) return [];
    return computePartialAutocorrelation(getNumericColumn(dataset, firstNumericIdx), maxLag);
  }, [dataset, firstNumericIdx]);

  const n = useMemo(() => {
    return dataset.rows.filter((row) => row[firstNumericIdx] !== null).length;
  }, [dataset, firstNumericIdx]);

  const confBound = n > 0 ? 1.96 / Math.sqrt(n) : 0.3;

  const aiInsight = useMemo(() => {
    if (acfValues.length === 0) return generateACFPACFInsight(0, 0, 0);

    // Count significant lags (excluding lag 0)
    const significantLags = acfValues.filter((v, i) => i > 0 && Math.abs(v) > confBound).length;

    // suggestedQ: first lag where ACF drops below confidence bound
    let suggestedQ = 0;
    for (let i = 1; i < acfValues.length; i++) {
      if (Math.abs(acfValues[i]) > confBound) suggestedQ = i;
      else break;
    }

    // suggestedP: first lag where PACF drops below confidence bound
    let suggestedP = 0;
    for (let i = 1; i < pacfValues.length; i++) {
      if (Math.abs(pacfValues[i]) > confBound) suggestedP = i;
      else break;
    }

    return generateACFPACFInsight(significantLags, suggestedP, suggestedQ);
  }, [acfValues, pacfValues, confBound]);

  if (firstNumericIdx < 0) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-4">
        No numeric columns available for ACF/PACF analysis.
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
          <span className="text-[9px] text-[var(--text-dim)]">
            n={n}, 95% CI = +/-{confBound.toFixed(3)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BarChart values={acfValues} confBound={confBound} label="Autocorrelation (ACF)" />
          <BarChart values={pacfValues} confBound={confBound} label="Partial Autocorrelation (PACF)" />
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[var(--text-dim)]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#f59e0b" }} />
            Within bounds
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#ef4444" }} />
            Significant
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: "var(--text-dim)" }} />
            95% confidence interval
          </span>
        </div>
      </div>
    </AIInsightCard>
  );
}
