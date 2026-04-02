import {
  type Field,
  type MetricCategory,
  METRIC_CATEGORIES,
  getSourceStreamInfo,
} from "../fieldsData";

export interface PlatformActionItem {
  platform: string;
  platformColor: string;
  category: MetricCategory;
  categoryLabel: string;
  categoryColor: string;
  missingItems: string[];
  totalFields: number;
  mappedFields: number;
}

/**
 * Compute which platforms need action based on mandatory metric rules:
 *
 * - Paid Marketing: Each platform must have Spends AND Impressions mapped
 * - KPI: Each platform must have at least 1 KPI mapped
 * - Organic: If a platform has organic fields, at least 1 metric + 1 dimension must be mapped
 * - Contextual: If a platform has contextual fields, at least 1 metric + 1 dimension must be mapped
 */
export function computeActionRequired(fields: Field[]): PlatformActionItem[] {
  const items: PlatformActionItem[] = [];

  // Group fields by category → platform
  const catPlatformMap = new Map<MetricCategory, Map<string, Field[]>>();

  for (const field of fields) {
    if (!field.metricCategory) continue;
    const cat = field.metricCategory;
    const info = getSourceStreamInfo(field.source);
    const platform = info.parent;

    if (!catPlatformMap.has(cat)) catPlatformMap.set(cat, new Map());
    const platformMap = catPlatformMap.get(cat)!;
    if (!platformMap.has(platform)) platformMap.set(platform, []);
    platformMap.get(platform)!.push(field);
  }

  // Paid Marketing: must have Spends + Impressions mapped per platform
  const paidPlatforms = catPlatformMap.get("paid_marketing");
  if (paidPlatforms) {
    for (const [platform, platformFields] of Array.from(paidPlatforms)) {
      const info = getSourceStreamInfo(platformFields[0].source);
      const mappedTypes = new Set(
        platformFields
          .filter((f) => f.status === "Mapped" && f.paidMarketingMetricType)
          .map((f) => f.paidMarketingMetricType)
      );
      const missing: string[] = [];
      if (!mappedTypes.has("Spends")) missing.push("Spends");
      if (!mappedTypes.has("Impressions")) missing.push("Impressions");

      if (missing.length > 0) {
        items.push({
          platform,
          platformColor: info.color,
          category: "paid_marketing",
          categoryLabel: METRIC_CATEGORIES.paid_marketing.label,
          categoryColor: METRIC_CATEGORIES.paid_marketing.color,
          missingItems: missing,
          totalFields: platformFields.length,
          mappedFields: platformFields.filter((f) => f.status === "Mapped").length,
        });
      }
    }
  }

  // KPI: at least 1 KPI mapped per platform
  const kpiPlatforms = catPlatformMap.get("kpi");
  if (kpiPlatforms) {
    for (const [platform, platformFields] of Array.from(kpiPlatforms)) {
      const info = getSourceStreamInfo(platformFields[0].source);
      const hasMappedKpi = platformFields.some(
        (f) => f.status === "Mapped" && f.kpiSubtype
      );
      if (!hasMappedKpi) {
        items.push({
          platform,
          platformColor: info.color,
          category: "kpi",
          categoryLabel: METRIC_CATEGORIES.kpi.label,
          categoryColor: METRIC_CATEGORIES.kpi.color,
          missingItems: ["At least 1 KPI"],
          totalFields: platformFields.length,
          mappedFields: platformFields.filter((f) => f.status === "Mapped").length,
        });
      }
    }
  }

  // Organic: at least 1 metric + 1 dimension mapped per platform (if fields exist)
  const organicPlatforms = catPlatformMap.get("organic");
  if (organicPlatforms) {
    for (const [platform, platformFields] of Array.from(organicPlatforms)) {
      const info = getSourceStreamInfo(platformFields[0].source);
      const mappedMetrics = platformFields.filter((f) => f.status === "Mapped" && f.kind === "metric").length;
      const mappedDims = platformFields.filter((f) => f.status === "Mapped" && f.kind === "dimension").length;
      if (mappedMetrics === 0 || mappedDims === 0) {
        const missing: string[] = [];
        if (mappedMetrics === 0 && mappedDims === 0) {
          missing.push("At least 1 metric and 1 dimension");
        } else if (mappedMetrics === 0) {
          missing.push("At least 1 metric");
        } else {
          missing.push("At least 1 dimension");
        }
        items.push({
          platform,
          platformColor: info.color,
          category: "organic",
          categoryLabel: METRIC_CATEGORIES.organic.label,
          categoryColor: METRIC_CATEGORIES.organic.color,
          missingItems: missing,
          totalFields: platformFields.length,
          mappedFields: platformFields.filter((f) => f.status === "Mapped").length,
        });
      }
    }
  }

  // Contextual: at least 1 metric + 1 dimension mapped per platform (if fields exist)
  const contextualPlatforms = catPlatformMap.get("contextual");
  if (contextualPlatforms) {
    for (const [platform, platformFields] of Array.from(contextualPlatforms)) {
      const info = getSourceStreamInfo(platformFields[0].source);
      const mappedMetrics = platformFields.filter((f) => f.status === "Mapped" && f.kind === "metric").length;
      const mappedDims = platformFields.filter((f) => f.status === "Mapped" && f.kind === "dimension").length;
      if (mappedMetrics === 0 || mappedDims === 0) {
        const missing: string[] = [];
        if (mappedMetrics === 0 && mappedDims === 0) {
          missing.push("At least 1 metric and 1 dimension");
        } else if (mappedMetrics === 0) {
          missing.push("At least 1 metric");
        } else {
          missing.push("At least 1 dimension");
        }
        items.push({
          platform,
          platformColor: info.color,
          category: "contextual",
          categoryLabel: METRIC_CATEGORIES.contextual.label,
          categoryColor: METRIC_CATEGORIES.contextual.color,
          missingItems: missing,
          totalFields: platformFields.length,
          mappedFields: platformFields.filter((f) => f.status === "Mapped").length,
        });
      }
    }
  }

  return items;
}
