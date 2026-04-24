"use client";

import { useMemo } from "react";
import { type Field, getSourceStreamInfo } from "../fieldsData";
import { DataTypeBadge } from "./badges";
import { StatusBadge, getFieldDisplayStatus } from "./StatusBadge";
import { InlineSampleValue } from "./SampleDataPreview";

// ─── Grid templates ────────────────────────────────────────────────────────
// Two variants: with or without the sample-data column. Both have the same
// first 7 columns (select, display, source, stream, source-field, type, status)
// plus the last action column. The sample column sits between source-field
// and type when enabled.

export const TABLE_GRID = "grid-cols-[36px_minmax(0,1fr)_130px_130px_minmax(0,1fr)_90px_120px_36px]";
const TABLE_GRID_SAMPLES = "grid-cols-[36px_minmax(0,1fr)_130px_130px_minmax(0,1fr)_140px_90px_120px_36px]";

export function fieldKey(f: Field): string {
  return `${f.source}::${f.sourceKey || f.columnName || f.name}`;
}

// ─── Table header ──────────────────────────────────────────────────────────

export function FieldTableHeader({
  showSamples = false,
  allSelected = false,
  anySelected = false,
  onToggleAll,
  selectable = false,
}: {
  showSamples?: boolean;
  allSelected?: boolean;
  anySelected?: boolean;
  onToggleAll?: () => void;
  selectable?: boolean;
} = {}) {
  const grid = showSamples ? TABLE_GRID_SAMPLES : TABLE_GRID;
  return (
    <div className={`grid ${grid} border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]`}>
      <div className="px-2 py-2.5 flex items-center justify-center">
        {selectable && (
          <Checkbox
            checked={allSelected}
            indeterminate={anySelected && !allSelected}
            onToggle={onToggleAll ?? (() => {})}
            ariaLabel="Select all"
          />
        )}
      </div>
      <HeaderCell>Display Name</HeaderCell>
      <HeaderCell>Source</HeaderCell>
      <HeaderCell>Stream</HeaderCell>
      <HeaderCell>Source Field</HeaderCell>
      {showSamples && <HeaderCell>Sample</HeaderCell>}
      <HeaderCell>Type</HeaderCell>
      <HeaderCell>Status</HeaderCell>
      <div className="px-1 py-2.5" />
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5">
      <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

interface NewFieldRowProps {
  field: Field;
  onEdit: (field: Field) => void;
  /** When provided, lets the row participate in bulk selection. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (field: Field) => void;
  /** Computed workspace-wide view of the field (brokenness, etc.) */
  allFields?: Field[];
  /** Show an additional sample-data column. */
  showSamples?: boolean;
  onDuplicate?: (field: Field) => void;
  onDelete?: (field: Field) => void;
}

export const NewFieldRow = ({
  field,
  onEdit,
  selectable = false,
  selected = false,
  onToggleSelect,
  allFields,
  showSamples = false,
  onDuplicate,
  onDelete,
}: NewFieldRowProps) => {
  const info = getSourceStreamInfo(field.source);
  const grid = showSamples ? TABLE_GRID_SAMPLES : TABLE_GRID;

  const displayStatus = useMemo(
    () => getFieldDisplayStatus(field, { allFields: allFields || [field] }),
    [field, allFields],
  );

  return (
    <div
      className={`grid ${grid} border-b border-[var(--border-subtle)] transition-colors group ${
        selected ? "bg-[#027b8e]/5 hover:bg-[#027b8e]/8" : "hover:bg-[var(--hover-item)]"
      } ${selectable ? "" : "cursor-pointer"}`}
      onClick={() => !selectable && onEdit(field)}
    >
      {/* Select checkbox */}
      <div className="px-2 py-2.5 flex items-center justify-center">
        {selectable && onToggleSelect && (
          <Checkbox
            checked={selected}
            onToggle={() => onToggleSelect(field)}
            ariaLabel={`Select ${field.displayName || field.sourceKey}`}
          />
        )}
      </div>

      {/* Display Name */}
      <div
        className="px-3 py-2.5 flex items-center gap-2 min-w-0 cursor-pointer"
        onClick={(e) => {
          if (selectable) {
            e.stopPropagation();
            onEdit(field);
          }
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: field.sourceColor }}
        >
          <span className="text-[8px] text-white font-bold">{info.parent[0]}</span>
        </span>
        <span
          className="text-[var(--text-primary)] text-xs font-medium truncate"
          title={field.displayName || field.columnName || field.sourceKey}
        >
          {field.displayName || (
            <span className="text-[var(--text-muted)] italic">Unmapped</span>
          )}
        </span>
      </div>

      {/* Source */}
      <div className="px-3 py-2.5 flex items-center min-w-0 cursor-pointer" onClick={() => selectable && onEdit(field)}>
        <span className="text-[var(--text-secondary)] text-xs truncate" title={info.parent}>
          {info.parent}
        </span>
      </div>

      {/* Stream */}
      <div className="px-3 py-2.5 flex items-center min-w-0 cursor-pointer" onClick={() => selectable && onEdit(field)}>
        <span className="text-[var(--text-muted)] text-xs truncate" title={info.stream}>
          {info.stream}
        </span>
      </div>

      {/* Source field */}
      <div className="px-3 py-2.5 flex items-center min-w-0 cursor-pointer" onClick={() => selectable && onEdit(field)}>
        <code
          className="text-[#a78bfa] text-xs bg-[#a78bfa]/10 px-1.5 py-0.5 rounded font-mono truncate"
          title={field.sourceKey}
        >
          {field.sourceKey || "—"}
        </code>
      </div>

      {/* Sample */}
      {showSamples && (
        <div className="px-3 py-2.5 flex items-center min-w-0 cursor-pointer" onClick={() => selectable && onEdit(field)}>
          <InlineSampleValue field={field} />
        </div>
      )}

      {/* Type */}
      <div className="px-3 py-2.5 flex items-center cursor-pointer" onClick={() => selectable && onEdit(field)}>
        <DataTypeBadge type={field.dataType} />
      </div>

      {/* Status */}
      <div className="px-3 py-2.5 flex items-center cursor-pointer" onClick={() => selectable && onEdit(field)}>
        <StatusBadge status={displayStatus} />
      </div>

      {/* Actions */}
      <div className="px-1 py-2.5 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDuplicate && (
          <IconButton
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(field);
            }}
            iconPath="M4 3h5a2 2 0 0 1 2 2v5M2 7v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1"
          />
        )}
        <IconButton
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(field);
          }}
          iconPath="M8.5 2.5l2 2L4 11l-2 .5.5-2L8.5 2.5z"
        />
        {onDelete && (
          <IconButton
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field);
            }}
            iconPath="M3 3.5h8M5 3.5V2.5A.5.5 0 0 1 5.5 2h3a.5.5 0 0 1 .5.5v1M4 3.5l.5 8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5l.5-8"
            danger
          />
        )}
      </div>
    </div>
  );
};

// ─── Primitives ────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate = false,
  onToggle,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={ariaLabel}
      className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? "bg-[#027b8e] border-[#027b8e]"
          : "border-[var(--border-secondary)] hover:border-[#027b8e]/60 bg-transparent"
      }`}
    >
      {checked && !indeterminate && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2 2 4-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && <span className="w-2 h-[1.5px] bg-white rounded-full" />}
    </button>
  );
}

function IconButton({
  title,
  onClick,
  iconPath,
  danger = false,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  iconPath: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors ${
        danger
          ? "text-[var(--text-muted)] hover:text-[#ff2056] hover:bg-[#ff2056]/8"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)]"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path
          d={iconPath}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ─── Bulk-aware table shell ────────────────────────────────────────────────
// A convenience wrapper that handles its own selection state and sample
// toggle. Used by the category detail view, platform detail view, and the
// inline expand inside IntegrationGroup.

interface FieldTableShellProps {
  fields: Field[];
  allFields: Field[];
  selected: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onEdit: (field: Field) => void;
  onDuplicate?: (field: Field) => void;
  onDelete?: (field: Field) => void;
  showSamples?: boolean;
  selectable?: boolean;
}

export function FieldTableShell({
  fields,
  allFields,
  selected,
  onSelectionChange,
  onEdit,
  onDuplicate,
  onDelete,
  showSamples = false,
  selectable = true,
}: FieldTableShellProps) {
  const allSelected = fields.length > 0 && fields.every((f) => selected.has(fieldKey(f)));
  const anySelected = fields.some((f) => selected.has(fieldKey(f)));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) {
      for (const f of fields) next.delete(fieldKey(f));
    } else {
      for (const f of fields) next.add(fieldKey(f));
    }
    onSelectionChange(next);
  };

  const toggleOne = (f: Field) => {
    const k = fieldKey(f);
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelectionChange(next);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
      <FieldTableHeader
        showSamples={showSamples}
        allSelected={allSelected}
        anySelected={anySelected}
        onToggleAll={toggleAll}
        selectable={selectable}
      />
      {fields.map((f, i) => (
        <NewFieldRow
          key={`${fieldKey(f)}-${i}`}
          field={f}
          allFields={allFields}
          onEdit={onEdit}
          selectable={selectable}
          selected={selected.has(fieldKey(f))}
          onToggleSelect={toggleOne}
          showSamples={showSamples}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
