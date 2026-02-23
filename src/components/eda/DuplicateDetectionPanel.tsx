"use client";

import { useState, useMemo } from "react";
import type { MockDataset } from "../mockDataGenerator";
import AIInsightCard from "./AIInsightCard";
import { generateDuplicateInsight } from "./edaInsightGenerator";

interface Props {
  dataset: MockDataset;
}

export default function DuplicateDetectionPanel({ dataset }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const duplicateData = useMemo(() => {
    const totalRows = dataset.rows.length;
    const colCount = dataset.columns.length;
    const threshold = Math.floor(colCount * 0.8);

    // Exact duplicates: rows with identical values across all columns
    const rowKeys = new Map<string, number[]>();
    dataset.rows.forEach((row, idx) => {
      const key = row.map((v) => (v === null ? "__NULL__" : String(v))).join("|");
      if (!rowKeys.has(key)) {
        rowKeys.set(key, []);
      }
      rowKeys.get(key)!.push(idx);
    });

    const exactDupGroups: number[][] = [];
    Array.from(rowKeys.values()).forEach((indices) => {
      if (indices.length > 1) {
        exactDupGroups.push(indices);
      }
    });
    const exactDupCount = exactDupGroups.reduce(
      (s, g) => s + g.length - 1,
      0
    );

    // Near-duplicates: rows matching on 80%+ columns (exclude exact dups)
    const exactDupIndices = new Set(
      exactDupGroups.flatMap((g) => g.slice(1))
    );
    const nearDupPairs: { row1: number; row2: number; matchCols: number }[] = [];
    const nearDupSet = new Set<number>();

    // Sample-based check to avoid O(n^2) for large datasets
    const maxCheck = Math.min(totalRows, 200);
    for (let i = 0; i < maxCheck; i++) {
      if (exactDupIndices.has(i)) continue;
      for (let j = i + 1; j < maxCheck; j++) {
        if (exactDupIndices.has(j)) continue;
        let matchCount = 0;
        for (let c = 0; c < colCount; c++) {
          const v1 = dataset.rows[i][c];
          const v2 = dataset.rows[j][c];
          if (v1 === v2 || (v1 === null && v2 === null)) {
            matchCount++;
          } else if (
            typeof v1 === "number" &&
            typeof v2 === "number" &&
            Math.abs(v1 - v2) < Math.abs(v1) * 0.01
          ) {
            matchCount++;
          }
        }
        if (matchCount >= threshold && matchCount < colCount) {
          nearDupPairs.push({ row1: i, row2: j, matchCols: matchCount });
          nearDupSet.add(i);
          nearDupSet.add(j);
        }
      }
    }

    return {
      totalRows,
      exactDupCount,
      exactDupGroups,
      nearDupCount: nearDupSet.size,
      nearDupPairs,
    };
  }, [dataset]);

  const aiInsight = useMemo(() => {
    return generateDuplicateInsight(
      duplicateData.exactDupCount,
      duplicateData.nearDupCount,
      duplicateData.totalRows
    );
  }, [duplicateData]);

  return (
    <AIInsightCard
      insight={aiInsight.insight}
      confidence={aiInsight.confidence}
      recommendations={aiInsight.recommendations}
    >
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
          <div className="text-[10px] text-[var(--text-label)] uppercase tracking-wider mb-1">
            Total Rows
          </div>
          <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
            {duplicateData.totalRows.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
          <div className="text-[10px] text-[var(--text-label)] uppercase tracking-wider mb-1">
            Exact Duplicates
          </div>
          <div
            className="text-lg font-semibold tabular-nums"
            style={{
              color: duplicateData.exactDupCount > 0 ? "#ef4444" : "#00bc7d",
            }}
          >
            {duplicateData.exactDupCount}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
          <div className="text-[10px] text-[var(--text-label)] uppercase tracking-wider mb-1">
            Near-Duplicates
          </div>
          <div
            className="text-lg font-semibold tabular-nums"
            style={{
              color: duplicateData.nearDupCount > 0 ? "#fbbf24" : "#00bc7d",
            }}
          >
            {duplicateData.nearDupCount}
          </div>
        </div>
      </div>

      {/* Detail table */}
      {(duplicateData.exactDupGroups.length > 0 ||
        duplicateData.nearDupPairs.length > 0) && (
        <div className="mt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-[#6941c6] hover:underline font-medium mb-2"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className={`transition-transform ${showDetails ? "rotate-90" : ""}`}
            >
              <path
                d="M3 1L7 5L3 9"
                stroke="#6941c6"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {showDetails ? "Hide" : "Show"} duplicate details
          </button>
          {showDetails && (
            <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--hover-item)]">
                    <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">
                      Type
                    </th>
                    <th className="text-[var(--text-label)] font-medium text-left px-3 py-2 border-b border-[var(--border-primary)]">
                      Row Indices
                    </th>
                    <th className="text-[var(--text-label)] font-medium text-right px-3 py-2 border-b border-[var(--border-primary)]">
                      Matching Columns
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateData.exactDupGroups.slice(0, 10).map((group, i) => (
                    <tr
                      key={`exact-${i}`}
                      className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50"
                    >
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">
                          Exact
                        </span>
                      </td>
                      <td className="text-[var(--text-primary)] px-3 py-2 tabular-nums">
                        {group.join(", ")}
                      </td>
                      <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">
                        {dataset.columns.length}/{dataset.columns.length}
                      </td>
                    </tr>
                  ))}
                  {duplicateData.nearDupPairs.slice(0, 10).map((pair, i) => (
                    <tr
                      key={`near-${i}`}
                      className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--hover-item)]/50"
                    >
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                          Near
                        </span>
                      </td>
                      <td className="text-[var(--text-primary)] px-3 py-2 tabular-nums">
                        {pair.row1}, {pair.row2}
                      </td>
                      <td className="text-[var(--text-primary)] text-right px-3 py-2 tabular-nums">
                        {pair.matchCols}/{dataset.columns.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AIInsightCard>
  );
}
