"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeStats, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateDescriptiveCardsInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

interface CardData {
  name: string;
  latestValue: number;
  trend: "up" | "down" | "flat";
  trendPct: number;
  sparkline: number[];
  mean: number;
  std: number;
}

export default function DescriptiveCardsPanel({ dataset }: Props) {
  const cards = useMemo(() => {
    const out: CardData[] = [];
    dataset.columns.forEach((col, i) => {
      const type = dataset.columnTypes[col];
      if (type === "date" || type === "string") return;
      const vals = getNumericColumn(dataset, i);
      const nums = vals.filter((v): v is number => v !== null);
      if (nums.length < 4) return;

      const stats = computeStats(vals);
      const mid = Math.floor(nums.length / 2);
      const firstHalfMean = nums.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
      const secondHalfMean = nums.slice(mid).reduce((s, v) => s + v, 0) / (nums.length - mid);
      const changePct = firstHalfMean !== 0 ? ((secondHalfMean - firstHalfMean) / Math.abs(firstHalfMean)) * 100 : 0;

      const trend: "up" | "down" | "flat" = changePct > 2 ? "up" : changePct < -2 ? "down" : "flat";

      // Sparkline: downsample to ~20 points
      const step = Math.max(1, Math.floor(nums.length / 20));
      const sparkline: number[] = [];
      for (let j = 0; j < nums.length; j += step) {
        sparkline.push(nums[j]);
      }

      out.push({
        name: col,
        latestValue: nums[nums.length - 1],
        trend,
        trendPct: changePct,
        sparkline,
        mean: stats.mean,
        std: stats.std,
      });
    });
    return out;
  }, [dataset]);

  const aiInsight = useMemo(() => {
    const trendUp = cards.filter(c => c.trend === "up").length;
    const trendDown = cards.filter(c => c.trend === "down").length;
    return generateDescriptiveCardsInsight(trendUp, trendDown, cards.length);
  }, [cards]);

  const formatNumber = (v: number): string => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
    if (Math.abs(v) < 1) return v.toFixed(3);
    return v.toFixed(1);
  };

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const sparkW = 80;
          const sparkH = 28;
          const minV = Math.min(...card.sparkline);
          const maxV = Math.max(...card.sparkline);
          const rangeV = maxV - minV || 1;

          const points = card.sparkline
            .map((v, i) => {
              const x = (i / (card.sparkline.length - 1)) * sparkW;
              const y = sparkH - ((v - minV) / rangeV) * sparkH;
              return `${x},${y}`;
            })
            .join(" ");

          const trendColor = card.trend === "up" ? "#00bc7d" : card.trend === "down" ? "#ef4444" : "var(--text-muted)";

          return (
            <div
              key={idx}
              className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-3 hover:border-[var(--border-secondary)] transition-colors"
            >
              <div className="text-[10px] text-[var(--text-label)] font-medium truncate mb-1.5" title={card.name}>
                {card.name}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatNumber(card.latestValue)}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: trendColor }}>
                    {card.trend === "up" && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 2L8 6H2L5 2Z" fill={trendColor} />
                      </svg>
                    )}
                    {card.trend === "down" && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 8L2 4H8L5 8Z" fill={trendColor} />
                      </svg>
                    )}
                    {card.trend === "flat" && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <line x1="2" y1="5" x2="8" y2="5" stroke={trendColor} strokeWidth="1.5" />
                      </svg>
                    )}
                    {card.trendPct > 0 ? "+" : ""}{card.trendPct.toFixed(1)}%
                  </span>
                </div>
                <svg width={sparkW} height={sparkH} className="shrink-0">
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#6941c6"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </AIInsightCard>
  );
}
