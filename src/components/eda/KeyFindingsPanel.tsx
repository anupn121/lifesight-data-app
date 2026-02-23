"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, computeCorrelation, computeADF, computeVIF, getNumericColumn, computeAutocorrelation } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateKeyFindingsInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

type Severity = "High" | "Medium" | "Low";

interface Finding {
  icon: string;
  text: string;
  severity: Severity;
}

const severityColors: Record<Severity, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#00bc7d",
};

export default function KeyFindingsPanel({ dataset }: Props) {
  const findings = useMemo(() => {
    const result: Finding[] = [];

    // Identify numeric columns
    const numericCols: { name: string; index: number }[] = [];
    dataset.columns.forEach((col, ci) => {
      const type = dataset.columnTypes[col];
      if (type !== "date" && type !== "string") {
        numericCols.push({ name: col, index: ci });
      }
    });

    // Identify spend columns
    const spendCols = numericCols.filter((c) => c.name.startsWith("Spend:"));

    // 1. Data completeness
    let totalMissing = 0;
    let totalValues = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index);
      totalValues += vals.length;
      totalMissing += vals.filter((v) => v === null).length;
    });
    const missingPct = totalValues > 0 ? (totalMissing / totalValues) * 100 : 0;
    const completenessSeverity: Severity = missingPct < 2 ? "Low" : missingPct < 10 ? "Medium" : "High";
    result.push({
      icon: "\u2714",
      text: `Data completeness is ${(100 - missingPct).toFixed(1)}% across ${numericCols.length} numeric variables. ${missingPct < 2 ? "Minimal gaps detected." : `${missingPct.toFixed(1)}% of values are missing and may need imputation.`}`,
      severity: completenessSeverity,
    });

    // 2. Outlier finding
    let totalOutliers = 0;
    let colsWithOutliers = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index);
      const stats = computeStats(vals);
      const iqr = stats.q3 - stats.q1;
      const lower = stats.q1 - 1.5 * iqr;
      const upper = stats.q3 + 1.5 * iqr;
      const outlierCount = vals.filter((v) => v !== null && (v < lower || v > upper)).length;
      totalOutliers += outlierCount;
      if (outlierCount > 0) colsWithOutliers++;
    });
    const outlierSeverity: Severity = totalOutliers === 0 ? "Low" : colsWithOutliers > numericCols.length * 0.5 ? "High" : "Medium";
    result.push({
      icon: "\u26A0",
      text: `${totalOutliers} outliers detected across ${colsWithOutliers} of ${numericCols.length} variables using IQR method. ${totalOutliers === 0 ? "All values within expected ranges." : "Review outlier impact on model accuracy."}`,
      severity: outlierSeverity,
    });

    // 3. Correlation finding
    let maxCorr = 0;
    let maxPair = "";
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const a = getNumericColumn(dataset, numericCols[i].index);
        const b = getNumericColumn(dataset, numericCols[j].index);
        const r = Math.abs(computeCorrelation(a, b));
        if (r > maxCorr) {
          maxCorr = r;
          maxPair = `${numericCols[i].name} & ${numericCols[j].name}`;
        }
      }
    }
    const corrSeverity: Severity = maxCorr > 0.9 ? "High" : maxCorr > 0.7 ? "Medium" : "Low";
    result.push({
      icon: "\uD83D\uDD17",
      text: `Strongest correlation: ${maxPair} (|r| = ${maxCorr.toFixed(3)}). ${maxCorr > 0.7 ? "High correlation may indicate multicollinearity risk." : "No excessively correlated pairs found."}`,
      severity: corrSeverity,
    });

    // 4. Stationarity finding
    let stationaryCount = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index);
      const adf = computeADF(vals);
      if (adf.isStationary) stationaryCount++;
    });
    const stationaryPct = numericCols.length > 0 ? (stationaryCount / numericCols.length) * 100 : 100;
    const stationaritySeverity: Severity = stationaryPct > 70 ? "Low" : stationaryPct > 40 ? "Medium" : "High";
    result.push({
      icon: "\uD83D\uDCC8",
      text: `${stationaryPct.toFixed(0)}% of series are stationary (${stationaryCount}/${numericCols.length} pass ADF test). ${stationaryPct > 70 ? "Most series are suitable for standard time series models." : "Non-stationary series require differencing before modeling."}`,
      severity: stationaritySeverity,
    });

    // 5. Distribution finding (approximate normality via skewness/kurtosis)
    let normalCount = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index);
      const stats = computeStats(vals);
      // Approximate normality: |skewness| < 1 and |kurtosis| < 3
      if (Math.abs(stats.skewness) < 1 && Math.abs(stats.kurtosis) < 3) normalCount++;
    });
    const normalPct = numericCols.length > 0 ? (normalCount / numericCols.length) * 100 : 100;
    const distSeverity: Severity = normalPct > 60 ? "Low" : normalPct > 30 ? "Medium" : "High";
    result.push({
      icon: "\uD83D\uDCC9",
      text: `${normalPct.toFixed(0)}% of variables are approximately normally distributed (${normalCount}/${numericCols.length}). ${normalPct > 60 ? "Parametric methods are appropriate for most variables." : "Consider non-parametric approaches or transformations."}`,
      severity: distSeverity,
    });

    // 6. Multicollinearity finding (VIF)
    if (spendCols.length >= 2) {
      const spendIndices = spendCols.map((c) => c.index);
      const vifs = computeVIF(dataset, spendIndices);
      const maxVif = Math.max(...vifs);
      const maxVifIdx = vifs.indexOf(maxVif);
      const maxVifName = spendCols[maxVifIdx]?.name ?? "Unknown";
      const highVifCount = vifs.filter((v) => v > 5).length;
      const vifSeverity: Severity = highVifCount === 0 ? "Low" : highVifCount > spendCols.length * 0.5 ? "High" : "Medium";
      result.push({
        icon: "\uD83D\uDD00",
        text: `Max VIF is ${maxVif.toFixed(1)} (${maxVifName}). ${highVifCount} of ${spendCols.length} spend variables exceed VIF threshold of 5. ${highVifCount === 0 ? "No multicollinearity concerns." : "Consider regularization or variable consolidation."}`,
        severity: vifSeverity,
      });
    } else {
      result.push({
        icon: "\uD83D\uDD00",
        text: `Multicollinearity check: ${spendCols.length < 2 ? "Insufficient spend variables for VIF analysis (need at least 2)." : "All VIF values are within acceptable limits."}`,
        severity: "Low",
      });
    }

    // 7. Trend finding
    let trendUpCount = 0;
    let trendDownCount = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index).filter((v): v is number => v !== null);
      if (vals.length < 4) return;
      const firstHalf = vals.slice(0, Math.floor(vals.length / 2));
      const secondHalf = vals.slice(Math.floor(vals.length / 2));
      const firstMean = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
      if (secondMean > firstMean * 1.05) trendUpCount++;
      else if (secondMean < firstMean * 0.95) trendDownCount++;
    });
    const trendDirection = trendUpCount > trendDownCount ? "upward" : trendDownCount > trendUpCount ? "downward" : "mixed";
    const trendSeverity: Severity = trendDirection === "mixed" ? "Medium" : "Low";
    result.push({
      icon: "\u2197",
      text: `Overall trend direction is ${trendDirection}: ${trendUpCount} variables trending up, ${trendDownCount} trending down. ${trendDirection === "upward" ? "Positive momentum across most metrics." : trendDirection === "downward" ? "Declining trends warrant investigation." : "Mixed signals across variables."}`,
      severity: trendSeverity,
    });

    // 8. Seasonality finding
    let seasonalCount = 0;
    numericCols.forEach((col) => {
      const vals = getNumericColumn(dataset, col.index);
      const acf = computeAutocorrelation(vals, 14);
      // Check for significant peaks at periodic lags
      const threshold = 2 / Math.sqrt(vals.filter((v) => v !== null).length || 1);
      for (let lag = 3; lag <= Math.min(14, acf.length - 1); lag++) {
        if (Math.abs(acf[lag]) > threshold && Math.abs(acf[lag]) > 0.2) {
          seasonalCount++;
          break;
        }
      }
    });
    const seasonalPct = numericCols.length > 0 ? (seasonalCount / numericCols.length) * 100 : 0;
    const seasonSeverity: Severity = seasonalPct > 50 ? "Medium" : "Low";
    result.push({
      icon: "\uD83D\uDD04",
      text: `Seasonal patterns detected in ${seasonalCount} of ${numericCols.length} variables (${seasonalPct.toFixed(0)}%). ${seasonalPct > 50 ? "Strong seasonality should be accounted for in modeling." : "Weak or no seasonality detected in most variables."}`,
      severity: seasonSeverity,
    });

    return result;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    return generateKeyFindingsInsight(findings.length);
  }, [findings]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
        <div className="p-3 space-y-1">
          {findings.map((finding, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--hover-item)]/50 transition-colors"
            >
              {/* Number + Icon */}
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--hover-item)] text-[10px] font-semibold text-[var(--text-label)]">
                  {idx + 1}
                </span>
                <span className="text-sm">{finding.icon}</span>
              </div>
              {/* Text */}
              <p className="flex-1 text-xs text-[var(--text-primary)] leading-relaxed">{finding.text}</p>
              {/* Severity badge */}
              <span
                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  color: severityColors[finding.severity],
                  backgroundColor: `${severityColors[finding.severity]}15`,
                  borderColor: `${severityColors[finding.severity]}30`,
                }}
              >
                {finding.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AIInsightCard>
  );
}
