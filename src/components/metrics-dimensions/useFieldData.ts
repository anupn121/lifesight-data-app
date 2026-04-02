import { useMemo } from "react";
import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";
import { computeActionRequired, type PlatformActionItem } from "./mandatoryMetrics";

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
export type { PlatformActionItem };
