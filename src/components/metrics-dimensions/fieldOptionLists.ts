// ═══════════════════════════════════════════════════════════════════════════
//  FIELD OPTION LISTS
// ═══════════════════════════════════════════════════════════════════════════
//
//  Produces option lists for each Combobox in the FieldModal. Each function
//  returns `ComboboxOption[]` so the UI can plug them in directly.
// ═══════════════════════════════════════════════════════════════════════════

import type { Field, DataTypeKey } from "../fieldsData";
import {
  DATA_TYPES,
  CURRENCY_OPTIONS,
  SOURCE_STREAM_TABLES,
  DATA_SOURCE_PARENTS,
  getSourceStreamInfo,
} from "../fieldsData";
import type { ComboboxOption } from "./Combobox";

// ─── Canonical metric / dimension names ───────────────────────────────────
// Lightweight list used to populate Combobox dropdowns. Pairs a keyword with
// a display name so we can filter and suggest cleanly.
const CANONICAL_PATTERNS: { keywords: string[]; displayName: string }[] = [
  { keywords: ["spend", "cost"], displayName: "Spend" },
  { keywords: ["impression"], displayName: "Impressions" },
  { keywords: ["click"], displayName: "Clicks" },
  { keywords: ["cpc"], displayName: "CPC" },
  { keywords: ["cpm"], displayName: "CPM" },
  { keywords: ["ctr"], displayName: "CTR" },
  { keywords: ["roas"], displayName: "ROAS" },
  { keywords: ["reach"], displayName: "Reach" },
  { keywords: ["revenue", "gmv", "sales"], displayName: "Revenue" },
  { keywords: ["order", "purchase"], displayName: "Orders" },
  { keywords: ["conversion"], displayName: "Conversions" },
  { keywords: ["install"], displayName: "Installs" },
  { keywords: ["signup", "registration", "lead"], displayName: "Registrations" },
  { keywords: ["store_visit", "foot_traffic"], displayName: "Store Visits" },
  { keywords: ["subscription"], displayName: "Subscriptions" },
  { keywords: ["aov"], displayName: "AOV" },
  { keywords: ["ltv"], displayName: "LTV" },
  { keywords: ["new_customer", "new_user"], displayName: "New Customers" },
  { keywords: ["session"], displayName: "Sessions" },
  { keywords: ["pageview", "page_view"], displayName: "Page Views" },
  { keywords: ["bounce"], displayName: "Bounce Rate" },
  { keywords: ["email_open", "open_rate"], displayName: "Email Opens" },
  { keywords: ["follower"], displayName: "Followers" },
  { keywords: ["weather", "temperature"], displayName: "Weather" },
  { keywords: ["holiday"], displayName: "Holiday" },
  { keywords: ["date", "day"], displayName: "Date" },
  { keywords: ["campaign_name", "campaign"], displayName: "Campaign" },
  { keywords: ["adset_name", "ad_set_name", "ad_group_name"], displayName: "Ad Set" },
  { keywords: ["ad_name"], displayName: "Ad" },
  { keywords: ["country", "region", "geo"], displayName: "Country" },
  { keywords: ["device", "platform"], displayName: "Device" },
  { keywords: ["channel"], displayName: "Channel" },
];

// ─── Source column options ─────────────────────────────────────────────────

/**
 * Source column options are (a) canonical keywords (spend, clicks, etc.) + (b)
 * source keys that other fields in the same source/stream already use. This
 * makes the dropdown serve as both a "what we typically expect" reference
 * and a "copy from a sibling field" shortcut.
 */
export function getSourceColumnOptions(
  source: string,
  fields: Field[],
): ComboboxOption[] {
  const set = new Map<string, ComboboxOption>();

  // Existing source keys from fields in the same source
  for (const f of fields) {
    if (!f.sourceKey) continue;
    if (source && f.source !== source) continue;
    if (!set.has(f.sourceKey)) {
      set.set(f.sourceKey, {
        value: f.sourceKey,
        label: f.sourceKey,
        description: f.displayName || undefined,
      });
    }
  }

  // Canonical keywords (deduped, keep higher weight wins)
  const canonicalKeys = new Set<string>();
  for (const p of CANONICAL_PATTERNS) {
    for (const k of p.keywords) {
      canonicalKeys.add(k);
    }
  }
  canonicalKeys.forEach((k) => {
    if (!set.has(k)) {
      set.set(k, { value: k, label: k });
    }
  });

  return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Display name options ──────────────────────────────────────────────────

/**
 * Canonical display names from fieldSuggestions, deduped. Surfaces names
 * like "Revenue", "Spend", "CTR" that map cleanly to known metrics.
 */
export function getDisplayNameOptions(sourceKey?: string): ComboboxOption[] {
  const seen = new Set<string>();
  const out: ComboboxOption[] = [];

  // Preferred: names that match the current sourceKey via keyword
  const sk = (sourceKey || "").toLowerCase();
  const matchesSourceKey = (keywords: string[]) =>
    !!sk && keywords.some((k) => sk.includes(k.toLowerCase()));

  // First pass: keywords matching current source column (if any)
  if (sk) {
    for (const p of CANONICAL_PATTERNS) {
      if (matchesSourceKey(p.keywords) && !seen.has(p.displayName)) {
        seen.add(p.displayName);
        out.push({
          value: p.displayName,
          label: p.displayName,
          description: `Suggested for "${sourceKey}"`,
        });
      }
    }
  }

  // Second pass: everything else
  for (const p of CANONICAL_PATTERNS) {
    if (seen.has(p.displayName)) continue;
    seen.add(p.displayName);
    out.push({
      value: p.displayName,
      label: p.displayName,
      description: p.keywords[0] ? `e.g., ${p.keywords.slice(0, 2).join(", ")}` : undefined,
    });
  }

  return out;
}

// ─── Column name options ───────────────────────────────────────────────────

/**
 * Column name options: snake_case of current display name + snake_case of
 * all canonical display names + common alternates. Excludes names already
 * used in the workspace (to help with uniqueness).
 */
export function getColumnNameOptions(
  displayName: string,
  fields: Field[],
  currentField?: Field | null,
): ComboboxOption[] {
  const taken = new Set(
    fields
      .filter((f) => f !== currentField)
      .map((f) => f.columnName)
      .filter(Boolean),
  );

  const out: ComboboxOption[] = [];
  const seen = new Set<string>();

  const add = (value: string, description?: string) => {
    if (!value) return;
    if (seen.has(value)) return;
    seen.add(value);
    out.push({
      value,
      label: value,
      description: taken.has(value) ? "Already used by another field" : description,
    });
  };

  // Auto-derived from display name
  if (displayName) {
    add(toColumnName(displayName), "Auto-derived");
  }

  // All canonical display names
  for (const p of CANONICAL_PATTERNS) {
    add(toColumnName(p.displayName));
  }

  return out;
}

function toColumnName(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ─── Data type options ─────────────────────────────────────────────────────

export function getDataTypeOptions(): ComboboxOption[] {
  const friendly: Record<DataTypeKey, string> = {
    CURRENCY: "Currency",
    FLOAT64: "Decimal",
    NUMERIC: "Number",
    INT64: "Integer",
    STRING: "Text",
    DATE: "Date",
    BIGNUMERIC: "Big Number",
    JSON: "Object",
  };
  const description: Record<DataTypeKey, string> = {
    CURRENCY: "Money values like $1,243.50",
    FLOAT64: "Decimals like 1.82",
    NUMERIC: "Exact numbers like 42.0",
    INT64: "Whole numbers like 45,230",
    STRING: "Text like campaign names",
    DATE: "Dates like 2026-04-24",
    BIGNUMERIC: "Very large numbers",
    JSON: "Nested objects",
  };

  return (Object.keys(DATA_TYPES) as DataTypeKey[]).map((k) => ({
    value: k,
    label: friendly[k],
    description: description[k],
  }));
}

// ─── Currency options ──────────────────────────────────────────────────────

export function getCurrencyOptions(): ComboboxOption[] {
  return CURRENCY_OPTIONS.map((c) => ({
    value: c.code,
    label: `${c.symbol} ${c.code}`,
  }));
}

// ─── Source parent options ─────────────────────────────────────────────────

export function getSourceParentOptions(): ComboboxOption[] {
  return Object.keys(SOURCE_STREAM_TABLES).map((parent) => ({
    value: parent,
    label: parent,
    accent: SOURCE_STREAM_TABLES[parent].color,
    description: DATA_SOURCE_PARENTS.has(parent)
      ? "Data warehouse / file source"
      : `${Object.keys(SOURCE_STREAM_TABLES[parent].streams).length} stream${
          Object.keys(SOURCE_STREAM_TABLES[parent].streams).length === 1 ? "" : "s"
        }`,
  }));
}

// ─── Stream options ────────────────────────────────────────────────────────

export function getStreamOptions(parent: string): ComboboxOption[] {
  const parentData = SOURCE_STREAM_TABLES[parent];
  if (!parentData) return [];
  return Object.keys(parentData.streams).map((s) => {
    const tables = parentData.streams[s].tables;
    return {
      value: s,
      label: s,
      description: tables.length > 0 ? `Tables: ${tables.slice(0, 2).join(", ")}${tables.length > 2 ? "…" : ""}` : undefined,
    };
  });
}

// Expose helper used by auto-fill
export { toColumnName as toColumnNameSlug };

// Keep unused-import linters happy when only some helpers are used elsewhere
void getSourceStreamInfo;
