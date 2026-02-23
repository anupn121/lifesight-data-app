"use client";

import { useMemo, useState } from "react";
import type { DataModel } from "./dataModelsData";
import type { Field } from "./fieldsData";
import { generateMockDataset } from "./mockDataGenerator";
import { EDA_REGISTRY, CATEGORY_COLORS, type EDACategory } from "./eda/edaTypes";

// Panel imports - Data Quality & Profiling
import DataProfilePanel from "./eda/DataProfilePanel";
import MissingDataPanel from "./eda/MissingDataPanel";
import DuplicateDetectionPanel from "./eda/DuplicateDetectionPanel";
import ConsistencyCheckPanel from "./eda/ConsistencyCheckPanel";
import DataQualityScorePanel from "./eda/DataQualityScorePanel";

// Panel imports - Univariate Analysis
import SummaryStatsPanel from "./eda/SummaryStatsPanel";
import DistributionPanel from "./eda/DistributionPanel";
import BoxPlotPanel from "./eda/BoxPlotPanel";
import NormalityTestPanel from "./eda/NormalityTestPanel";
import DescriptiveCardsPanel from "./eda/DescriptiveCardsPanel";

// Panel imports - Bivariate & Multivariate
import CorrelationMatrixPanel from "./eda/CorrelationMatrixPanel";
import ScatterPlotPanel from "./eda/ScatterPlotPanel";
import MulticollinearityPanel from "./eda/MulticollinearityPanel";
import PCAPanel from "./eda/PCAPanel";
import ClusteringPanel from "./eda/ClusteringPanel";

// Panel imports - Time Series
import TrendDecompositionPanel from "./eda/TrendDecompositionPanel";
import SeasonalityPanel from "./eda/SeasonalityPanel";
import StationarityCheckPanel from "./eda/StationarityCheckPanel";
import ACFPACFPanel from "./eda/ACFPACFPanel";
import ChangePointPanel from "./eda/ChangePointPanel";

// Panel imports - Outlier & Anomaly Detection
import OutlierDetectionPanel from "./eda/OutlierDetectionPanel";
import TimeSeriesAnomalyPanel from "./eda/TimeSeriesAnomalyPanel";
import SpendAnomalyPanel from "./eda/SpendAnomalyPanel";
import OutlierImpactPanel from "./eda/OutlierImpactPanel";

// Panel imports - Marketing AI Insights
import SpendResponseCurvePanel from "./eda/SpendResponseCurvePanel";
import ChannelContributionPanel from "./eda/ChannelContributionPanel";
import FeatureImportancePanel from "./eda/FeatureImportancePanel";
import AdstockEstimatePanel from "./eda/AdstockEstimatePanel";
import KeyFindingsPanel from "./eda/KeyFindingsPanel";

interface EDAViewProps {
  model: DataModel;
  fields: Field[];
  onBack: () => void;
}

const CATEGORIES: EDACategory[] = [
  "Data Quality & Profiling",
  "Univariate Analysis",
  "Bivariate & Multivariate",
  "Time Series",
  "Outlier & Anomaly Detection",
  "Marketing AI Insights",
];

const CATEGORY_ICONS: Record<EDACategory, string> = {
  "Data Quality & Profiling": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "Univariate Analysis": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Bivariate & Multivariate": "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  "Time Series": "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  "Outlier & Anomaly Detection": "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  "Marketing AI Insights": "M13 10V3L4 14h7v7l9-11h-7z",
};

export default function EDAView({ model, fields, onBack }: EDAViewProps) {
  const dataset = useMemo(() => generateMockDataset(model, fields), [model.id]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(EDA_REGISTRY.map((c) => c.id)));
  const clearAll = () => setSelected(new Set());

  const aiQuickAnalysis = () => {
    const defaults = EDA_REGISTRY.filter((c) => c.defaultSelected).map((c) => c.id);
    setSelected(new Set(defaults));
    setExpandedCategories(new Set(CATEGORIES));
  };

  const selectCategory = (cat: EDACategory) => {
    const catItems = EDA_REGISTRY.filter((c) => c.category === cat);
    const allSelected = catItems.every((c) => selected.has(c.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        catItems.forEach((c) => next.delete(c.id));
      } else {
        catItems.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const renderPanel = (id: string) => {
    switch (id) {
      case "dataProfile": return <DataProfilePanel dataset={dataset} />;
      case "missing": return <MissingDataPanel dataset={dataset} />;
      case "duplicateDetection": return <DuplicateDetectionPanel dataset={dataset} />;
      case "consistencyCheck": return <ConsistencyCheckPanel dataset={dataset} />;
      case "dataQualityScore": return <DataQualityScorePanel dataset={dataset} />;
      case "summary": return <SummaryStatsPanel dataset={dataset} />;
      case "distribution": return <DistributionPanel dataset={dataset} />;
      case "boxPlot": return <BoxPlotPanel dataset={dataset} />;
      case "normalityTest": return <NormalityTestPanel dataset={dataset} />;
      case "descriptiveCards": return <DescriptiveCardsPanel dataset={dataset} />;
      case "correlation": return <CorrelationMatrixPanel dataset={dataset} />;
      case "scatterPlot": return <ScatterPlotPanel dataset={dataset} />;
      case "multicollinearity": return <MulticollinearityPanel dataset={dataset} model={model} />;
      case "pca": return <PCAPanel dataset={dataset} />;
      case "clustering": return <ClusteringPanel dataset={dataset} />;
      case "trendDecomposition": return <TrendDecompositionPanel dataset={dataset} />;
      case "seasonality": return <SeasonalityPanel dataset={dataset} />;
      case "stationarity": return <StationarityCheckPanel dataset={dataset} />;
      case "acfPacf": return <ACFPACFPanel dataset={dataset} />;
      case "changePoint": return <ChangePointPanel dataset={dataset} />;
      case "outlier": return <OutlierDetectionPanel dataset={dataset} />;
      case "timeSeriesAnomaly": return <TimeSeriesAnomalyPanel dataset={dataset} />;
      case "spendAnomaly": return <SpendAnomalyPanel dataset={dataset} />;
      case "outlierImpact": return <OutlierImpactPanel dataset={dataset} />;
      case "spendResponseCurve": return <SpendResponseCurvePanel dataset={dataset} />;
      case "channelContribution": return <ChannelContributionPanel dataset={dataset} />;
      case "featureImportance": return <FeatureImportancePanel dataset={dataset} />;
      case "adstockEstimate": return <AdstockEstimatePanel dataset={dataset} />;
      case "keyFindings": return <KeyFindingsPanel dataset={dataset} />;
      default: return null;
    }
  };

  // Group components by category and build ordered selected list
  const componentsByCategory = useMemo(() => {
    const map = new Map<EDACategory, typeof EDA_REGISTRY>();
    for (const cat of CATEGORIES) {
      map.set(cat, EDA_REGISTRY.filter((c) => c.category === cat));
    }
    return map;
  }, []);

  // Build ordered selected components: KeyFindings first, then by category order
  const orderedSelected = useMemo(() => {
    const result: typeof EDA_REGISTRY = [];
    // Key findings first if selected
    if (selected.has("keyFindings")) {
      result.push(EDA_REGISTRY.find((c) => c.id === "keyFindings")!);
    }
    for (const cat of CATEGORIES) {
      const catItems = EDA_REGISTRY.filter((c) => c.category === cat && selected.has(c.id) && c.id !== "keyFindings");
      result.push(...catItems);
    }
    return result;
  }, [selected]);

  const selectedCount = selected.size;
  const totalCount = EDA_REGISTRY.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg hover:bg-[var(--hover-item)] flex items-center justify-center transition-colors"
            title="Back to Models"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h2 className="text-[var(--text-primary)] text-lg font-semibold">Exploratory Data Analysis</h2>
            <p className="text-[var(--text-muted)] text-sm">
              {model.name} &middot; {model.granularity} &middot; {dataset.rows.length} rows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={aiQuickAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6941c6] text-white text-xs font-medium hover:bg-[#5b35b5] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" opacity="0.9" />
            </svg>
            AI Quick Analysis
          </button>
          {selectedCount > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{selectedCount}/{totalCount}</span>
          )}
        </div>
      </div>

      {/* Category accordion selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-primary)]">
          <h3 className="text-[var(--text-primary)] text-sm font-semibold">Select Analyses</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-[#6941c6] hover:underline">Select All</button>
            <button onClick={clearAll} className="text-xs text-[var(--text-muted)] hover:underline">Clear</button>
          </div>
        </div>

        {CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const items = componentsByCategory.get(cat) || [];
          const isExpanded = expandedCategories.has(cat);
          const selectedInCat = items.filter((c) => selected.has(c.id)).length;
          const allSelectedInCat = selectedInCat === items.length;

          return (
            <div key={cat} className="border-b border-[var(--border-primary)] last:border-b-0">
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--hover-item)] transition-colors">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <path d="M3 1L7 5L3 9" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d={CATEGORY_ICONS[cat]} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{cat}</span>
                  <span className="text-[9px] tabular-nums text-[var(--text-dim)]">
                    {selectedInCat}/{items.length}
                  </span>
                </button>
                <button
                  onClick={() => selectCategory(cat)}
                  className="text-[10px] px-2 py-0.5 rounded border transition-colors shrink-0"
                  style={{
                    borderColor: `${color}30`,
                    color: color,
                    backgroundColor: allSelectedInCat ? `${color}15` : "transparent",
                  }}
                >
                  {allSelectedInCat ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Category items */}
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 px-4 pb-3">
                  {items.map((comp) => (
                    <label
                      key={comp.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selected.has(comp.id)
                          ? `border-[${color}]/30`
                          : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                      }`}
                      style={selected.has(comp.id) ? { backgroundColor: `${color}08`, borderColor: `${color}30` } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(comp.id)}
                        onChange={() => toggleSelect(comp.id)}
                        className="mt-0.5 rounded border-[var(--border-secondary)]"
                        style={{ accentColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-medium text-[var(--text-primary)] leading-tight block">{comp.name}</span>
                        <span className="text-[9px] text-[var(--text-dim)] leading-tight">{comp.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results */}
      {orderedSelected.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-6 py-12 text-center">
          <div className="w-10 h-10 rounded-lg bg-[#6941c6]/10 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#6941c6" opacity="0.5" />
            </svg>
          </div>
          <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-1">No Analyses Selected</h3>
          <p className="text-[var(--text-label)] text-xs max-w-sm mx-auto mb-3">
            Select analyses from the categories above, or click &ldquo;AI Quick Analysis&rdquo; to auto-select recommended panels.
          </p>
          <button
            onClick={aiQuickAnalysis}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6941c6] text-white text-xs font-medium hover:bg-[#5b35b5] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
            </svg>
            AI Quick Analysis
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orderedSelected.map((comp) => {
            const color = CATEGORY_COLORS[comp.category];
            return (
              <div key={comp.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                {/* Collapsible header */}
                <button
                  onClick={() => toggleCollapse(comp.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--hover-item)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      className={`transition-transform ${collapsed.has(comp.id) ? "" : "rotate-90"}`}
                    >
                      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{comp.name}</span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border"
                      style={{
                        backgroundColor: `${color}10`,
                        color: color,
                        borderColor: `${color}20`,
                      }}
                    >
                      {comp.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">{collapsed.has(comp.id) ? "Expand" : "Collapse"}</span>
                </button>
                {/* Panel content */}
                {!collapsed.has(comp.id) && (
                  <div className="px-4 pb-4 border-t border-[var(--border-primary)]">
                    {renderPanel(comp.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
