"use client";

import { useState, useMemo } from "react";
import {
  type Field,
  type DataTypeKey,
  DATA_TYPES,
  DATA_SOURCE_PARENTS,
  SOURCE_STREAM_TABLES,
  CURRENCY_OPTIONS,
  getSourceStreamInfo,
  toColumnName,
  sourceOptions,
} from "../fieldsData";

// --- Transformation Step Types ---
export interface TransformStep {
  id: string;
  operation: string;
  value: string;
}

const AGGREGATIONS = [
  { key: "NONE", label: "No Aggregation", icon: "\u2014", desc: "Use the raw value as-is, no math applied.", color: "border-[var(--border-secondary)] text-[var(--text-label)]" },
  { key: "SUM", label: "Add Up All Values", icon: "\u03A3", desc: "Add up all values across rows. Good for totals like spend or revenue.", color: "border-[#00bc7d]/40 text-[#00bc7d]" },
  { key: "AVG", label: "Calculate Average", icon: "x\u0304", desc: "Calculate the mean value. Good for rates like CTR or frequency.", color: "border-[#2b7fff]/40 text-[#60a5fa]" },
  { key: "COUNT", label: "Count Entries", icon: "#", desc: "Count how many rows have this value. Good for counting events.", color: "border-[#fe9a00]/40 text-[#fbbf24]" },
  { key: "MIN", label: "Find Minimum", icon: "\u2193", desc: "Find the smallest value.", color: "border-[#027b8e]/40 text-[#a78bfa]" },
  { key: "MAX", label: "Find Maximum", icon: "\u2191", desc: "Find the largest value.", color: "border-[#027b8e]/40 text-[#a78bfa]" },
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

// --- Badge component used by FieldModal ---

const DataTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    CURRENCY: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    FLOAT64: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    NUMERIC: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    INT64: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    STRING: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    DATE: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    BIGNUMERIC: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    JSON: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    Currency: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    Percentage: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    Ratio: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Number: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    String: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Enum: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
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
          <div className="bg-[#fe9a00]/5 border border-[#fe9a00]/20 rounded-[6px] px-3 py-2">
            <p className="text-[10px] text-[#fbbf24] leading-relaxed">
              Advanced mode: write your formula directly. Use SQL expressions like SUM, AVG, NULLIF, CASE WHEN, etc. The source key is <code className="bg-[var(--bg-badge)] px-1 rounded text-[#a78bfa]">{sourceKey || "column"}</code>.
            </p>
          </div>
          <textarea
            value={advancedFormula}
            onChange={(e) => onAdvancedFormulaChange(e.target.value)}
            placeholder={`e.g., SUM(${sourceKey || "column"}) * 100 / NULLIF(denominator, 0)`}
            rows={3}
            className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors font-mono resize-none"
          />
        </div>
      ) : (
        <>
          {/* Step 1: Aggregation selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-[#027b8e] flex items-center justify-center text-[8px] text-white font-bold">1</span>
              <span className="text-[11px] text-[var(--text-secondary)]">How should this field be aggregated?</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {AGGREGATIONS.map((agg) => (
                <button
                  key={agg.key}
                  onClick={() => onAggregationChange(agg.key)}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-[6px] border transition-all text-center ${
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
              <span className="w-4 h-4 rounded-full bg-[#027b8e] flex items-center justify-center text-[8px] text-white font-bold">2</span>
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
                    <div key={step.id} className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[6px] px-4 py-3">
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
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] w-20 font-mono focus:outline-none focus:border-[#027b8e] transition-colors"
                          placeholder={opDef.placeholder}
                        />
                      )}
                      {opDef.inputType === "text" && (
                        <input
                          type="text"
                          value={step.value}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] flex-1 font-mono focus:outline-none focus:border-[#027b8e] transition-colors"
                          placeholder={opDef.placeholder}
                        />
                      )}
                      {opDef.inputType === "select" && (
                        <select
                          value={step.value}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-dashed border-[var(--border-secondary)] text-[var(--text-label)] text-xs hover:border-[#027b8e] hover:text-[#a78bfa] transition-colors w-full justify-center"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Add a step
              </button>
            ) : (
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[6px] p-2 flex flex-col gap-1">
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
        <div className="bg-[#00bc7d]/5 border border-[#00bc7d]/20 rounded-[6px] px-3 py-2">
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
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[12px] w-full max-w-[900px] flex flex-col">
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
            <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-[6px] p-0.5 w-fit">
              <button
                onClick={() => update("kind", "metric")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.kind === "metric" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Metric
              </button>
              <button
                onClick={() => update("kind", "dimension")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${form.kind === "dimension" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
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
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
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
                  className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors"
                />
              ) : isSingleStream ? (
                <div className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-label)] px-3 py-2">
                  {streamNames[0]}
                </div>
              ) : (
                <select
                  value={selectedStream}
                  onChange={(e) => handleStreamChange(e.target.value)}
                  className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
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
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors font-mono"
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
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors"
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
                columnNameError ? "border-[#ef4444] focus:border-[#ef4444]" : "border-[var(--border-secondary)] focus:border-[#027b8e]"
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
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
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
                className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
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
              className="bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md text-xs text-[var(--text-secondary)] px-3 py-2 w-full placeholder-[#475467] focus:outline-none focus:border-[#027b8e] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-[6px] h-[28px] text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canSave) onSave(buildSaveField());
            }}
            disabled={!canSave}
            className="flex-1 bg-[#027b8e] hover:bg-[#025e6d] disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] h-[28px] text-[12px] text-white font-medium transition-colors flex items-center justify-center"
          >
            {isEdit ? "Save Changes" : "Add Field"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldModal;
