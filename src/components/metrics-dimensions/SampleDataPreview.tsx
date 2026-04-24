"use client";

import { useMemo, useState } from "react";
import type { Field } from "../fieldsData";
import { getSampleValues, canValidateSample } from "./sampleDataMock";

export function SampleDataPreview({
  field,
  rows = 5,
  compact = false,
}: {
  field: Field;
  rows?: number;
  compact?: boolean;
}) {
  const [refreshTick, setRefreshTick] = useState(0);
  const canValidate = canValidateSample(field);
  const values = useMemo(
    () => (canValidate ? getSampleValues(field, rows) : []),
    // refreshTick intentionally triggers re-render but generator is deterministic
    // so the same values redraw — this is the "pulse" animation on the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field.source, field.sourceKey, field.columnName, field.dataType, rows, refreshTick],
  );

  return (
    <div className="rounded-[8px] border border-[var(--border-primary)] bg-[var(--bg-card-inner)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">
            Sample data
          </span>
          {canValidate ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[3px] border border-[#00bc7d]/30 text-[10px] font-semibold uppercase tracking-wide text-[#00bc7d]">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Column exists
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[3px] border border-[#fe9a00]/30 text-[10px] font-semibold uppercase tracking-wide text-[#fe9a00]">
              Not detected
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshTick((t) => t + 1)}
          className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors p-1 -m-1"
          aria-label="Refresh sample"
          title="Refresh"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            className={refreshTick > 0 ? "animate-spin-slow" : ""}
            style={{ animation: refreshTick > 0 ? "spin 0.4s ease-out" : undefined }}
            key={refreshTick}
          >
            <path
              d="M12 7a5 5 0 1 1-1.6-3.7M12 2v3.1H9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className={compact ? "px-3 py-2" : "px-3 py-3"}>
        {canValidate && values.length > 0 ? (
          <div className="flex flex-col gap-1">
            {values.map((v, i) => (
              <div
                key={i}
                className="font-mono text-xs text-[var(--text-secondary)] truncate"
                title={v}
              >
                {v}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Fill in the source and column to preview sample values.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline, single-value variant — used in dense table rows.
 */
export function InlineSampleValue({ field }: { field: Field }) {
  const value = useMemo(() => {
    if (!canValidateSample(field)) return "—";
    return getSampleValues(field, 1)[0] ?? "—";
  }, [field]);

  return (
    <span
      className="font-mono text-xs text-[var(--text-muted)] truncate"
      title={value}
    >
      {value}
    </span>
  );
}
