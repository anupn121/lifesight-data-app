"use client";

import { useState, useMemo } from "react";
import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";
import { SearchIcon } from "./badges";
import { FieldTableShell, fieldKey } from "./FieldTable";
import BulkActionBar from "./BulkActionBar";
import type { DetailKindFilter, StatusFilter } from "./types";

interface PlatformDetailViewProps {
  platform: string;
  fields: Field[];
  onBack: () => void;
  onEditField: (field: Field) => void;
  onFieldsChange: (fields: Field[]) => void;
}

export default function PlatformDetailView({
  platform,
  fields,
  onBack,
  onEditField,
  onFieldsChange,
}: PlatformDetailViewProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<DetailKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showSamples, setShowSamples] = useState(false);

  // Fields for this platform
  const platformFields = useMemo(() => {
    return fields.filter((f) => {
      const info = getSourceStreamInfo(f.source);
      return info.parent === platform;
    });
  }, [fields, platform]);

  const platformInfo = useMemo(() => {
    if (platformFields.length === 0) return { color: "#9CA3AF", categories: [] as MetricCategory[] };
    const info = getSourceStreamInfo(platformFields[0].source);
    const cats = new Set<MetricCategory>();
    platformFields.forEach((f) => {
      if (f.metricCategory) cats.add(f.metricCategory);
    });
    return { color: info.color, categories: Array.from(cats) };
  }, [platformFields]);

  const filteredFields = useMemo(() => {
    return platformFields.filter((f) => {
      if (kindFilter === "metrics" && f.kind !== "metric") return false;
      if (kindFilter === "dimensions" && f.kind !== "dimension") return false;
      if (statusFilter === "mapped" && f.status !== "Mapped") return false;
      if (statusFilter === "unmapped" && f.status !== "Unmapped") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.displayName.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.sourceKey.toLowerCase().includes(q) ||
          f.columnName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [platformFields, kindFilter, statusFilter, search]);

  // Counts
  const totalFields = platformFields.length;
  const mappedCount = platformFields.filter((f) => f.status === "Mapped").length;
  const unmappedCount = totalFields - mappedCount;
  const derivedCount = platformFields.filter((f) => f.source === "Derived").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 9.5L4 6L7.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Data Transformation
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${platformInfo.color}, ${platformInfo.color}99)` }}
        >
          <span className="text-base text-white font-bold">{platform[0]}</span>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <h2 className="text-[var(--text-primary)] text-lg font-semibold truncate">{platform}</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {platformInfo.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-[2px] rounded-[4px] border"
                style={{
                  backgroundColor: `${METRIC_CATEGORIES[cat].color}12`,
                  color: METRIC_CATEGORIES[cat].color,
                  borderColor: `${METRIC_CATEGORIES[cat].color}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: METRIC_CATEGORIES[cat].color }} />
                {METRIC_CATEGORIES[cat].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Total fields" value={totalFields} tone="neutral" />
        <SummaryCard label="Mapped" value={mappedCount} tone="green" />
        <SummaryCard label="Unmapped" value={unmappedCount} tone={unmappedCount > 0 ? "orange" : "neutral"} />
        <SummaryCard label="Derived" value={derivedCount} tone={derivedCount > 0 ? "blue" : "neutral"} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-[6px] p-0.5">
          {(["all", "metrics", "dimensions"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                kindFilter === k
                  ? "bg-[#027b8e] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {k === "all" ? "All" : k === "metrics" ? "Metrics" : "Dimensions"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] px-3 py-1.5 focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="mapped">Mapped</option>
          <option value="unmapped">Unmapped</option>
        </select>

        <button
          onClick={() => setShowSamples((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
            showSamples
              ? "border-[#027b8e] bg-[#027b8e]/10 text-[#027b8e]"
              : "border-[var(--border-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 5.5H12.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 2.5V11.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {showSamples ? "Hide samples" : "Show samples"}
        </button>
      </div>

      {/* Field table */}
      {filteredFields.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-6 py-12 text-center">
          <p className="text-[var(--text-label)] text-sm mb-1">No fields match your filters</p>
          <p className="text-[var(--text-dim)] text-xs">
            {search ? `No results matching "${search}"` : "Try adjusting the kind or status filter."}
          </p>
        </div>
      ) : (
        <FieldTableShell
          fields={filteredFields}
          allFields={fields}
          selected={selectedKeys}
          onSelectionChange={setSelectedKeys}
          onEdit={onEditField}
          showSamples={showSamples}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selected={fields.filter((f) => selectedKeys.has(fieldKey(f)))}
        allFields={fields}
        onApply={(updated) => {
          const map = new Map(updated.map((f) => [fieldKey(f), f] as const));
          onFieldsChange(fields.map((f) => map.get(fieldKey(f)) ?? f));
        }}
        onClear={() => setSelectedKeys(new Set())}
        onDelete={(toDelete) => {
          const keys = new Set(toDelete.map(fieldKey));
          onFieldsChange(fields.filter((f) => !keys.has(fieldKey(f))));
          setSelectedKeys(new Set());
        }}
      />
    </div>
  );
}

// ─── Summary card ──────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "orange" | "blue" | "neutral";
}) {
  const toneColor = {
    green: "#00bc7d",
    orange: "#fe9a00",
    blue: "#2b7fff",
    neutral: "var(--text-primary)",
  }[tone];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[10px] px-4 py-3">
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className="text-xl font-bold" style={{ color: toneColor }}>
        {value}
      </span>
    </div>
  );
}
