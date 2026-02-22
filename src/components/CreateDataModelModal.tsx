"use client";

import { useState, useMemo } from "react";
import type { Field } from "./fieldsData";
import { KPI_CATEGORIES, DIMENSION_CATEGORIES, type DataModel, type KPIWithSource, type ControlVariableWithSource, type ModelingDimension, type DimensionCategory } from "./dataModelsData";

// Suggest spend fields per tactic
const tacticSpendSuggestions: Record<string, string[]> = {
  "Meta MOF": ["fb_spend"],
  "Meta": ["fb_spend"],
  "Meta Outcome Awareness": ["fb_spend"],
  "Instagram Outcome Leads": ["fb_spend"],
  "Instagram Video": ["fb_spend"],
  "Facebook Retargeting": ["fb_spend"],
  "Google 2D": ["gads_spend"],
  "Google 3D": ["gads_spend"],
  "Google Shopping": ["gads_spend"],
  "Google 1D": ["gads_spend"],
  "TikTok Awareness": ["tt_spend"],
  "TV": [],
};

interface CreateDataModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: DataModel) => void;
  editModel: DataModel | null;
  fields: Field[];
  tactics: string[];
}

// Close icon
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// KPI source type options
const KPI_SOURCE_TYPES = ["Platform", "Google Sheets", "BigQuery", "Snowflake"] as const;

export default function CreateDataModelModal({ isOpen, onClose, onSave, editModel, fields, tactics }: CreateDataModelModalProps) {
  const isEdit = editModel !== null;

  // Derive filtered field lists from props
  const mappedMetrics = useMemo(() => fields.filter((f) => f.kind === "metric" && f.status === "Mapped"), [fields]);
  const spendMetrics = useMemo(() => fields.filter((f) => f.kind === "metric" && f.dataType === "CURRENCY" && f.status === "Mapped"), [fields]);

  const [form, setForm] = useState(() => {
    if (editModel) {
      return {
        name: editModel.name,
        description: editModel.description,
        status: editModel.status,
        kpis: editModel.kpis.map((k) => ({ ...k })),
        spendVariables: editModel.spendVariables.map((sv) => ({ ...sv, metricFields: [...sv.metricFields] })),
        controlVariables: editModel.controlVariables.map((cv) => ({ ...cv })),
        modelingDimensions: editModel.modelingDimensions.map((md) => ({ ...md })),
        granularity: editModel.granularity,
      };
    }
    return {
      name: "",
      description: "",
      status: "Draft" as "Draft" | "Active" | "Archived",
      kpis: [] as KPIWithSource[],
      spendVariables: [] as { tactic: string; metricFields: string[] }[],
      controlVariables: [] as ControlVariableWithSource[],
      modelingDimensions: [] as ModelingDimension[],
      granularity: "Weekly" as "Daily" | "Weekly" | "Monthly",
    };
  });

  // Reset form when editModel changes
  const [prevEdit, setPrevEdit] = useState<DataModel | null>(null);
  if (editModel !== prevEdit) {
    setPrevEdit(editModel);
    if (editModel) {
      setForm({
        name: editModel.name,
        description: editModel.description,
        status: editModel.status,
        kpis: editModel.kpis.map((k) => ({ ...k })),
        spendVariables: editModel.spendVariables.map((sv) => ({ ...sv, metricFields: [...sv.metricFields] })),
        controlVariables: editModel.controlVariables.map((cv) => ({ ...cv })),
        modelingDimensions: editModel.modelingDimensions.map((md) => ({ ...md })),
        granularity: editModel.granularity,
      });
    } else {
      setForm({
        name: "",
        description: "",
        status: "Draft",
        kpis: [],
        spendVariables: [],
        controlVariables: [],
        modelingDimensions: [],
        granularity: "Weekly",
      });
    }
  }

  const [customVarName, setCustomVarName] = useState("");

  // --- KPI management ---
  const addKpi = (category: (typeof KPI_CATEGORIES)[number]) => {
    setForm((prev) => ({
      ...prev,
      kpis: [...prev.kpis, { category, sourceType: "Platform" as const }],
    }));
  };

  const removeKpi = (index: number) => {
    setForm((prev) => ({
      ...prev,
      kpis: prev.kpis.filter((_, i) => i !== index),
    }));
  };

  const updateKpi = (index: number, updates: Partial<KPIWithSource>) => {
    setForm((prev) => ({
      ...prev,
      kpis: prev.kpis.map((k, i) => (i === index ? { ...k, ...updates } : k)),
    }));
  };

  // Toggle tactic
  const toggleTactic = (tactic: string) => {
    setForm((prev) => {
      const exists = prev.spendVariables.find((sv) => sv.tactic === tactic);
      if (exists) {
        return { ...prev, spendVariables: prev.spendVariables.filter((sv) => sv.tactic !== tactic) };
      }
      const suggested = tacticSpendSuggestions[tactic] || [];
      return { ...prev, spendVariables: [...prev.spendVariables, { tactic, metricFields: [...suggested] }] };
    });
  };

  // Toggle spend metric within a tactic
  const toggleSpendMetric = (tacticIndex: number, fieldName: string) => {
    setForm((prev) => {
      const updated = [...prev.spendVariables];
      const sv = { ...updated[tacticIndex], metricFields: [...updated[tacticIndex].metricFields] };
      if (sv.metricFields.includes(fieldName)) {
        sv.metricFields = sv.metricFields.filter((f) => f !== fieldName);
      } else {
        sv.metricFields.push(fieldName);
      }
      updated[tacticIndex] = sv;
      return { ...prev, spendVariables: updated };
    });
  };

  // Add custom control variable
  const addCustomVar = () => {
    if (!customVarName.trim()) return;
    setForm((prev) => ({
      ...prev,
      controlVariables: [...prev.controlVariables, { name: customVarName.trim(), type: "custom" as const }],
    }));
    setCustomVarName("");
  };

  // Toggle control variable from fields
  const toggleControlField = (fieldName: string, displayName: string) => {
    setForm((prev) => {
      const exists = prev.controlVariables.find((cv) => cv.fieldName === fieldName);
      if (exists) {
        return { ...prev, controlVariables: prev.controlVariables.filter((cv) => cv.fieldName !== fieldName) };
      }
      return { ...prev, controlVariables: [...prev.controlVariables, { name: displayName, fieldName, type: "metric" as const }] };
    });
  };

  // Remove control variable
  const removeControlVar = (index: number) => {
    setForm((prev) => ({
      ...prev,
      controlVariables: prev.controlVariables.filter((_, i) => i !== index),
    }));
  };

  // --- Dimension management ---
  const addDimension = (category: DimensionCategory) => {
    const options = DIMENSION_CATEGORIES[category];
    setForm((prev) => ({
      ...prev,
      modelingDimensions: [...prev.modelingDimensions, { category, granularity: options[0] as string }],
    }));
  };

  const removeDimension = (index: number) => {
    setForm((prev) => ({
      ...prev,
      modelingDimensions: prev.modelingDimensions.filter((_, i) => i !== index),
    }));
  };

  const updateDimensionGranularity = (index: number, granularity: string) => {
    setForm((prev) => ({
      ...prev,
      modelingDimensions: prev.modelingDimensions.map((d, i) => (i === index ? { ...d, granularity } : d)),
    }));
  };

  const canSave = form.name.trim() && form.kpis.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const now = new Date().toISOString();
    const model: DataModel = {
      id: editModel?.id || `dm-${Date.now()}`,
      name: form.name,
      description: form.description,
      status: form.status,
      kpis: form.kpis,
      spendVariables: form.spendVariables,
      controlVariables: form.controlVariables,
      modelingDimensions: form.modelingDimensions,
      granularity: form.granularity,
      usedIn: editModel?.usedIn || [],
      createdAt: editModel?.createdAt || now,
      updatedAt: now,
    };
    onSave(model);
  };

  // Metric fields for Platform source in KPI rows
  const metricFieldOptions = mappedMetrics.map((f) => ({ name: f.name, displayName: f.displayName }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-[680px] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border-primary)] flex-shrink-0">
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">{isEdit ? "Edit Data Model" : "Create Data Model"}</h2>
          <button onClick={onClose} className="text-[var(--text-label)] hover:text-[var(--text-primary)] transition-colors p-1">
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 flex flex-col gap-6 overflow-y-auto flex-1">
          {/* Section 1 - Basic Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">1</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Basic Info</h3>
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Model Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., US E-Commerce Revenue Model"
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this data model"
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
              />
            </div>

          </div>

          {/* Section 2 - KPIs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">2</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">KPIs (Target Variables)</h3>
            </div>

            <p className="text-[10px] text-[var(--text-label)] -mt-2">Select KPI categories and map each to a source. For Platform sources, pick a metric field.</p>

            {/* KPI category selector */}
            <div className="flex flex-wrap gap-1.5">
              {KPI_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => addKpi(cat)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-badge)] border border-[var(--border-secondary)] text-[var(--text-muted)] hover:border-[#6941c6] hover:text-[#a78bfa] transition-colors"
                >
                  + {cat}
                </button>
              ))}
            </div>

            {/* Selected KPIs with source mapping */}
            {form.kpis.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.kpis.map((kpi, idx) => (
                  <div key={idx} className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <span className="text-[11px] text-[#a78bfa] font-medium min-w-[90px]">{kpi.category}</span>
                    <select
                      value={kpi.sourceType}
                      onChange={(e) => updateKpi(idx, { sourceType: e.target.value as KPIWithSource["sourceType"], fieldName: undefined, tableName: undefined, columnName: undefined })}
                      className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 focus:outline-none focus:border-[#6941c6] appearance-none"
                    >
                      {KPI_SOURCE_TYPES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {kpi.sourceType === "Platform" ? (
                      <select
                        value={kpi.fieldName || ""}
                        onChange={(e) => updateKpi(idx, { fieldName: e.target.value })}
                        className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 flex-1 focus:outline-none focus:border-[#6941c6] appearance-none"
                      >
                        <option value="">Select metric field...</option>
                        {metricFieldOptions.map((f) => (
                          <option key={f.name} value={f.name}>{f.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={kpi.tableName || ""}
                          onChange={(e) => updateKpi(idx, { tableName: e.target.value })}
                          placeholder="Table"
                          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 w-24 placeholder-[#475467] focus:outline-none focus:border-[#6941c6] font-mono"
                        />
                        <input
                          type="text"
                          value={kpi.columnName || ""}
                          onChange={(e) => updateKpi(idx, { columnName: e.target.value })}
                          placeholder="Column"
                          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 w-24 placeholder-[#475467] focus:outline-none focus:border-[#6941c6] font-mono"
                        />
                      </>
                    )}
                    <button
                      onClick={() => removeKpi(idx)}
                      className="text-[var(--text-label)] hover:text-[#ff2056] transition-colors flex-shrink-0"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3 - Spend Variables */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">3</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Spend Variables</h3>
            </div>

            <p className="text-[10px] text-[var(--text-label)] -mt-2">Select tactics to include. Each tactic auto-suggests relevant spend metrics.</p>

            {/* Tactic cards */}
            <div className="grid grid-cols-2 gap-2">
              {tactics.map((tactic) => {
                const isSelected = form.spendVariables.some((sv) => sv.tactic === tactic);
                return (
                  <button
                    key={tactic}
                    onClick={() => toggleTactic(tactic)}
                    className={`px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                      isSelected
                        ? "bg-[#6941c6]/10 border-[#6941c6]/40 text-[#a78bfa]"
                        : "bg-[var(--bg-badge)] border-[var(--border-secondary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-[#6941c6] border-[#6941c6]" : "border-[var(--border-secondary)]"
                      }`}>
                        {isSelected && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6.5 2L3 5.5L1.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                      {tactic}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected tactics with metric sub-items */}
            {form.spendVariables.length > 0 && (
              <div className="border border-[var(--border-primary)] rounded-lg divide-y divide-[#1f1f21]/50">
                {form.spendVariables.map((sv, svIndex) => (
                  <div key={sv.tactic} className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] text-[#a78bfa] font-medium">{sv.tactic}</span>
                      <span className="text-[10px] text-[var(--text-label)]">{sv.metricFields.length} metrics</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {spendMetrics.map((field) => {
                        const isActive = sv.metricFields.includes(field.name);
                        return (
                          <button
                            key={field.name}
                            onClick={() => toggleSpendMetric(svIndex, field.name)}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                              isActive
                                ? "bg-[#00bc7d]/15 text-[#00bc7d] border border-[#00bc7d]/30"
                                : "bg-[var(--bg-badge)] text-[var(--text-label)] border border-[var(--border-secondary)] hover:text-[var(--text-muted)]"
                            }`}
                          >
                            {field.source}: {field.displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 - Control Variables */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">4</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Control Variables</h3>
              <span className="text-[10px] text-[var(--text-label)]">(Optional)</span>
            </div>

            {/* Selected control variables */}
            {form.controlVariables.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.controlVariables.map((cv, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cv.type === "custom"
                        ? "bg-[#fe9a00]/10 text-[#fbbf24] border border-[#fe9a00]/20"
                        : "bg-[#2b7fff]/10 text-[#60a5fa] border border-[#2b7fff]/20"
                    }`}
                  >
                    {cv.name}
                    {cv.type === "custom" && <span className="text-[9px] opacity-60">custom</span>}
                    <button onClick={() => removeControlVar(i)} className="hover:opacity-100 opacity-60 transition-opacity">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add custom variable */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customVarName}
                onChange={(e) => setCustomVarName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomVar(); }}
                placeholder="Add custom variable (e.g., Weather Index)"
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-1.5 flex-1 placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
              />
              <button
                onClick={addCustomVar}
                disabled={!customVarName.trim()}
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] disabled:opacity-40 transition-colors"
              >
                Add Custom
              </button>
            </div>

            {/* Select from mapped fields */}
            <div className="border border-[var(--border-primary)] rounded-lg max-h-[140px] overflow-y-auto">
              {mappedMetrics.slice(0, 20).map((field) => {
                const isSelected = form.controlVariables.some((cv) => cv.fieldName === field.name);
                return (
                  <label
                    key={field.name}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleControlField(field.name, field.displayName)}
                      className="w-3.5 h-3.5 rounded border-[var(--border-secondary)] bg-[var(--bg-badge)] accent-[#6941c6]"
                    />
                    <span className="text-[11px] text-[var(--text-secondary)] flex-1">{field.displayName}</span>
                    <span className="text-[10px] text-[var(--text-label)]">{field.source}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5 - Modeling Dimensions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">5</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Modeling Dimensions</h3>
            </div>

            <p className="text-[10px] text-[var(--text-label)] -mt-2">Select dimension categories and pick the granularity level for each.</p>

            {/* Dimension category buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DIMENSION_CATEGORIES) as DimensionCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => addDimension(cat)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-badge)] border border-[var(--border-secondary)] text-[var(--text-muted)] hover:border-[#6941c6] hover:text-[#a78bfa] transition-colors"
                >
                  + {cat}
                </button>
              ))}
            </div>

            {/* Selected dimensions with granularity selector */}
            {form.modelingDimensions.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.modelingDimensions.map((dim, idx) => {
                  const options = DIMENSION_CATEGORIES[dim.category];
                  return (
                    <div key={idx} className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg px-3 py-2.5 flex items-center gap-3">
                      <span className="text-[11px] text-[#a78bfa] font-medium min-w-[70px]">{dim.category}</span>
                      <select
                        value={dim.granularity}
                        onChange={(e) => updateDimensionGranularity(idx, e.target.value)}
                        className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 flex-1 focus:outline-none focus:border-[#6941c6] appearance-none"
                      >
                        {options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeDimension(idx)}
                        className="text-[var(--text-label)] hover:text-[#ff2056] transition-colors flex-shrink-0"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 6 - Granularity */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-[#6941c6]/20 flex items-center justify-center">
                <span className="text-[10px] text-[#a78bfa] font-bold">6</span>
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Time Granularity</h3>
            </div>

            <div>
              <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-lg p-0.5 w-fit">
                {(["Daily", "Weekly", "Monthly"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm((prev) => ({ ...prev, granularity: g }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      form.granularity === g ? "bg-[#6941c6] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)] flex-shrink-0">
          <button onClick={onClose} className="flex-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-[#6941c6] hover:bg-[#5b34b5] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm text-white font-medium transition-colors"
          >
            {isEdit ? "Save Changes" : "Create Model"}
          </button>
        </div>
      </div>
    </div>
  );
}
