"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { getNumericColumn, computeStats } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateDistributionInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

function buildHistogram(values: (number | null)[], bins: number = 10) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return { buckets: [], maxCount: 0 };

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  const step = range / bins;

  const buckets = Array.from({ length: bins }, (_, i) => ({
    low: min + i * step,
    high: min + (i + 1) * step,
    count: 0,
  }));

  for (const v of nums) {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1);
    buckets[idx].count++;
  }

  return { buckets, maxCount: Math.max(...buckets.map((b) => b.count)) };
}

function Histogram({ name, values }: { name: string; values: (number | null)[] }) {
  const { buckets, maxCount } = useMemo(() => buildHistogram(values), [values]);
  const stats = useMemo(() => computeStats(values), [values]);
  if (buckets.length === 0) return null;

  // Simple normality check: skewness close to 0, kurtosis close to 0
  const isNormal = Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis) < 1;

  const w = 280;
  const h = 120;
  const pad = { top: 10, right: 10, bottom: 24, left: 10 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const barW = plotW / buckets.length - 2;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--text-label)] font-medium truncate" title={name}>{name}</span>
        <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium border ${
          isNormal ? "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20" : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
        }`}>
          {isNormal ? "Normal" : "Non-normal"}
        </span>
      </div>
      <svg width={w} height={h} className="rounded border border-[var(--border-primary)] bg-[var(--hover-item)]/30">
        {buckets.map((b, i) => {
          const barH = maxCount > 0 ? (b.count / maxCount) * plotH : 0;
          const x = pad.left + i * (plotW / buckets.length) + 1;
          const y = pad.top + plotH - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(barW, 1)}
              height={barH}
              fill="#6941c6"
              opacity={0.8}
              rx={1}
            >
              <title>{`${b.low.toFixed(0)} - ${b.high.toFixed(0)}: ${b.count}`}</title>
            </rect>
          );
        })}
        <text x={pad.left} y={h - 4} fontSize="8" fill="var(--text-dim)">
          {buckets[0].low.toFixed(0)}
        </text>
        <text x={w - pad.right} y={h - 4} fontSize="8" fill="var(--text-dim)" textAnchor="end">
          {buckets[buckets.length - 1].high.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}

export default function DistributionPanel({ dataset }: Props) {
  const numericCols = useMemo(() => {
    return dataset.columns
      .map((col, i) => ({ col, i, type: dataset.columnTypes[col] }))
      .filter(({ type }) => type !== "date" && type !== "string");
  }, [dataset]);

  const aiInsight = useMemo(() => {
    let normalCount = 0;
    for (const { i } of numericCols) {
      const vals = getNumericColumn(dataset, i);
      const stats = computeStats(vals);
      if (Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis) < 1) normalCount++;
    }
    return generateDistributionInsight(normalCount, numericCols.length);
  }, [dataset, numericCols]);

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="grid grid-cols-2 gap-3">
        {numericCols.map(({ col, i }) => (
          <Histogram key={i} name={col} values={getNumericColumn(dataset, i)} />
        ))}
      </div>
    </AIInsightCard>
  );
}
