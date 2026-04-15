import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";

// ═══════════════════════════════════════════════════════════════════════════
//  MANDATORY METRICS — TWO-STATE ACTION DETECTION
// ═══════════════════════════════════════════════════════════════════════════
//
//  Action Required items have two possible states:
//
//  1. "required_column_missing" — A critical column (date, and for Paid
//     Marketing also a spend column) couldn't be auto-detected in the data
//     source's columns. The user must either map an existing column as the
//     date/spend OR re-import with the correct columns.
//
//  2. "mapping_required" — The data source has all required columns but
//     hasn't been fully mapped yet (e.g. KPI source with no KPI fields
//     mapped, Paid Marketing with unmapped Spends field).
//
//  Items are computed at the Integration + Data Source level so the Action
//  Required list shows one row per (integration, data_source) combination
//  that needs attention — NOT one row per platform like the previous
//  implementation.
// ═══════════════════════════════════════════════════════════════════════════

export type ActionState = "required_column_missing" | "mapping_required";

export interface ActionItem {
  /** Unique key combining integration + data source */
  id: string;
  /** Integration name (e.g., "Facebook", "Shopify", "BigQuery") */
  integration: string;
  /** Integration color (from SOURCE_STREAM_TABLES) */
  integrationColor: string;
  /** Data source name (e.g., "Ad Insights", "Orders", "revenue_q4") */
  dataSource: string;
  /** Category this item belongs to */
  category: MetricCategory;
  categoryLabel: string;
  categoryColor: string;
  /** State determines the UI treatment */
  state: ActionState;
  /** Short explanation shown in the row */
  missingLabel: string;
  /** Detailed items missing (e.g., ["Date", "Spends"]) */
  missingItems: string[];
  /** Columns available in this data source (for inline "Map as date" picker) */
  availableColumns: string[];
  /** Progress counts */
  totalFields: number;
  mappedFields: number;
}

// ─── Date Column Detection ─────────────────────────────────────────────────

const DATE_COLUMN_PATTERNS = /^(date|day|week|month|year|quarter|period|timestamp|dt|report_date)s?$/i;

/**
 * Check if any column name in the data source matches a date pattern.
 * Also matches on column display names to be generous.
 */
function hasDateColumn(fields: Field[]): boolean {
  return fields.some((f) => {
    const names = [f.columnName, f.name, f.displayName].filter(Boolean);
    return names.some((n) => DATE_COLUMN_PATTERNS.test(n)) || f.dataType === "DATE";
  });
}

function hasSpendColumn(fields: Field[]): boolean {
  return fields.some((f) => {
    if (f.paidMarketingMetricType === "Spends") return true;
    const names = [f.columnName, f.name, f.displayName].filter(Boolean);
    return names.some((n) => /spend|cost|media.spend|ad.spend|amount.spent/i.test(n));
  });
}

// ─── Grouping ──────────────────────────────────────────────────────────────

/**
 * Group fields by (integration, dataSource) within each category.
 * Integration = parent from SOURCE_STREAM_TABLES
 * Data Source = stream from SOURCE_STREAM_TABLES (or the raw source name if
 *               the source is not in the hierarchy, e.g. BigQuery tables)
 */
function groupByIntegrationAndSource(fields: Field[]): Map<
  MetricCategory,
  Map<
    string, // integration
    Map<
      string, // data source
      { fields: Field[]; integrationColor: string }
    >
  >
> {
  const result = new Map<MetricCategory, Map<string, Map<string, { fields: Field[]; integrationColor: string }>>>();

  for (const field of fields) {
    if (!field.metricCategory) continue;
    const info = getSourceStreamInfo(field.source);
    const integration = info.parent;
    const dataSource = info.stream || field.source;

    if (!result.has(field.metricCategory)) result.set(field.metricCategory, new Map());
    const catMap = result.get(field.metricCategory)!;
    if (!catMap.has(integration)) catMap.set(integration, new Map());
    const intMap = catMap.get(integration)!;
    if (!intMap.has(dataSource)) intMap.set(dataSource, { fields: [], integrationColor: info.color });
    intMap.get(dataSource)!.fields.push(field);
  }

  return result;
}

// ─── Rule Evaluation ───────────────────────────────────────────────────────

/**
 * Evaluate a single data source against its category's rules.
 * Returns null if the data source is OK, or an ActionItem describing what's wrong.
 */
function evaluateDataSource(
  integration: string,
  integrationColor: string,
  dataSource: string,
  dsFields: Field[],
  category: MetricCategory,
): ActionItem | null {
  const cfg = METRIC_CATEGORIES[category];
  const mappedFields = dsFields.filter((f) => f.status === "Mapped").length;
  const availableColumns = Array.from(
    new Set(dsFields.map((f) => f.columnName || f.name).filter(Boolean))
  );

  const base = {
    id: `${integration}::${dataSource}::${category}`,
    integration,
    integrationColor,
    dataSource,
    category,
    categoryLabel: cfg.label,
    categoryColor: cfg.color,
    totalFields: dsFields.length,
    mappedFields,
    availableColumns,
  };

  // ─── Check 1: Required Column Missing (date always, spend for paid marketing) ───
  const missingColumns: string[] = [];
  if (!hasDateColumn(dsFields)) missingColumns.push("Date");
  if (category === "paid_marketing" && !hasSpendColumn(dsFields)) missingColumns.push("Spend");

  if (missingColumns.length > 0) {
    const missingLabel = missingColumns.length === 1
      ? `${missingColumns[0]} column missing`
      : `${missingColumns.join(" & ")} columns missing`;
    return {
      ...base,
      state: "required_column_missing",
      missingLabel,
      missingItems: missingColumns,
    };
  }

  // ─── Check 2: Mapping Required (category-specific rules) ───────────────────
  if (category === "paid_marketing") {
    const mappedTypes = new Set(
      dsFields
        .filter((f) => f.status === "Mapped" && f.paidMarketingMetricType)
        .map((f) => f.paidMarketingMetricType)
    );
    const needed: string[] = [];
    if (!mappedTypes.has("Spends")) needed.push("Spends");
    if (!mappedTypes.has("Impressions")) needed.push("Impressions");
    if (needed.length > 0) {
      return {
        ...base,
        state: "mapping_required",
        missingLabel: `Map ${needed.join(" & ")}`,
        missingItems: needed,
      };
    }
  }

  if (category === "kpi") {
    const hasMappedKpi = dsFields.some((f) => f.status === "Mapped" && f.kpiSubtype);
    if (!hasMappedKpi) {
      return {
        ...base,
        state: "mapping_required",
        missingLabel: "Map at least 1 KPI",
        missingItems: ["At least 1 KPI"],
      };
    }
  }

  if (category === "organic" || category === "contextual") {
    const mappedMetrics = dsFields.filter((f) => f.status === "Mapped" && f.kind === "metric").length;
    const mappedDims = dsFields.filter((f) => f.status === "Mapped" && f.kind === "dimension").length;
    if (mappedMetrics === 0 || mappedDims === 0) {
      const needed: string[] = [];
      if (mappedMetrics === 0) needed.push("1 metric");
      if (mappedDims === 0) needed.push("1 dimension");
      return {
        ...base,
        state: "mapping_required",
        missingLabel: `Map ${needed.join(" & ")}`,
        missingItems: needed,
      };
    }
  }

  return null;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Compute which data sources need action. Returns one ActionItem per
 * (integration, data_source) that has either a missing required column
 * or incomplete mapping.
 */
export function computeActionRequired(fields: Field[]): ActionItem[] {
  const grouped = groupByIntegrationAndSource(fields);
  const items: ActionItem[] = [];

  for (const [category, intMap] of Array.from(grouped)) {
    for (const [integration, dsMap] of Array.from(intMap)) {
      for (const [dataSource, { fields: dsFields, integrationColor }] of Array.from(dsMap)) {
        const item = evaluateDataSource(integration, integrationColor, dataSource, dsFields, category);
        if (item) items.push(item);
      }
    }
  }

  // Sort: column_missing first (most urgent), then mapping_required
  return items.sort((a, b) => {
    if (a.state !== b.state) return a.state === "required_column_missing" ? -1 : 1;
    return a.integration.localeCompare(b.integration);
  });
}

// Backwards-compatible alias for any consumers still using the old type name
export type PlatformActionItem = ActionItem;
