"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  SETUP HERO
// ═══════════════════════════════════════════════════════════════════════════
//
//  Three regions, fixed grid columns so section labels align across columns:
//    • Progress — donut + aligned stats grid
//    • Next steps — up to 3 action cards
//    • Quick actions — single "Add field" button (unified modal)
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import type { Field } from "../fieldsData";
import type { ActionItem } from "./mandatoryMetrics";

interface SetupHeroProps {
  fields: Field[];
  items: ActionItem[];
  onMapNow: (integration: string, dataSource: string, category: string) => void;
  onMapColumnAsDate?: (integration: string, dataSource: string, columnName: string) => void;
  onAddField: () => void;
}

export default function SetupHero({
  fields,
  items,
  onMapNow,
  onMapColumnAsDate,
  onAddField,
}: SetupHeroProps) {
  const stats = useMemo(() => {
    const total = fields.length;
    const mapped = fields.filter((f) => f.status === "Mapped").length;
    const derived = fields.filter((f) => f.source === "Derived").length;
    const unmapped = total - mapped;
    return { total, mapped, unmapped, derived };
  }, [fields]);

  const percentMapped = stats.total === 0 ? 0 : Math.round((stats.mapped / stats.total) * 100);

  const nextSteps = useMemo<NextStepCard[]>(() => {
    const cards: NextStepCard[] = [];

    const columnMissing = items.filter((i) => i.state === "required_column_missing");
    if (columnMissing.length > 0) {
      const item = columnMissing[0];
      cards.push({
        kind: "column_missing",
        tone: "red",
        title: `${item.integration} is missing a ${item.missingItems.join(", ")} column`,
        subtitle: item.dataSource,
        item,
      });
    }

    const mappingRequired = items.filter((i) => i.state === "mapping_required");
    if (mappingRequired.length > 0 && cards.length < 3) {
      const item = mappingRequired[0];
      const count = item.totalFields - item.mappedFields;
      cards.push({
        kind: "mapping_required",
        tone: "orange",
        title:
          count > 0
            ? `${count} unmapped column${count === 1 ? "" : "s"} in ${item.integration}`
            : `${item.integration} needs ${item.missingItems.join(" & ")}`,
        subtitle: item.dataSource,
        item,
      });
    }

    const remaining = items.length - cards.filter((c) => c.item).length;
    if (remaining > 0 && cards.length < 3) {
      cards.push({
        kind: "more",
        tone: "orange",
        title: `${remaining} more item${remaining === 1 ? "" : "s"} need attention`,
        subtitle: "Review the full action list below",
      });
    }

    if (cards.length === 0) {
      cards.push({
        kind: "all_clear",
        tone: "green",
        title: "All set",
        subtitle: "Your fields are ready to power models.",
      });
    }

    return cards;
  }, [items]);

  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[12px] overflow-hidden"
      style={{ boxShadow: "var(--shadow-popover)" }}
    >
      {/* Gradient accent strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#027b8e] via-[#027b8e] to-[#012e36]" />

      {/* Body: 3-region grid with consistent column widths */}
      <div className="grid grid-cols-[300px_minmax(0,1fr)_240px] gap-0 p-5">
        <ProgressRegion stats={stats} percentMapped={percentMapped} />

        <div className="relative px-6">
          <div className="absolute inset-y-0 left-0 w-px bg-[var(--border-primary)]" />
          <NextStepsRegion cards={nextSteps} onMapNow={onMapNow} onMapColumnAsDate={onMapColumnAsDate} />
        </div>

        <div className="relative pl-6">
          <div className="absolute inset-y-0 left-0 w-px bg-[var(--border-primary)]" />
          <QuickActionsRegion onAddField={onAddField} />
        </div>
      </div>
    </div>
  );
}

// ─── Region 1: Progress ────────────────────────────────────────────────────

function ProgressRegion({
  stats,
  percentMapped,
}: {
  stats: { total: number; mapped: number; unmapped: number; derived: number };
  percentMapped: number;
}) {
  const rows: { color: string; label: string; value: number }[] = [
    { color: "#00bc7d", label: "Mapped", value: stats.mapped },
    { color: "#71717a", label: "Unmapped", value: stats.unmapped },
  ];
  if (stats.derived > 0) rows.push({ color: "#a78bfa", label: "Derived", value: stats.derived });

  return (
    <div className="flex flex-col gap-3 min-h-[108px]">
      <SectionLabel>Setup progress</SectionLabel>
      <div className="flex items-center gap-5">
        <DonutRing size={72} percent={percentMapped} accent="#00bc7d" trackColor="var(--border-primary)" />
        <div className="flex-1 min-w-0">
          <div className="text-[var(--text-primary)] text-sm font-semibold mb-1.5">
            {stats.total === 0 ? "No fields yet" : `${stats.mapped} of ${stats.total} mapped`}
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 text-xs items-center">
            {rows.map((r) => (
              <StatRow key={r.label} color={r.color} label={r.label} value={r.value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-secondary)] font-semibold tabular-nums text-right">{value}</span>
    </>
  );
}

// ─── Region 2: Next Steps ──────────────────────────────────────────────────

type NextStepCard = {
  kind: "column_missing" | "mapping_required" | "more" | "all_clear";
  tone: "red" | "orange" | "green";
  title: string;
  subtitle: string;
  item?: ActionItem;
};

const TONE_COLORS: Record<NextStepCard["tone"], string> = {
  red: "#ff2056",
  orange: "#fe9a00",
  green: "#00bc7d",
};

function NextStepsRegion({
  cards,
  onMapNow,
  onMapColumnAsDate,
}: {
  cards: NextStepCard[];
  onMapNow: (i: string, d: string, c: string) => void;
  onMapColumnAsDate?: (i: string, d: string, col: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-h-[108px]">
      <SectionLabel>Next steps</SectionLabel>
      <div className="flex flex-col gap-2 flex-1">
        {cards.map((card, idx) => (
          <NextStepRow key={idx} card={card} onMapNow={onMapNow} onMapColumnAsDate={onMapColumnAsDate} />
        ))}
      </div>
    </div>
  );
}

function NextStepRow({
  card,
  onMapNow,
  onMapColumnAsDate,
}: {
  card: NextStepCard;
  onMapNow: (i: string, d: string, c: string) => void;
  onMapColumnAsDate?: (i: string, d: string, col: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const toneColor = TONE_COLORS[card.tone];
  const isColumnMissing = card.kind === "column_missing";
  const isDateMissing = !!card.item && card.item.missingItems.includes("Date");
  const canPickDate =
    isColumnMissing && isDateMissing && !!onMapColumnAsDate && !!card.item && card.item.availableColumns.length > 0;

  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[var(--border-primary)] bg-[var(--bg-card-inner)] px-3 py-2.5 hover:border-[var(--border-secondary)] transition-colors">
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: toneColor, boxShadow: `0 0 0 3px ${toneColor}25` }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[var(--text-primary)] text-sm font-medium truncate">{card.title}</div>
        <div className="text-[var(--text-muted)] text-xs truncate mt-0.5">{card.subtitle}</div>
      </div>
      <div className="relative flex-shrink-0">
        {canPickDate ? (
          <>
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className="inline-flex items-center gap-1.5 border border-[#027b8e]/40 text-[#027b8e] hover:bg-[#027b8e]/8 hover:border-[#027b8e] rounded-[6px] h-[28px] px-3 text-xs font-semibold transition-colors"
            >
              Pick date column
              <Chevron />
            </button>
            {pickerOpen && card.item && (
              <DateColumnPicker
                columns={card.item.availableColumns}
                onPick={(col) => {
                  onMapColumnAsDate!(card.item!.integration, card.item!.dataSource, col);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </>
        ) : card.item ? (
          <button
            onClick={() => onMapNow(card.item!.integration, card.item!.dataSource, card.item!.category)}
            className="inline-flex items-center gap-1.5 border border-[#027b8e]/40 text-[#027b8e] hover:bg-[#027b8e]/8 hover:border-[#027b8e] rounded-[6px] h-[28px] px-3 text-xs font-semibold transition-colors"
          >
            Review & map
            <Arrow />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Region 3: Quick Actions ───────────────────────────────────────────────

function QuickActionsRegion({ onAddField }: { onAddField: () => void }) {
  return (
    <div className="flex flex-col gap-3 min-h-[108px]">
      <SectionLabel>Quick actions</SectionLabel>
      <button
        onClick={onAddField}
        className="flex items-center gap-3 rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-card-inner)] px-3 py-3 hover:border-[#027b8e] hover:bg-[#027b8e]/5 transition-colors text-left group"
      >
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #027b8e, #012e36)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2.5V13.5M2.5 8H13.5"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[var(--text-primary)] text-sm font-semibold">Add field</div>
          <div className="text-[var(--text-muted)] text-xs mt-0.5">Map a source or build a formula</div>
        </div>
      </button>
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)] h-4 leading-4">
      {children}
    </span>
  );
}

function DonutRing({
  size,
  percent,
  accent,
  trackColor,
}: {
  size: number;
  percent: number;
  accent: string;
  trackColor: string;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[var(--text-primary)] text-sm font-semibold tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2.5 3.5L5 6L7.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M3.5 1.5L7 5L3.5 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DateColumnPicker({
  columns,
  onPick,
  onClose,
}: {
  columns: string[];
  onPick: (column: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-[34px] z-50 w-[240px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] shadow-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-label)] font-semibold">
            Pick column to map as date
          </div>
        </div>
        <div className="max-h-[220px] overflow-y-auto py-1">
          {columns.map((col) => (
            <button
              key={col}
              onClick={() => onPick(col)}
              className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[var(--text-muted)]">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 6H14M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-[var(--text-primary)] font-mono truncate">{col}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
