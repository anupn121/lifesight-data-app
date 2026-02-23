"use client";

import { useState, useMemo, useCallback } from "react";
import {
  type Field,
  type DataTypeKey,
  DATA_TYPES,
  DATA_SOURCE_PARENTS,
  SOURCE_STREAM_TABLES,
  DEFAULT_TRANSFORMS,
  sourceOptions,
  toColumnName,
} from "./fieldsData";

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newFields: Field[]) => void;
  defaultKind: "metric" | "dimension";
  fields: Field[];
}

interface BulkRow {
  id: string;
  sourceKey: string;
  displayName: string;
  columnName: string;
  dataType: DataTypeKey;
  transformation: string;
  description: string;
  checked: boolean;
}

const TRANSFORMATIONS = ["NONE", "SUM", "AVG", "COUNT", "MIN", "MAX"];
const DATA_TYPE_KEYS = Object.keys(DATA_TYPES) as DataTypeKey[];
const MAX_ROWS = 100;

function deriveDisplayName(sourceKey: string): string {
  return sourceKey
    .replace(/^(metrics|segments|campaign|ad|adGroup|creative)\./i, "")
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Resolve source parent → stream/tables/color
function resolveSource(
  parentKey: string,
  streamKey: string,
  tableName: string
): { sourceName: string; sourceColor: string; tables: string[] } {
  const parentInfo = SOURCE_STREAM_TABLES[parentKey];
  if (parentInfo && parentInfo.streams[streamKey]) {
    const stream = parentInfo.streams[streamKey];
    return {
      sourceName: stream.sources[0] || `${parentKey} ${streamKey}`,
      sourceColor: parentInfo.color,
      tables: stream.tables,
    };
  }
  // DATA_SOURCE_PARENTS case (BigQuery, Google Sheets, etc.) — free-text table
  const opt = sourceOptions.find((s) => s.name === parentKey);
  return {
    sourceName: parentKey,
    sourceColor: opt?.color || "#9CA3AF",
    tables: tableName ? [tableName] : [],
  };
}

export default function BulkAddModal({
  isOpen,
  onClose,
  onSave,
  defaultKind,
  fields,
}: BulkAddModalProps) {
  // Step 1 context state
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<"metric" | "dimension">(defaultKind);
  const [parentKey, setParentKey] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [tableName, setTableName] = useState("");
  const [defaultDataType, setDefaultDataType] = useState<DataTypeKey>("STRING");
  const [rawInput, setRawInput] = useState("");

  // Step 2 grid state
  const [rows, setRows] = useState<BulkRow[]>([]);

  // Derived: is this a DATA_SOURCE_PARENTS source?
  const isFreeTextSource = DATA_SOURCE_PARENTS.has(parentKey);
  const parentKeys = useMemo(
    () => [
      ...Object.keys(SOURCE_STREAM_TABLES),
      ...Array.from(DATA_SOURCE_PARENTS),
    ].filter((v, i, a) => a.indexOf(v) === i),
    []
  );
  const streamKeys = useMemo(() => {
    if (!parentKey || isFreeTextSource) return [];
    const info = SOURCE_STREAM_TABLES[parentKey];
    return info ? Object.keys(info.streams) : [];
  }, [parentKey, isFreeTextSource]);

  // Existing column names for duplicate detection
  const existingColumnNames = useMemo(
    () => new Set(fields.map((f) => f.columnName)),
    [fields]
  );

  // Detect duplicate column names within rows + existing fields
  const duplicateColumns = useMemo(() => {
    const dupes = new Set<string>();
    const seen = new Map<string, number>();
    for (let i = 0; i < rows.length; i++) {
      const cn = rows[i].columnName;
      if (!cn) continue;
      if (existingColumnNames.has(cn)) dupes.add(cn);
      if (seen.has(cn)) {
        dupes.add(cn);
      }
      seen.set(cn, i);
    }
    return dupes;
  }, [rows, existingColumnNames]);

  const selectedRows = rows.filter((r) => r.checked);
  const hasValidationErrors = selectedRows.some(
    (r) => !r.columnName || duplicateColumns.has(r.columnName)
  );

  // Parse raw input into rows
  const handleGeneratePreview = useCallback(() => {
    const lines = rawInput
      .split(/[\n,\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const limited = lines.slice(0, MAX_ROWS);
    const newRows: BulkRow[] = limited.map((sourceKey, i) => {
      const display = deriveDisplayName(sourceKey);
      const colName = toColumnName(display);
      return {
        id: `bulk-${Date.now()}-${i}`,
        sourceKey,
        displayName: display,
        columnName: colName,
        dataType: defaultDataType,
        transformation: DEFAULT_TRANSFORMS[defaultDataType] || "NONE",
        description: "",
        checked: true,
      };
    });
    setRows(newRows);
    setStep(2);
  }, [rawInput, defaultDataType]);

  // Row update helper
  const updateRow = useCallback(
    (id: string, updates: Partial<BulkRow>) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...updates };
          // If dataType changed, re-apply default transform
          if (updates.dataType && updates.dataType !== r.dataType) {
            updated.transformation =
              DEFAULT_TRANSFORMS[updates.dataType] || "NONE";
          }
          return updated;
        })
      );
    },
    []
  );

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, checked })));
  }, []);

  // Batch controls
  const setAllTypes = useCallback((dt: DataTypeKey) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        dataType: dt,
        transformation: DEFAULT_TRANSFORMS[dt] || "NONE",
      }))
    );
  }, []);

  const setAllTransforms = useCallback((t: string) => {
    setRows((prev) => prev.map((r) => ({ ...r, transformation: t })));
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    const { sourceName, sourceColor, tables } = resolveSource(
      parentKey,
      streamKey,
      tableName
    );
    const newFields: Field[] = selectedRows.map((row) => ({
      name: row.columnName,
      displayName: row.displayName,
      columnName: row.columnName,
      kind,
      source: sourceName,
      sourceColor,
      sourceKey: row.sourceKey,
      dataType: row.dataType,
      transformation: row.transformation,
      status: row.displayName.trim() ? "Mapped" : "Unmapped",
      description: row.description,
      transformationFormula:
        row.transformation !== "NONE"
          ? `${row.transformation}(${row.sourceKey})`
          : "",
      tables,
      currencyConfig:
        row.dataType === "CURRENCY"
          ? { code: "USD", symbol: "$" }
          : undefined,
    }));
    onSave(newFields);
  }, [selectedRows, parentKey, streamKey, tableName, kind, onSave]);

  // Reset when closing
  const handleClose = () => {
    setStep(1);
    setKind(defaultKind);
    setParentKey("");
    setStreamKey("");
    setTableName("");
    setDefaultDataType("STRING");
    setRawInput("");
    setRows([]);
    onClose();
  };

  if (!isOpen) return null;

  const allChecked = rows.length > 0 && rows.every((r) => r.checked);
  const someChecked = rows.some((r) => r.checked) && !allChecked;
  const warningText =
    rawInput.split(/[\n,\t]+/).filter((s) => s.trim()).length > MAX_ROWS
      ? `Only the first ${MAX_ROWS} entries will be imported.`
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Bulk Add Fields
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Add multiple fields at once from a single source
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mr-8">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: step === 1 ? "#6941c6" : "var(--bg-badge)",
                color: step === 1 ? "#fff" : "var(--text-muted)",
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background:
                    step === 1 ? "rgba(255,255,255,0.2)" : "transparent",
                  border:
                    step !== 1
                      ? "1px solid var(--border-secondary)"
                      : "none",
                }}
              >
                1
              </span>
              Context
            </div>
            <div
              className="w-6 h-px"
              style={{ background: "var(--border-secondary)" }}
            />
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: step === 2 ? "#6941c6" : "var(--bg-badge)",
                color: step === 2 ? "#fff" : "var(--text-muted)",
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background:
                    step === 2 ? "rgba(255,255,255,0.2)" : "transparent",
                  border:
                    step !== 2
                      ? "1px solid var(--border-secondary)"
                      : "none",
                }}
              >
                2
              </span>
              Review
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step === 1 ? (
            <Step1
              kind={kind}
              setKind={setKind}
              parentKey={parentKey}
              setParentKey={(v) => {
                setParentKey(v);
                setStreamKey("");
                setTableName("");
              }}
              streamKey={streamKey}
              setStreamKey={setStreamKey}
              tableName={tableName}
              setTableName={setTableName}
              defaultDataType={defaultDataType}
              setDefaultDataType={setDefaultDataType}
              rawInput={rawInput}
              setRawInput={setRawInput}
              parentKeys={parentKeys}
              streamKeys={streamKeys}
              isFreeTextSource={isFreeTextSource}
              warningText={warningText}
              onGenerate={handleGeneratePreview}
            />
          ) : (
            <Step2
              rows={rows}
              updateRow={updateRow}
              deleteRow={deleteRow}
              toggleAll={toggleAll}
              allChecked={allChecked}
              someChecked={someChecked}
              duplicateColumns={duplicateColumns}
              setAllTypes={setAllTypes}
              setAllTransforms={setAllTransforms}
              selectedCount={selectedRows.length}
              totalCount={rows.length}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-primary)]">
          {step === 2 ? (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-badge)] hover:bg-[var(--hover-item)] rounded-lg transition-colors"
              >
                &larr; Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">
                  After adding, click any field to configure advanced
                  transformations (multiply, divide, round, etc.)
                </span>
                <button
                  onClick={handleSave}
                  disabled={selectedRows.length === 0 || hasValidationErrors}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#6941c6] hover:bg-[#5b34b5] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add {selectedRows.length} Field
                  {selectedRows.length !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-badge)] hover:bg-[var(--hover-item)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePreview}
                disabled={
                  !rawInput.trim() ||
                  !parentKey ||
                  (!isFreeTextSource && !streamKey) ||
                  (isFreeTextSource && !tableName)
                }
                className="px-4 py-2 text-xs font-medium text-white bg-[#6941c6] hover:bg-[#5b34b5] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Generate Preview &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Define Context ───
function Step1({
  kind,
  setKind,
  parentKey,
  setParentKey,
  streamKey,
  setStreamKey,
  tableName,
  setTableName,
  defaultDataType,
  setDefaultDataType,
  rawInput,
  setRawInput,
  parentKeys,
  streamKeys,
  isFreeTextSource,
  warningText,
  onGenerate,
}: {
  kind: "metric" | "dimension";
  setKind: (k: "metric" | "dimension") => void;
  parentKey: string;
  setParentKey: (v: string) => void;
  streamKey: string;
  setStreamKey: (v: string) => void;
  tableName: string;
  setTableName: (v: string) => void;
  defaultDataType: DataTypeKey;
  setDefaultDataType: (v: DataTypeKey) => void;
  rawInput: string;
  setRawInput: (v: string) => void;
  parentKeys: string[];
  streamKeys: string[];
  isFreeTextSource: boolean;
  warningText: string;
  onGenerate: () => void;
}) {
  const inputStyle =
    "w-full bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#6941c6] transition-colors";

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Kind toggle */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
          Field Kind
        </label>
        <div className="flex gap-2">
          {(["metric", "dimension"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                kind === k
                  ? "bg-[#6941c6] text-white"
                  : "bg-[var(--bg-badge)] text-[var(--text-secondary)] hover:bg-[var(--hover-item)]"
              }`}
            >
              {k === "metric" ? "Metric" : "Dimension"}
            </button>
          ))}
        </div>
      </div>

      {/* Source parent */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
          Source
        </label>
        <select
          value={parentKey}
          onChange={(e) => setParentKey(e.target.value)}
          className={inputStyle}
        >
          <option value="">Select a source...</option>
          {parentKeys.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Stream or table name */}
      {parentKey && !isFreeTextSource && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
            Stream
          </label>
          <select
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            className={inputStyle}
          >
            <option value="">Select a stream...</option>
            {streamKeys.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      {parentKey && isFreeTextSource && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
            Table / Sheet Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g., my_dataset.my_table"
            className={inputStyle}
          />
        </div>
      )}

      {/* Default data type */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
          Default Data Type
        </label>
        <select
          value={defaultDataType}
          onChange={(e) => setDefaultDataType(e.target.value as DataTypeKey)}
          className={inputStyle}
        >
          {DATA_TYPE_KEYS.map((dt) => (
            <option key={dt} value={dt}>
              {DATA_TYPES[dt].display} ({dt})
            </option>
          ))}
        </select>
      </div>

      {/* Textarea for source columns */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-label)] mb-1.5">
          Source Columns
        </label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={`Paste source column names here, separated by newlines, commas, or tabs.\n\nExample:\nmetrics.costMicros\nmetrics.impressions\nmetrics.clicks\nsegments.date`}
          rows={8}
          className={`${inputStyle} resize-y font-mono text-xs`}
        />
        {warningText && (
          <p className="text-xs text-amber-500 mt-1">{warningText}</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Review Grid ───
function Step2({
  rows,
  updateRow,
  deleteRow,
  toggleAll,
  allChecked,
  someChecked,
  duplicateColumns,
  setAllTypes,
  setAllTransforms,
  selectedCount,
  totalCount,
}: {
  rows: BulkRow[];
  updateRow: (id: string, updates: Partial<BulkRow>) => void;
  deleteRow: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  allChecked: boolean;
  someChecked: boolean;
  duplicateColumns: Set<string>;
  setAllTypes: (dt: DataTypeKey) => void;
  setAllTransforms: (t: string) => void;
  selectedCount: number;
  totalCount: number;
}) {
  const cellBase = "px-2 py-2 text-xs";
  const inputBase =
    "w-full bg-[var(--bg-main)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[#6941c6] transition-colors";
  const selectBase =
    "w-full bg-[var(--bg-main)] border border-[var(--border-primary)] rounded px-1.5 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[#6941c6] transition-colors";

  return (
    <div className="space-y-3">
      {/* Batch controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-label)]">
            Set all types to:
          </span>
          <select
            onChange={(e) => setAllTypes(e.target.value as DataTypeKey)}
            className="bg-[var(--bg-main)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Choose...
            </option>
            {DATA_TYPE_KEYS.map((dt) => (
              <option key={dt} value={dt}>
                {DATA_TYPES[dt].display}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-label)]">
            Set all transforms to:
          </span>
          <select
            onChange={(e) => setAllTransforms(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Choose...
            </option>
            {TRANSFORMATIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {selectedCount} of {totalCount} selected
        </span>
      </div>

      {/* Grid */}
      <div className="border border-[var(--border-primary)] rounded-lg overflow-auto max-h-[50vh]">
        <table className="w-full text-left" style={{ minWidth: 900 }}>
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-badge)]">
              <th className={`${cellBase} w-8`}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="accent-[#6941c6]"
                />
              </th>
              <th className={`${cellBase} text-[var(--text-label)] font-medium`}>
                Source Column
              </th>
              <th className={`${cellBase} text-[var(--text-label)] font-medium`}>
                Display Name
              </th>
              <th className={`${cellBase} text-[var(--text-label)] font-medium`}>
                Column Name
              </th>
              <th
                className={`${cellBase} text-[var(--text-label)] font-medium w-[110px]`}
              >
                Type
              </th>
              <th
                className={`${cellBase} text-[var(--text-label)] font-medium w-[100px]`}
              >
                Transform
              </th>
              <th className={`${cellBase} text-[var(--text-label)] font-medium`}>
                Description
              </th>
              <th className={`${cellBase} w-8`} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isDuplicate = duplicateColumns.has(row.columnName);
              return (
                <tr
                  key={row.id}
                  className={
                    i % 2 === 1
                      ? "bg-[var(--hover-item)]"
                      : ""
                  }
                >
                  <td className={cellBase}>
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(e) =>
                        updateRow(row.id, { checked: e.target.checked })
                      }
                      className="accent-[#6941c6]"
                    />
                  </td>
                  <td className={cellBase}>
                    <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                      {row.sourceKey}
                    </span>
                  </td>
                  <td className={cellBase}>
                    <input
                      type="text"
                      value={row.displayName}
                      onChange={(e) => {
                        const display = e.target.value;
                        updateRow(row.id, {
                          displayName: display,
                          columnName: toColumnName(display),
                        });
                      }}
                      className={inputBase}
                    />
                  </td>
                  <td className={cellBase}>
                    <input
                      type="text"
                      value={row.columnName}
                      onChange={(e) =>
                        updateRow(row.id, { columnName: e.target.value })
                      }
                      className={`${inputBase} font-mono ${
                        isDuplicate
                          ? "!border-red-500 !ring-1 !ring-red-500/30"
                          : ""
                      }`}
                    />
                    {isDuplicate && (
                      <span className="text-[10px] text-red-500">
                        Duplicate
                      </span>
                    )}
                  </td>
                  <td className={cellBase}>
                    <select
                      value={row.dataType}
                      onChange={(e) =>
                        updateRow(row.id, {
                          dataType: e.target.value as DataTypeKey,
                        })
                      }
                      className={selectBase}
                    >
                      {DATA_TYPE_KEYS.map((dt) => (
                        <option key={dt} value={dt}>
                          {DATA_TYPES[dt].display}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={cellBase}>
                    <select
                      value={row.transformation}
                      onChange={(e) =>
                        updateRow(row.id, { transformation: e.target.value })
                      }
                      className={selectBase}
                    >
                      {TRANSFORMATIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={cellBase}>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.id, { description: e.target.value })
                      }
                      placeholder="Optional"
                      className={inputBase}
                    />
                  </td>
                  <td className={cellBase}>
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      title="Remove row"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
