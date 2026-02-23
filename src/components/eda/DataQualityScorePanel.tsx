"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateDataQualityScoreInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface DimensionScore {
  name: string;
  score: number;
}

export default function DataQualityScorePanel({ dataset }: Props) {
  const { overallScore, dimensions } = useMemo(() => {
    const totalRows = dataset.rows.length;
    const totalCols = dataset.columns.length;

    // Completeness: % non-null across all cells
    let totalCells = 0;
    let nonNullCells = 0;
    for (const row of dataset.rows) {
      for (const val of row) {
        totalCells++;
        if (val !== null) nonNullCells++;
      }
    }
    const completeness = totalCells > 0 ? (nonNullCells / totalCells) * 100 : 100;

    // Consistency: pass rate of basic checks
    let checksPassed = 0;
    let checksTotal = 0;
    const spendIndices: number[] = [];
    const kpiIndices: number[] = [];
    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (col.toLowerCase().startsWith("spend")) spendIndices.push(ci);
      else if (type !== "date" && type !== "string") kpiIndices.push(ci);
    });

    // No negative spend check
    checksTotal++;
    let hasNegSpend = false;
    for (const si of spendIndices) {
      const vals = getNumericColumn(dataset, si);
      if (vals.some((v) => v !== null && v < 0)) hasNegSpend = true;
    }
    if (!hasNegSpend) checksPassed++;

    // No negative KPI check
    checksTotal++;
    let hasNegKpi = false;
    for (const ki of kpiIndices) {
      const vals = getNumericColumn(dataset, ki);
      if (vals.some((v) => v !== null && v < 0)) hasNegKpi = true;
    }
    if (!hasNegKpi) checksPassed++;

    // No extreme outliers check
    checksTotal++;
    let hasExtreme = false;
    for (const ci of [...spendIndices, ...kpiIndices]) {
      const vals = getNumericColumn(dataset, ci);
      const stats = computeStats(vals);
      if (stats.std > 0) {
        if (vals.some((v) => v !== null && Math.abs(v - stats.mean) > 3 * stats.std)) {
          hasExtreme = true;
        }
      }
    }
    if (!hasExtreme) checksPassed++;

    const consistency = checksTotal > 0 ? (checksPassed / checksTotal) * 100 : 100;

    // Validity: % of numeric values within IQR-based range
    let validCount = 0;
    let totalNumeric = 0;
    for (const ci of [...spendIndices, ...kpiIndices]) {
      const vals = getNumericColumn(dataset, ci);
      const stats = computeStats(vals);
      const iqr = stats.q3 - stats.q1;
      const lower = stats.q1 - 3 * iqr;
      const upper = stats.q3 + 3 * iqr;
      for (const v of vals) {
        if (v !== null) {
          totalNumeric++;
          if (v >= lower && v <= upper) validCount++;
        }
      }
    }
    const validity = totalNumeric > 0 ? (validCount / totalNumeric) * 100 : 100;

    // Uniqueness: 1 - duplicate rate
    const rowKeys = new Set<string>();
    let dupCount = 0;
    for (const row of dataset.rows) {
      const key = row.map((v) => (v === null ? "__NULL__" : String(v))).join("|");
      if (rowKeys.has(key)) {
        dupCount++;
      } else {
        rowKeys.add(key);
      }
    }
    const uniqueness = totalRows > 0 ? ((totalRows - dupCount) / totalRows) * 100 : 100;

    // Timeliness: check recency of data
    const dateIdx = dataset.columns.indexOf("Date");
    let timeliness = 100;
    if (dateIdx >= 0) {
      const dates = dataset.rows
        .map((r) => r[dateIdx])
        .filter((d): d is string => typeof d === "string")
        .sort();
      if (dates.length > 0) {
        const lastDate = new Date(dates[dates.length - 1]);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Score decreases with age: 100 if <7 days, 80 if <30, 60 if <90, 40 otherwise
        timeliness =
          daysDiff < 7 ? 100 : daysDiff < 30 ? 80 : daysDiff < 90 ? 60 : 40;
      }
    }

    const dims: DimensionScore[] = [
      { name: "Completeness", score: completeness },
      { name: "Consistency", score: consistency },
      { name: "Validity", score: validity },
      { name: "Uniqueness", score: uniqueness },
      { name: "Timeliness", score: timeliness },
    ];

    const overall = Math.round(
      dims.reduce((s, d) => s + d.score, 0) / dims.length
    );

    return { overallScore: overall, dimensions: dims };
  }, [dataset]);

  const aiInsight = useMemo(() => {
    return generateDataQualityScoreInsight(overallScore);
  }, [overallScore]);

  const scoreColor = (score: number) => {
    if (score > 80) return "#00bc7d";
    if (score > 60) return "#fbbf24";
    return "#ef4444";
  };

  const color = scoreColor(overallScore);

  // SVG gauge parameters
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (overallScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <AIInsightCard
      insight={aiInsight.insight}
      confidence={aiInsight.confidence}
      recommendations={aiInsight.recommendations}
    >
      <div className="flex items-start gap-6">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border-primary)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          {/* Score text */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {overallScore}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="flex-1 space-y-3">
          {dimensions.map((dim, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-primary)]">
                  {dim.name}
                </span>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: scoreColor(dim.score) }}
                >
                  {dim.score.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--border-primary)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(dim.score, 100)}%`,
                    backgroundColor: scoreColor(dim.score),
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AIInsightCard>
  );
}
