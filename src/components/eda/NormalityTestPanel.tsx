"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateNormalityInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface NormalityResult {
  name: string;
  jbStat: number;
  pValue: number;
  pass: boolean;
  sortedValues: number[];
  theoreticalQuantiles: number[];
}

// Approximation of inverse normal CDF (Beasley-Springer-Moro algorithm simplified)
function normalQuantile(p: number): number {
  if (p <= 0) return -4;
  if (p >= 1) return 4;
  // Rational approximation for central region
  const a = p - 0.5;
  if (Math.abs(a) < 0.42) {
    const r = a * a;
    return a * ((((-25.44106049637 * r + 41.39119773534) * r - 18.61500062529) * r + 2.506628277459) /
      ((((3.13082909833 * r - 21.06224101826) * r + 23.08336743743) * r - 8.47351093090) * r + 1));
  }
  const r = a < 0 ? p : 1 - p;
  const s = Math.log(-Math.log(r));
  let t = 0.3374754822726147 + s * (0.9761690190917186 + s * (0.1607979714918209 + s * (0.0276438810333863 + s * 0.0038405729373609)));
  return a < 0 ? -t : t;
}

export default function NormalityTestPanel({ dataset }: Props) {
  const results = useMemo(() => {
    const out: NormalityResult[] = [];
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      const vals = getNumericColumn(dataset, i);
      const stats = computeStats(vals);
      const n = stats.count;
      if (n < 4) return;

      const S = stats.skewness;
      const K = stats.kurtosis; // excess kurtosis
      const jb = (n / 6) * (S * S + (K * K) / 4);
      const pass = jb < 5.99; // chi-sq(2) critical value at 0.05
      const pValue = pass ? 0.05 + (5.99 - jb) / 5.99 * 0.45 : Math.max(0.001, 0.05 * Math.exp(-(jb - 5.99) / 10));

      // Q-Q data: sorted values vs theoretical quantiles
      const nums = vals.filter((v): v is number => v !== null).sort((a, b) => a - b);
      const theoreticalQuantiles = nums.map((_, idx) => {
        const p = (idx + 0.5) / nums.length;
        return normalQuantile(p);
      });

      out.push({
        name: col,
        jbStat: jb,
        pValue: Math.min(pValue, 0.999),
        pass,
        sortedValues: nums,
        theoreticalQuantiles,
      });
    });
    return out;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const passCount = results.filter(r => r.pass).length;
    return generateNormalityInsight(passCount, results.length);
  }, [results]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--hover-item)]">
              <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Variable</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Test Stat (JB)</th>
              <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">p-value</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Result</th>
              <th className="text-[var(--text-label)] font-medium text-center px-3 py-2 border-b border-[var(--border-primary)] whitespace-nowrap">Q-Q Plot</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              // Mini Q-Q plot
              const size = 60;
              const pad = 6;
              const plotSize = size - pad * 2;
              const minQ = Math.min(...r.theoreticalQuantiles);
              const maxQ = Math.max(...r.theoreticalQuantiles);
              const minV = r.sortedValues[0];
              const maxV = r.sortedValues[r.sortedValues.length - 1];
              const rangeQ = maxQ - minQ || 1;
              const rangeV = maxV - minV || 1;

              // Sample points for the plot (take every nth to keep it manageable)
              const step = Math.max(1, Math.floor(r.sortedValues.length / 20));
              const points: { x: number; y: number }[] = [];
              for (let j = 0; j < r.sortedValues.length; j += step) {
                points.push({
                  x: pad + ((r.theoreticalQuantiles[j] - minQ) / rangeQ) * plotSize,
                  y: pad + plotSize - ((r.sortedValues[j] - minV) / rangeV) * plotSize,
                });
              }

              return (
                <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50">
                  <td className="text-[var(--text-primary)] font-medium px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{r.name}</td>
                  <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">{r.jbStat.toFixed(3)}</td>
                  <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums whitespace-nowrap">{r.pValue.toFixed(4)}</td>
                  <td className="text-center px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                      r.pass
                        ? "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20"
                        : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
                    }`}>
                      {r.pass ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td className="text-center px-3 py-2">
                    <svg width={size} height={size} className="inline-block rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
                      {/* Reference line (perfect normal) */}
                      <line x1={pad} y1={pad + plotSize} x2={pad + plotSize} y2={pad} stroke="var(--text-dim)" strokeWidth="0.5" strokeDasharray="2,2" />
                      {/* Data points */}
                      {points.map((p, pi) => (
                        <circle key={pi} cx={p.x} cy={p.y} r={1.5} fill={r.pass ? "#00bc7d" : "#ef4444"} opacity={0.7} />
                      ))}
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AIInsightCard>
  );
}
