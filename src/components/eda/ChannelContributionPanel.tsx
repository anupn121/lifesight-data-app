"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeCorrelation } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateChannelContributionInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface ChannelContrib {
  channel: string;
  pct: number;
}

const COLORS = ["#6941c6", "#2b7fff", "#00bc7d", "#f59e0b", "#ef4444", "#ec4899"];

export default function ChannelContributionPanel({ dataset }: Props) {
  const contributions = useMemo(() => {
    const spendIndices: { idx: number; name: string }[] = [];
    let kpiIdx = -1;

    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      if (col.startsWith("Spend:")) {
        spendIndices.push({ idx: i, name: col });
      } else if (kpiIdx === -1 && (type === "integer" || type === "currency")) {
        kpiIdx = i;
      }
    });

    if (kpiIdx === -1 || spendIndices.length === 0) return [];

    const kpiVals = getNumericColumn(dataset, kpiIdx);

    const raw: { channel: string; absCorr: number }[] = [];
    for (const spend of spendIndices) {
      const spendVals = getNumericColumn(dataset, spend.idx);
      const r = Math.abs(computeCorrelation(spendVals, kpiVals));
      raw.push({ channel: spend.name.replace("Spend: ", ""), absCorr: r });
    }

    const total = raw.reduce((s, r) => s + r.absCorr, 0);
    if (total === 0) return raw.map(r => ({ channel: r.channel, pct: 100 / raw.length }));

    return raw.map(r => ({ channel: r.channel, pct: (r.absCorr / total) * 100 }));
  }, [dataset]);

  const aiInsight = useMemo(() => {
    if (contributions.length === 0) return { insight: "No spend channels found for contribution analysis.", confidence: "Low" as const, recommendations: [] };
    const sorted = [...contributions].sort((a, b) => b.pct - a.pct);
    return generateChannelContributionInsight(sorted[0].channel, sorted[0].pct);
  }, [contributions]);

  // Donut chart geometry
  const donutSize = 200;
  const cx = donutSize / 2;
  const cy = donutSize / 2;
  const outerR = 80;
  const innerR = 50;

  const donutPaths = useMemo(() => {
    if (contributions.length === 0) return [];

    const paths: { d: string; color: string; channel: string; pct: number }[] = [];
    let startAngle = -Math.PI / 2;

    for (let i = 0; i < contributions.length; i++) {
      const slice = contributions[i];
      const angle = (slice.pct / 100) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const largeArc = angle > Math.PI ? 1 : 0;

      const x1o = cx + outerR * Math.cos(startAngle);
      const y1o = cy + outerR * Math.sin(startAngle);
      const x2o = cx + outerR * Math.cos(endAngle);
      const y2o = cy + outerR * Math.sin(endAngle);
      const x1i = cx + innerR * Math.cos(endAngle);
      const y1i = cy + innerR * Math.sin(endAngle);
      const x2i = cx + innerR * Math.cos(startAngle);
      const y2i = cy + innerR * Math.sin(startAngle);

      const d = [
        `M ${x1o} ${y1o}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
        "Z",
      ].join(" ");

      paths.push({ d, color: COLORS[i % COLORS.length], channel: slice.channel, pct: slice.pct });
      startAngle = endAngle;
    }

    return paths;
  }, [contributions]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      {contributions.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">No spend channels found for contribution analysis.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Donut + Legend */}
          <div className="flex items-center gap-6">
            <svg width={donutSize} height={donutSize} className="shrink-0">
              {donutPaths.map((p, i) => (
                <path key={i} d={p.d} fill={p.color} opacity={0.85}>
                  <title>{`${p.channel}: ${p.pct.toFixed(1)}%`}</title>
                </path>
              ))}
              {/* Center label */}
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="500">
                Est.
              </text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="500">
                Contrib.
              </text>
            </svg>
            {/* Legend */}
            <div className="flex flex-col gap-1.5">
              {contributions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-[var(--text-primary)] truncate max-w-[140px]" title={c.channel}>{c.channel}</span>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums ml-auto">{c.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="text-left text-[var(--text-label)] font-medium py-1.5 pr-3">Channel</th>
                  <th className="text-right text-[var(--text-label)] font-medium py-1.5 pr-3 w-16">Est. %</th>
                  <th className="text-left text-[var(--text-label)] font-medium py-1.5">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {[...contributions].sort((a, b) => b.pct - a.pct).map((c, i) => (
                  <tr key={i} className="border-b border-[var(--border-primary)]/50">
                    <td className="py-1.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[contributions.indexOf(c) % COLORS.length] }} />
                        <span className="text-[var(--text-primary)] truncate max-w-[160px]" title={c.channel}>{c.channel}</span>
                      </div>
                    </td>
                    <td className="text-right text-[var(--text-primary)] tabular-nums py-1.5 pr-3">{c.pct.toFixed(1)}%</td>
                    <td className="py-1.5">
                      <div className="w-full bg-[var(--hover-item)] rounded-full h-2 max-w-[200px]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${c.pct}%`,
                            backgroundColor: COLORS[contributions.indexOf(c) % COLORS.length],
                            opacity: 0.75,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AIInsightCard>
  );
}
