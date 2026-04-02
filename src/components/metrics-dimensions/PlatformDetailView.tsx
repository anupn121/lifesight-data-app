"use client";

import { useState, useMemo } from "react";
import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";
import { SearchIcon } from "./badges";
import { TABLE_GRID, NewFieldRow, FieldTableHeader } from "./FieldTable";
import type { DetailKindFilter, StatusFilter } from "./types";

interface PlatformDetailViewProps {
  platform: string;
  fields: Field[];
  onBack: () => void;
  onEditField: (field: Field) => void;
}

export default function PlatformDetailView({
  platform,
  fields,
  onBack,
  onEditField,
}: PlatformDetailViewProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<DetailKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Get all fields for this platform
  const platformFields = useMemo(() => {
    return fields.filter((f) => {
      const info = getSourceStreamInfo(f.source);
      return info.parent === platform;
    });
  }, [fields, platform]);

  // Get platform info
  const platformInfo = useMemo(() => {
    if (platformFields.length === 0) return { color: "#9CA3AF", categories: [] as MetricCategory[] };
    const info = getSourceStreamInfo(platformFields[0].source);
    const cats = new Set<MetricCategory>();
    platformFields.forEach((f) => {
      if (f.metricCategory) cats.add(f.metricCategory);
    });
    return { color: info.color, categories: Array.from(cats) };
  }, [platformFields]);

  // Apply filters
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

  const totalFields = platformFields.length;
  const mappedCount = platformFields.filter((f) => f.status === "Mapped").length;
  const unmappedCount = totalFields - mappedCount;
  const metricCount = platformFields.filter((f) => f.kind === "metric").length;
  const dimensionCount = platformFields.filter((f) => f.kind === "dimension").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 9.5L4 6L7.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Metrics & Dimensions
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: platformInfo.color }}
        >
          <span className="text-sm text-white font-bold">{platform[0]}</span>
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">{platform}</h2>
          <div className="flex items-center gap-1.5">
            {platformInfo.categories.map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
                style={{
                  backgroundColor: `${METRIC_CATEGORIES[cat].color}15`,
                  color: METRIC_CATEGORIES[cat].color,
                }}
              >
                {METRIC_CATEGORIES[cat].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">Total Fields</span>
          <span className="text-[var(--text-primary)] text-xl font-bold">{totalFields}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">Mapped</span>
          <span className="text-[#00bc7d] text-xl font-bold">{mappedCount}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">Unmapped</span>
          <span className={`text-xl font-bold ${unmappedCount > 0 ? "text-[#fe9a00]" : "text-[var(--text-primary)]"}`}>{unmappedCount}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3">
          <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider block mb-1">Categories</span>
          <span className="text-[var(--text-primary)] text-xl font-bold">{platformInfo.categories.length}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {/* Kind toggle */}
        <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-[6px] p-0.5">
          {(["all", "metrics", "dimensions"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                kindFilter === k
                  ? "bg-[#027b8e] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {k === "all" ? "All" : k === "metrics" ? "Metrics" : "Dimensions"}
            </button>
          ))}
        </div>

        {/* Search */}
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

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] px-3 py-1.5 focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="mapped">Mapped</option>
          <option value="unmapped">Unmapped</option>
        </select>
      </div>

      {/* Field table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
        <FieldTableHeader />
        {filteredFields.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[var(--text-label)] text-xs">No fields match your filters</p>
          </div>
        ) : (
          filteredFields.map((field) => (
            <NewFieldRow key={`${field.source}-${field.sourceKey}`} field={field} onEdit={onEditField} />
          ))
        )}
      </div>
    </div>
  );
}
