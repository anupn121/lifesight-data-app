"use client";

interface SummaryCardsProps {
  totalMapped: number;
  totalFields: number;
  actionItemCount: number;
  metricCount: number;
  dimensionCount: number;
  onActionClick: () => void;
}

export default function SummaryCards({
  totalMapped,
  totalFields,
  actionItemCount,
  metricCount,
  dimensionCount,
  onActionClick,
}: SummaryCardsProps) {
  const mappingPct = totalFields > 0 ? Math.round((totalMapped / totalFields) * 100) : 0;
  const progressColor = mappingPct === 100 ? "#00bc7d" : mappingPct > 60 ? "#fe9a00" : "#ff2056";

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Card 1 — Mapping Progress */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Mapping Progress</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
            style={{
              backgroundColor: `${progressColor}15`,
              color: progressColor,
            }}
          >
            {mappingPct}%
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-[var(--text-primary)] text-2xl font-bold" style={{ color: progressColor }}>{totalMapped}</span>
          <span className="text-[var(--text-label)] text-sm">/ {totalFields}</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-badge)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${mappingPct}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>

      {/* Card 2 — Action Required */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Action Required</span>
        </div>
        {actionItemCount > 0 ? (
          <>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-[#ff2056] text-2xl font-bold">{actionItemCount}</span>
            </div>
            <button
              onClick={onActionClick}
              className="text-[#ff2056] text-[11px] font-medium hover:underline transition-colors"
            >
              integrations need mapping →
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#00bc7d" strokeWidth="1.2"/>
              <path d="M5.5 8L7 9.5L10.5 6" stroke="#00bc7d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#00bc7d] text-xs font-medium">All set</span>
          </div>
        )}
      </div>

      {/* Card 3 — Fields Overview */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Fields Overview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2b7fff]" />
            <span className="text-[var(--text-primary)] text-lg font-bold">{metricCount}</span>
            <span className="text-[var(--text-label)] text-[11px]">Metrics</span>
          </div>
          <div className="w-px h-6 bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#027b8e]" />
            <span className="text-[var(--text-primary)] text-lg font-bold">{dimensionCount}</span>
            <span className="text-[var(--text-label)] text-[11px]">Dimensions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
