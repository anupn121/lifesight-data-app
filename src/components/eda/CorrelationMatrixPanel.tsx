"use client";

import { useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import { computeCorrelation, getNumericColumn } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateCorrelationInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

function corrColor(r: number): string {
  const abs = Math.abs(r);
  if (r > 0) return `rgba(239, 68, 68, ${abs * 0.8 + 0.1})`;
  return `rgba(59, 130, 246, ${abs * 0.8 + 0.1})`;
}

export default function CorrelationMatrixPanel({ dataset }: Props) {
  const { names, matrix, fullNames } = useMemo(() => {
    const cols = dataset.columns
      .map((col, i) => ({ col, i }))
      .filter(({ col }) => {
        const t = dataset.columnTypes[col];
        return t !== "date" && t !== "string";
      });

    const names = cols.map((c) => {
      const name = c.col;
      return name.length > 15 ? name.slice(0, 14) + "..." : name;
    });
    const fullNames = cols.map((c) => c.col);

    const numericData = cols.map((c) => getNumericColumn(dataset, c.i));
    const n = cols.length;
    const matrix: { r: number; fullX: string; fullY: string }[][] = [];

    for (let i = 0; i < n; i++) {
      const row: { r: number; fullX: string; fullY: string }[] = [];
      for (let j = 0; j < n; j++) {
        const r = i === j ? 1 : computeCorrelation(numericData[i], numericData[j]);
        row.push({ r, fullX: fullNames[j], fullY: fullNames[i] });
      }
      matrix.push(row);
    }

    return { names, matrix, fullNames };
  }, [dataset]);

  // Find top-N strongest pairs
  const topPairs = useMemo(() => {
    const pairs: { x: string; y: string; r: number }[] = [];
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        pairs.push({ x: fullNames[j], y: fullNames[i], r: matrix[i][j].r });
      }
    }
    pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    return pairs.slice(0, 5);
  }, [matrix, fullNames]);

  const aiInsight = useMemo(() => {
    const strongPairs = topPairs.filter(p => Math.abs(p.r) > 0.7);
    const maxPair = topPairs[0];
    return generateCorrelationInsight(
      strongPairs.length,
      maxPair?.r ?? 0,
      maxPair ? `${maxPair.y} vs ${maxPair.x}` : ""
    );
  }, [topPairs]);

  const n = names.length;
  const cellSize = Math.min(40, Math.max(24, 400 / n));
  const labelW = 100;
  const labelH = 80;
  const w = labelW + n * cellSize;
  const h = labelH + n * cellSize;

  return (
    <AIInsightCard insight={aiInsight.insight} confidence={aiInsight.confidence} recommendations={aiInsight.recommendations}>
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <svg width={w} height={h}>
            {names.map((name, j) => (
              <text
                key={`col-${j}`}
                x={labelW + j * cellSize + cellSize / 2}
                y={labelH - 4}
                fontSize="9"
                fill="var(--text-label)"
                textAnchor="end"
                transform={`rotate(-45, ${labelW + j * cellSize + cellSize / 2}, ${labelH - 4})`}
              >
                {name}
              </text>
            ))}
            {matrix.map((row, i) => (
              <g key={`row-${i}`}>
                <text
                  x={labelW - 4}
                  y={labelH + i * cellSize + cellSize / 2 + 3}
                  fontSize="9"
                  fill="var(--text-label)"
                  textAnchor="end"
                >
                  {names[i]}
                </text>
                {row.map((cell, j) => (
                  <g key={`cell-${i}-${j}`}>
                    <rect
                      x={labelW + j * cellSize}
                      y={labelH + i * cellSize}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      fill={corrColor(cell.r)}
                      rx={2}
                    >
                      <title>{`${cell.fullY} vs ${cell.fullX}: r = ${cell.r.toFixed(3)}`}</title>
                    </rect>
                    {cellSize >= 28 && (
                      <text
                        x={labelW + j * cellSize + cellSize / 2 - 0.5}
                        y={labelH + i * cellSize + cellSize / 2 + 3}
                        fontSize="8"
                        fill={Math.abs(cell.r) > 0.5 ? "white" : "var(--text-muted)"}
                        textAnchor="middle"
                      >
                        {cell.r.toFixed(2)}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>

        {/* Top-N Strongest Pairs */}
        <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
          <div className="bg-[var(--hover-item)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-label)]">Top Correlated Pairs</div>
          <div className="divide-y divide-[var(--border-primary)]">
            {topPairs.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className="text-[var(--text-primary)] truncate flex-1">{p.y} &harr; {p.x}</span>
                <span className={`tabular-nums font-medium ml-2 ${Math.abs(p.r) > 0.7 ? "text-[#ef4444]" : Math.abs(p.r) > 0.4 ? "text-[#f59e0b]" : "text-[#00bc7d]"}`}>
                  {p.r.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AIInsightCard>
  );
}
