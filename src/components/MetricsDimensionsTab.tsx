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
import { FieldTableShell, fieldKey } from "./metrics-dimensions/FieldTable";
import type { ViewMode, DetailKindFilter, StatusFilter } from "./metrics-dimensions/types";
import SetupHero from "./metrics-dimensions/SetupHero";
import CategoryHierarchySection from "./metrics-dimensions/CategoryHierarchySection";
import PlatformDetailView from "./metrics-dimensions/PlatformDetailView";
import BulkActionBar from "./metrics-dimensions/BulkActionBar";
import { ScopeFilterBar } from "./metrics-dimensions/ScopeFilterBar";
import {
  type ScopeFilter,
  scopeMatchesFilter,
  countActiveFilters,
} from "./metrics-dimensions/scopeTypes";
import {
  useMandatoryMetrics,
  useHierarchicalFieldData,
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
  // When the user clicks "+ Add field" on a specific integration's row, this
  // carries that integration name into the modal so Source is pre-filled.
  const [addFieldSource, setAddFieldSource] = useState<string>("");
  const [flowKind, setFlowKind] = useState<"metric" | "dimension">("metric");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showSamples, setShowSamples] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>({});

  // Fields restricted to the current scope filter. All downstream logic
  // (hierarchy, action items, detail lists) uses this filtered slice.
  const scopedFields = useMemo(() => {
    if (countActiveFilters(scopeFilter) === 0) return fields;
    return fields.filter((f) => scopeMatchesFilter(f.accountScope, scopeFilter));
  }, [fields, scopeFilter]);

  const { actionItems, totalActionItems } = useMandatoryMetrics(scopedFields);
  const hierarchyData = useHierarchicalFieldData(scopedFields);

  // Detail view: filtered fields for selected category (respects scope filter)
  const detailFields = useMemo(() => {
    if (view !== "detail" || !detailCategory) return [];
    return scopedFields.filter((f) => {
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
  }, [scopedFields, view, detailCategory, detailKind, statusFilter, sourceFilter, search]);

  const detailSources = useMemo(() => {
    if (view !== "detail" || !detailCategory) return [];
    const sources = new Set(scopedFields.filter((f) => f.metricCategory === detailCategory).map((f) => f.source));
    return Array.from(sources).sort();
  }, [scopedFields, view, detailCategory]);

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
    setAddFieldSource("");
    setIsModalOpen(true);
  };

  const handleAddField = (integrationName?: string) => {
    setEditField(null);
    setAddFieldSource(integrationName ?? "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditField(null);
    setAddFieldSource("");
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
          fields={scopedFields}
          onBack={goBack}
          onEditField={handleEdit}
          onFieldsChange={onFieldsChange}
        />
        <FieldModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          editField={editField}
          defaultKind="metric"
          fields={fields}
          defaultSource={addFieldSource}
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
              Data Transformation
            </button>
            <span className="text-[var(--text-label)] text-xs">/</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-[var(--text-primary)] text-sm font-semibold">{config.label}</span>
            </div>
          </div>
          <button
            onClick={() => handleAddField()}
            className="bg-[#027b8e] hover:bg-[#025e6d] text-white rounded-[6px] flex items-center gap-1.5 px-3 h-[28px] text-[12px] font-medium transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add Field
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-[6px] p-0.5">
            {(["all", "metrics", "dimensions"] as const).map((k) => (
              <button key={k} onClick={() => setDetailKind(k)} className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${detailKind === k ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
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

        {/* Scope filter — respects workspace-level tagging */}
        <ScopeFilterBar fields={fields} filter={scopeFilter} onChange={setScopeFilter} compact />

        {/* Tables */}
        {(detailKind === "all" || detailKind === "metrics") && dMetrics.length > 0 && (
          <div>
            {detailKind === "all" && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--text-primary)] text-xs font-semibold uppercase tracking-wider">Metrics</span>
                <span className="text-[var(--text-dim)] text-xs">({dMetrics.length})</span>
              </div>
            )}
            <FieldTableShell
              fields={dMetrics}
              allFields={fields}
              selected={selectedKeys}
              onSelectionChange={setSelectedKeys}
              onEdit={handleEdit}
              showSamples={showSamples}
            />
          </div>
        )}
        {(detailKind === "all" || detailKind === "dimensions") && dDimensions.length > 0 && (
          <div>
            {detailKind === "all" && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--text-primary)] text-xs font-semibold uppercase tracking-wider">Dimensions</span>
                <span className="text-[var(--text-dim)] text-xs">({dDimensions.length})</span>
              </div>
            )}
            <FieldTableShell
              fields={dDimensions}
              allFields={fields}
              selected={selectedKeys}
              onSelectionChange={setSelectedKeys}
              onEdit={handleEdit}
              showSamples={showSamples}
            />
          </div>
        )}
        {detailFields.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-6 py-12 text-center">
            <p className="text-[var(--text-label)] text-sm mb-1">No fields found</p>
            <p className="text-[var(--text-dim)] text-xs">{search ? `No results matching "${search}"` : `No ${detailKind === "all" ? "fields" : detailKind} in ${config.label} yet.`}</p>
          </div>
        )}
        <FieldModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} editField={editField} defaultKind="metric" fields={fields} defaultSource={addFieldSource} />

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
  const handleMapColumnAsDate = (integration: string, dataSource: string, columnName: string) => {
    onFieldsChange(
      fields.map((f) => {
        if (f.columnName !== columnName && f.name !== columnName) return f;
        return {
          ...f,
          kind: "dimension",
          status: "Mapped",
          dataType: f.dataType === "DATE" ? f.dataType : "DATE",
        };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Setup Hero — replaces the old Action Required section */}
      <SetupHero
        fields={scopedFields}
        items={actionItems}
        onMapNow={(integration) => openPlatformDetail(integration)}
        onMapColumnAsDate={handleMapColumnAsDate}
        onAddField={() => handleAddField()}
      />

      {/* Scope filter + search */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] text-xs text-[var(--text-secondary)] placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
        </div>
        <ScopeFilterBar fields={fields} filter={scopeFilter} onChange={setScopeFilter} />
      </div>

      {/* Category hierarchy sections */}
      {hierarchyData.map((cat, idx) => (
        <CategoryHierarchySection
          key={cat.category}
          data={cat}
          defaultExpanded={idx === 0}
          onViewDataSource={(integrationName) => openPlatformDetail(integrationName)}
          onViewCategory={() => openDetail(cat.category)}
          onConnectSource={onNavigateToIntegrations}
          scopeFilter={scopeFilter}
          onToggleScopeFilter={(dim, val) => {
            const next = { ...scopeFilter };
            const cur = new Set(next[dim] ?? []);
            if (cur.has(val)) cur.delete(val);
            else cur.add(val);
            if (cur.size === 0) delete next[dim];
            else next[dim] = cur;
            setScopeFilter(next);
          }}
          onAddField={handleAddField}
        />
      ))}

      {/* Modals */}
      <FieldModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editField={editField}
        defaultKind="metric"
        fields={fields}
        defaultSource={addFieldSource}
      />
    </div>
  );
}
