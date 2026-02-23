"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computePCA } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generatePCAInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function PCAPanel({ dataset }: Props) {
  const analysis = useMemo(() => {
    // Collect all numeric columns
    const numericCols: { name: string; values: (number | null)[] }[] = [];
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      numericCols.push({ name: col, values: getNumericColumn(dataset, i) });
    });

    if (numericCols.length < 2) return null;

    const nRows = dataset.rows.length;

    // Compute column means for imputation (ignoring nulls)
    const colMeans = numericCols.map(c => {
      const nums = c.values.filter((v): v is number => v !== null);
      return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;
    });

    // Build data matrix with imputation
    const dataMatrix: number[][] = [];
    for (let i = 0; i < nRows; i++) {
      const row: number[] = [];
      let hasAny = false;
      for (let j = 0; j < numericCols.length; j++) {
        const v = numericCols[j].values[i];
        if (v !== null) {
          row.push(v);
          hasAny = true;
        } else {
          row.push(colMeans[j]);
        }
      }
      if (hasAny) dataMatrix.push(row);
    }

    if (dataMatrix.length < 3) return null;

    // Standardize columns (z-score) before PCA
    const p = numericCols.length;
    const means = new Array(p).fill(0);
    const stds = new Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < dataMatrix.length; i++) means[j] += dataMatrix[i][j];
      means[j] /= dataMatrix.length;
      for (let i = 0; i < dataMatrix.length; i++) stds[j] += (dataMatrix[i][j] - means[j]) ** 2;
      stds[j] = Math.sqrt(stds[j] / dataMatrix.length) || 1;
    }
    const standardized = dataMatrix.map(row => row.map((v, j) => (v - means[j]) / stds[j]));

    const nComponents = Math.min(p, 6);
    const pca = computePCA(standardized, nComponents);

    if (pca.eigenvalues.length === 0) return null;

    // Variance explained
    const totalVariance = pca.eigenvalues.reduce((s, v) => s + v, 0);
    const varianceExplained = pca.eigenvalues.map(v => totalVariance > 0 ? v / totalVariance : 0);
    const cumulativeVariance = varianceExplained.reduce<number[]>((acc, v) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + v);
      return acc;
    }, []);

    // Components needed for 80%
    let componentsFor80 = varianceExplained.length;
    for (let i = 0; i < cumulativeVariance.length; i++) {
      if (cumulativeVariance[i] >= 0.8) {
        componentsFor80 = i + 1;
        break;
      }
    }

    return {
      eigenvalues: pca.eigenvalues,
      varianceExplained,
      cumulativeVariance,
      projections: pca.projections,
      componentsFor80,
      totalVars: p,
      colNames: numericCols.map(c => c.name),
    };
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (!analysis) return { insight: "Insufficient numeric columns for PCA.", confidence: "Low" as const, recommendations: [] };
    return generatePCAInsight(analysis.varianceExplained, analysis.componentsFor80, analysis.totalVars);
  }, [analysis]);

  if (!analysis) {
    return (
      <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">Need at least 2 numeric columns for PCA.</p>
      </AIInsightCard>
    );
  }

  // Scree plot dimensions
  const screeW = 320;
  const screeH = 160;
  const sp = { top: 16, right: 20, bottom: 28, left: 36 };
  const sPlotW = screeW - sp.left - sp.right;
  const sPlotH = screeH - sp.top - sp.bottom;
  const nBars = analysis.varianceExplained.length;
  const barGap = 4;
  const barW = (sPlotW - barGap * (nBars - 1)) / nBars;

  // 2D scatter dimensions
  const scatW = 280;
  const scatH = 200;
  const scp = { top: 16, right: 16, bottom: 24, left: 36 };
  const scPlotW = scatW - scp.left - scp.right;
  const scPlotH = scatH - scp.top - scp.bottom;

  // Projections for scatter
  const proj2d = analysis.projections.filter(p => p.length >= 2);
  const pc1Vals = proj2d.map(p => p[0]);
  const pc2Vals = proj2d.map(p => p[1]);
  const pc1Min = Math.min(...pc1Vals);
  const pc1Max = Math.max(...pc1Vals);
  const pc2Min = Math.min(...pc2Vals);
  const pc2Max = Math.max(...pc2Vals);
  const pc1Range = pc1Max - pc1Min || 1;
  const pc2Range = pc2Max - pc2Min || 1;

  // Cumulative line points
  const cumLinePoints = analysis.cumulativeVariance
    .map((v, i) => {
      const x = sp.left + i * (barW + barGap) + barW / 2;
      const y = sp.top + sPlotH - v * sPlotH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-wrap gap-4">
        {/* Scree Plot */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--text-label)] font-medium">Scree Plot (Variance Explained)</span>
          <svg width={screeW} height={screeH} className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
            {/* Y axis */}
            <text x={sp.left - 4} y={sp.top + 4} fontSize="7" fill="var(--text-dim)" textAnchor="end">100%</text>
            <text x={sp.left - 4} y={sp.top + sPlotH} fontSize="7" fill="var(--text-dim)" textAnchor="end">0%</text>
            <line x1={sp.left} y1={sp.top} x2={sp.left} y2={sp.top + sPlotH} stroke="var(--border-primary)" strokeWidth="0.5" />
            <line x1={sp.left} y1={sp.top + sPlotH} x2={sp.left + sPlotW} y2={sp.top + sPlotH} stroke="var(--border-primary)" strokeWidth="0.5" />

            {/* Bars */}
            {analysis.varianceExplained.map((v, i) => {
              const bh = v * sPlotH;
              const x = sp.left + i * (barW + barGap);
              const y = sp.top + sPlotH - bh;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barW} height={bh} fill="#6941c6" opacity={0.8} rx={2}>
                    <title>PC{i + 1}: {(v * 100).toFixed(1)}%</title>
                  </rect>
                  <text x={x + barW / 2} y={screeH - sp.bottom + 12} fontSize="7" fill="var(--text-dim)" textAnchor="middle">
                    PC{i + 1}
                  </text>
                  <text x={x + barW / 2} y={y - 3} fontSize="7" fill="var(--text-label)" textAnchor="middle">
                    {(v * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Cumulative line */}
            <polyline
              points={cumLinePoints}
              fill="none"
              stroke="#00bc7d"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {analysis.cumulativeVariance.map((v, i) => {
              const x = sp.left + i * (barW + barGap) + barW / 2;
              const y = sp.top + sPlotH - v * sPlotH;
              return <circle key={i} cx={x} cy={y} r={2.5} fill="#00bc7d" />;
            })}

            {/* 80% threshold line */}
            <line
              x1={sp.left}
              y1={sp.top + sPlotH * 0.2}
              x2={sp.left + sPlotW}
              y2={sp.top + sPlotH * 0.2}
              stroke="var(--text-dim)"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
            <text x={sp.left + sPlotW + 2} y={sp.top + sPlotH * 0.2 + 3} fontSize="7" fill="var(--text-dim)">80%</text>
          </svg>
        </div>

        {/* 2D Projection */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--text-label)] font-medium">2D Projection (PC1 vs PC2)</span>
          <svg width={scatW} height={scatH} className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
            {/* Axes */}
            <line x1={scp.left} y1={scp.top} x2={scp.left} y2={scp.top + scPlotH} stroke="var(--border-primary)" strokeWidth="0.5" />
            <line x1={scp.left} y1={scp.top + scPlotH} x2={scp.left + scPlotW} y2={scp.top + scPlotH} stroke="var(--border-primary)" strokeWidth="0.5" />
            <text x={scp.left + scPlotW / 2} y={scatH - 4} fontSize="7" fill="var(--text-dim)" textAnchor="middle">
              PC1 ({(analysis.varianceExplained[0] * 100).toFixed(1)}%)
            </text>
            <text x={8} y={scp.top + scPlotH / 2} fontSize="7" fill="var(--text-dim)" textAnchor="middle" transform={`rotate(-90, 8, ${scp.top + scPlotH / 2})`}>
              PC2 ({(analysis.varianceExplained[1] * 100).toFixed(1)}%)
            </text>

            {/* Points */}
            {proj2d.map((p, i) => {
              const x = scp.left + ((p[0] - pc1Min) / pc1Range) * scPlotW;
              const y = scp.top + scPlotH - ((p[1] - pc2Min) / pc2Range) * scPlotH;
              return (
                <circle key={i} cx={x} cy={y} r={2.5} fill="#2b7fff" opacity={0.5}>
                  <title>PC1: {p[0].toFixed(2)}, PC2: {p[1].toFixed(2)}</title>
                </circle>
              );
            })}
          </svg>
        </div>
      </div>
    </AIInsightCard>
  );
}
