"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  FIELD MODAL — Unified Mapped + Derived
// ═══════════════════════════════════════════════════════════════════════════
//
//  Single modal with two value-source modes:
//
//  • "Source column" — map a column from a connected integration; ingest
//    transforms (SUM / CAST / currency normalization) apply automatically.
//
//  • "Expression" — write an arbitrary SQL-ish formula that references
//    existing fields. Supports nested operations:
//        ((revenue - cost) / revenue) * 100
//
//  Both modes share the Identity section (display name, column name, data
//  type, currency) so users can flip between them without losing work.
//  The right pane adapts to the active mode — sample data for source,
//  live formula output for expression.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import {
  type Field,
  type DataTypeKey,
  DATA_TYPES,
  DATA_SOURCE_PARENTS,
  SOURCE_STREAM_TABLES,
  CURRENCY_OPTIONS,
  getSourceStreamInfo,
  toColumnName,
} from "../fieldsData";
import { SampleDataPreview } from "./SampleDataPreview";
import { buildSampleRowMap, evaluateFormulaOverSamples } from "./sampleDataMock";
import { extractReferencedColumns } from "./StatusBadge";
import { Combobox } from "./Combobox";
import { ExpressionEditor } from "./ExpressionEditor";
import {
  getSourceColumnOptions,
  getDisplayNameOptions,
  getColumnNameOptions,
  getDataTypeOptions,
  getCurrencyOptions,
  getSourceParentOptions,
  getStreamOptions,
} from "./fieldOptionLists";

// ─── UI constants ─────────────────────────────────────────────────────────

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]";
const FIELD_LABEL = "text-xs font-medium text-[var(--text-secondary)] mb-1.5 block";
const INPUT =
  "bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 w-full placeholder-[var(--text-dim)] focus:outline-none focus:border-[#027b8e] focus:ring-1 focus:ring-[#027b8e]/30 transition-all";

type ValueMode = "source" | "expression";

const DERIVED_SOURCE = "Derived";
const DERIVED_COLOR = "#a78bfa";
const MAPPED_ACCENT = "#027b8e";

function isDerivedField(f: Field | null): boolean {
  return !!f && f.source === DERIVED_SOURCE;
}

// ─── Section container ────────────────────────────────────────────────────

function Section({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className={SECTION_LABEL}>{label}</div>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Formula + live-output preview ────────────────────────────────────────

function FormulaPreview({ formula, sampleOutput }: { formula: string; sampleOutput: string[] }) {
  const hasFormula = formula.trim().length > 0;
  return (
    <div className="rounded-[10px] bg-[var(--bg-card-inner)] border border-[var(--border-primary)] overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#a78bfa] to-[#6941c6]" />
      <div className="px-4 py-3 pl-5 border-b border-[var(--border-primary)] flex items-center gap-2">
        <div className="w-5 h-5 rounded-[4px] bg-[#a78bfa]/15 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 6L3 9V3Z" fill="#a78bfa" />
          </svg>
        </div>
        <span className={SECTION_LABEL}>Formula</span>
      </div>
      <div className="px-4 py-4 pl-5 flex flex-col gap-3">
        <div className="bg-[#0a0a0f] rounded-[6px] px-3 py-2.5 font-mono text-sm text-[#a78bfa] break-all border border-[var(--border-subtle)]">
          {hasFormula ? formula : <span className="text-[var(--text-dim)]">Your formula will appear here</span>}
        </div>
        {hasFormula && sampleOutput.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1.5 font-semibold">
              Sample output
            </div>
            <div className="flex flex-col gap-1">
              {sampleOutput.map((v, i) => (
                <div key={i} className="font-mono text-sm text-[#00bc7d] flex items-center gap-2">
                  <span className="text-[var(--text-dim)] text-xs w-6">#{i + 1}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dependencies card ────────────────────────────────────────────────────

type Dependency = { label: string; columnName: string; missing: boolean };

function DependenciesCard({
  dependencies,
  variant,
}: {
  dependencies: Dependency[];
  variant: "used-by" | "references";
}) {
  if (dependencies.length === 0) return null;
  return (
    <div className="rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-card-inner)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-primary)]">
        <div className="w-5 h-5 rounded-[4px] bg-[#fe9a00]/15 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M4 4h4v4H4zM4 4l-2-2M8 4l2-2M8 8l2 2M4 8l-2 2"
              stroke="#fe9a00"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={SECTION_LABEL}>{variant === "used-by" ? "Used by" : "References"}</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {dependencies.map((d, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-[4px] text-xs font-mono border ${
                d.missing
                  ? "text-[#ff2056] border-[#ff2056]/30 bg-[#ff2056]/5"
                  : "text-[var(--text-secondary)] border-[var(--border-secondary)] bg-[var(--bg-card)]"
              }`}
              title={d.missing ? "Not found in workspace" : d.label}
            >
              {d.label}
              {d.missing && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v3m0 1.5v0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </span>
          ))}
        </div>
        {variant === "used-by" && (
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Renaming this column will require updating these metrics.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Right preview pane ───────────────────────────────────────────────────

function RightPreviewPane({
  valueMode,
  form,
  columnName,
  expression,
  allFields,
  editField,
}: {
  valueMode: ValueMode;
  form: Field;
  columnName: string;
  expression: string;
  allFields: Field[];
  editField: Field | null;
}) {
  // Live sample output for expressions
  const sampleRowMap = useMemo(() => buildSampleRowMap(allFields, 5), [allFields]);
  const sampleOutput = useMemo(() => {
    if (valueMode !== "expression" || !expression.trim()) return [];
    return evaluateFormulaOverSamples(expression, sampleRowMap, 5);
  }, [valueMode, expression, sampleRowMap]);

  // Dependencies — differ by mode
  const dependencies = useMemo<Dependency[]>(() => {
    if (valueMode === "source") {
      if (!columnName) return [];
      return allFields
        .filter(
          (f) =>
            f.source === DERIVED_SOURCE &&
            f !== editField &&
            f.transformationFormula &&
            extractReferencedColumns(f.transformationFormula).includes(columnName),
        )
        .map((f) => ({
          label: f.displayName || f.columnName || f.name,
          columnName: f.columnName,
          missing: false,
        }));
    }
    if (!expression) return [];
    const refs = extractReferencedColumns(expression);
    const available = new Set(allFields.map((f) => f.columnName).filter(Boolean));
    return refs.map((r) => ({ label: r, columnName: r, missing: !available.has(r) }));
  }, [valueMode, allFields, editField, columnName, expression]);

  return (
    <div className="flex flex-col gap-4">
      {valueMode === "expression" ? (
        <FormulaPreview formula={expression} sampleOutput={sampleOutput} />
      ) : (
        <SampleDataPreview field={form} rows={5} />
      )}
      <DependenciesCard
        dependencies={dependencies}
        variant={valueMode === "source" ? "used-by" : "references"}
      />
    </div>
  );
}

// ─── Identity section (shared by both modes) ──────────────────────────────

function IdentitySection({
  form,
  setForm,
  columnName,
  onColumnNameChange,
  onColumnNameEdit,
  columnNameError,
  selectedCurrency,
  onCurrencyChange,
  workspaceFields,
  editField,
}: {
  form: Field;
  setForm: (f: Field) => void;
  columnName: string;
  onColumnNameChange: (v: string) => void;
  onColumnNameEdit: () => void;
  columnNameError: string;
  selectedCurrency: string;
  onCurrencyChange: (v: string) => void;
  workspaceFields: Field[];
  editField: Field | null;
}) {
  const displayNameOptions = useMemo(
    () => getDisplayNameOptions(form.sourceKey),
    [form.sourceKey],
  );
  const columnNameOptions = useMemo(
    () => getColumnNameOptions(form.displayName, workspaceFields, editField),
    [form.displayName, workspaceFields, editField],
  );
  const dataTypeOptions = useMemo(() => getDataTypeOptions(), []);
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);

  return (
    <div className="flex flex-col gap-6">
      {/* Kind toggle */}
      <div className="flex items-center gap-3">
        <span className={SECTION_LABEL}>Type</span>
        <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-[8px] p-1">
          {(["metric", "dimension"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setForm({ ...form, kind: k })}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                form.kind === k
                  ? "bg-gradient-to-br from-[#027b8e] to-[#012e36] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {k === "metric" ? "Metric" : "Dimension"}
            </button>
          ))}
        </div>
      </div>

      {/* Define */}
      <Section label="Define" description="How this field appears in your workspace.">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FIELD_LABEL}>Display name</label>
            <Combobox
              value={form.displayName}
              onChange={(v) => {
                setForm({ ...form, displayName: v, status: v.trim() ? "Mapped" : "Unmapped" });
                if (columnName === "" || columnName === toColumnName(form.displayName)) {
                  onColumnNameChange(toColumnName(v));
                }
              }}
              options={displayNameOptions}
              placeholder="e.g., Total Revenue"
              allowCustom
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Column name</label>
            <Combobox
              value={columnName}
              onChange={(v) => {
                onColumnNameChange(v);
                onColumnNameEdit();
              }}
              options={columnNameOptions}
              placeholder="e.g., total_revenue"
              allowCustom
              monospace
              error={!!columnNameError}
            />
          </div>
        </div>
        {columnNameError && <p className="text-xs text-[#d4183d]">{columnNameError}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FIELD_LABEL}>Data type</label>
            <Combobox
              value={form.dataType}
              onChange={(v) => setForm({ ...form, dataType: v as DataTypeKey })}
              options={dataTypeOptions}
              placeholder="Select type…"
            />
          </div>
          {form.dataType === "CURRENCY" && (
            <div>
              <label className={FIELD_LABEL}>Currency</label>
              <Combobox
                value={selectedCurrency}
                onChange={onCurrencyChange}
                options={currencyOptions}
                placeholder="Select currency…"
              />
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Source column editor (mapped mode) ───────────────────────────────────

function SourceColumnEditor({
  form,
  setForm,
  selectedParent,
  selectedStream,
  onParentChange,
  onStreamChange,
  workspaceFields,
}: {
  form: Field;
  setForm: (f: Field) => void;
  selectedParent: string;
  selectedStream: string;
  onParentChange: (p: string) => void;
  onStreamChange: (s: string) => void;
  workspaceFields: Field[];
}) {
  const parentData = selectedParent ? SOURCE_STREAM_TABLES[selectedParent] : null;
  const streamNames = parentData ? Object.keys(parentData.streams) : [];
  const isDataSourceParent = DATA_SOURCE_PARENTS.has(selectedParent);
  const isSingleStream = streamNames.length === 1;

  const sourceColumnOptions = useMemo(
    () => getSourceColumnOptions(form.source, workspaceFields),
    [form.source, workspaceFields],
  );
  const sourceParentOptions = useMemo(() => getSourceParentOptions(), []);
  const streamOptions = useMemo(() => getStreamOptions(selectedParent), [selectedParent]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FIELD_LABEL}>Source</label>
          <Combobox
            value={selectedParent}
            onChange={onParentChange}
            options={sourceParentOptions}
            placeholder="Select source…"
          />
        </div>
        {selectedParent && (
          <div>
            <label className={FIELD_LABEL}>
              {isDataSourceParent ? "Table / Sheet" : "Stream"}
            </label>
            {isSingleStream ? (
              <div className={`${INPUT} text-[var(--text-muted)]`}>{streamNames[0]}</div>
            ) : (
              <Combobox
                value={selectedStream}
                onChange={onStreamChange}
                options={streamOptions}
                placeholder={isDataSourceParent ? "e.g., my_data_table" : "Select stream…"}
                allowCustom={isDataSourceParent}
              />
            )}
          </div>
        )}
      </div>
      <div>
        <label className={FIELD_LABEL}>Source column</label>
        <Combobox
          value={form.sourceKey}
          onChange={(v) => setForm({ ...form, sourceKey: v })}
          options={sourceColumnOptions}
          placeholder="Select or type a column…"
          allowCustom
          monospace
        />
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          The raw field name from the source API. Pick a suggestion or type your own.
        </p>
      </div>
    </div>
  );
}

// ─── Value source mode toggle ─────────────────────────────────────────────

function ValueSourceToggle({
  value,
  onChange,
}: {
  value: ValueMode;
  onChange: (v: ValueMode) => void;
}) {
  const options: { key: ValueMode; label: string; description: string; accent: string; iconPath: string }[] = [
    {
      key: "source",
      label: "Source column",
      description: "Map a column from a connected source",
      accent: MAPPED_ACCENT,
      iconPath: "M4 7h16M4 12h16M4 17h16",
    },
    {
      key: "expression",
      label: "Expression",
      description: "Compute from a formula over other fields",
      accent: DERIVED_COLOR,
      iconPath: "M4 20l4-16m4 16l4-16M3 8h18M3 16h18",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`flex items-center gap-3 p-3 rounded-[10px] border-2 transition-all text-left ${
              selected
                ? "bg-[var(--bg-card-inner)]"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
            }`}
            style={selected ? { borderColor: o.accent } : {}}
          >
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{
                background: selected
                  ? `linear-gradient(135deg, ${o.accent}, ${o.accent}60)`
                  : `${o.accent}18`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d={o.iconPath} stroke={selected ? "white" : o.accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[var(--text-primary)] text-sm font-semibold">{o.label}</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">{o.description}</div>
            </div>
            {selected && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: o.accent }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────

function FieldModal({
  isOpen,
  onClose,
  onSave,
  editField,
  defaultKind,
  fields,
  defaultSource,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: Field) => void;
  editField: Field | null;
  defaultKind: "metric" | "dimension";
  fields: Field[];
  /** Pre-fill the source parent when opening a new field (editField === null). Used by the per-integration "Add field" button. */
  defaultSource?: string;
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
    dataType: "NUMERIC" as DataTypeKey,
    transformation: "NONE",
    status: "Unmapped",
    description: "",
    transformationFormula: "",
    tables: [],
    currencyConfig: undefined,
  };

  const [valueMode, setValueMode] = useState<ValueMode>(
    isDerivedField(editField) ? "expression" : "source",
  );
  const [form, setForm] = useState<Field>(editField ?? emptyField);
  const [selectedParent, setSelectedParent] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [columnName, setColumnName] = useState(editField?.columnName || "");
  const [columnNameManuallyEdited, setColumnNameManuallyEdited] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(
    editField?.currencyConfig?.code || "USD",
  );
  const [expression, setExpression] = useState<string>(editField?.transformationFormula || "");

  // Re-initialize when editField or defaultSource changes (e.g., user clicks
  // "+ Add field" on a different integration's row).
  const [prevEdit, setPrevEdit] = useState<Field | null>(null);
  const [prevDefaultSource, setPrevDefaultSource] = useState<string>("");
  const nextDefaultSource = defaultSource || "";
  if (editField !== prevEdit || nextDefaultSource !== prevDefaultSource) {
    setPrevEdit(editField);
    setPrevDefaultSource(nextDefaultSource);
    if (editField) {
      setForm(editField);
      setColumnName(editField.columnName || "");
      setColumnNameManuallyEdited(false);
      setSelectedCurrency(editField.currencyConfig?.code || "USD");
      const info = getSourceStreamInfo(editField.source);
      setSelectedParent(info.parent);
      setSelectedStream(info.stream);
      setValueMode(isDerivedField(editField) ? "expression" : "source");
      setExpression(editField.transformationFormula || "");
    } else {
      // Pre-fill the source context if caller passed defaultSource (from the
      // per-integration Add field button). Collapses to the same single-source
      // auto-resolve that handleParentChange does.
      const pd = nextDefaultSource ? SOURCE_STREAM_TABLES[nextDefaultSource] : null;
      const streams = pd ? Object.keys(pd.streams) : [];
      const autoStream = streams.length === 1 ? streams[0] : "";
      const streamData = autoStream && pd ? pd.streams[autoStream] : null;
      const autoSourceName =
        streamData && streamData.sources.length > 0 ? streamData.sources[0] : "";
      setForm({
        ...emptyField,
        kind: defaultKind,
        source: autoSourceName,
        sourceColor: autoSourceName && pd ? pd.color : "#9CA3AF",
        tables: streamData ? streamData.tables : [],
      });
      setSelectedParent(pd ? nextDefaultSource : "");
      setSelectedStream(autoStream);
      setColumnName("");
      setColumnNameManuallyEdited(false);
      setSelectedCurrency("USD");
      setValueMode("source");
      setExpression("");
    }
  }

  const columnOptions = useMemo(() => {
    const set = new Set<string>();
    fields.forEach((f) => {
      if (f.columnName) set.add(f.columnName);
    });
    return Array.from(set).sort();
  }, [fields]);

  const columnNameError = useMemo(() => {
    if (!columnName.trim()) return "";
    const existing = fields.find((f) => f.columnName === columnName && f !== editField);
    if (existing)
      return `Column name "${columnName}" is already used by "${existing.displayName} (${existing.source})"`;
    return "";
  }, [columnName, fields, editField]);

  const handleParentChange = (parent: string) => {
    setSelectedParent(parent);
    setSelectedStream("");
    const pd = SOURCE_STREAM_TABLES[parent];
    if (pd) {
      const streams = Object.keys(pd.streams);
      if (streams.length === 1) {
        const streamData = pd.streams[streams[0]];
        setSelectedStream(streams[0]);
        if (streamData.sources.length > 0) {
          setForm((prev) => ({
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
    const pd = SOURCE_STREAM_TABLES[selectedParent];
    if (!pd) return;
    const streamData = pd.streams[stream];
    if (streamData && streamData.sources.length > 0) {
      setForm((prev) => ({
        ...prev,
        source: streamData.sources[0],
        sourceColor: pd.color,
        tables: streamData.tables,
      }));
    }
  };

  const handleColumnNameEdit = () => setColumnNameManuallyEdited(true);
  const handleColumnNameChange = (v: string) => setColumnName(v);

  const buildSaveField = (): Field => {
    if (valueMode === "source") {
      return {
        ...form,
        columnName,
        transformation: "NONE",
        transformationFormula: "",
        currencyConfig:
          form.dataType === "CURRENCY"
            ? {
                code: selectedCurrency,
                symbol:
                  CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$",
              }
            : undefined,
      };
    }
    // Expression mode — respects the user's Metric / Dimension toggle.
    // Dimensions with expressions typically use CASE WHEN for bucketing
    // (e.g., `CASE WHEN country IN ('US','CA') THEN 'NA' ELSE 'Other' END`).
    const refs = extractReferencedColumns(expression);
    const primaryRef = refs[0] || "";
    return {
      ...form,
      source: DERIVED_SOURCE,
      sourceColor: DERIVED_COLOR,
      sourceKey: primaryRef,
      columnName,
      transformation: "DERIVED",
      transformationFormula: expression,
      status: form.displayName.trim() ? "Mapped" : "Unmapped",
      tables: [],
      currencyConfig:
        form.dataType === "CURRENCY"
          ? {
              code: selectedCurrency,
              symbol:
                CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$",
            }
          : undefined,
    };
  };

  const canSave = useMemo(() => {
    if (columnNameError) return false;
    if (!form.displayName.trim()) return false;
    if (!columnName.trim()) return false;
    if (!form.dataType || !(form.dataType in DATA_TYPES)) return false;
    if (valueMode === "source") {
      return !!form.sourceKey.trim() && !!form.source;
    }
    // Expression mode — require non-empty expression AND balanced parens
    const trimmed = expression.trim();
    if (!trimmed) return false;
    const open = (trimmed.match(/\(/g) || []).length;
    const close = (trimmed.match(/\)/g) || []).length;
    if (open !== close) return false;
    return true;
  }, [columnNameError, form, columnName, valueMode, expression]);

  if (!isOpen) return null;

  const headerAccent = valueMode === "source" ? MAPPED_ACCENT : DERIVED_COLOR;

  const resetForAnother = () => {
    setForm((prev) => ({
      ...prev,
      displayName: "",
      columnName: "",
      sourceKey: "",
      description: "",
      status: "Unmapped",
      transformationFormula: "",
    }));
    setColumnName("");
    setColumnNameManuallyEdited(false);
    setExpression("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[14px] w-full max-w-[1180px] flex flex-col overflow-hidden"
        style={{ boxShadow: "var(--shadow-xl)", maxHeight: "calc(100vh - 48px)" }}
      >
        {/* Accent strip (adapts to mode) */}
        <div
          className="h-[3px] w-full transition-colors"
          style={{ background: `linear-gradient(90deg, ${headerAccent}, ${headerAccent}30)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
              style={{ background: `linear-gradient(135deg, ${headerAccent}, ${headerAccent}60)` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d={valueMode === "source" ? "M4 7h16M4 12h16M4 17h16" : "M4 20l4-16m4 16l4-16M3 8h18M3 16h18"}
                  stroke="white"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] text-base font-semibold leading-tight">
                {isEdit ? "Edit field" : "Add field"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Map from a source or build a derived metric — switch any time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body — two-column grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-[1fr_420px]">
          {/* Left: form */}
          <div className="overflow-y-auto px-7 pt-5 pb-6 border-r border-[var(--border-primary)]">
            <div className="flex flex-col gap-6">
              <IdentitySection
                form={form}
                setForm={setForm}
                columnName={columnName}
                onColumnNameChange={handleColumnNameChange}
                onColumnNameEdit={handleColumnNameEdit}
                columnNameError={columnNameError}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                workspaceFields={fields}
                editField={editField}
              />

              <div className="h-px bg-[var(--border-primary)]" />

              {/* Value source */}
              <Section
                label="Value source"
                description={
                  valueMode === "source"
                    ? "Pull the value directly from a connected source."
                    : "Build the value by combining and transforming existing fields."
                }
              >
                <ValueSourceToggle value={valueMode} onChange={setValueMode} />

                <div className="mt-2">
                  {valueMode === "source" ? (
                    <SourceColumnEditor
                      form={form}
                      setForm={setForm}
                      selectedParent={selectedParent}
                      selectedStream={selectedStream}
                      onParentChange={handleParentChange}
                      onStreamChange={handleStreamChange}
                      workspaceFields={fields}
                    />
                  ) : (
                    <ExpressionEditor
                      value={expression}
                      onChange={setExpression}
                      columnOptions={columnOptions}
                    />
                  )}
                </div>
              </Section>

              <Section label="Details">
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this field (optional)"
                  className={INPUT}
                />
              </Section>
            </div>
          </div>

          {/* Right: preview pane */}
          <div className="overflow-y-auto bg-[var(--bg-card-inner)]/40 px-6 pt-5 pb-6">
            <RightPreviewPane
              valueMode={valueMode}
              form={form}
              columnName={columnName}
              expression={expression}
              allFields={fields}
              editField={editField}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                canSave ? "bg-[#00bc7d]" : "bg-[var(--border-secondary)]"
              }`}
            />
            <span>{canSave ? "Ready to save" : "Complete required fields to continue"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-[8px] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
            >
              Cancel
            </button>
            {!isEdit && (
              <button
                onClick={() => {
                  if (!canSave) return;
                  onSave(buildSaveField());
                  resetForAnother();
                }}
                disabled={!canSave}
                className="px-4 h-9 rounded-[8px] border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#027b8e]"
              >
                Save & add another
              </button>
            )}
            <button
              onClick={() => {
                if (canSave) onSave(buildSaveField());
              }}
              disabled={!canSave}
              className="px-5 h-9 rounded-[8px] text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSave
                  ? `linear-gradient(135deg, ${headerAccent}, ${headerAccent}80)`
                  : "var(--bg-badge)",
              }}
            >
              {isEdit ? "Save changes" : valueMode === "source" ? "Add field" : "Add derived metric"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FieldModal;
