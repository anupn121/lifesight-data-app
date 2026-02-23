"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, detectChangePoints } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateChangePointInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function ChangePointPanel({ dataset }: Props) {
  const firstNumericIdx = useMemo(() => {
    return dataset.columns.findIndex(
      (col) => dataset.columnTypes[col] !== "date" && dataset.columnTypes[col] !== "string"
    );
  }, [dataset]);

  const values = useMemo(() => {
    if (firstNumericIdx < 0) return [];
    return getNumericColumn(dataset, firstNumericIdx).map((v) => v ?? 0);
  }, [dataset, firstNumericIdx]);

  const changePoints = useMemo(() => {
    if (values.length < 10) return [];
    return detectChangePoints(values);
  }, [values]);

  const aiInsight = useMemo(() => {
    return generateChangePointInsight(changePoints.length, values.length);
  }, [changePoints, values.length]);

  if (firstNumericIdx < 0 || values.length === 0) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-4">
        No numeric columns available for change point detection.
      </div>
    );
  }

  const width = 600;
  const height = 180;
  const pad = { top: 16, right: 12, bottom: 24, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = values.map((v, i) => {
    const x = pad.left + (i / Math.max(values.length - 1, 1)) * plotW;
    const y = pad.top + plotH - ((v - minVal) / range) * plotH;
    return { x, y };
  });

  const linePath = `M${points.map((p) => `${p.x},${p.y}`).join("L")}`;

  // Get date labels if available
  const dateColIdx = dataset.columns.findIndex((col) => dataset.columnTypes[col] === "date");
  const getLabel = (idx: number) => {
    if (dateColIdx >= 0 && dataset.rows[idx]) {
      return String(dataset.rows[idx][dateColIdx] ?? `#${idx}`);
    }
    return `#${idx}`;
  };

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-label)] font-medium">
            Column: {dataset.columns[firstNumericIdx]}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20">
            {changePoints.length} change point{changePoints.length !== 1 ? "s" : ""}
          </span>
        </div>

        <svg
          width={width}
          height={height}
          className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30"
          style={{ maxWidth: "100%" }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Main line */}
          <path d={linePath} fill="none" stroke="#2b7fff" strokeWidth={1.5} />

          {/* Change point vertical lines and labels */}
          {changePoints.map((cpIdx, i) => {
            const x = pad.left + (cpIdx / Math.max(values.length - 1, 1)) * plotW;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={pad.top + plotH}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <circle cx={x} cy={points[cpIdx]?.y ?? pad.top} r={3} fill="#ef4444" />
                <text
                  x={x}
                  y={pad.top - 4}
                  fontSize="7"
                  fill="#ef4444"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {getLabel(cpIdx)}
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          <text x={pad.left - 4} y={pad.top + 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {maxVal.toFixed(0)}
          </text>
          <text x={pad.left - 4} y={pad.top + plotH} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {minVal.toFixed(0)}
          </text>

          {/* X-axis labels */}
          <text x={pad.left} y={height - 4} fontSize="8" fill="var(--text-dim)">
            {getLabel(0)}
          </text>
          <text x={pad.left + plotW} y={height - 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
            {getLabel(values.length - 1)}
          </text>
        </svg>

        {/* Change point legend */}
        {changePoints.length > 0 && (
          <div className="flex items-center gap-4 text-[9px] text-[var(--text-dim)]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 border-t-2" style={{ borderColor: "#2b7fff" }} />
              Time series
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: "#ef4444" }} />
              Change points
            </span>
          </div>
        )}
      </div>
    </AIInsightCard>
  );
}
