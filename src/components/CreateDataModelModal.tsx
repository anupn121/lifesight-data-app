"use client";

import { useState, useMemo, useCallback } from "react";
import type { Field } from "./fieldsData";
import {
  DIMENSION_CATEGORIES,
  type DataModel,
  type KPIWithSource,
  type ControlVariableWithSource,
  type ModelingDimension,
  type DimensionCategory,
  type KPICategory,
} from "./dataModelsData";

// ─── Source Configuration ───────────────────────────────────────────────────

interface SourceConfig {
  id: string;
  name: string;
  color: string;
  abbr: string;
  spendField: string | null;
  impressionField: string | null;
  clickField: string | null;
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  meta: { id: "meta", name: "Meta", color: "#1877F2", abbr: "Fb", spendField: "fb_spend", impressionField: "fb_impressions", clickField: "fb_clicks" },
  google: { id: "google", name: "Google", color: "#34A853", abbr: "G", spendField: "gads_spend", impressionField: "gads_impressions", clickField: "gads_clicks" },
  tiktok: { id: "tiktok", name: "TikTok", color: "#EE1D52", abbr: "Tt", spendField: "tt_spend", impressionField: "tt_impressions", clickField: "tt_clicks" },
  snapchat: { id: "snapchat", name: "Snapchat", color: "#FFFC00", abbr: "Sc", spendField: "snap_spend", impressionField: "snap_impressions", clickField: "snap_clicks" },
  pinterest: { id: "pinterest", name: "Pinterest", color: "#E60023", abbr: "Pi", spendField: "pin_spend", impressionField: "pin_impressions", clickField: "pin_clicks" },
  linkedin: { id: "linkedin", name: "LinkedIn", color: "#0A66C2", abbr: "Li", spendField: "li_spend", impressionField: "li_impressions", clickField: "li_clicks" },
  x: { id: "x", name: "X", color: "#1DA1F2", abbr: "X", spendField: "x_spend", impressionField: "x_impressions", clickField: "x_clicks" },
  stackadapt: { id: "stackadapt", name: "StackAdapt", color: "#4A3AFF", abbr: "SA", spendField: "stackadapt_spend", impressionField: "stackadapt_impressions", clickField: null },
  tv: { id: "tv", name: "TV", color: "#6B7280", abbr: "TV", spendField: null, impressionField: null, clickField: null },
  other: { id: "other", name: "Other", color: "#9CA3AF", abbr: "?", spendField: null, impressionField: null, clickField: null },
};

// Sample metadata for tactics — Campaign Name pattern & Objective
const TACTIC_METADATA: Record<string, { campaign: string; objective: string }> = {
  "Meta MOF": { campaign: "Brand Awareness Q1", objective: "Awareness · Reach" },
  "Meta": { campaign: "Conversions – CBO", objective: "Conversions · CBO" },
  "Instagram Outcome Leads": { campaign: "IG Lead Gen", objective: "Lead Generation" },
  "Meta Outcome Awareness": { campaign: "Brand Lift Study", objective: "Awareness · Brand Lift" },
  "Instagram Video": { campaign: "IG Reels Promo", objective: "Awareness · Video Views" },
  "Facebook Retargeting": { campaign: "FB Retarget – WV", objective: "Retargeting · Website Visitors" },
  "Google 2D": { campaign: "Brand Search", objective: "Search · Brand" },
  "Google 3D": { campaign: "Non-Brand Search", objective: "Search · Non-Brand" },
  "Google Shopping": { campaign: "Shopping Standard", objective: "Shopping · Standard" },
  "Google 1D": { campaign: "DSA Campaigns", objective: "Search · DSA" },
  "TikTok Awareness": { campaign: "TikTok Spark Ads", objective: "Awareness · Spark" },
};

function getSourceIdForTactic(tactic: string): string {
  const t = tactic.toLowerCase();
  if (/^meta|^instagram|^facebook/.test(t)) return "meta";
  if (/^google/.test(t)) return "google";
  if (/^tiktok/.test(t)) return "tiktok";
  if (/^snap/.test(t)) return "snapchat";
  if (/^pinterest/.test(t)) return "pinterest";
  if (/^linkedin/.test(t)) return "linkedin";
  if (/^x /.test(t) || /^twitter/.test(t)) return "x";
  if (/^stackadapt/.test(t)) return "stackadapt";
  if (/^tv$/.test(t)) return "tv";
  return "other";
}

// ─── Shared Icons ───────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M8 3L4 7L2 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionDot = ({ color }: { color: string }) => (
  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
);

// ─── Props ──────────────────────────────────────────────────────────────────

interface CreateDataModelWizardProps {
  onSave: (model: DataModel) => void;
  onBack: () => void;
  editModel: DataModel | null;
  fields: Field[];
  tactics: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Single-page builder
// ═══════════════════════════════════════════════════════════════════════════

type TemplateChoice = "campaign_ad_level" | "aggregated" | "scratch" | null;

const TEMPLATE_CONFIGS: Record<"campaign_ad_level" | "aggregated", {
  label: string;
  description: string;
  color: string;
  granularity: "Daily" | "Weekly" | "Monthly";
  dimensions: ModelingDimension[];
  namePrefix: string;
}> = {
  campaign_ad_level: {
    label: "Campaign Ad Level Data",
    description: "Daily granularity with campaign-level dimensions. Best for detailed attribution analysis and per-platform spend/impression/click metrics.",
    color: "#2b7fff",
    granularity: "Daily",
    dimensions: [
      { category: "Date", granularity: "Daily" },
      { category: "Channel", granularity: "Campaign" },
      { category: "Geo", granularity: "Country" },
    ],
    namePrefix: "Campaign Level",
  },
  aggregated: {
    label: "Aggregated Data",
    description: "Weekly or monthly granularity with geo and channel dimensions. Best for media mix modeling with aggregated KPI metrics.",
    color: "#00bc7d",
    granularity: "Weekly",
    dimensions: [
      { category: "Date", granularity: "Weekly" },
      { category: "Channel", granularity: "Tactic" },
      { category: "Geo", granularity: "State/Region" },
    ],
    namePrefix: "Aggregated",
  },
};

export default function CreateDataModelWizard({ onSave, onBack, editModel, fields, tactics }: CreateDataModelWizardProps) {
  const isEdit = editModel !== null;
  const [templateChoice, setTemplateChoice] = useState<TemplateChoice>("scratch");

  // ── Derived data ──────────────────────────────────────────────────────────

  const tacticsBySource = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const tactic of tactics) {
      const sourceId = getSourceIdForTactic(tactic);
      if (!grouped[sourceId]) grouped[sourceId] = [];
      grouped[sourceId].push(tactic);
    }
    return grouped;
  }, [tactics]);

  const availableSources = useMemo(
    () => Object.keys(tacticsBySource).filter((id) => SOURCE_CONFIGS[id]),
    [tacticsBySource],
  );

  // File-uploaded paid marketing fields grouped by platform (sourceKey starts with "uploaded.")
  const filePaidSources = useMemo(() => {
    const grouped: Record<string, { sourceId: string; name: string; color: string; abbr: string; fields: { name: string; displayName: string; metricType?: string }[] }> = {};
    for (const f of fields) {
      if (f.metricCategory !== "paid_marketing" || f.status !== "Mapped" || f.kind !== "metric") continue;
      if (!f.sourceKey?.startsWith("uploaded.")) continue;
      // Find matching SOURCE_CONFIGS entry by source name
      const sourceId = Object.keys(SOURCE_CONFIGS).find(
        (id) => SOURCE_CONFIGS[id].name.toLowerCase() === f.source.toLowerCase()
      );
      if (!sourceId || !SOURCE_CONFIGS[sourceId]) continue;
      const cfg = SOURCE_CONFIGS[sourceId];
      if (!grouped[sourceId]) grouped[sourceId] = { sourceId, name: cfg.name, color: cfg.color, abbr: cfg.abbr, fields: [] };
      grouped[sourceId].fields.push({ name: f.name, displayName: f.displayName, metricType: f.paidMarketingMetricType });
    }
    return Object.values(grouped);
  }, [fields]);

  const organicFields = useMemo(() => {
    const grouped: Record<string, { source: string; color: string; fields: { name: string; displayName: string }[] }> = {};
    for (const f of fields) {
      if (f.kind !== "metric" || f.status !== "Mapped") continue;
      if (/hubspot|klaviyo|activecampaign|mailchimp|brevo/i.test(f.source)) {
        if (!grouped[f.source]) grouped[f.source] = { source: f.source, color: f.sourceColor, fields: [] };
        grouped[f.source].fields.push({ name: f.name, displayName: f.displayName });
      }
    }
    return Object.values(grouped);
  }, [fields]);

  const contextualFields = useMemo(() => {
    const grouped: Record<string, { source: string; color: string; fields: { name: string; displayName: string }[] }> = {};
    for (const f of fields) {
      if (f.kind !== "metric" || f.status !== "Mapped") continue;
      if (/ga4|google analytics|mixpanel|amplitude/i.test(f.source)) {
        if (!grouped[f.source]) grouped[f.source] = { source: f.source, color: f.sourceColor, fields: [] };
        grouped[f.source].fields.push({ name: f.name, displayName: f.displayName });
      }
    }
    return Object.values(grouped);
  }, [fields]);

  // KPI fields — only fields mapped with metricCategory === "kpi", grouped by kpiSubtype
  const kpiFields = useMemo(() => {
    const kpiList = fields.filter((f) => f.kind === "metric" && f.status === "Mapped" && f.metricCategory === "kpi");
    const grouped: Record<string, { name: string; displayName: string; source: string; sourceColor: string; kpiSubtype: string }[]> = {};
    for (const f of kpiList) {
      const sub = f.kpiSubtype || "Other";
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push({ name: f.name, displayName: f.displayName, source: f.source, sourceColor: f.sourceColor, kpiSubtype: sub });
    }
    return { list: kpiList, grouped };
  }, [fields]);

  // ── Form state ────────────────────────────────────────────────────────────

  const [name, setName] = useState(editModel?.name ?? "");
  const [description, setDescription] = useState(editModel?.description ?? "");

  // KPI — selected by field name directly
  const [selectedKpiField, setSelectedKpiField] = useState<string | null>(editModel?.kpis[0]?.fieldName ?? null);

  // Sources & Tactics — toggle between source-level and tactic-level granularity
  const [sourceViewMode, setSourceViewMode] = useState<"sources" | "tactics">("sources");
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedTactics, setSelectedTactics] = useState<Set<string>>(() => {
    if (!editModel) return new Set<string>();
    return new Set(editModel.spendVariables.map((sv) => sv.tactic));
  });
  const [sourceMetrics, setSourceMetrics] = useState<Record<string, { impressions: boolean; clicks: boolean }>>(() => {
    if (!editModel) return {};
    const result: Record<string, { impressions: boolean; clicks: boolean }> = {};
    for (const sv of editModel.spendVariables) {
      const srcId = getSourceIdForTactic(sv.tactic);
      const cfg = SOURCE_CONFIGS[srcId];
      if (!cfg || result[srcId]) continue;
      result[srcId] = {
        impressions: !!(cfg.impressionField && sv.metricFields.includes(cfg.impressionField)),
        clicks: !!(cfg.clickField && sv.metricFields.includes(cfg.clickField)),
      };
    }
    return result;
  });

  // File-sourced paid marketing field toggles (field name → included)
  const [selectedFileFields, setSelectedFileFields] = useState<Set<string>>(new Set());
  const toggleFileField = useCallback((fieldName: string) => {
    setSelectedFileFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName);
      else next.add(fieldName);
      return next;
    });
  }, []);
  const toggleAllFileFieldsForSource = useCallback((sourceId: string) => {
    const group = filePaidSources.find((g) => g.sourceId === sourceId);
    if (!group) return;
    setSelectedFileFields((prev) => {
      const next = new Set(prev);
      const allSelected = group.fields.every((f) => next.has(f.name));
      if (allSelected) group.fields.forEach((f) => next.delete(f.name));
      else group.fields.forEach((f) => next.add(f.name));
      return next;
    });
  }, [filePaidSources]);

  // Organic & Contextual
  const [selectedControlFields, setSelectedControlFields] = useState<Set<string>>(() => {
    if (!editModel) return new Set<string>();
    return new Set(
      editModel.controlVariables
        .filter((cv) => cv.type === "metric" && cv.fieldName)
        .map((cv) => cv.fieldName as string),
    );
  });
  const [customVars, setCustomVars] = useState<string[]>(() => {
    if (!editModel) return [];
    return editModel.controlVariables.filter((cv) => cv.type === "custom").map((cv) => cv.name);
  });
  const [customVarInput, setCustomVarInput] = useState("");

  // Dimensions & Granularity
  const [modelingDimensions, setModelingDimensions] = useState<ModelingDimension[]>(
    editModel?.modelingDimensions.map((d) => ({ ...d })) ?? [],
  );
  const [granularity, setGranularity] = useState<"Daily" | "Weekly" | "Monthly">(editModel?.granularity ?? "Weekly");

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleTactic = useCallback((tactic: string) => {
    setSelectedTactics((prev) => {
      const next = new Set(prev);
      if (next.has(tactic)) next.delete(tactic); else next.add(tactic);
      return next;
    });
  }, []);

  const toggleAllTacticsForSource = useCallback((sourceId: string) => {
    const sourceTactics = tacticsBySource[sourceId] || [];
    setSelectedTactics((prev) => {
      const next = new Set(prev);
      const allSelected = sourceTactics.every((t) => next.has(t));
      if (allSelected) sourceTactics.forEach((t) => next.delete(t));
      else sourceTactics.forEach((t) => next.add(t));
      return next;
    });
  }, [tacticsBySource]);

  const toggleSource = useCallback((sourceId: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
        // Also deselect all tactics for this source
        const sourceTactics = tacticsBySource[sourceId] || [];
        setSelectedTactics((pt) => {
          const nt = new Set(pt);
          sourceTactics.forEach((t) => nt.delete(t));
          return nt;
        });
      } else {
        next.add(sourceId);
        // Also select all tactics for this source
        const sourceTactics = tacticsBySource[sourceId] || [];
        setSelectedTactics((pt) => {
          const nt = new Set(pt);
          sourceTactics.forEach((t) => nt.add(t));
          return nt;
        });
      }
      return next;
    });
  }, [tacticsBySource]);

  // Switching modes — sync selectedSources ↔ selectedTactics
  const handleSwitchViewMode = useCallback((mode: "sources" | "tactics") => {
    if (mode === "sources") {
      // Derive selected sources from selected tactics
      const sources = new Set<string>();
      Array.from(selectedTactics).forEach((tactic) => {
        sources.add(getSourceIdForTactic(tactic));
      });
      setSelectedSources(sources);
    } else {
      // Derive selected tactics from selected sources (select all for each)
      const tactics = new Set(Array.from(selectedTactics));
      Array.from(selectedSources).forEach((sourceId) => {
        const sourceTactics = tacticsBySource[sourceId] || [];
        sourceTactics.forEach((t) => tactics.add(t));
      });
      setSelectedTactics(tactics);
    }
    setSourceViewMode(mode);
  }, [selectedTactics, selectedSources, tacticsBySource]);

  const toggleSourceMetric = useCallback((sourceId: string, metric: "impressions" | "clicks") => {
    setSourceMetrics((prev) => ({
      ...prev,
      [sourceId]: {
        impressions: prev[sourceId]?.impressions ?? false,
        clicks: prev[sourceId]?.clicks ?? false,
        [metric]: !(prev[sourceId]?.[metric] ?? false),
      },
    }));
  }, []);

  const toggleControlField = useCallback((fieldName: string) => {
    setSelectedControlFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName); else next.add(fieldName);
      return next;
    });
  }, []);

  const addCustomVar = useCallback(() => {
    const val = customVarInput.trim();
    if (!val || customVars.includes(val)) return;
    setCustomVars((prev) => [...prev, val]);
    setCustomVarInput("");
  }, [customVarInput, customVars]);

  const removeCustomVar = useCallback((index: number) => {
    setCustomVars((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addDimension = useCallback((category: DimensionCategory) => {
    const options = DIMENSION_CATEGORIES[category];
    setModelingDimensions((prev) => [...prev, { category, granularity: options[0] as string }]);
  }, []);

  const removeDimension = useCallback((index: number) => {
    setModelingDimensions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateDimensionGranularity = useCallback((index: number, value: string) => {
    setModelingDimensions((prev) => prev.map((d, i) => (i === index ? { ...d, granularity: value } : d)));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const canSave = name.trim().length > 0 && selectedKpiField !== null;

  const handleSave = useCallback(() => {
    if (!canSave || !selectedKpiField) return;
    const now = new Date().toISOString();

    // Look up the selected KPI field to derive the category
    const kpiField = fields.find((f) => f.name === selectedKpiField);
    const kpiCategory: KPICategory = (kpiField?.kpiSubtype as KPICategory) || "Revenue";

    const kpis: KPIWithSource[] = [{
      category: kpiCategory,
      sourceType: "Platform",
      fieldName: selectedKpiField,
    }];

    const spendVariables: { tactic: string; metricFields: string[] }[] = [];
    Array.from(selectedTactics).forEach((tactic) => {
      const srcId = getSourceIdForTactic(tactic);
      const cfg = SOURCE_CONFIGS[srcId];
      const metricFields: string[] = [];
      if (cfg?.spendField) metricFields.push(cfg.spendField);
      if (cfg?.impressionField && sourceMetrics[srcId]?.impressions) metricFields.push(cfg.impressionField);
      if (cfg?.clickField && sourceMetrics[srcId]?.clicks) metricFields.push(cfg.clickField);
      spendVariables.push({ tactic, metricFields });
    });
    // Include file-uploaded paid marketing fields as spend variables
    for (const group of filePaidSources) {
      const selectedFields = group.fields.filter((f) => selectedFileFields.has(f.name));
      if (selectedFields.length > 0) {
        spendVariables.push({ tactic: group.name, metricFields: selectedFields.map((f) => f.name) });
      }
    }

    const controlVariables: ControlVariableWithSource[] = [];
    Array.from(selectedControlFields).forEach((fieldName) => {
      const field = fields.find((f) => f.name === fieldName);
      if (field) controlVariables.push({ name: field.displayName, fieldName, type: "metric" });
    });
    for (const cv of customVars) controlVariables.push({ name: cv, type: "custom" });

    onSave({
      id: editModel?.id || `dm-${Date.now()}`,
      name: name.trim(),
      description,
      status: editModel?.status || "Draft",
      kpis,
      spendVariables,
      controlVariables,
      modelingDimensions,
      granularity,
      usedIn: editModel?.usedIn || [],
      createdAt: editModel?.createdAt || now,
      updatedAt: now,
    });
  }, [canSave, selectedKpiField, selectedTactics, sourceMetrics, selectedControlFields, customVars, fields, name, description, modelingDimensions, granularity, editModel, onSave]);

  // ── Template handling ─────────────────────────────────────────────────────

  const handleSelectTemplate = useCallback((choice: "campaign_ad_level" | "aggregated" | "scratch") => {
    setTemplateChoice(choice);
    if (choice !== "scratch") {
      const config = TEMPLATE_CONFIGS[choice];
      setGranularity(config.granularity);
      setModelingDimensions(config.dimensions.map((d) => ({ ...d })));
      if (!name.trim()) setName(`${config.namePrefix} Model`);
    }
  }, [name]);

  // ── Derived counts ────────────────────────────────────────────────────────

  const tacticCount = selectedTactics.size + selectedFileFields.size;
  const controlCount = selectedControlFields.size + customVars.length;
  const addedDimCategories = new Set(modelingDimensions.map((d) => d.category));

  // ═════════════════════════════════════════════════════════════════════════
  // TEMPLATE SELECTION SCREEN
  // ═════════════════════════════════════════════════════════════════════════

  if (templateChoice === null) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1.5 text-sm">
            <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
              Data Models
            </button>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
              <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-primary)] font-medium">New Data Model</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto py-8">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2 text-center">Choose a Template</h2>
          <p className="text-[var(--text-muted)] text-sm mb-8 text-center">
            Start with a pre-configured template or build from scratch.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {(["campaign_ad_level", "aggregated"] as const).map((key) => {
              const tpl = TEMPLATE_CONFIGS[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className="text-left p-5 rounded-xl border-[1.5px] border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] transition-all group"
                >
                  <div className="h-[3px] w-12 rounded-full mb-4" style={{ background: tpl.color }} />
                  <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-2">{tpl.label}</h3>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-4">{tpl.description}</p>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Pre-configured</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: `${tpl.color}15`, color: tpl.color }}>
                        {tpl.granularity}
                      </span>
                      {tpl.dimensions.map((d) => (
                        <span key={d.category} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-badge)] text-[var(--text-secondary)]">
                          {d.category}: {d.granularity}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => handleSelectTemplate("scratch")}
              className="text-[#027b8e] text-sm hover:underline transition-colors"
            >
              Start from Scratch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER — Builder form
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Breadcrumb Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5 text-sm">
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Data Models
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[var(--text-primary)] font-medium">{isEdit ? "Edit Model" : "Create Model"}</span>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-4 h-[28px] rounded-[6px] text-[12px] font-medium text-[var(--text-muted)] border border-[var(--border-primary)] hover:bg-[var(--hover-item)] hover:border-[var(--border-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 h-[28px] rounded-[6px] text-[12px] font-medium bg-[#027b8e] hover:bg-[#025e6d] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? "Save Changes" : "Create Model"}
          </button>
        </div>
      </div>

      {/* ── Body — single scrollable page ──────────────────────────────── */}
      <div className="flex flex-col gap-4 flex-1 pb-6">

        {/* ── Name & Description ───────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-[var(--text-label)] mb-1 block uppercase tracking-wider font-semibold">Data Model Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., US E-Commerce Revenue Model"
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2 w-full placeholder-[var(--text-dim)] focus:outline-none focus:border-[#027b8e] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-[var(--text-label)] mb-1 block uppercase tracking-wider font-semibold">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this data model"
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[var(--text-dim)] focus:outline-none focus:border-[#027b8e] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── KPI Selection ────────────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
            <SectionDot color="#00bc7d" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">KPI</h3>
            <span className="text-[10px] text-[var(--text-dim)]">Select the target metric for your model</span>
            {selectedKpiField && (() => {
              const f = kpiFields.list.find((k) => k.name === selectedKpiField);
              return f ? (
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00bc7d]/10 text-[#00bc7d] border border-[#00bc7d]/20">{f.source}: {f.displayName}</span>
              ) : null;
            })()}
          </div>
          <div className="p-3">
            {kpiFields.list.length === 0 ? (
              <p className="text-[11px] text-[var(--text-dim)] py-2 text-center">No KPI fields mapped yet. Map fields as KPI in Metrics & Dimensions first.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(kpiFields.grouped).map(([subtype, groupFields]) => (
                  <div key={subtype}>
                    <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold mb-1.5 block">{subtype}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {groupFields.map((f) => {
                        const isSelected = selectedKpiField === f.name;
                        return (
                          <button
                            key={f.name}
                            onClick={() => setSelectedKpiField(isSelected ? null : f.name)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                              isSelected
                                ? "bg-[#00bc7d]/10 border-[#00bc7d]/30 text-[#00bc7d]"
                                : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M8 3L4 7L2 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.sourceColor }} />
                            <span className="text-[var(--text-dim)] text-[10px]">{f.source}</span>
                            {f.displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sources & Tactics ─────────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
            <SectionDot color="#2b7fff" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sources & Tactics</h3>
            {/* Segmented toggle */}
            <div className="flex items-center bg-[var(--bg-primary)] rounded-[6px] border border-[var(--border-primary)] p-0.5 ml-2">
              {(["sources", "tactics"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSwitchViewMode(mode)}
                  className={`px-2.5 py-1 rounded-[4px] text-[10px] font-semibold transition-all ${
                    sourceViewMode === mode
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                  }`}
                >
                  {mode === "sources" ? "Sources" : "Tactics"}
                </button>
              ))}
            </div>
            {tacticCount > 0 && (
              <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00bc7d]/10 text-[#00bc7d] border border-[#00bc7d]/20">
                {tacticCount} selected
              </span>
            )}
          </div>
          <div className="divide-y divide-[var(--border-primary)]">
            {/* ── Sources mode: source-level rows ──────────────────────── */}
            {sourceViewMode === "sources" && availableSources.map((sourceId) => {
              const cfg = SOURCE_CONFIGS[sourceId];
              if (!cfg) return null;
              const isSelected = selectedSources.has(sourceId);
              const hasMetrics = cfg.impressionField || cfg.clickField;
              return (
                <div key={sourceId} className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => toggleSource(sourceId)} className="flex items-center gap-2.5 flex-1 group">
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "" : ""
                        }`}
                        style={{
                          borderColor: isSelected ? cfg.color : "var(--border-secondary)",
                          backgroundColor: isSelected ? cfg.color : "transparent",
                        }}
                      >
                        {isSelected && <CheckIcon />}
                      </div>
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${cfg.color}20` }}>
                        <span className="text-[8px] font-bold" style={{ color: cfg.color }}>{cfg.abbr}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[#027b8e] transition-colors">{cfg.name}</span>
                      <span className="text-[9px] text-[var(--text-dim)]">{(tacticsBySource[sourceId] || []).length} tactics</span>
                    </button>
                  </div>
                  {/* Metric toggles inline */}
                  {hasMetrics && isSelected && (
                    <div className="flex items-center gap-2 mt-2 ml-8">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#00bc7d]/10 text-[#00bc7d]">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6.5 2.5L3.25 5.75L1.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Spend
                      </span>
                      {cfg.impressionField && (
                        <button
                          onClick={() => toggleSourceMetric(sourceId, "impressions")}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            sourceMetrics[sourceId]?.impressions
                              ? "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20"
                              : "text-[var(--text-dim)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                          }`}
                        >
                          Impressions
                        </button>
                      )}
                      {cfg.clickField && (
                        <button
                          onClick={() => toggleSourceMetric(sourceId, "clicks")}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            sourceMetrics[sourceId]?.clicks
                              ? "bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/20"
                              : "text-[var(--text-dim)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                          }`}
                        >
                          Clicks
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Tactics mode: tactic-level detail per source ─────────── */}
            {sourceViewMode === "tactics" && availableSources.map((sourceId) => {
              const cfg = SOURCE_CONFIGS[sourceId];
              if (!cfg) return null;
              const sourceTactics = tacticsBySource[sourceId] || [];
              if (sourceTactics.length === 0) {
                // No tactics — show source as single selectable item
                const isSelected = selectedSources.has(sourceId);
                return (
                  <div key={sourceId} className="px-4 py-3">
                    <button onClick={() => toggleSource(sourceId)} className="flex items-center gap-2.5 group">
                      <div className={`w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0`}
                        style={{ borderColor: isSelected ? cfg.color : "var(--border-secondary)", backgroundColor: isSelected ? cfg.color : "transparent" }}>
                        {isSelected && <CheckIcon />}
                      </div>
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20` }}>
                        <span className="text-[8px] font-bold" style={{ color: cfg.color }}>{cfg.abbr}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)]">{cfg.name}</span>
                      <span className="text-[9px] text-[var(--text-dim)] italic">No tactics defined</span>
                    </button>
                  </div>
                );
              }
              const selectedCount = sourceTactics.filter((t) => selectedTactics.has(t)).length;
              const allSelected = selectedCount === sourceTactics.length;
              const hasMetrics = cfg.impressionField || cfg.clickField;
              return (
                <div key={sourceId} className="px-4 py-3">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <button onClick={() => toggleAllTacticsForSource(sourceId)} className="flex items-center gap-2.5 group">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${allSelected ? "ring-1 ring-offset-1 ring-offset-[var(--bg-card)]" : ""}`} style={{ backgroundColor: `${cfg.color}20`, ...(allSelected ? { ringColor: cfg.color } : {}) }}>
                        <span className="text-[8px] font-bold" style={{ color: cfg.color }}>{cfg.abbr}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[#027b8e] transition-colors">{cfg.name}</span>
                    </button>
                    {selectedCount > 0 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cfg.color}12`, color: cfg.color }}>{selectedCount}/{sourceTactics.length}</span>
                    )}
                    <button onClick={() => toggleAllTacticsForSource(sourceId)} className="ml-auto text-[10px] font-medium text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                      {allSelected ? "Clear" : "All"}
                    </button>
                  </div>
                  {/* Tactic rows with metadata */}
                  <div className="flex flex-col gap-1">
                    {sourceTactics.map((tactic) => {
                      const isSelected = selectedTactics.has(tactic);
                      const meta = TACTIC_METADATA[tactic];
                      return (
                        <button
                          key={tactic}
                          onClick={() => toggleTactic(tactic)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all ${
                            isSelected
                              ? "border-[#027b8e]/30 bg-[#027b8e]/8"
                              : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"
                          }`}>
                            {isSelected && <CheckIcon />}
                          </div>
                          <span className={`text-[11px] font-medium ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{tactic}</span>
                          {meta && (
                            <span className="ml-auto flex items-center gap-2">
                              <span className="text-[9px] text-[var(--text-dim)] bg-[var(--bg-badge)] px-1.5 py-0.5 rounded">{meta.campaign}</span>
                              <span className="text-[9px] text-[var(--text-dim)]">{meta.objective}</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Metric toggles */}
                  {hasMetrics && selectedCount > 0 && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-dashed border-[var(--border-primary)]">
                      <span className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">Include</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#00bc7d]/10 text-[#00bc7d]">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6.5 2.5L3.25 5.75L1.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Spend
                      </span>
                      {cfg.impressionField && (
                        <button onClick={() => toggleSourceMetric(sourceId, "impressions")}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            sourceMetrics[sourceId]?.impressions ? "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20" : "text-[var(--text-dim)] border-[var(--border-primary)]"
                          }`}>Impressions</button>
                      )}
                      {cfg.clickField && (
                        <button onClick={() => toggleSourceMetric(sourceId, "clicks")}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            sourceMetrics[sourceId]?.clicks ? "bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/20" : "text-[var(--text-dim)] border-[var(--border-primary)]"
                          }`}>Clicks</button>
                      )}
                      {sourceMetrics[sourceId]?.impressions && sourceMetrics[sourceId]?.clicks && (
                        <span className="text-[9px] text-[#fe9a00] bg-[#fe9a00]/8 px-1.5 py-0.5 rounded font-medium">CTR auto</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* File-uploaded paid marketing sources (shown in both modes) */}
            {filePaidSources.map((group) => {
              const selectedCount = group.fields.filter((f) => selectedFileFields.has(f.name)).length;
              const allSelected = selectedCount === group.fields.length && selectedCount > 0;
              return (
                <div key={`file-${group.sourceId}`} className="px-4 py-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <button onClick={() => toggleAllFileFieldsForSource(group.sourceId)} className="flex items-center gap-2.5 group">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${allSelected ? "ring-1 ring-offset-1 ring-offset-[var(--bg-card)]" : ""}`} style={{ backgroundColor: `${group.color}20` }}>
                        <span className="text-[8px] font-bold" style={{ color: group.color }}>{group.abbr}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[#027b8e] transition-colors">{group.name}</span>
                    </button>
                    <span className="text-[9px] text-[var(--text-dim)] bg-[var(--bg-badge)] px-1.5 py-0.5 rounded font-medium">File</span>
                    {selectedCount > 0 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${group.color}12`, color: group.color }}>{selectedCount}/{group.fields.length}</span>
                    )}
                    <button onClick={() => toggleAllFileFieldsForSource(group.sourceId)} className="ml-auto text-[10px] font-medium text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                      {allSelected ? "Clear" : "All"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.fields.map((field) => {
                      const isSelected = selectedFileFields.has(field.name);
                      return (
                        <button
                          key={field.name}
                          onClick={() => toggleFileField(field.name)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                            isSelected ? "border-[#027b8e]/30 bg-[#027b8e]/8 text-[var(--text-primary)]" : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"
                          }`}>
                            {isSelected && <CheckIcon />}
                          </div>
                          {field.displayName}{field.metricType ? ` (${field.metricType})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Organic & Contextual ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Organic */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
              <SectionDot color="#fe9a00" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Organic</h3>
            </div>
            <div className="p-3">
              {organicFields.length === 0 ? (
                <p className="text-[11px] text-[var(--text-dim)] py-1">No organic fields mapped</p>
              ) : (
                organicFields.map((group) => (
                  <div key={group.source} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: group.color }} />
                      <span className="text-[10px] font-medium text-[var(--text-dim)]">{group.source}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.fields.map((f) => {
                        const isSelected = selectedControlFields.has(f.name);
                        return (
                          <button
                            key={f.name}
                            onClick={() => toggleControlField(f.name)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                              isSelected
                                ? "border-[#fe9a00]/30 bg-[#fe9a00]/8 text-[var(--text-primary)]"
                                : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
                            }`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${
                              isSelected ? "bg-[#fe9a00] border-[#fe9a00]" : "border-[var(--border-secondary)]"
                            }`}>
                              {isSelected && <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M5 1.5L2.5 4L1 2.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            {f.displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contextual */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
              <SectionDot color="#027b8e" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Contextual</h3>
            </div>
            <div className="p-3">
              {contextualFields.length === 0 ? (
                <p className="text-[11px] text-[var(--text-dim)] py-1">No contextual fields mapped</p>
              ) : (
                contextualFields.map((group) => (
                  <div key={group.source} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: group.color }} />
                      <span className="text-[10px] font-medium text-[var(--text-dim)]">{group.source}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.fields.map((f) => {
                        const isSelected = selectedControlFields.has(f.name);
                        return (
                          <button
                            key={f.name}
                            onClick={() => toggleControlField(f.name)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                              isSelected
                                ? "border-[#027b8e]/30 bg-[#027b8e]/8 text-[var(--text-primary)]"
                                : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
                            }`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${
                              isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"
                            }`}>
                              {isSelected && <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M5 1.5L2.5 4L1 2.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            {f.displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Custom variables inline */}
              <div className="mt-2 pt-2 border-t border-[var(--border-primary)]">
                {customVars.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {customVars.map((cv, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20">
                        {cv}
                        <button onClick={() => removeCustomVar(i)} className="opacity-60 hover:opacity-100 transition-opacity">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6 2L2 6M2 2L6 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customVarInput}
                    onChange={(e) => setCustomVarInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomVar(); }}
                    placeholder="Custom variable..."
                    className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded text-[10px] text-[var(--text-secondary)] px-2 py-1 flex-1 placeholder-[var(--text-dim)] focus:outline-none focus:border-[#027b8e] transition-colors"
                  />
                  <button onClick={addCustomVar} disabled={!customVarInput.trim()} className="px-2 py-1 rounded text-[10px] font-medium text-[var(--text-dim)] border border-[var(--border-primary)] hover:bg-[var(--hover-item)] disabled:opacity-30 transition-colors">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dimensions & Granularity ─────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
            <SectionDot color="#a855f7" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Dimensions & Granularity</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {/* Dimension pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">Dimensions</span>
              {(Object.keys(DIMENSION_CATEGORIES) as DimensionCategory[]).map((cat) => {
                const added = addedDimCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => { if (!added) addDimension(cat); }}
                    disabled={added}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                      added
                        ? "bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/20 cursor-default"
                        : "text-[var(--text-muted)] border-[var(--border-primary)] hover:border-[#a855f7]/30 hover:text-[#c084fc]"
                    }`}
                  >
                    {added ? `\u2713 ${cat}` : `+ ${cat}`}
                  </button>
                );
              })}
            </div>

            {/* Selected dimensions with granularity pickers */}
            {modelingDimensions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {modelingDimensions.map((dim, idx) => {
                  const options = DIMENSION_CATEGORIES[dim.category];
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-[var(--bg-badge)] rounded-lg px-3 py-1.5">
                      <span className="text-[11px] text-[#c084fc] font-medium min-w-[60px]">{dim.category}</span>
                      <div className="flex items-center gap-0.5 bg-[var(--bg-card-inner)] rounded p-0.5 flex-1">
                        {options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateDimensionGranularity(idx, opt as string)}
                            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex-1 text-center ${
                              dim.granularity === opt
                                ? "bg-[#027b8e] text-white"
                                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => removeDimension(idx)} className="text-[var(--text-dim)] hover:text-[#ff2056] transition-colors p-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Time granularity */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">Time</span>
              <div className="flex items-center gap-0.5 bg-[var(--bg-badge)] rounded-md p-0.5">
                {(["Daily", "Weekly", "Monthly"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                      granularity === g ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
