"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computePCA, computeKMeans } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateClusteringInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

const CLUSTER_COLORS = ["#6941c6", "#2b7fff", "#00bc7d"];

export default function ClusteringPanel({ dataset }: Props) {
  const analysis = useMemo(() => {
    // Collect numeric columns
    const numericCols: { name: string; values: (number | null)[] }[] = [];
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      numericCols.push({ name: col, values: getNumericColumn(dataset, i) });
    });

    if (numericCols.length < 2) return null;

    const nRows = dataset.rows.length;

    // Column means for imputation
    const colMeans = numericCols.map(c => {
      const nums = c.values.filter((v): v is number => v !== null);
      return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;
    });

    // Build standardized data matrix
    const rawMatrix: number[][] = [];
    for (let i = 0; i < nRows; i++) {
      const row: number[] = [];
      let hasAny = false;
      for (let j = 0; j < numericCols.length; j++) {
        const v = numericCols[j].values[i];
        if (v !== null) { row.push(v); hasAny = true; }
        else row.push(colMeans[j]);
      }
      if (hasAny) rawMatrix.push(row);
    }

    if (rawMatrix.length < 4) return null;

    const p = numericCols.length;
    const means = new Array(p).fill(0);
    const stds = new Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < rawMatrix.length; i++) means[j] += rawMatrix[i][j];
      means[j] /= rawMatrix.length;
      for (let i = 0; i < rawMatrix.length; i++) stds[j] += (rawMatrix[i][j] - means[j]) ** 2;
      stds[j] = Math.sqrt(stds[j] / rawMatrix.length) || 1;
    }
    const standardized = rawMatrix.map(row => row.map((v, j) => (v - means[j]) / stds[j]));

    // K-Means
    const k = 3;
    const { assignments, centroids } = computeKMeans(standardized, k);

    // PCA for visualization
    const pca = computePCA(standardized, 2);
    const projections = pca.projections;

    // Compute silhouette score
    let silhouetteSum = 0;
    const n = standardized.length;

    for (let i = 0; i < n; i++) {
      const myCluster = assignments[i];

      // a(i): average distance to same-cluster points
      let aSum = 0;
      let aCount = 0;
      for (let j = 0; j < n; j++) {
        if (j === i || assignments[j] !== myCluster) continue;
        let dist = 0;
        for (let d = 0; d < p; d++) dist += (standardized[i][d] - standardized[j][d]) ** 2;
        aSum += Math.sqrt(dist);
        aCount++;
      }
      const a = aCount > 0 ? aSum / aCount : 0;

      // b(i): minimum average distance to other cluster points
      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === myCluster) continue;
        let bSum = 0;
        let bCount = 0;
        for (let j = 0; j < n; j++) {
          if (assignments[j] !== c) continue;
          let dist = 0;
          for (let d = 0; d < p; d++) dist += (standardized[i][d] - standardized[j][d]) ** 2;
          bSum += Math.sqrt(dist);
          bCount++;
        }
        if (bCount > 0) b = Math.min(b, bSum / bCount);
      }
      if (b === Infinity) b = 0;

      const maxAB = Math.max(a, b);
      silhouetteSum += maxAB > 0 ? (b - a) / maxAB : 0;
    }
    const silhouetteScore = n > 0 ? silhouetteSum / n : 0;

    // Cluster summaries
    const clusterSummaries = Array.from({ length: k }, (_, c) => {
      const members = assignments.filter(a => a === c).length;
      const centroid = centroids[c] || [];
      // Summarize centroid: top 3 features with highest absolute value
      const featureScores = centroid
        .map((v, j) => ({ name: numericCols[j].name, value: v }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 3);
      const summary = featureScores
        .map(f => {
          const shortName = f.name.length > 20 ? f.name.slice(0, 18) + ".." : f.name;
          return `${shortName}: ${f.value > 0 ? "High" : "Low"}`;
        })
        .join(", ");
      return { id: c, size: members, summary };
    });

    return { assignments, projections, silhouetteScore, clusterSummaries, k };
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (!analysis) return { insight: "Insufficient data for clustering.", confidence: "Low" as const, recommendations: [] };
    return generateClusteringInsight(analysis.k, analysis.silhouetteScore);
  }, [analysis]);

  if (!analysis) {
    return (
      <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">Need at least 2 numeric columns for clustering.</p>
      </AIInsightCard>
    );
  }

  // Scatter plot dimensions
  const scatW = 320;
  const scatH = 220;
  const sp = { top: 16, right: 16, bottom: 24, left: 36 };
  const plotW = scatW - sp.left - sp.right;
  const plotH = scatH - sp.top - sp.bottom;

  const proj2d = analysis.projections.filter(p => p.length >= 2);
  const pc1Vals = proj2d.map(p => p[0]);
  const pc2Vals = proj2d.map(p => p[1]);
  const pc1Min = Math.min(...pc1Vals);
  const pc1Max = Math.max(...pc1Vals);
  const pc2Min = Math.min(...pc2Vals);
  const pc2Max = Math.max(...pc2Vals);
  const pc1Range = pc1Max - pc1Min || 1;
  const pc2Range = pc2Max - pc2Min || 1;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-wrap gap-4">
        {/* Scatter plot */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--text-label)] font-medium">Cluster Assignments (PCA Projection)</span>
            <div className="flex items-center gap-2">
              {CLUSTER_COLORS.map((color, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[8px] text-[var(--text-dim)]">C{i}</span>
                </div>
              ))}
            </div>
          </div>
          <svg width={scatW} height={scatH} className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
            {/* Axes */}
            <line x1={sp.left} y1={sp.top} x2={sp.left} y2={sp.top + plotH} stroke="var(--border-primary)" strokeWidth="0.5" />
            <line x1={sp.left} y1={sp.top + plotH} x2={sp.left + plotW} y2={sp.top + plotH} stroke="var(--border-primary)" strokeWidth="0.5" />
            <text x={sp.left + plotW / 2} y={scatH - 4} fontSize="7" fill="var(--text-dim)" textAnchor="middle">PC1</text>
            <text x={8} y={sp.top + plotH / 2} fontSize="7" fill="var(--text-dim)" textAnchor="middle" transform={`rotate(-90, 8, ${sp.top + plotH / 2})`}>PC2</text>

            {/* Points colored by cluster */}
            {proj2d.map((p, i) => {
              const cluster = analysis.assignments[i] ?? 0;
              const x = sp.left + ((p[0] - pc1Min) / pc1Range) * plotW;
              const y = sp.top + plotH - ((p[1] - pc2Min) / pc2Range) * plotH;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={CLUSTER_COLORS[cluster % CLUSTER_COLORS.length]}
                  opacity={0.6}
                >
                  <title>Cluster {cluster}: ({p[0].toFixed(2)}, {p[1].toFixed(2)})</title>
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Cluster summary table */}
        <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-label)] font-medium">Cluster Summary</span>
            <span className="text-[9px] text-[var(--text-muted)] tabular-nums">
              Silhouette: {analysis.silhouetteScore.toFixed(3)}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--hover-item)]">
                  <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Cluster</th>
                  <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Size</th>
                  <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Centroid Summary</th>
                </tr>
              </thead>
              <tbody>
                {analysis.clusterSummaries.map((cs) => (
                  <tr key={cs.id} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[cs.id % CLUSTER_COLORS.length] }} />
                        <span className="text-[var(--text-primary)] font-medium">C{cs.id}</span>
                      </div>
                    </td>
                    <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">{cs.size}</td>
                    <td className="text-[var(--text-muted)] px-3 py-2 text-[10px]">{cs.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AIInsightCard>
  );
}
