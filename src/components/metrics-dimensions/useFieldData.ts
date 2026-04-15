import { useMemo } from "react";
import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";
import { computeActionRequired, type PlatformActionItem, type ActionItem } from "./mandatoryMetrics";

const CATEGORY_ORDER: MetricCategory[] = ["kpi", "paid_marketing", "organic", "contextual"];

// Marketer-friendly category descriptions
export const CATEGORY_INFO: Record<MetricCategory, { label: string; description: string }> = {
  kpi: { label: "KPIs", description: "Your business results \u2014 revenue, conversions, orders" },
  paid_marketing: { label: "Paid Marketing", description: "Ad performance data from your media channels" },
  organic: { label: "Organic & Owned", description: "Non-paid channels like email, SEO, and social" },
  contextual: { label: "External Factors", description: "Weather, holidays, seasonality, and other factors" },
};

// Key metrics to highlight per platform row in the overview
const KEY_METRIC_LABELS: Record<MetricCategory, string[]> = {
  kpi: ["Revenue", "Purchases", "Customers", "Order Value"],
  paid_marketing: ["Spends", "Impressions", "Clicks", "CPC"],
  organic: ["Sessions", "Users", "Pageviews", "Bounce Rate"],
  contextual: ["Temperature", "Holidays", "Events", "Seasonality"],
};

export interface PlatformData {
  name: string;
  color: string;
  metrics: number;
  dimensions: number;
  mapped: number;
  total: number;
  keyMetrics: string[];
}

export interface CategoryData {
  category: MetricCategory;
  label: string;
  description: string;
  color: string;
  totalFields: number;
  mappedCount: number;
  unmappedCount: number;
  metricCount: number;
  dimensionCount: number;
  platforms: PlatformData[];
}

export function useMandatoryMetrics(fields: Field[]) {
  return useMemo(() => {
    const actionItems = computeActionRequired(fields);
    return {
      actionItems,
      totalActionItems: actionItems.length,
    };
  }, [fields]);
}

export function useCategoryPlatformData(fields: Field[]): CategoryData[] {
  return useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const catFields = fields.filter((f) => f.metricCategory === cat);
      const config = METRIC_CATEGORIES[cat];
      const info = CATEGORY_INFO[cat];
      const keyLabels = KEY_METRIC_LABELS[cat];

      const platformMap = new Map<string, {
        color: string;
        metrics: number;
        dimensions: number;
        mapped: number;
        total: number;
        displayNames: Set<string>;
      }>();

      catFields.forEach((f) => {
        const srcInfo = getSourceStreamInfo(f.source);
        const existing = platformMap.get(srcInfo.parent) || {
          color: srcInfo.color,
          metrics: 0,
          dimensions: 0,
          mapped: 0,
          total: 0,
          displayNames: new Set<string>(),
        };
        existing.total++;
        if (f.kind === "metric") existing.metrics++;
        else existing.dimensions++;
        if (f.status === "Mapped") existing.mapped++;
        if (f.displayName) existing.displayNames.add(f.displayName);
        platformMap.set(srcInfo.parent, existing);
      });

      const platforms: PlatformData[] = Array.from(platformMap.entries())
        .map(([name, data]) => {
          // Find up to 4 key metrics that exist for this platform
          const matchedKeys = keyLabels.filter((label) =>
            data.displayNames.has(label) ||
            Array.from(data.displayNames).some((dn) => dn.toLowerCase().includes(label.toLowerCase()))
          ).slice(0, 4);

          // If not enough key metrics matched, fill with actual display names
          const keyMetrics = matchedKeys.length >= 2
            ? matchedKeys
            : Array.from(data.displayNames).slice(0, 4);

          return { name, color: data.color, metrics: data.metrics, dimensions: data.dimensions, mapped: data.mapped, total: data.total, keyMetrics };
        })
        .sort((a, b) => b.total - a.total);

      const totalCatFields = catFields.length;
      const totalCatMapped = catFields.filter((f) => f.status === "Mapped").length;

      return {
        category: cat,
        label: info.label,
        description: info.description,
        color: config.color,
        totalFields: totalCatFields,
        mappedCount: totalCatMapped,
        unmappedCount: totalCatFields - totalCatMapped,
        metricCount: catFields.filter((f) => f.kind === "metric").length,
        dimensionCount: catFields.filter((f) => f.kind === "dimension").length,
        platforms,
      };
    });
  }, [fields]);
}

export function useFieldCounts(fields: Field[]) {
  return useMemo(() => ({
    metricCount: fields.filter((f) => f.kind === "metric").length,
    dimensionCount: fields.filter((f) => f.kind === "dimension").length,
    totalMapped: fields.filter((f) => f.status === "Mapped").length,
    totalFields: fields.length,
  }), [fields]);
}

export { CATEGORY_ORDER };
export type { PlatformActionItem, ActionItem };

// ═══════════════════════════════════════════════════════════════════════════
//  HIERARCHICAL DATA GROUPING
//  Category → Integration → Data Source → Fields
// ═══════════════════════════════════════════════════════════════════════════

// Top-5 metric preferences per category (used for card previews)
const TOP_METRICS_BY_CATEGORY: Record<MetricCategory, string[]> = {
  kpi: ["revenue", "orders", "purchases", "conversions", "aov", "sessions", "customers", "signups"],
  paid_marketing: ["spend", "impressions", "clicks", "conversions", "cpc", "ctr", "cpm", "roas"],
  organic: ["impressions", "opens", "clicks", "sessions", "users", "pageviews", "open_rate", "click_rate"],
  contextual: ["temperature", "holiday", "launch", "price", "event", "seasonality", "weather", "fuel"],
};

// Top-5 dimension preferences (shared across categories since dates/geo/campaign apply broadly)
const TOP_DIMENSIONS = [
  "date", "day", "week", "month",
  "campaign", "campaign_name", "ad_name",
  "source", "platform", "channel",
  "country", "region", "geo",
  "product", "product_name",
];

// Number of metric/dimension rows shown in each DataSourceCard preview
export const PREVIEW_FIELD_COUNT = 5;

// ─── Empty-state examples per category ───────────────────────────────────
// Shown when a category has zero integrations. Gives the user concrete
// next-steps instead of a generic "connect a source" message.
export interface EmptyStateExample {
  title: string;
  message: string;
  suggestions: string[];
}

export const EMPTY_STATE_BY_CATEGORY: Record<MetricCategory, EmptyStateExample> = {
  kpi: {
    title: "No KPI data yet",
    message:
      "Track revenue, orders, conversions, and the outcomes your business cares about.",
    suggestions: ["Shopify", "Google Analytics", "Upload a sales sheet"],
  },
  paid_marketing: {
    title: "No paid marketing data yet",
    message:
      "Connect the ad platforms you spend on, or upload a spend sheet for channels we don't support natively (TV, Radio, OOH).",
    suggestions: ["Facebook Ads", "Google Ads", "TikTok Ads", "Upload spend sheet"],
  },
  organic: {
    title: "No organic data yet",
    message:
      "Add email, organic social, SEO, and other non-paid marketing activity to measure alongside paid channels.",
    suggestions: ["HubSpot", "Klaviyo", "Google Search Console", "Instagram Insights"],
  },
  contextual: {
    title: "No external factors yet",
    message:
      "Upload weather, holidays, product launches, or any other variables that might affect your outcomes.",
    suggestions: ["Weather data", "Holidays calendar", "Product launches", "Fuel prices"],
  },
};

// Paid-marketing integrations always get a single consolidated data source.
// User feedback: for ad platforms, Ad Performance / Geo Insights / Creative
// Insights / Ad Budgets / Audience Insights are all just "ad data" from the
// user's perspective — no user action distinguishes them. Merge them.
const CONSOLIDATED_PAID_DATA_SOURCE = "Ad Insights";

export interface DataSourceGroup {
  /** Original stream name (e.g., "Ad Performance") */
  rawName: string;
  /** Display name shown in the UI (e.g., "Ad Insights") */
  displayName: string;
  /** All fields in this data source */
  fields: Field[];
  metrics: Field[];
  dimensions: Field[];
  /** Top 3 mapped metrics (by importance, fallback to alphabetical) */
  topMetrics: Field[];
  /** Top 3 mapped dimensions (by importance, fallback to alphabetical) */
  topDimensions: Field[];
  /** Counts */
  totalFields: number;
  mappedFields: number;
  mappedMetrics: number;
  mappedDimensions: number;
  /** Progress as percentage */
  progress: number;
}

export interface IntegrationGroup {
  /** Integration name (e.g., "Facebook", "Shopify", "BigQuery") */
  name: string;
  /** Brand color */
  color: string;
  /** Data sources under this integration */
  dataSources: DataSourceGroup[];
  /** Total fields across all data sources */
  totalFields: number;
  mappedFields: number;
  progress: number;
}

export interface CategoryHierarchy {
  category: MetricCategory;
  label: string;
  description: string;
  color: string;
  integrations: IntegrationGroup[];
  totalFields: number;
  mappedFields: number;
  progress: number;
}

/**
 * Pick the top N fields by importance from a list.
 * Uses the category's preferred metric names, falling back to alphabetical.
 */
function pickTopFields(
  fields: Field[],
  kind: "metric" | "dimension",
  category: MetricCategory,
  count: number,
): Field[] {
  const filtered = fields.filter((f) => f.kind === kind && f.status === "Mapped");
  const preferences = kind === "metric" ? TOP_METRICS_BY_CATEGORY[category] : TOP_DIMENSIONS;

  // Score fields by preference match (earlier = higher score)
  const scored = filtered.map((f) => {
    const searchable = `${f.name} ${f.displayName} ${f.columnName}`.toLowerCase();
    let score = 999;
    for (let i = 0; i < preferences.length; i++) {
      if (searchable.includes(preferences[i])) {
        score = i;
        break;
      }
    }
    return { field: f, score };
  });

  // Sort: lower score = better match; tied scores → alphabetical
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.field.displayName.localeCompare(b.field.displayName);
  });

  let top = scored.slice(0, count).map((s) => s.field);

  // If we don't have enough mapped fields, fill with unmapped
  if (top.length < count) {
    const unmapped = fields.filter((f) => f.kind === kind && f.status !== "Mapped");
    unmapped.sort((a, b) => a.displayName.localeCompare(b.displayName));
    top = top.concat(unmapped.slice(0, count - top.length));
  }

  return top.slice(0, count);
}

/**
 * Build a DataSourceGroup from a set of fields belonging to one data source.
 * Helper used by both the paid-marketing-consolidated path and the per-stream
 * path so the field-level math stays consistent.
 */
function buildDataSourceGroup(
  rawName: string,
  displayName: string,
  dsFields: Field[],
  category: MetricCategory,
): DataSourceGroup {
  const metrics = dsFields.filter((f) => f.kind === "metric");
  const dimensions = dsFields.filter((f) => f.kind === "dimension");
  const mappedFields = dsFields.filter((f) => f.status === "Mapped").length;
  const mappedMetrics = metrics.filter((f) => f.status === "Mapped").length;
  const mappedDimensions = dimensions.filter((f) => f.status === "Mapped").length;

  return {
    rawName,
    displayName,
    fields: dsFields,
    metrics,
    dimensions,
    topMetrics: pickTopFields(dsFields, "metric", category, PREVIEW_FIELD_COUNT),
    topDimensions: pickTopFields(dsFields, "dimension", category, PREVIEW_FIELD_COUNT),
    totalFields: dsFields.length,
    mappedFields,
    mappedMetrics,
    mappedDimensions,
    progress:
      dsFields.length > 0 ? Math.round((mappedFields / dsFields.length) * 100) : 0,
  };
}

/**
 * Group fields into the three-level hierarchy used by the new
 * Metrics & Dimensions tab layout.
 *
 * Special rule for paid_marketing: all streams under a single integration
 * (e.g., "Ad Performance", "Geo Insights", "Lead Forms" for Facebook) are
 * consolidated into a single "Ad Insights" data source. Users don't take
 * different actions on these — they're all just ad data.
 *
 * For all other categories (KPI, Organic, Contextual), each stream is kept
 * as its own data source because they represent meaningfully different
 * data (Shopify Orders vs Customers vs Products).
 */
export function useHierarchicalFieldData(fields: Field[]): CategoryHierarchy[] {
  return useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const catFields = fields.filter((f) => f.metricCategory === cat);
      const config = METRIC_CATEGORIES[cat];
      const info = CATEGORY_INFO[cat];
      const isPaidMarketing = cat === "paid_marketing";

      // Group: integration → data source → fields
      // For paid_marketing the inner "data source" key is always
      // CONSOLIDATED_PAID_DATA_SOURCE so all streams merge.
      const intMap = new Map<string, { color: string; dsMap: Map<string, Field[]> }>();

      catFields.forEach((f) => {
        const srcInfo = getSourceStreamInfo(f.source);
        const integration = srcInfo.parent;
        const dataSource = isPaidMarketing
          ? CONSOLIDATED_PAID_DATA_SOURCE
          : srcInfo.stream || f.source;

        if (!intMap.has(integration)) {
          intMap.set(integration, { color: srcInfo.color, dsMap: new Map() });
        }
        const entry = intMap.get(integration)!;
        if (!entry.dsMap.has(dataSource)) entry.dsMap.set(dataSource, []);
        entry.dsMap.get(dataSource)!.push(f);
      });

      // Build IntegrationGroup[] from the map
      const integrations: IntegrationGroup[] = Array.from(intMap.entries()).map(
        ([intName, { color, dsMap }]) => {
          const dataSources: DataSourceGroup[] = Array.from(dsMap.entries())
            .map(([dsName, dsFields]) =>
              buildDataSourceGroup(dsName, dsName, dsFields, cat),
            )
            .sort((a, b) => b.totalFields - a.totalFields);

          const totalFields = dataSources.reduce((sum, ds) => sum + ds.totalFields, 0);
          const mappedFields = dataSources.reduce((sum, ds) => sum + ds.mappedFields, 0);

          return {
            name: intName,
            color,
            dataSources,
            totalFields,
            mappedFields,
            progress: totalFields > 0 ? Math.round((mappedFields / totalFields) * 100) : 0,
          };
        },
      );

      // Sort integrations by total fields desc (most data first)
      integrations.sort((a, b) => b.totalFields - a.totalFields);

      const totalCatFields = catFields.length;
      const totalCatMapped = catFields.filter((f) => f.status === "Mapped").length;

      return {
        category: cat,
        label: info.label,
        description: info.description,
        color: config.color,
        integrations,
        totalFields: totalCatFields,
        mappedFields: totalCatMapped,
        progress: totalCatFields > 0 ? Math.round((totalCatMapped / totalCatFields) * 100) : 0,
      };
    });
  }, [fields]);
}
