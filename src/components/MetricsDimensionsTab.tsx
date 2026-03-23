"use client";

import { useState, useMemo } from "react";
import FlowView from "./FlowView";
import BulkAddModal from "./BulkAddModal";
import {
  type Field,
  type DataTypeKey,
  type MetricCategory,
  type DimensionDefinition,
  type ChannelDimensionMapping,
  DATA_TYPES,
  DATA_SOURCE_PARENTS,
  SOURCE_STREAM_TABLES,
  CURRENCY_OPTIONS,
  METRIC_CATEGORIES,
  SYSTEM_DIMENSIONS,
  getSourceStreamInfo,
  deriveMetricCategory,
  toColumnName,
  sourceOptions,
} from "./fieldsData";

type SubTab = "metrics" | "dimensions" | "metrics-flow" | "dimensions-flow";
type StatusFilter = "all" | "mapped" | "unmapped";




// --- Transformation Step Types ---
interface TransformStep {
  id: string;
  operation: string;
  value: string;
}

const AGGREGATIONS = [
  { key: "NONE", label: "No Aggregation", icon: "\u2014", desc: "Use the raw value as-is, no math applied.", color: "border-[var(--border-secondary)] text-[var(--text-label)]" },
  { key: "SUM", label: "Add Up All Values", icon: "\u03A3", desc: "Add up all values across rows. Good for totals like spend or revenue.", color: "border-[#00bc7d]/40 text-[#00bc7d]" },
  { key: "AVG", label: "Calculate Average", icon: "x\u0304", desc: "Calculate the mean value. Good for rates like CTR or frequency.", color: "border-[#2b7fff]/40 text-[#60a5fa]" },
  { key: "COUNT", label: "Count Entries", icon: "#", desc: "Count how many rows have this value. Good for counting events.", color: "border-[#fe9a00]/40 text-[#fbbf24]" },
  { key: "MIN", label: "Find Minimum", icon: "\u2193", desc: "Find the smallest value.", color: "border-[#6941c6]/40 text-[#a78bfa]" },
  { key: "MAX", label: "Find Maximum", icon: "\u2191", desc: "Find the largest value.", color: "border-[#6941c6]/40 text-[#a78bfa]" },
] as const;

const POST_OPERATIONS = [
  { key: "MULTIPLY", label: "Multiply the result by", icon: "\u00D7", desc: "Multiply the result by a number. Example: multiply by 100 to convert a ratio to a percentage.", placeholder: "e.g., 100", inputType: "number" as const },
  { key: "DIVIDE_BY", label: "Divide the result by", icon: "\u00F7", desc: "Divide the result by a number or field. Safely handles division by zero.", placeholder: "e.g., 1000000 or another_field", inputType: "text" as const },
  { key: "ROUND", label: "Round to decimal places", icon: "\u2248", desc: "Round to a specific number of decimal places.", placeholder: "e.g., 2", inputType: "number" as const },
  { key: "COALESCE", label: "Default if empty", icon: "?", desc: "If the value is missing or null, use this fallback value instead.", placeholder: "e.g., 0", inputType: "text" as const },
  { key: "CAST_DATE", label: "Convert to date", icon: "D", desc: "Convert text values into a proper date format for time-based analysis.", placeholder: "", inputType: "none" as const },
  { key: "EXTRACT_PART", label: "Extract date part", icon: "E", desc: "Pull out just the year, month, or day from a date value.", placeholder: "YEAR, MONTH, or DAY", inputType: "select" as const },
] as const;

interface TransformRecipe {
  name: string;
  desc: string;
  aggregation: string;
  steps: TransformStep[];
}

const RECIPES: TransformRecipe[] = [
  {
    name: "Sum All Values",
    desc: "Add up all values into one total",
    aggregation: "SUM",
    steps: [{ id: "r1", operation: "ROUND", value: "2" }],
  },
  {
    name: "Calculate Average",
    desc: "Find the middle value across rows",
    aggregation: "AVG",
    steps: [{ id: "r1", operation: "ROUND", value: "2" }],
  },
  {
    name: "Divide Two Fields",
    desc: "Calculate a ratio (e.g., CPC = spend / clicks)",
    aggregation: "NONE",
    steps: [{ id: "r1", operation: "DIVIDE_BY", value: "denominator" }, { id: "r2", operation: "COALESCE", value: "0" }],
  },
  {
    name: "Convert to Percentage",
    desc: "Multiply a decimal by 100",
    aggregation: "AVG",
    steps: [{ id: "r1", operation: "MULTIPLY", value: "100" }, { id: "r2", operation: "ROUND", value: "2" }],
  },
  {
    name: "Round Numbers",
    desc: "Round to a specific number of decimal places",
    aggregation: "NONE",
    steps: [{ id: "r1", operation: "ROUND", value: "2" }],
  },
  {
    name: "Convert Micros",
    desc: "Divide by 1,000,000 to get real currency values",
    aggregation: "SUM",
    steps: [{ id: "r1", operation: "DIVIDE_BY", value: "1000000" }, { id: "r2", operation: "ROUND", value: "2" }],
  },
];

let stepIdCounter = 0;
function nextStepId(): string {
  return `step_${++stepIdCounter}`;
}

// Build formula string from aggregation + steps
function buildFormulaFromSteps(
  aggregation: string,
  steps: TransformStep[],
  sourceKey: string
): string {
  const col = sourceKey || "column";

  let expr = col;
  if (aggregation === "SUM") expr = `SUM(${col})`;
  else if (aggregation === "AVG") expr = `AVG(${col})`;
  else if (aggregation === "COUNT") expr = `COUNT(${col})`;
  else if (aggregation === "MIN") expr = `MIN(${col})`;
  else if (aggregation === "MAX") expr = `MAX(${col})`;

  for (const step of steps) {
    const v = step.value || "0";
    switch (step.operation) {
      case "MULTIPLY":
        expr = `(${expr}) * ${v}`;
        break;
      case "DIVIDE_BY": {
        const isNumber = /^\d+(\.\d+)?$/.test(v.trim());
        expr = isNumber
          ? `(${expr}) / ${v}`
          : `(${expr}) / NULLIF(${v}, 0)`;
        break;
      }
      case "ROUND":
        expr = `ROUND(${expr}, ${v})`;
        break;
      case "COALESCE":
        expr = `COALESCE(${expr}, ${v})`;
        break;
      case "CAST_DATE":
        expr = `CAST(${expr} AS DATE)`;
        break;
      case "EXTRACT_PART":
        expr = `EXTRACT(${v || "YEAR"} FROM ${expr})`;
        break;
    }
  }

  return expr;
}

// Describe the full pipeline in plain English
function describeFormulaPipeline(
  aggregation: string,
  steps: TransformStep[],
  sourceKey: string
): string {
  const col = sourceKey || "this field";
  const parts: string[] = [];

  if (aggregation === "NONE") parts.push(`Take the raw value of "${col}"`);
  else if (aggregation === "SUM") parts.push(`Add up all "${col}" values`);
  else if (aggregation === "AVG") parts.push(`Calculate the average of "${col}"`);
  else if (aggregation === "COUNT") parts.push(`Count the number of "${col}" entries`);
  else if (aggregation === "MIN") parts.push(`Find the smallest "${col}" value`);
  else if (aggregation === "MAX") parts.push(`Find the largest "${col}" value`);

  for (const step of steps) {
    switch (step.operation) {
      case "MULTIPLY":
        parts.push(`multiply the result by ${step.value || "?"}`);
        break;
      case "DIVIDE_BY":
        parts.push(`divide by ${step.value || "?"}`);
        break;
      case "ROUND":
        parts.push(`round to ${step.value || "?"} decimal places`);
        break;
      case "COALESCE":
        parts.push(`use ${step.value || "0"} if the value is empty`);
        break;
      case "CAST_DATE":
        parts.push(`convert to a date`);
        break;
      case "EXTRACT_PART":
        parts.push(`extract the ${(step.value || "year").toLowerCase()}`);
        break;
    }
  }

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] + ".";
  return parts[0] + ", then " + parts.slice(1).join(", then ") + ".";
}

function aggregationToTransformKey(aggregation: string): string {
  if (aggregation === "COUNT" || aggregation === "MIN" || aggregation === "MAX") return aggregation;
  if (aggregation === "NONE") return "NONE";
  return aggregation;
}

function parseExistingTransform(field: Field): { aggregation: string; steps: TransformStep[] } {
  const formula = field.transformationFormula || "";
  const agg = (["SUM", "AVG", "COUNT", "MIN", "MAX"].includes(field.transformation))
    ? field.transformation
    : "NONE";

  if (formula) {
    return { aggregation: agg, steps: [] };
  }

  if (field.transformation === "CAST") {
    return { aggregation: "NONE", steps: [{ id: nextStepId(), operation: "CAST_DATE", value: "" }] };
  }
  if (field.transformation === "EXTRACT") {
    return { aggregation: "NONE", steps: [{ id: nextStepId(), operation: "EXTRACT_PART", value: "YEAR" }] };
  }
  if (field.transformation === "DIVIDE") {
    return { aggregation: "NONE", steps: [{ id: nextStepId(), operation: "DIVIDE_BY", value: "denominator" }] };
  }

  return { aggregation: agg, steps: [] };
}

// --- Badge components ---

const DataTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    CURRENCY: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    FLOAT64: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    NUMERIC: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    INT64: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    STRING: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    DATE: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    BIGNUMERIC: "bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20",
    JSON: "bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20",
    Currency: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    Percentage: "bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20",
    Ratio: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Number: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    String: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Enum: "bg-[#6941c6]/10 text-[#a78bfa] border-[#6941c6]/20",
    Date: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
  };
  // Marketer-friendly display names
  const friendlyNames: Record<string, string> = {
    CURRENCY: "Currency",
    FLOAT64: "Decimal",
    NUMERIC: "Number",
    INT64: "Number",
    STRING: "Text",
    DATE: "Date",
    BIGNUMERIC: "Number",
    JSON: "Object",
  };
  const display = friendlyNames[type] || DATA_TYPES[type as DataTypeKey]?.display || type;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colors[type] || "bg-[var(--hover-item)] text-[var(--text-muted)] border-[var(--border-subtle)]"}`}
    >
      {display}
    </span>
  );
};

// --- Icons ---
const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className="absolute left-3 top-1/2 -translate-y-1/2"
  >
    <path
      d="M6.41667 11.0833C8.994 11.0833 11.0833 8.994 11.0833 6.41667C11.0833 3.83934 8.994 1.75 6.41667 1.75C3.83934 1.75 1.75 3.83934 1.75 6.41667C1.75 8.994 3.83934 11.0833 6.41667 11.0833Z"
      stroke="#667085"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.25 12.25L9.71252 9.71252"
      stroke="#667085"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- Transformation Builder Sub-component ---
function TransformationBuilder({
  aggregation,
  steps,
  sourceKey,
  advancedFormula,
  advancedMode,
  onAggregationChange,
  onStepsChange,
  onAdvancedFormulaChange,
  onAdvancedModeChange,
}: {
  aggregation: string;
  steps: TransformStep[];
  sourceKey: string;
  advancedFormula: string;
  advancedMode: boolean;
  onAggregationChange: (agg: string) => void;
  onStepsChange: (steps: TransformStep[]) => void;
  onAdvancedFormulaChange: (formula: string) => void;
  onAdvancedModeChange: (mode: boolean) => void;
}) {
  const [showAddStep, setShowAddStep] = useState(false);

  const formula = advancedMode
    ? advancedFormula
    : buildFormulaFromSteps(aggregation, steps, sourceKey);

  const plainEnglish = advancedMode
    ? ""
    : describeFormulaPipeline(aggregation, steps, sourceKey);

  const hasTransform = aggregation !== "NONE" || steps.length > 0;

  const addStep = (operation: string) => {
    const defaultValues: Record<string, string> = {
      MULTIPLY: "100",
      DIVIDE_BY: "1000",
      ROUND: "2",
      COALESCE: "0",
      CAST_DATE: "",
      EXTRACT_PART: "YEAR",
    };
    onStepsChange([...steps, { id: nextStepId(), operation, value: defaultValues[operation] || "" }]);
    setShowAddStep(false);
  };

  const updateStep = (id: string, value: string) => {
    onStepsChange(steps.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter((s) => s.id !== id));
  };

  const applyRecipe = (recipe: TransformRecipe) => {
    onAggregationChange(recipe.aggregation);
    onStepsChange(recipe.steps.map((s) => ({ ...s, id: nextStepId() })));
    onAdvancedModeChange(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <label className="text-xs text-[var(--text-muted)] font-medium">
        Transformation
      </label>

      {/* Recipe cards - always visible, 2-column grid */}
      {!advancedMode && (
        <div className="grid grid-cols-2 gap-1.5">
          {RECIPES.map((recipe) => (
            <button
              key={recipe.name}
              onClick={() => applyRecipe(recipe)}
              className="flex flex-col gap-0.5 text-left px-3 py-2 rounded-md bg-[var(--hover-bg)] hover:bg-[var(--hover-item)] border border-[var(--border-subtle)] transition-colors"
            >
              <span className="text-[var(--text-secondary)] text-xs font-medium">{recipe.name}</span>
              <span className="text-[var(--text-label)] text-[10px]">{recipe.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Advanced mode: raw formula */}
      {advancedMode ? (
        <div className="flex flex-col gap-2">
          <div className="bg-[#fe9a00]/5 border border-[#fe9a00]/20 rounded-lg px-3 py-2">
            <p className="text-[10px] text-[#fbbf24] leading-relaxed">
              Advanced mode: write your formula directly. Use SQL expressions like SUM, AVG, NULLIF, CASE WHEN, etc. The source key is <code className="bg-[var(--bg-badge)] px-1 rounded text-[#a78bfa]">{sourceKey || "column"}</code>.
            </p>
          </div>
          <textarea
            value={advancedFormula}
            onChange={(e) => onAdvancedFormulaChange(e.target.value)}
            placeholder={`e.g., SUM(${sourceKey || "column"}) * 100 / NULLIF(denominator, 0)`}
            rows={3}
            className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors font-mono resize-none"
          />
        </div>
      ) : (
        <>
          {/* Step 1: Aggregation selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-[#6941c6] flex items-center justify-center text-[8px] text-white font-bold">1</span>
              <span className="text-[11px] text-[var(--text-secondary)]">How should this field be aggregated?</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {AGGREGATIONS.map((agg) => (
                <button
                  key={agg.key}
                  onClick={() => onAggregationChange(agg.key)}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-all text-center ${
                    aggregation === agg.key
                      ? `${agg.color} bg-[var(--hover-item)] border-current`
                      : "border-[var(--border-primary)] text-[var(--text-label)] hover:border-[var(--border-secondary)] hover:text-[var(--text-muted)]"
                  }`}
                  title={agg.desc}
                >
                  <span className="text-sm font-mono leading-none">{agg.icon}</span>
                  <span className="text-[10px] font-medium">{agg.label}</span>
                  <span className="text-[9px] text-[var(--text-label)] leading-tight">{agg.desc.split(".")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Post-operations (chained steps) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-[#6941c6] flex items-center justify-center text-[8px] text-white font-bold">2</span>
              <span className="text-[11px] text-[var(--text-secondary)]">Then apply additional operations</span>
              <span className="text-[10px] text-[var(--text-label)] ml-1">(optional)</span>
            </div>

            {/* Existing steps */}
            {steps.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {steps.map((step, idx) => {
                  const opDef = POST_OPERATIONS.find((o) => o.key === step.operation);
                  if (!opDef) return null;
                  return (
                    <div key={step.id} className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3">
                      <span className="text-[10px] text-[var(--text-label)] font-medium min-w-[40px]">
                        {idx === 0 ? "Then" : "And"}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                        <span className="text-sm">{opDef.icon}</span>
                        <span className="font-medium">{opDef.label}</span>
                      </span>
                      {opDef.inputType === "number" && (
                        <input
                          type="number"
                          value={step.value}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] w-20 font-mono focus:outline-none focus:border-[#6941c6] transition-colors"
                          placeholder={opDef.placeholder}
                        />
                      )}
                      {opDef.inputType === "text" && (
                        <input
                          type="text"
                          value={step.value}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] flex-1 font-mono focus:outline-none focus:border-[#6941c6] transition-colors"
                          placeholder={opDef.placeholder}
                        />
                      )}
                      {opDef.inputType === "select" && (
                        <select
                          value={step.value}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[#6941c6] transition-colors appearance-none"
                        >
                          <option value="YEAR">Year</option>
                          <option value="MONTH">Month</option>
                          <option value="DAY">Day</option>
                          <option value="HOUR">Hour</option>
                        </select>
                      )}
                      <button
                        onClick={() => removeStep(step.id)}
                        className="text-[var(--text-label)] hover:text-[#ef4444] transition-colors ml-auto p-0.5"
                        title="Remove this step"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add step button / picker */}
            {!showAddStep ? (
              <button
                onClick={() => setShowAddStep(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-secondary)] text-[var(--text-label)] text-xs hover:border-[#6941c6] hover:text-[#a78bfa] transition-colors w-full justify-center"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Add a step
              </button>
            ) : (
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-2 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">Pick an operation to add</p>
                  <button onClick={() => setShowAddStep(false)} className="text-[var(--text-label)] hover:text-[var(--text-primary)] transition-colors p-0.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {POST_OPERATIONS.map((op) => (
                  <button
                    key={op.key}
                    onClick={() => addStep(op.key)}
                    className="flex items-start gap-2 px-2.5 py-2 rounded-md hover:bg-[var(--hover-item)] transition-colors text-left"
                  >
                    <span className="text-sm mt-0.5 w-4 text-center">{op.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium">{op.label}</span>
                      <span className="text-[10px] text-[var(--text-label)] leading-relaxed">{op.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Plain English summary - always visible when there's any transform */}
      {!advancedMode && hasTransform && plainEnglish && (
        <div className="bg-[#00bc7d]/5 border border-[#00bc7d]/20 rounded-lg px-3 py-2">
          <p className="text-[10px] text-[var(--text-label)] mb-0.5 font-medium">What this does:</p>
          <p className="text-[11px] text-[#00bc7d] leading-relaxed">{plainEnglish}</p>
        </div>
      )}

      {/* Generated formula - collapsed by default behind a disclosure */}
      {hasTransform && (
        <details className="text-xs">
          <summary className="text-[var(--text-label)] cursor-pointer hover:text-[var(--text-muted)]">Show generated formula</summary>
          <div className="mt-2 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md px-3 py-2 font-mono text-xs text-[#a78bfa] break-all">
            {formula}
          </div>
        </details>
      )}

      {/* Advanced mode link at bottom */}
      {!advancedMode && (
        <button
          onClick={() => onAdvancedModeChange(true)}
          className="text-[10px] text-[var(--text-label)] hover:text-[var(--text-muted)] transition-colors text-left"
        >
          Need to write a custom formula?
        </button>
      )}
      {advancedMode && (
        <button
          onClick={() => onAdvancedModeChange(false)}
          className="text-[10px] text-[var(--text-label)] hover:text-[var(--text-muted)] transition-colors text-left"
        >
          Back to guided mode
        </button>
      )}
    </div>
  );
}

// --- Field Modal ---
function FieldModal({
  isOpen,
  onClose,
  onSave,
  editField,
  defaultKind,
  fields,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: Field) => void;
  editField: Field | null;
  defaultKind: "metric" | "dimension";
  fields: Field[];
}) {
  const isEdit = editField !== null;
  const emptyField: Field = {
    name: "",
    displayName: "",
    columnName: "",
    kind: defaultKind,
    source: "",
    sourceColor: "#9CA3AF",
    sourceKey: "",
    dataType: "STRING" as DataTypeKey,
    transformation: "NONE",
    status: "Unmapped",
    description: "",
    transformationFormula: "",
    tables: [],
    currencyConfig: undefined,
  };

  const [form, setForm] = useState<Field>(editField ?? emptyField);
  const [selectedParent, setSelectedParent] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [columnName, setColumnName] = useState(editField?.columnName || "");
  const [columnNameManuallyEdited, setColumnNameManuallyEdited] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(editField?.currencyConfig?.code || "USD");

  // Transform builder state
  const initialParsed = editField ? parseExistingTransform(editField) : { aggregation: "NONE", steps: [] };
  const [aggregation, setAggregation] = useState(initialParsed.aggregation);
  const [transformSteps, setTransformSteps] = useState<TransformStep[]>(initialParsed.steps);
  const [advancedMode, setAdvancedMode] = useState(!!editField?.transformationFormula);
  const [advancedFormula, setAdvancedFormula] = useState(editField?.transformationFormula || "");

  const [prevEdit, setPrevEdit] = useState<Field | null>(null);
  if (editField !== prevEdit) {
    setPrevEdit(editField);
    if (editField) {
      setForm(editField);
      setColumnName(editField.columnName || "");
      setColumnNameManuallyEdited(false);
      setSelectedCurrency(editField.currencyConfig?.code || "USD");
      // Determine parent/stream from source
      const info = getSourceStreamInfo(editField.source);
      setSelectedParent(info.parent);
      setSelectedStream(info.stream);
      const parsed = parseExistingTransform(editField);
      setAggregation(parsed.aggregation);
      setTransformSteps(parsed.steps);
      setAdvancedMode(!!editField.transformationFormula);
      setAdvancedFormula(editField.transformationFormula || "");
    } else {
      setForm({ ...emptyField, kind: defaultKind });
      setSelectedParent("");
      setSelectedStream("");
      setColumnName("");
      setColumnNameManuallyEdited(false);
      setSelectedCurrency("USD");
      setAggregation("NONE");
      setTransformSteps([]);
      setAdvancedMode(false);
      setAdvancedFormula("");
    }
  }

  // Column name uniqueness validation
  const columnNameError = useMemo(() => {
    if (!columnName.trim()) return "";
    const existing = fields.find(f => f.columnName === columnName && f !== editField);
    if (existing) return `Column name "${columnName}" is already used by "${existing.displayName} (${existing.source})"`;
    return "";
  }, [columnName, fields, editField]);

  const update = (key: keyof Field, val: string) => {
    setForm((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next = { ...prev, [key]: val } as any;
      if (key === "source") {
        const src = sourceOptions.find((s) => s.name === val);
        next.sourceColor = src?.color || "#9CA3AF";
      }
      if (key === "displayName") {
        next.status = val.trim() ? "Mapped" : "Unmapped";
        if (!columnNameManuallyEdited) {
          setColumnName(toColumnName(val));
        }
      }
      return next as Field;
    });
  };

  // Get parent source options from SOURCE_STREAM_TABLES
  const parentSourceOptions = Object.keys(SOURCE_STREAM_TABLES);

  // Get streams for selected parent
  const parentData = selectedParent ? SOURCE_STREAM_TABLES[selectedParent] : null;
  const streamNames = parentData ? Object.keys(parentData.streams) : [];
  const isDataSourceParent = DATA_SOURCE_PARENTS.has(selectedParent);
  const isSingleStream = streamNames.length === 1;

  // Auto-select stream when single stream parent is selected
  const handleParentChange = (parent: string) => {
    setSelectedParent(parent);
    setSelectedStream("");
    const pd = SOURCE_STREAM_TABLES[parent];
    if (pd) {
      const streams = Object.keys(pd.streams);
      if (streams.length === 1) {
        setSelectedStream(streams[0]);
        // Auto-set form.source
        const streamData = pd.streams[streams[0]];
        if (streamData.sources.length > 0) {
          setForm(prev => ({
            ...prev,
            source: streamData.sources[0],
            sourceColor: pd.color,
            tables: streamData.tables,
          }));
        }
      }
    }
  };

  const handleStreamChange = (stream: string) => {
    setSelectedStream(stream);
    if (parentData && parentData.streams[stream]) {
      const streamData = parentData.streams[stream];
      if (streamData.sources.length > 0) {
        setForm(prev => ({
          ...prev,
          source: streamData.sources[0],
          sourceColor: parentData.color,
          tables: streamData.tables,
        }));
      }
    }
  };

  const buildSaveField = (): Field => {
    let transformation = aggregationToTransformKey(aggregation);
    let transformationFormula = "";

    if (advancedMode) {
      transformationFormula = advancedFormula;
      if (/^SUM\(/i.test(advancedFormula.trim())) transformation = "SUM";
      else if (/^AVG\(/i.test(advancedFormula.trim())) transformation = "AVG";
      else if (/^COUNT\(/i.test(advancedFormula.trim())) transformation = "COUNT";
      else if (advancedFormula.trim()) transformation = "SUM";
      else transformation = "NONE";
    } else if (aggregation !== "NONE" || transformSteps.length > 0) {
      transformationFormula = buildFormulaFromSteps(aggregation, transformSteps, form.sourceKey);
    }

    return {
      ...form,
      columnName,
      transformation,
      transformationFormula,
      currencyConfig: form.dataType === "CURRENCY" ? { code: selectedCurrency, symbol: CURRENCY_OPTIONS.find(c => c.code === selectedCurrency)?.symbol || "$" } : undefined,
    };
  };

  const canSave = form.sourceKey.trim() && form.source && form.dataType && form.dataType in DATA_TYPES && !columnNameError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-[900px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border-primary)]">
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">
            {isEdit ? "Edit Field" : "Add Field"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-label)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* 1. Kind toggle */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Field Type
            </label>
            <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-lg p-0.5 w-fit">
              <button
                onClick={() => update("kind", "metric")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.kind === "metric" ? "bg-[#6941c6] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Metric
              </button>
              <button
                onClick={() => update("kind", "dimension")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.kind === "dimension" ? "bg-[#6941c6] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Dimension
              </button>
            </div>
          </div>

          {/* 2. Source (parent) */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Source
            </label>
            <select
              value={selectedParent}
              onChange={(e) => handleParentChange(e.target.value)}
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#6941c6] transition-colors appearance-none"
            >
              <option value="">Select source...</option>
              {parentSourceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Stream (conditional) */}
          {selectedParent && (
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                {isDataSourceParent ? "Table / Sheet Name" : "Stream"}
              </label>
              {isDataSourceParent ? (
                <input
                  type="text"
                  value={selectedStream}
                  onChange={(e) => {
                    setSelectedStream(e.target.value);
                    // For data source parents, set the source directly
                    if (parentData) {
                      const firstStream = Object.keys(parentData.streams)[0];
                      const streamData = parentData.streams[firstStream];
                      if (streamData?.sources.length > 0) {
                        setForm(prev => ({
                          ...prev,
                          source: streamData.sources[0],
                          sourceColor: parentData.color,
                        }));
                      }
                    }
                  }}
                  placeholder="e.g., my_data_table, Sheet1"
                  className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
                />
              ) : isSingleStream ? (
                <div className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-label)] px-3 py-2">
                  {streamNames[0]}
                </div>
              ) : (
                <select
                  value={selectedStream}
                  onChange={(e) => handleStreamChange(e.target.value)}
                  className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#6941c6] transition-colors appearance-none"
                >
                  <option value="">Select stream...</option>
                  {streamNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 4. Source Column (sourceKey) */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Source Column
            </label>
            <input
              type="text"
              value={form.sourceKey}
              onChange={(e) => update("sourceKey", e.target.value)}
              placeholder="e.g., metrics.ctr, campaign.name, total_sales"
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors font-mono"
            />
            <p className="text-[10px] text-[var(--text-label)] mt-1">
              The raw field name from the source API
            </p>
          </div>

          {/* 5. Display Name */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Display Name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder="e.g., Total Revenue, Campaign Name"
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
            <p className="text-[10px] text-[var(--text-label)] mt-1">
              Leave blank to keep unmapped
            </p>
          </div>

          {/* 6. Column Name */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => {
                setColumnName(e.target.value);
                setColumnNameManuallyEdited(true);
              }}
              placeholder="e.g., total_revenue"
              className={`bg-[var(--bg-badge)] border rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none transition-colors font-mono ${
                columnNameError ? "border-[#ef4444] focus:border-[#ef4444]" : "border-[var(--border-secondary)] focus:border-[#6941c6]"
              }`}
            />
            {columnNameError && (
              <p className="text-[10px] text-[#ef4444] mt-1">{columnNameError}</p>
            )}
            {!columnNameError && (
              <p className="text-[10px] text-[var(--text-label)] mt-1">
                Auto-generated from display name. Edit to customize.
              </p>
            )}
          </div>

          {/* 7. Data Type */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Data Type
            </label>
            <select
              value={form.dataType}
              onChange={(e) => update("dataType", e.target.value)}
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#6941c6] transition-colors appearance-none"
            >
              <option value="">Select type...</option>
              {(Object.entries(DATA_TYPES) as [DataTypeKey, { display: string }][]).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.display} ({key})
                </option>
              ))}
            </select>
          </div>

          {/* 8. Currency Code (conditional) */}
          {form.dataType === "CURRENCY" && (
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                Currency Code
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#6941c6] transition-colors appearance-none"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[var(--border-primary)]" />

          {/* 9. Transformation Builder */}
          <TransformationBuilder
            aggregation={aggregation}
            steps={transformSteps}
            sourceKey={form.sourceKey}
            advancedFormula={advancedFormula}
            advancedMode={advancedMode}
            onAggregationChange={setAggregation}
            onStepsChange={setTransformSteps}
            onAdvancedFormulaChange={setAdvancedFormula}
            onAdvancedModeChange={setAdvancedMode}
          />

          {/* Divider */}
          <div className="border-t border-[var(--border-primary)]" />

          {/* 10. Description */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Brief description of this field"
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canSave) onSave(buildSaveField());
            }}
            disabled={!canSave}
            className="flex-1 bg-[#6941c6] hover:bg-[#5b34b5] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm text-white font-medium transition-colors"
          >
            {isEdit ? "Save Changes" : "Add Field"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Grouping Types ---
interface CategorySubGroup {
  label: string;
  color?: string;
  fields: Field[];
  mappedCount: number;
  unmappedCount: number;
}

interface CategoryGroup {
  category: MetricCategory;
  label: string;
  color: string;
  subGroups: CategorySubGroup[];
  totalFields: number;
  totalMapped: number;
}

// Grid template shared between header and rows
const TABLE_GRID = "grid-cols-[1fr_130px_130px_180px_160px_80px_90px_36px]";

// Unified field row for collapsible category sections
const NewFieldRow = ({ field, onEdit }: { field: Field; onEdit: (field: Field) => void }) => {
  const info = getSourceStreamInfo(field.source);
  return (
    <div
      className={`grid ${TABLE_GRID} border-b border-[var(--border-subtle)] hover:bg-[var(--hover-item)] transition-colors cursor-pointer group`}
      onClick={() => onEdit(field)}
    >
      {/* Display Name */}
      <div className="px-4 py-2.5 flex items-center gap-2.5 min-w-0">
        <span
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: field.sourceColor }}
        >
          <span className="text-[7px] text-white font-bold">{info.parent[0]}</span>
        </span>
        <span className="text-[var(--text-primary)] text-xs font-medium truncate" title={field.displayName || field.columnName}>
          {field.displayName || field.columnName}
        </span>
      </div>
      {/* Source Name */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <span className="text-[var(--text-secondary)] text-[11px] truncate" title={info.parent}>{info.parent}</span>
      </div>
      {/* Stream Name */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <span className="text-[var(--text-muted)] text-[11px] truncate" title={info.stream}>{info.stream}</span>
      </div>
      {/* Source Field */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <code className="text-[#a78bfa] text-[10px] bg-[#6941c6]/10 px-1.5 py-0.5 rounded font-mono truncate" title={field.sourceKey}>
          {field.sourceKey}
        </code>
      </div>
      {/* Target Key */}
      <div className="px-3 py-2.5 flex items-center min-w-0">
        <code className="text-[var(--text-muted)] text-[10px] bg-[var(--bg-badge)] px-1.5 py-0.5 rounded font-mono truncate" title={field.columnName}>
          {field.columnName}
        </code>
      </div>
      {/* Data Type */}
      <div className="px-3 py-2.5 flex items-center">
        <DataTypeBadge type={field.dataType} />
      </div>
      {/* Status */}
      <div className="px-3 py-2.5 flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
          field.status === "Mapped"
            ? "bg-[#00bc7d]/10 text-[#00bc7d]"
            : "bg-[#fe9a00]/10 text-[#fe9a00]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${field.status === "Mapped" ? "bg-[#00bc7d]" : "bg-[#fe9a00]"}`} />
          {field.status === "Mapped" ? "Active" : "Needs Setup"}
        </span>
      </div>
      {/* Edit */}
      <div className="px-1 py-2.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(field); }}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--hover-item)] transition-all"
          title="Edit"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5.5 2.5H2.5C2.23478 2.5 1.98043 2.60536 1.79289 2.79289C1.60536 2.98043 1.5 3.23478 1.5 3.5V9.5C1.5 9.76522 1.60536 10.0196 1.79289 10.2071C1.98043 10.3946 2.23478 10.5 2.5 10.5H8.5C8.76522 10.5 9.01957 10.3946 9.20711 10.2071C9.39464 10.0196 9.5 9.76522 9.5 9.5V6.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.75 1.75C8.94891 1.55109 9.2187 1.43934 9.5 1.43934C9.7813 1.43934 10.0511 1.55109 10.25 1.75C10.4489 1.94891 10.5607 2.2187 10.5607 2.5C10.5607 2.7813 10.4489 3.05109 10.25 3.25L5.5 8L3.5 8.5L4 6.5L8.75 1.75Z" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
interface MetricsDimensionsTabProps {
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
}

export default function MetricsDimensionsTab({
  fields,
  onFieldsChange,
}: MetricsDimensionsTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("metrics");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(["kpi", "paid_marketing", "organic", "contextual"]));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const switchSubTab = (tab: SubTab) => {
    setSubTab(tab);
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  const isFlowTab = subTab === "metrics-flow" || subTab === "dimensions-flow";

  // Filter fields — applies to both metrics and dimensions
  const filteredFields = useMemo(() => {
    if (isFlowTab) return [];
    const kind = subTab === "metrics" ? "metric" : "dimension";
    return fields.filter((f) => {
      if (f.kind !== kind) return false;
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
  }, [fields, subTab, statusFilter, sourceFilter, search, isFlowTab]);

  const metricCount = fields.filter((f) => f.kind === "metric").length;
  const dimensionCount = fields.filter((f) => f.kind === "dimension").length;

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    if (isFlowTab) return [];
    const kind = subTab === "metrics" ? "metric" : "dimension";
    const sources = new Set(fields.filter((f) => f.kind === kind).map((f) => f.source));
    return Array.from(sources).sort();
  }, [fields, subTab, isFlowTab]);

  // Category grouping — works for both metrics AND dimensions
  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (isFlowTab) return [];
    const CATEGORY_ORDER: MetricCategory[] = ["kpi", "paid_marketing", "organic", "contextual"];
    const catMap = new Map<MetricCategory, Field[]>();

    filteredFields.forEach((f) => {
      const cat = f.metricCategory;
      if (!cat) return;
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(f);
    });

    return CATEGORY_ORDER.map((cat) => {
      const flds = catMap.get(cat) || [];
      const config = METRIC_CATEGORIES[cat];
      return {
        category: cat,
        label: config.label,
        color: config.color,
        subGroups: [],
        totalFields: flds.length,
        totalMapped: flds.filter((f) => f.status === "Mapped").length,
      };
    });
  }, [filteredFields, isFlowTab]);

  // Flat fields per category for rendering inside sections
  const fieldsByCategory = useMemo(() => {
    if (isFlowTab) return new Map<MetricCategory, Field[]>();
    const map = new Map<MetricCategory, Field[]>();
    filteredFields.forEach((f) => {
      const cat = f.metricCategory;
      if (!cat) return;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(f);
    });
    return map;
  }, [filteredFields, isFlowTab]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleEdit = (field: Field) => {
    setEditField(field);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Filter bar above content ── */}
      <div className="flex items-center gap-3">
        {/* Metrics / Dimensions segmented control */}
        <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-lg p-0.5">
          <button
            onClick={() => switchSubTab("metrics")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === "metrics" || subTab === "metrics-flow"
                ? "bg-[#6941c6] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Metrics ({metricCount})
          </button>
          <button
            onClick={() => switchSubTab("dimensions")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === "dimensions" || subTab === "dimensions-flow"
                ? "bg-[#6941c6] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Dimensions ({dimensionCount})
          </button>
        </div>

        {/* Data Flow toggle */}
        <button
          onClick={() => {
            const base = subTab === "metrics-flow" ? "metrics" : subTab === "dimensions-flow" ? "dimensions" : subTab;
            switchSubTab(isFlowTab ? (base as SubTab) : (`${base}-flow` as SubTab));
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
            isFlowTab
              ? "bg-[#6941c6]/10 text-[#6941c6] border border-[#6941c6]/30"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)]"
          }`}
          title="View data flow"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h3l2 3-2 3H2M9 4h3M9 10h3M7 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isFlowTab && <span>Data Flow</span>}
        </button>

        {/* Search — grows to fill space */}
        {!isFlowTab && (
          <div className="relative flex-1 max-w-sm">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${subTab.startsWith("metrics") ? "metrics" : "dimensions"}...`}
              className="w-full bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] pl-8 pr-3 py-2 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
          </div>
        )}

        {/* Status filter */}
        {!isFlowTab && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg text-xs text-[var(--text-secondary)] px-3 py-2 focus:outline-none focus:border-[#6941c6] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="mapped">Active</option>
            <option value="unmapped">Needs Setup</option>
          </select>
        )}

        {/* Source filter */}
        {!isFlowTab && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg text-xs text-[var(--text-secondary)] px-3 py-2 max-w-[180px] focus:outline-none focus:border-[#6941c6] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        )}

        {/* Add button — pushed to right */}
        {!isFlowTab && (
          <button
            onClick={() => {
              setEditField(null);
              setIsModalOpen(true);
            }}
            className="ml-auto bg-[#6941c6] hover:bg-[#5b34b5] text-white rounded-lg flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {subTab === "metrics" ? "Add Metric" : "Add Dimension"}
          </button>
        )}
      </div>

      {/* ── Data Flow tab content ── */}
      {isFlowTab && (
        <FlowView
          fields={fields}
          kind={subTab === "metrics-flow" ? "metric" : "dimension"}
          onBulkAdd={() => setIsBulkModalOpen(true)}
        />
      )}

      {/* ── Collapsible Category Sections ── */}
      {!isFlowTab && (
        <div className="flex flex-col gap-5">
          {categoryGroups.map((cg) => {
            const isExpanded = expandedCategories.has(cg.category);
            const catFields = fieldsByCategory.get(cg.category) || [];
            const mappedPct = cg.totalFields > 0 ? Math.round((cg.totalMapped / cg.totalFields) * 100) : 0;

            return (
              <div key={cg.category}>
                {/* Section header — matches Integrations page pattern */}
                <button
                  onClick={() => toggleCategory(cg.category)}
                  className="flex items-center gap-2 mb-3 group"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: cg.color }} />
                  <span className="text-[var(--text-primary)] text-sm font-semibold">{cg.label}</span>
                  <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {cg.totalMapped}/{cg.totalFields}
                  </span>
                  <span className="text-[var(--text-dim)] text-[10px]">{mappedPct}% active</span>
                </button>

                {/* Expanded card with table */}
                {isExpanded && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className={`grid ${TABLE_GRID} border-b border-[var(--border-primary)]`}>
                      <div className="px-4 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Display Name</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Source</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Stream</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Source Field</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Target Key</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Type</span>
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-[var(--text-label)] text-xs font-medium">Status</span>
                      </div>
                      <div className="px-1 py-3" />
                    </div>

                    {/* Field rows */}
                    {catFields.length > 0 ? (
                      catFields.map((field, idx) => (
                        <NewFieldRow key={`${field.source}-${field.sourceKey}-${idx}`} field={field} onEdit={handleEdit} />
                      ))
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <p className="text-[var(--text-label)] text-sm mb-1">No {subTab === "metrics" ? "metrics" : "dimensions"} in {cg.label}</p>
                        <p className="text-[var(--text-dim)] text-xs">
                          {search ? `No results matching "${search}"` : "Fields will appear here once assigned to this category."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Global empty state */}
          {filteredFields.length === 0 && !search && !statusFilter && !sourceFilter && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl px-6 py-12 text-center">
              <p className="text-[var(--text-label)] text-sm mb-1">No {subTab === "metrics" ? "metrics" : "dimensions"} configured yet</p>
              <p className="text-[var(--text-dim)] text-xs">Add your first {subTab === "metrics" ? "metric" : "dimension"} to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <FieldModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditField(null);
        }}
        onSave={(field) => {
          if (editField) {
            onFieldsChange(fields.map((f) => (f === editField ? field : f)));
          } else {
            onFieldsChange([...fields, field]);
          }
          setIsModalOpen(false);
          setEditField(null);
        }}
        editField={editField}
        defaultKind={subTab === "dimensions" || subTab === "dimensions-flow" ? "dimension" : "metric"}
        fields={fields}
      />

      <BulkAddModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={(newFields) => {
          onFieldsChange([...fields, ...newFields]);
          setIsBulkModalOpen(false);
        }}
        defaultKind={subTab === "dimensions" || subTab === "dimensions-flow" ? "dimension" : "metric"}
        fields={fields}
      />
    </div>
  );
}
