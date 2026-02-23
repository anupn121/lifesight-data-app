"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateConsistencyInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface CheckResult {
  name: string;
  description: string;
  passed: boolean;
  details: string;
}

export default function ConsistencyCheckPanel({ dataset }: Props) {
  const checks = useMemo(() => {
    const results: CheckResult[] = [];

    // Identify spend and KPI columns
    const spendIndices: number[] = [];
    const kpiIndices: number[] = [];
    const dateIndex = dataset.columns.indexOf("Date");

    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (col.toLowerCase().startsWith("spend")) {
        spendIndices.push(ci);
      } else if (type !== "date" && type !== "string") {
        kpiIndices.push(ci);
      }
    });

    // Check 1: No negative spend
    {
      let negCount = 0;
      for (const si of spendIndices) {
        const vals = getNumericColumn(dataset, si);
        negCount += vals.filter((v) => v !== null && v < 0).length;
      }
      results.push({
        name: "No Negative Spend",
        description: "All spend values should be zero or positive",
        passed: negCount === 0,
        details:
          negCount === 0
            ? "All spend values are non-negative"
            : `${negCount} negative spend value${negCount > 1 ? "s" : ""} found`,
      });
    }

    // Check 2: No future dates
    {
      let futureCount = 0;
      if (dateIndex >= 0) {
        const today = new Date().toISOString().split("T")[0];
        for (const row of dataset.rows) {
          const d = row[dateIndex];
          if (typeof d === "string" && d > today) {
            futureCount++;
          }
        }
      }
      results.push({
        name: "No Future Dates",
        description: "All dates should be on or before today",
        passed: futureCount === 0,
        details:
          futureCount === 0
            ? "All dates are in the past or present"
            : `${futureCount} future date${futureCount > 1 ? "s" : ""} detected`,
      });
    }

    // Check 3: No negative KPIs
    {
      let negCount = 0;
      for (const ki of kpiIndices) {
        const vals = getNumericColumn(dataset, ki);
        negCount += vals.filter((v) => v !== null && v < 0).length;
      }
      results.push({
        name: "No Negative KPIs",
        description: "KPI values should be zero or positive",
        passed: negCount === 0,
        details:
          negCount === 0
            ? "All KPI values are non-negative"
            : `${negCount} negative KPI value${negCount > 1 ? "s" : ""} found`,
      });
    }

    // Check 4: Spend within 3 standard deviations
    {
      let outlierCount = 0;
      for (const si of spendIndices) {
        const vals = getNumericColumn(dataset, si);
        const stats = computeStats(vals);
        if (stats.count > 0 && stats.std > 0) {
          outlierCount += vals.filter(
            (v) => v !== null && Math.abs(v - stats.mean) > 3 * stats.std
          ).length;
        }
      }
      results.push({
        name: "Spend Within 3 Std Devs",
        description: "No extreme spend outliers beyond 3 standard deviations",
        passed: outlierCount === 0,
        details:
          outlierCount === 0
            ? "All spend values are within expected range"
            : `${outlierCount} extreme spend outlier${outlierCount > 1 ? "s" : ""} detected`,
      });
    }

    // Check 5: No consecutive nulls > 5
    {
      let failedCols = 0;
      const numericIndices = [...spendIndices, ...kpiIndices];
      for (const ci of numericIndices) {
        let maxConsec = 0;
        let current = 0;
        for (const row of dataset.rows) {
          if (row[ci] === null) {
            current++;
            maxConsec = Math.max(maxConsec, current);
          } else {
            current = 0;
          }
        }
        if (maxConsec > 5) failedCols++;
      }
      results.push({
        name: "No Consecutive Nulls > 5",
        description: "No column should have more than 5 consecutive missing values",
        passed: failedCols === 0,
        details:
          failedCols === 0
            ? "No long gaps in any numeric column"
            : `${failedCols} column${failedCols > 1 ? "s" : ""} with gaps longer than 5 rows`,
      });
    }

    // Check 6: KPI values within expected range (no extreme outliers)
    {
      let outOfRange = 0;
      for (const ki of kpiIndices) {
        const vals = getNumericColumn(dataset, ki);
        const stats = computeStats(vals);
        if (stats.count > 0 && stats.std > 0) {
          const iqr = stats.q3 - stats.q1;
          const lower = stats.q1 - 3 * iqr;
          const upper = stats.q3 + 3 * iqr;
          outOfRange += vals.filter(
            (v) => v !== null && (v < lower || v > upper)
          ).length;
        }
      }
      results.push({
        name: "KPI Values Within Expected Range",
        description: "KPI values should not be extreme outliers (3x IQR)",
        passed: outOfRange === 0,
        details:
          outOfRange === 0
            ? "All KPI values are within expected bounds"
            : `${outOfRange} value${outOfRange > 1 ? "s" : ""} outside expected range`,
      });
    }

    return results;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const passCount = checks.filter((c) => c.passed).length;
    return generateConsistencyInsight(passCount, checks.length);
  }, [checks]);

  return (
    <AIInsightCard
      insight={aiInsight.insight}
      confidence={aiInsight.confidence}
      recommendations={aiInsight.recommendations}
    >
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-primary)] px-4 py-3 hover:bg-[var(--hover-item)]/50"
          >
            {/* Pass/Fail badge */}
            <div
              className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
              style={{
                backgroundColor: check.passed
                  ? "rgba(0, 188, 125, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              }}
            >
              {check.passed ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="#00bc7d"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 3L9 9M9 3L3 9"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Check info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {check.name}
                </span>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border"
                  style={{
                    backgroundColor: check.passed
                      ? "rgba(0, 188, 125, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    color: check.passed ? "#00bc7d" : "#ef4444",
                    borderColor: check.passed
                      ? "rgba(0, 188, 125, 0.3)"
                      : "rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {check.passed ? "PASS" : "FAIL"}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {check.description}
              </p>
            </div>

            {/* Details */}
            <div className="text-[10px] text-[var(--text-dim)] text-right shrink-0">
              {check.details}
            </div>
          </div>
        ))}
      </div>
    </AIInsightCard>
  );
}
