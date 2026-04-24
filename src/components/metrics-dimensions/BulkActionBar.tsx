"use client";

import { useRef, useState, useEffect } from "react";
import {
  type Field,
  type MetricCategory,
  type KpiSubtype,
  type PaidMarketingMetricType,
  METRIC_CATEGORIES,
} from "../fieldsData";

// ─── Options ──────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: MetricCategory; label: string; color: string }[] = [
  { value: "kpi", label: "KPIs", color: METRIC_CATEGORIES.kpi.color },
  { value: "paid_marketing", label: "Paid Marketing", color: METRIC_CATEGORIES.paid_marketing.color },
  { value: "organic", label: "Organic", color: METRIC_CATEGORIES.organic.color },
  { value: "contextual", label: "External Factors", color: METRIC_CATEGORIES.contextual.color },
];

const KPI_SUBTYPES: KpiSubtype[] = [
  "Revenue", "Conversions", "Orders", "Installs", "Registrations",
  "Store Visits", "Reach", "Subscriptions", "Admissions",
];

const PAID_TYPES: PaidMarketingMetricType[] = ["Spends", "Impressions", "Clicks", "Other"];

// ─── Props ────────────────────────────────────────────────────────────────

export interface BulkActionBarProps {
  selected: Field[];
  allFields: Field[];
  onApply: (next: Field[]) => void;
  onClear: () => void;
  onDelete?: (fields: Field[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BulkActionBar({ selected, allFields, onApply, onClear, onDelete }: BulkActionBarProps) {
  if (selected.length === 0) return null;

  const setCategory = (cat: MetricCategory) => {
    const updated = selected.map((f) => ({ ...f, metricCategory: cat }));
    onApply(updated);
  };

  const setPaidType = (pt: PaidMarketingMetricType) => {
    const updated = selected.map((f) => ({
      ...f,
      metricCategory: "paid_marketing" as const,
      paidMarketingMetricType: pt,
      kind: "metric" as const,
    }));
    onApply(updated);
  };

  const setKpiSubtype = (kt: KpiSubtype) => {
    const updated = selected.map((f) => ({
      ...f,
      metricCategory: "kpi" as const,
      kpiSubtype: kt,
      kind: "metric" as const,
    }));
    onApply(updated);
  };

  const setKind = (kind: "metric" | "dimension") => {
    const updated = selected.map((f) => ({ ...f, kind }));
    onApply(updated);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(selected);
  };

  // Track which allFields entries are selected so we can avoid collisions
  // if needed. Not used today but wired for future use.
  void allFields;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[12px] px-3 py-2"
      style={{ boxShadow: "var(--shadow-xl)" }}
    >
      {/* Count */}
      <div className="flex items-center gap-2 px-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#027b8e] text-white text-xs font-semibold">
          {selected.length}
        </span>
        <span className="text-[var(--text-secondary)] text-sm font-medium">
          selected
        </span>
      </div>

      <Divider />

      <MenuButton label="Set category" icon="grid">
        {CATEGORY_OPTIONS.map((o) => (
          <MenuItem key={o.value} onClick={() => setCategory(o.value)} dotColor={o.color}>
            {o.label}
          </MenuItem>
        ))}
      </MenuButton>

      <MenuButton label="Set type" icon="tag">
        <MenuGroupLabel>KPI subtype</MenuGroupLabel>
        {KPI_SUBTYPES.map((t) => (
          <MenuItem key={t} onClick={() => setKpiSubtype(t)}>
            {t}
          </MenuItem>
        ))}
        <MenuDivider />
        <MenuGroupLabel>Paid Marketing type</MenuGroupLabel>
        {PAID_TYPES.map((t) => (
          <MenuItem key={t} onClick={() => setPaidType(t)}>
            {t}
          </MenuItem>
        ))}
      </MenuButton>

      <MenuButton label="Mark as" icon="toggle">
        <MenuItem onClick={() => setKind("metric")}>Metric</MenuItem>
        <MenuItem onClick={() => setKind("dimension")}>Dimension</MenuItem>
      </MenuButton>

      <Divider />

      {onDelete && (
        <BulkButton
          label="Delete"
          tone="red"
          onClick={handleDelete}
          iconPath="M3 3.5h8M5 3.5V2.5A.5.5 0 0 1 5.5 2h3a.5.5 0 0 1 .5.5v1M4 3.5l.5 8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5l.5-8"
        />
      )}

      <Divider />

      <button
        onClick={onClear}
        aria-label="Clear selection"
        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Menu shell ────────────────────────────────────────────────────────────

function MenuButton({
  label,
  icon,
  children,
}: {
  label: string;
  icon: "grid" | "tag" | "toggle";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-medium transition-colors ${
          open
            ? "bg-[var(--hover-item)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)]"
        }`}
      >
        <MenuIcon icon={icon} />
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2.5 3.5L5 6L7.5 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 min-w-[220px] bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[8px] overflow-hidden py-1 max-h-[320px] overflow-y-auto"
          style={{ boxShadow: "var(--shadow-xl)" }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  dotColor,
  children,
}: {
  onClick: () => void;
  dotColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
    >
      {dotColor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />}
      <span className="text-[var(--text-primary)] text-xs">{children}</span>
    </button>
  );
}

function MenuGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
      {children}
    </div>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-[var(--border-primary)]" />;
}

function Divider() {
  return <div className="w-px h-5 bg-[var(--border-primary)]" />;
}

function MenuIcon({ icon }: { icon: "grid" | "tag" | "toggle" }) {
  if (icon === "grid") {
    return (
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8" y="1.5" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.5" y="8" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8" y="8" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (icon === "tag") {
    return (
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d="M2 6V2h4l6 6-4 4-6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="4.5" cy="4.5" r="0.75" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="4" width="11" height="6" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5" cy="7" r="1.25" fill="currentColor" />
    </svg>
  );
}

function BulkButton({
  label,
  tone,
  iconPath,
  disabled = false,
  onClick,
}: {
  label: string;
  tone: "blue" | "red";
  iconPath: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const toneColor = tone === "blue" ? "#2b7fff" : "#ff2056";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-semibold transition-colors border ${
        disabled
          ? "border-transparent text-[var(--text-dim)] cursor-not-allowed"
          : "border-transparent hover:border-current"
      }`}
      style={{
        color: disabled ? undefined : toneColor,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d={iconPath} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
