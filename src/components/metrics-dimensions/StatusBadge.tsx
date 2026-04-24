"use client";

import type { Field } from "../fieldsData";

// ─── Display-only status state machine ─────────────────────────────────────
// `Field.status` is stored as just "Mapped" | "Unmapped" for backward compat.
// `FieldDisplayStatus` is richer — it's computed at render time from the
// field + workspace context (suggestions, dependencies, draft state).

export type FieldDisplayStatus =
  | "Unmapped"    // user hasn't touched it
  | "Draft"       // editor opened but unsaved
  | "Mapped"      // displayName + category set
  | "Validated"   // user confirmed sample data looks right
  | "Broken";     // downstream derived metric references a renamed/deleted column

export const FIELD_STATUS_LABELS: Record<FieldDisplayStatus, string> = {
  Unmapped: "Unmapped",
  Draft: "Draft",
  Mapped: "Mapped",
  Validated: "Validated",
  Broken: "Broken",
};

// Palette matches `src/components/integrations-monitoring/statusConfig.ts`
// so the two tabs feel like one design system.
export const fieldStatusConfig: Record<
  FieldDisplayStatus,
  { color: string; dotColor: string; bg: string; borderColor: string }
> = {
  Unmapped: {
    color: "text-[#71717a]",
    dotColor: "bg-[#71717a]",
    bg: "",
    borderColor: "border-[#71717a]/30",
  },
  Draft: {
    color: "text-[#fe9a00]",
    dotColor: "bg-[#fe9a00]",
    bg: "bg-[#fe9a00]/5",
    borderColor: "border-[#fe9a00]/30",
  },
  Mapped: {
    color: "text-[#00bc7d]",
    dotColor: "bg-[#00bc7d]",
    bg: "",
    borderColor: "border-[#00bc7d]/30",
  },
  Validated: {
    color: "text-[#00bc7d]",
    dotColor: "bg-[#00bc7d]",
    bg: "bg-[#00bc7d]/5",
    borderColor: "border-[#00bc7d]/40",
  },
  Broken: {
    color: "text-[#ff2056]",
    dotColor: "bg-[#ff2056]",
    bg: "bg-[#ff2056]/5",
    borderColor: "border-[#ff2056]/30",
  },
};

// ─── Status derivation ─────────────────────────────────────────────────────

/**
 * Compute the display status for a field given the full workspace context.
 *
 * Order of precedence (highest wins):
 *   Broken → Validated → Mapped → Draft → Unmapped
 */
export function getFieldDisplayStatus(
  field: Field,
  opts: {
    allFields: Field[];
    isDraft?: boolean;
  },
): FieldDisplayStatus {
  // Broken: a derived metric whose formula references a column that doesn't exist
  if (field.transformationFormula) {
    const referenced = extractReferencedColumns(field.transformationFormula);
    const availableColumns = new Set(
      opts.allFields.filter((f) => f !== field).map((f) => f.columnName).filter(Boolean),
    );
    const missing = referenced.filter((col) => !availableColumns.has(col));
    if (field.displayName && missing.length > 0 && referenced.length > 0) {
      return "Broken";
    }
  }

  if (field.status === "Mapped") {
    if (field.validated) return "Validated";
    return "Mapped";
  }

  if (opts.isDraft) return "Draft";
  return "Unmapped";
}

/**
 * Extract column identifiers from a SQL-ish formula. Very light parser —
 * pulls out bare identifiers that aren't SQL keywords or numbers.
 */
export function extractReferencedColumns(formula: string): string[] {
  const RESERVED = new Set([
    "SUM", "AVG", "COUNT", "MIN", "MAX", "ROUND", "ABS", "LEAST", "GREATEST",
    "NULLIF", "CAST", "AS", "CASE", "WHEN", "THEN", "ELSE", "END", "DATE",
    "EXTRACT", "FROM", "COALESCE", "AND", "OR", "NOT", "IS", "NULL",
  ]);
  const tokens = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (RESERVED.has(t.toUpperCase())) continue;
    seen.add(t);
  }
  return Array.from(seen);
}

// ─── Rendering ─────────────────────────────────────────────────────────────

export function StatusBadge({
  status,
  size = "sm",
  solid = false,
}: {
  status: FieldDisplayStatus;
  size?: "sm" | "xs";
  solid?: boolean;
}) {
  const cfg = fieldStatusConfig[status];
  const label = FIELD_STATUS_LABELS[status];

  const sizeCls =
    size === "xs"
      ? "px-2 py-[2px] text-[10px]"
      : "px-2.5 py-1 text-[10px]";

  const dotSize = size === "xs" ? "w-1.5 h-1.5" : "w-1.5 h-1.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border font-semibold uppercase tracking-wide ${sizeCls} ${cfg.color} ${cfg.borderColor} ${solid ? cfg.bg : ""}`}
    >
      <span className={`${dotSize} rounded-full ${cfg.dotColor}`} />
      {label}
    </span>
  );
}

/**
 * Dot-only version — for inline use in dense tables where a full badge is too heavy.
 */
export function StatusDot({ status, size = 8 }: { status: FieldDisplayStatus; size?: number }) {
  const cfg = fieldStatusConfig[status];
  return (
    <span
      className={`inline-block rounded-full ${cfg.dotColor}`}
      style={{ width: size, height: size }}
      aria-label={FIELD_STATUS_LABELS[status]}
    />
  );
}
