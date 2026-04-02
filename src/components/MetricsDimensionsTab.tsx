"use client";

import { useState, useMemo } from "react";
import FlowView from "./FlowView";
import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
} from "./fieldsData";
import FieldModal from "./metrics-dimensions/FieldModal";
import { SearchIcon } from "./metrics-dimensions/badges";
import { NewFieldRow, FieldTableHeader } from "./metrics-dimensions/FieldTable";
import type { ViewMode, DetailKindFilter, StatusFilter } from "./metrics-dimensions/types";
import ActionRequiredSection from "./metrics-dimensions/ActionRequiredSection";
import CategorySection from "./metrics-dimensions/CategorySection";
import PlatformDetailView from "./metrics-dimensions/PlatformDetailView";
import {
  useMandatoryMetrics,
  useCategoryPlatformData,
} from "./metrics-dimensions/useFieldData";

interface MetricsDimensionsTabProps {
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  hasConnectedIntegration?: boolean;
  onNavigateToIntegrations?: () => void;
}

export default function MetricsDimensionsTab({
  fields,
  onFieldsChange,
  hasConnectedIntegration = true,
  onNavigateToIntegrations,
}: MetricsDimensionsTabProps) {
  const [view, setView] = useState<ViewMode>("overview");
  const [detailCategory, setDetailCategory] = useState<MetricCategory | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [detailKind, setDetailKind] = useState<DetailKindFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [flowKind, setFlowKind] = useState<"metric" | "dimension">("metric");

  const { actionItems, totalActionItems } = useMandatoryMetrics(fields);
  const categoryData = useCategoryPlatformData(fields);

  // Detail view: filtered fields for selected category
  const detailFields = useMemo(() => {
    if (view !== "detail" || !detailCategory) return [];
    return fields.filter((f) => {
      if (f.metricCategory !== detailCategory) return false;
      if (detailKind === "metrics" && f.kind !== "metric") return false;
      if (detailKind === "dimensions" && f.kind !== "dimension") return false;
      if (statusFilter === "mapped" && f.status !== "Mapped") return false;
      if (statusFilter === "unmapped" && f.status !== "Unmapped") return false;
      if (sourceFilter !== "all" && f.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.displayName.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.sourceKey.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.columnName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fields, view, detailCategory, detailKind, statusFilter, sourceFilter, search]);

  const detailSources = useMemo(() => {
    if (view !== "detail" || !detailCategory) return [];
    const sources = new Set(fields.filter((f) => f.metricCategory === detailCategory).map((f) => f.source));
    return Array.from(sources).sort();
  }, [fields, view, detailCategory]);

  const openDetail = (cat: MetricCategory) => {
    setDetailCategory(cat);
    setView("detail");
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
    setDetailKind("all");
  };

  const openPlatformDetail = (platform: string) => {
    setSelectedPlatform(platform);
    setView("platform-detail");
    setSearch("");
    setStatusFilter("all");
    setDetailKind("all");
  };

  const handleEdit = (field: Field) => {
    setEditField(field);
    setIsModalOpen(true);
  };

  const handleSave = (field: Field) => {
    if (editField) {
      onFieldsChange(fields.map((f) => (f === editField ? field : f)));
    } else {
      onFieldsChange([...fields, field]);
    }
    setIsModalOpen(false);
    setEditField(null);
  };

  const goBack = () => {
    setView("overview");
    setDetailCategory(null);
    setSelectedPlatform(null);
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  // ---------- EMPTY STATE ----------
  if (!hasConnectedIntegration) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-badge)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-label)]">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-1">No metrics or dimensions yet</h3>
        <p className="text-[var(--text-muted)] text-xs text-center max-w-sm mb-4">
          Connect at least one integration to start mapping your metrics and dimensions. Your fields will populate automatically once data flows in.
        </p>
        {onNavigateToIntegrations && (
          <button
            onClick={onNavigateToIntegrations}
            className="bg-[#027b8e] hover:bg-[#025e6d] text-white rounded-[6px] flex items-center gap-1.5 px-4 h-[28px] text-[12px] font-medium transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Set Up Integrations
          </button>
        )}
      </div>
    );
  }

  // ---------- PLATFORM DETAIL VIEW ----------
  if (view === "platform-detail" && selectedPlatform) {
    return (
      <div className="flex flex-col gap-5">
        <PlatformDetailView
          platform={selectedPlatform}
          fields={fields}
          onBack={goBack}
          onEditField={handleEdit}
        />
        <FieldModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditField(null); }}
          onSave={handleSave}
          editField={editField}
          defaultKind="metric"
          fields={fields}
        />
      </div>
    );
  }

  // ---------- CATEGORY DETAIL VIEW ----------
  if (view === "detail" && detailCategory) {
    const config = METRIC_CATEGORIES[detailCategory];
    const dMetrics = detailFields.filter((f) => f.kind === "metric");
    const dDimensions = detailFields.filter((f) => f.kind === "dimension");

    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xs">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 9.5L4 6L7.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Metrics & Dimensions
            </button>
            <span className="text-[var(--text-label)] text-xs">/</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-[var(--text-primary)] text-sm font-semibold">{config.label}</span>
            </div>
          </div>
          <button
            onClick={() => { setEditField(null); setIsModalOpen(true); }}
            className="bg-[#027b8e] hover:bg-[#025e6d] text-white rounded-[6px] flex items-center gap-1.5 px-3 h-[28px] text-[12px] font-medium transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add Field
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-[6px] p-0.5">
            {(["all", "metrics", "dimensions"] as const).map((k) => (
              <button key={k} onClick={() => setDetailKind(k)} className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${detailKind === k ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                {k === "all" ? "All" : k === "metrics" ? "Metrics" : "Dimensions"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <SearchIcon />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fields..." className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] px-3 py-1.5 focus:outline-none focus:border-[#027b8e] transition-colors appearance-none">
            <option value="all">All Statuses</option>
            <option value="mapped">Mapped</option>
            <option value="unmapped">Unmapped</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] px-3 py-1.5 max-w-[180px] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none">
            <option value="all">All Sources</option>
            {detailSources.map((src) => (<option key={src} value={src}>{src}</option>))}
          </select>
        </div>

        {/* Tables */}
        {(detailKind === "all" || detailKind === "metrics") && dMetrics.length > 0 && (
          <div>
            {detailKind === "all" && <div className="flex items-center gap-2 mb-2"><span className="text-[var(--text-primary)] text-xs font-semibold">Metrics</span><span className="text-[var(--text-label)] text-[10px]">({dMetrics.length})</span></div>}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
              <FieldTableHeader />
              {dMetrics.map((field, idx) => (<NewFieldRow key={`m-${field.source}-${field.sourceKey}-${idx}`} field={field} onEdit={handleEdit} />))}
            </div>
          </div>
        )}
        {(detailKind === "all" || detailKind === "dimensions") && dDimensions.length > 0 && (
          <div>
            {detailKind === "all" && <div className="flex items-center gap-2 mb-2"><span className="text-[var(--text-primary)] text-xs font-semibold">Dimensions</span><span className="text-[var(--text-label)] text-[10px]">({dDimensions.length})</span></div>}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
              <FieldTableHeader />
              {dDimensions.map((field, idx) => (<NewFieldRow key={`d-${field.source}-${field.sourceKey}-${idx}`} field={field} onEdit={handleEdit} />))}
            </div>
          </div>
        )}
        {detailFields.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-6 py-12 text-center">
            <p className="text-[var(--text-label)] text-sm mb-1">No fields found</p>
            <p className="text-[var(--text-dim)] text-xs">{search ? `No results matching "${search}"` : `No ${detailKind === "all" ? "fields" : detailKind} in ${config.label} yet.`}</p>
          </div>
        )}
        <FieldModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditField(null); }} onSave={handleSave} editField={editField} defaultKind="metric" fields={fields} />
      </div>
    );
  }

  // ---------- FLOW VIEW ----------
  if (view === "flow") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xs">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 9.5L4 6L7.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Overview
          </button>
          <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-[6px] p-0.5 ml-3">
            <button onClick={() => setFlowKind("metric")} className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${flowKind === "metric" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Metrics Flow</button>
            <button onClick={() => setFlowKind("dimension")} className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${flowKind === "dimension" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Dimensions Flow</button>
          </div>
        </div>
        <FlowView fields={fields} kind={flowKind} />
      </div>
    );
  }

  // ---------- OVERVIEW ----------
  return (
    <div className="flex flex-col gap-4">
      {/* Top action bar */}
      <div className="flex items-center gap-3">
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
        <div className="flex-1" />
        <button
          onClick={() => setView("flow")}
          className="border border-[var(--border-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] rounded-[6px] flex items-center gap-1.5 px-3 h-[28px] text-[12px] font-medium transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3.5h2.5l1.5 2.5-1.5 2.5H1.5M7.5 3.5h3M7.5 8.5h3M6 6h4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Data Flow
        </button>
        <button
          onClick={() => { setEditField(null); setIsModalOpen(true); }}
          className="bg-[#027b8e] hover:bg-[#025e6d] text-white rounded-[6px] flex items-center gap-1.5 px-3 h-[28px] text-[12px] font-medium transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Add Field
        </button>
      </div>

      {/* Action Required section */}
      <div id="action-required-section">
        <ActionRequiredSection
          items={actionItems}
          onMapNow={(platform) => openPlatformDetail(platform)}
        />
      </div>

      {/* Category sections */}
      {categoryData.map((cat, idx) => (
        <CategorySection
          key={cat.category}
          data={cat}
          defaultExpanded={idx === 0}
          onViewAll={(platformName) => openPlatformDetail(platformName)}
          onViewCategory={() => openDetail(cat.category)}
        />
      ))}

      {/* Modals */}
      <FieldModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditField(null); }}
        onSave={handleSave}
        editField={editField}
        defaultKind="metric"
        fields={fields}
      />
    </div>
  );
}
