// Auto-generated fields data from schema
// This file is imported by MetricsDimensionsTab.tsx

// --- Data Type System ---
export type DataTypeKey = "CURRENCY" | "FLOAT64" | "NUMERIC" | "INT64" | "STRING" | "DATE" | "BIGNUMERIC" | "JSON";

// --- Metric Category System ---
export type MetricCategory = "kpi" | "paid_marketing" | "organic" | "contextual" | "halo";
export type VariableType = "Binary" | "Continuous" | "Categorical";
export type KpiSubtype = "Revenue" | "Conversions" | "Installs" | "Orders" | "Store Visits" | "Registrations" | "Reach" | "Subscriptions" | "Admissions";
export type PaidMarketingMetricType = "Spends" | "Impressions" | "Clicks" | "Other";

export const METRIC_CATEGORIES: Record<MetricCategory, { label: string; color: string; description: string }> = {
  kpi: { label: "KPIs", color: "#00bc7d", description: "Revenue, Conversions, Installs, Orders, etc." },
  paid_marketing: { label: "Paid Marketing", color: "#2b7fff", description: "Spends, Impressions, Clicks grouped by ad platform" },
  organic: { label: "Organic", color: "#fe9a00", description: "Binary, Continuous, Categorical variables" },
  contextual: { label: "Contextual", color: "#6941c6", description: "Binary, Continuous, Categorical variables" },
  halo: { label: "Halo", color: "#EE1D52", description: "Binary, Continuous, Categorical variables" },
};

export const DATA_TYPES: Record<DataTypeKey, { display: string; bqType: string }> = {
  DATE: { display: "Date", bqType: "DATE" },
  STRING: { display: "Text", bqType: "STRING" },
  FLOAT64: { display: "Decimal", bqType: "FLOAT64" },
  BIGNUMERIC: { display: "Big Number", bqType: "BIGNUMERIC" },
  JSON: { display: "JSON", bqType: "JSON" },
  INT64: { display: "Integer", bqType: "INT64" },
  NUMERIC: { display: "Number", bqType: "NUMERIC" },
  CURRENCY: { display: "Currency", bqType: "FLOAT64" },
};

// --- Currency Options ---
export const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20AC" },
  { code: "GBP", symbol: "\u00A3" },
  { code: "JPY", symbol: "\u00A5" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
  { code: "INR", symbol: "\u20B9" },
  { code: "BRL", symbol: "R$" },
];

export interface Field {
  name: string;
  displayName: string;
  columnName: string;
  kind: "metric" | "dimension";
  source: string;
  sourceColor: string;
  sourceKey: string;
  dataType: DataTypeKey;
  transformation: string;
  status: "Mapped" | "Unmapped";
  description: string;
  stream?: string;
  transformationFormula?: string;
  tables?: string[];
  currencyConfig?: { code: string; symbol: string };
  metricCategory?: MetricCategory;
  variableType?: VariableType;
  kpiSubtype?: KpiSubtype;
  paidMarketingMetricType?: PaidMarketingMetricType;
}

interface RawField {
  name: string;
  displayName: string;
  kind: "metric" | "dimension";
  source: string;
  sourceColor: string;
  sourceKey: string;
  dataType: string;
  transformation: string;
  status: "Mapped" | "Unmapped";
  description: string;
  stream?: string;
  transformationFormula?: string;
  metricCategory?: MetricCategory;
  variableType?: VariableType;
  kpiSubtype?: KpiSubtype;
  paidMarketingMetricType?: PaidMarketingMetricType;
}

// --- Source/Stream/Table hierarchy ---
export const SOURCE_STREAM_TABLES: Record<string, {
  color: string;
  streams: Record<string, {
    sources: string[];
    tables: string[];
  }>;
}> = {
  Facebook: {
    color: "#1877F2",
    streams: {
      "Ad Performance": { sources: ["Facebook Ads"], tables: ["fb_ad_performance", "fb_campaign_daily"] },
      "Geo Insights": { sources: ["Facebook Geo Insights"], tables: ["fb_geo_insights"] },
      "Lead Forms": { sources: ["Facebook Lead Forms"], tables: ["fb_lead_forms"] },
    },
  },
  Google: {
    color: "#34A853",
    streams: {
      "Ad Performance": { sources: ["Google Ads"], tables: ["gads_ad_performance", "gads_campaign_daily"] },
      "Geo Insights": { sources: ["Google Geo Insights"], tables: ["gads_geo_insights"] },
      "DV 360": { sources: ["Google DV 360"], tables: ["dv360_performance"] },
    },
  },
  Vibe: {
    color: "#7C3AED",
    streams: {
      "Ad Performance": { sources: ["Vibe Ads"], tables: ["vibe_ad_performance"] },
      "Geo Insights": { sources: ["Vibe Geo Insights"], tables: ["vibe_geo_insights"] },
    },
  },
  TikTok: {
    color: "#EE1D52",
    streams: {
      "Ad Performance": { sources: ["Tiktok Ads"], tables: ["tiktok_ad_performance"] },
    },
  },
  Snapchat: {
    color: "#FFFC00",
    streams: {
      "Ad Performance": { sources: ["Snapchat Ads"], tables: ["snap_ad_performance"] },
    },
  },
  Pinterest: {
    color: "#E60023",
    streams: {
      "Ad Performance": { sources: ["Pinterest Ads"], tables: ["pin_ad_performance"] },
    },
  },
  LinkedIn: {
    color: "#0A66C2",
    streams: {
      "Ad Performance": { sources: ["Linkedin Ads"], tables: ["li_ad_performance"] },
    },
  },
  X: {
    color: "#1DA1F2",
    streams: {
      "Ad Performance": { sources: ["X Ads"], tables: ["x_ad_performance"] },
    },
  },
  Amazon: {
    color: "#FF9900",
    streams: {
      "Ad Performance": { sources: ["Amazon Ads"], tables: ["amz_ad_performance"] },
    },
  },
  Microsoft: {
    color: "#00A4EF",
    streams: {
      "Ad Performance": { sources: ["Microsoft Ads"], tables: ["msft_ad_performance"] },
    },
  },
  Walmart: {
    color: "#0071DC",
    streams: {
      "Ad Performance": { sources: ["Walmart Ads"], tables: ["wm_ad_performance"] },
    },
  },
  Criteo: {
    color: "#F48120",
    streams: {
      "Ad Performance": { sources: ["Criteo Ads"], tables: ["criteo_ad_performance"] },
    },
  },
  Adroll: {
    color: "#0DAEF0",
    streams: {
      "Ad Performance": { sources: ["Adroll Ads"], tables: ["adroll_ad_performance"] },
    },
  },
  Outbrain: {
    color: "#F47920",
    streams: {
      "Ad Performance": { sources: ["Outbrain Ads"], tables: ["ob_ad_performance"] },
    },
  },
};

// Parents that use free-text table/sheet name input instead of stream dropdown
export const DATA_SOURCE_PARENTS = new Set(["BigQuery", "Snowflake", "Google Sheets", "Import CSV"]);

const DATA_TYPE_MIGRATION: Record<string, DataTypeKey> = {
  Currency: "CURRENCY",
  Number: "NUMERIC",
  String: "STRING",
  Enum: "STRING",
  Date: "DATE",
  Ratio: "FLOAT64",
  Percentage: "FLOAT64",
};

export function getSourceStreamInfo(source: string): { parent: string; stream: string; tables: string[]; color: string } {
  for (const [parent, info] of Object.entries(SOURCE_STREAM_TABLES)) {
    for (const [stream, streamInfo] of Object.entries(info.streams)) {
      if (streamInfo.sources.includes(source)) {
        return { parent, stream, tables: streamInfo.tables, color: info.color };
      }
    }
  }
  // Fallback for sources not in hierarchy
  const fallbackParent = source.replace(/ Ads$/, "").replace(/ Geo Insights$/, "").replace(/ Lead Forms$/, "");
  return { parent: fallbackParent, stream: "Ad Performance", tables: [], color: "#9CA3AF" };
}

export function toColumnName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** @deprecated Use getSourceStreamInfo instead */
export function getStreamInfo(source: string): { parent: string; stream: string } {
  const info = getSourceStreamInfo(source);
  return { parent: info.parent, stream: info.stream };
}

const rawFields: RawField[] = [
  // ══════════════════════════════════════════════════════════════════════
  // FACEBOOK ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "fb_spend", displayName: "Spend", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total advertising spend" },
  { name: "fb_impressions", displayName: "Impressions", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad impressions" },
  { name: "fb_clicks", displayName: "Link Clicks", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.inline_link_clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clicks on ad links" },
  { name: "fb_purchase", displayName: "Purchases", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_purchase]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversion events" },
  { name: "fb_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.action_values[omni_purchase]", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to ad purchases" },
  { name: "fb_add_to_cart", displayName: "Add to Cart", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_add_to_cart]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Add-to-cart events" },
  { name: "fb_leads", displayName: "Leads", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[lead_grouped]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead generation events" },
  { name: "fb_date", displayName: "Date", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.date_start", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "fb_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "fb_adset_name", displayName: "Ad Set Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adset_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set name" },
  { name: "fb_ad_name", displayName: "Ad Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad creative name" },
  { name: "fb_objective", displayName: "Objective", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.objective", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },

  // ══════════════════════════════════════════════════════════════════════
  // FACEBOOK GEO INSIGHTS
  // ══════════════════════════════════════════════════════════════════════
  { name: "fb_geo_impressions", displayName: "Impressions", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Impressions by geo" },
  { name: "fb_geo_clicks", displayName: "Link Clicks", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "inline_link_clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Link clicks by geo" },
  { name: "fb_geo_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "action_values[omni_purchase]", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Purchase revenue by geo" },
  { name: "fb_geo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "fb_geo_country", displayName: "Country", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "country", dataType: "String", transformation: "NONE", status: "Mapped", description: "Country code" },

  // ══════════════════════════════════════════════════════════════════════
  // GOOGLE ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "gads_spend", displayName: "Spend", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.costMicros", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend in micros" },
  { name: "gads_impressions", displayName: "Impressions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad impressions" },
  { name: "gads_clicks", displayName: "Clicks", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad clicks" },
  { name: "gads_conversions", displayName: "All Conversions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.allConversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "All conversion actions" },
  { name: "gads_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to ads" },
  { name: "gads_purchase", displayName: "Purchases", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.purchase", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversion events" },
  { name: "gads_submit_lead_form", displayName: "Lead Form Submits", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.submit_lead_form", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead form submission events" },
  { name: "gads_date", displayName: "Date", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "gads_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__campaign.name__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "gads_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__adGroup.name__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "gads_channel_type", displayName: "Channel Type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "campaign.advertisingChannelType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX" },
  { name: "gads_objective", displayName: "Network Type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.adNetworkType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad network type" },

  // ══════════════════════════════════════════════════════════════════════
  // GOOGLE GEO INSIGHTS
  // ══════════════════════════════════════════════════════════════════════
  { name: "gads_geo_spend", displayName: "Spend", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Spend by geo" },
  { name: "gads_geo_impressions", displayName: "Impressions", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Impressions by geo" },
  { name: "gads_geo_clicks", displayName: "Clicks", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clicks by geo" },
  { name: "gads_geo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "gads_geo_country", displayName: "Country", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "country_code", dataType: "String", transformation: "NONE", status: "Mapped", description: "Country code" },

  // ══════════════════════════════════════════════════════════════════════
  // TIKTOK ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "tt_spend", displayName: "Spend", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "tt_impressions", displayName: "Impressions", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "tt_clicks", displayName: "Clicks", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "tt_purchase", displayName: "Purchases", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_purchase", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total purchase conversions" },
  { name: "tt_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_complete_payment_rate", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from completed payments" },
  { name: "tt_date", displayName: "Date", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "tt_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "campaign.campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "tt_objective", displayName: "Objective", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.objective_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },

  // ══════════════════════════════════════════════════════════════════════
  // SNAPCHAT ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "snap_spend", displayName: "Spend", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "snap_impressions", displayName: "Impressions", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "snap_clicks", displayName: "Swipe Ups", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "swipes", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Swipe-up clicks" },
  { name: "snap_purchase", displayName: "Purchases", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversions" },
  { name: "snap_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_purchases_value", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from purchases" },
  { name: "snap_date", displayName: "Date", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "snap_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "snap_objective", displayName: "Objective", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "objective", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },

  // ══════════════════════════════════════════════════════════════════════
  // PINTEREST ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "pin_spend", displayName: "Spend", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "spend_in_dollar", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "pin_impressions", displayName: "Impressions", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_impression", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "pin_clicks", displayName: "Clickthroughs", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_clickthrough", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clickthrough events" },
  { name: "pin_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "attributed_revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to pins" },
  { name: "pin_leads", displayName: "Leads", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_lead", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead generation events" },
  { name: "pin_date", displayName: "Date", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "pin_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "pin_objective", displayName: "Objective", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign_objective_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },

  // ══════════════════════════════════════════════════════════════════════
  // LINKEDIN ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "li_spend", displayName: "Spend", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "li_impressions", displayName: "Impressions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "li_clicks", displayName: "Clicks", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "li_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "ConversionValueInLocalCurrency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "li_one_click_leads", displayName: "One-Click Leads", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "OneClickLeads", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead gen form submissions" },
  { name: "li_date", displayName: "Date", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "TimePeriod", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "li_campaign_name", displayName: "Campaign Group Name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CampaignGroupName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign group name" },
  { name: "li_objective", displayName: "Objective", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "ObjectiveType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },

  // ══════════════════════════════════════════════════════════════════════
  // X ADS (Twitter)
  // ══════════════════════════════════════════════════════════════════════
  { name: "x_spend", displayName: "Spend", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "x_impressions", displayName: "Impressions", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "x_clicks", displayName: "Clicks", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "x_purchase", displayName: "Purchases", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversions" },
  { name: "x_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_value", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "x_date", displayName: "Date", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "time_period", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "x_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "x_objective", displayName: "Objective", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "goal", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign goal" },

  // ══════════════════════════════════════════════════════════════════════
  // REMAINING CHANNELS (Condensed)
  // ══════════════════════════════════════════════════════════════════════

  // Amazon Ads
  { name: "amz_spend", displayName: "Spend", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "cost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad cost" },
  { name: "amz_impressions", displayName: "Impressions", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "amz_clicks", displayName: "Clicks", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "amz_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "sales / sales14d", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue (14d)" },
  { name: "amz_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Microsoft Ads
  { name: "msft_spend", displayName: "Spend", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "msft_impressions", displayName: "Impressions", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "msft_clicks", displayName: "Clicks", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "msft_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AllRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "msft_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "CampaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Walmart Ads
  { name: "wm_spend", displayName: "Spend", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "wm_impressions", displayName: "Impressions", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "wm_clicks", displayName: "Clicks", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "wm_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "wm_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Criteo Ads
  { name: "criteo_spend", displayName: "Spend", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "AdvertiserCost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "criteo_impressions", displayName: "Impressions", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Displays", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total displays/impressions" },
  { name: "criteo_clicks", displayName: "Clicks", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "criteo_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "RevenueGeneratedAllPc30d", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue (30d post-click)" },
  { name: "criteo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Campaign", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Adroll Ads
  { name: "adroll_spend", displayName: "Spend", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "cost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "adroll_impressions", displayName: "Impressions", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "adroll_clicks", displayName: "Clicks", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "adroll_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "adroll_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Outbrain Ads
  { name: "ob_spend", displayName: "Spend", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "ob_impressions", displayName: "Impressions", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "ob_clicks", displayName: "Clicks", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "ob_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "ob_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Vibe Ads
  { name: "vibe_spend", displayName: "Spend", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "vibe_impressions", displayName: "Impressions", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "vibe_purchase", displayName: "Purchases", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase events" },
  { name: "vibe_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "amount_of_purchases", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from purchases" },
  { name: "vibe_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Google DV 360
  { name: "dv360_spend", displayName: "Media Cost", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "media_cost_partner_currency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total media cost" },
  { name: "dv360_impressions", displayName: "Impressions", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "dv360_clicks", displayName: "Clicks", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "dv360_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "revenue_partner_currency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue in partner currency" },
  { name: "dv360_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
];

// ---------------------------------------------------------------------------
// Metric category derivation
// ---------------------------------------------------------------------------

const AD_PLATFORM_SOURCES = new Set(
  Object.values(SOURCE_STREAM_TABLES).flatMap((p) =>
    Object.values(p.streams).flatMap((s) => s.sources)
  )
);

export function deriveMetricCategory(displayName: string, source: string): {
  metricCategory: MetricCategory;
  variableType?: VariableType;
  kpiSubtype?: KpiSubtype;
  paidMarketingMetricType?: PaidMarketingMetricType;
} {
  const dn = displayName.toLowerCase();

  // KPI: Revenue
  if (/attributed revenue|conversions? value/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Revenue" };
  }
  // KPI: Conversions
  if (/^purchases$|^all conversions$|^add to cart$|^begin checkout$|^initiated checkout$|^checkout$|^checkouts$|^leads$|^one-click leads$|^qualified leads$|^converted leads$|^lead form submits$|^all clicks$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Conversions" };
  }
  // KPI: Installs
  if (/^app installs$|^app activations$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Installs" };
  }
  // KPI: Registrations
  if (/^registrations$|^signups$|^complete registration$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Registrations" };
  }
  // KPI: Reach
  if (/^page views$|^page visits$|^site visits$|^sessions$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Reach" };
  }
  // KPI: Subscriptions
  if (/^paid subscriptions$|^subscribe$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Subscriptions" };
  }

  // Paid Marketing (only from ad platforms)
  if (AD_PLATFORM_SOURCES.has(source)) {
    // Spends
    if (/^spend$|^media cost$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" };
    }
    // Impressions
    if (/^impressions$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" };
    }
    // Clicks
    if (/^clicks$|^link clicks$|^all clicks$|^swipe ups$|^clickthroughs$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" };
    }
    // Other ad platform metrics
    return { metricCategory: "paid_marketing", paidMarketingMetricType: "Other" };
  }

  // Default: contextual / continuous for non-ad-platform metrics
  return { metricCategory: "contextual", variableType: "Continuous" };
}

// ---------------------------------------------------------------------------
// Migration: raw fields -> typed fields
// ---------------------------------------------------------------------------

function migrateField(raw: RawField): Field {
  const info = getSourceStreamInfo(raw.source);
  const derived = raw.kind === "metric"
    ? deriveMetricCategory(raw.displayName, raw.source)
    : { metricCategory: undefined, variableType: undefined, kpiSubtype: undefined, paidMarketingMetricType: undefined };
  return {
    ...raw,
    columnName: raw.name, // existing name is already snake_case + unique
    dataType: (DATA_TYPE_MIGRATION[raw.dataType] || "STRING") as DataTypeKey,
    stream: info.stream,
    tables: info.tables,
    metricCategory: raw.metricCategory ?? derived.metricCategory,
    variableType: raw.variableType ?? derived.variableType,
    kpiSubtype: raw.kpiSubtype ?? derived.kpiSubtype,
    paidMarketingMetricType: raw.paidMarketingMetricType ?? derived.paidMarketingMetricType,
  };
}

export const initialFields: Field[] = rawFields.map(migrateField);

// --- Source options for dropdowns ---
export const sourceOptions = [
  { name: "Facebook Ads", color: "#1877F2" },
  { name: "Facebook Geo Insights", color: "#1877F2" },
  { name: "Google Ads", color: "#34A853" },
  { name: "Google Geo Insights", color: "#34A853" },
  { name: "Tiktok Ads", color: "#EE1D52" },
  { name: "Snapchat Ads", color: "#FFFC00" },
  { name: "Pinterest Ads", color: "#E60023" },
  { name: "Linkedin Ads", color: "#0A66C2" },
  { name: "X Ads", color: "#1DA1F2" },
  { name: "Amazon Ads", color: "#FF9900" },
  { name: "Microsoft Ads", color: "#00A4EF" },
  { name: "Criteo Ads", color: "#F48120" },
  { name: "Outbrain Ads", color: "#F47920" },
  { name: "Adroll Ads", color: "#0DAEF0" },
  { name: "Walmart Ads", color: "#0071DC" },
  { name: "Vibe Ads", color: "#7C3AED" },
  { name: "Vibe Geo Insights", color: "#7C3AED" },
  { name: "Google DV 360", color: "#4285F4" },
  { name: "Spotify Ads", color: "#1DB954" },
  { name: "StackAdapt", color: "#4A3AFF" },
  { name: "Moloco", color: "#FF4B4B" },
  { name: "Taboola", color: "#243B86" },
  { name: "Facebook Lead Forms", color: "#1877F2" },
  { name: "Tradedoubler", color: "#00A3E0" },
  { name: "Everflow", color: "#FF6B35" },
  { name: "CJ Affiliate", color: "#003366" },
  { name: "Impact", color: "#FF6D3A" },
  { name: "Google Analytics 4", color: "#F9AB00" },
  { name: "HubSpot", color: "#FF7A59" },
  { name: "Salesforce", color: "#00A1E0" },
  { name: "Custom Connector", color: "#6941c6" },
  { name: "Google Sheets", color: "#0F9D58" },
  { name: "Import CSV", color: "#71717a" },
  { name: "Snowflake", color: "#29B5E8" },
  { name: "BigQuery", color: "#4285F4" },
  { name: "Shopify", color: "#95BF47" },
  { name: "WooCommerce", color: "#96588A" },
  { name: "Salesforce Commerce Cloud", color: "#00A1E0" },
  { name: "Salesforce Marketing Cloud", color: "#00A1E0" },
  { name: "Klaviyo", color: "#2B2B2B" },
  { name: "ActiveCampaign", color: "#356AE6" },
  { name: "AppsFlyer", color: "#00C853" },
  { name: "Recharge", color: "#00BFA5" },
  { name: "Judge.me", color: "#FFC107" },
  { name: "Fera.ai", color: "#FF5252" },
  { name: "Roku", color: "#6C3C97" },
  { name: "Multiple", color: "#9CA3AF" },
];

// --- Dimension Definition System ---
export interface ChannelDimensionMapping {
  channel: string;         // parent source name e.g. "Facebook", "Google"
  source: string;          // e.g. "Facebook Ads"
  sourceKey: string;       // e.g. "ad.account_name"
  stream: string;
  dataType: DataTypeKey;
  status: "Mapped" | "Unmapped";
}

export interface DimensionDefinition {
  id: string;
  name: string;            // e.g. "Account", "Brand", "Geo"
  description: string;
  isSystem: boolean;       // true for pre-defined, false for user-created
  channelMappings: ChannelDimensionMapping[];
}

// Build system dimensions from existing rawFields dimension entries
function buildSystemDimensions(): DimensionDefinition[] {
  const dimensionFields = rawFields.filter((f) => f.kind === "dimension");

  // Map displayName patterns to unified dimension definitions
  const dimensionDefs: { id: string; name: string; description: string; patterns: RegExp }[] = [
    { id: "dim_date", name: "Date", description: "Report date for time-based analysis", patterns: /^Date$/i },
    { id: "dim_campaign_name", name: "Campaign Name", description: "Campaign or campaign group name across channels", patterns: /^Campaign( Group)? Name$/i },
    { id: "dim_adgroup", name: "Ad Group / Ad Set", description: "Ad group or ad set level grouping", patterns: /^Ad (Set|Group) Name$/i },
    { id: "dim_ad_name", name: "Ad Name", description: "Individual ad creative name", patterns: /^Ad Name$/i },
    { id: "dim_objective", name: "Objective", description: "Campaign objective or goal type", patterns: /^Objective$|^Network Type$/i },
    { id: "dim_country", name: "Geo / Country", description: "Geographic country or region targeting", patterns: /^Country$/i },
    { id: "dim_channel_type", name: "Channel Type", description: "Advertising channel type (Search, Display, Video, etc.)", patterns: /^Channel Type$/i },
    { id: "dim_account", name: "Account", description: "Advertising account identifier", patterns: /^Account( Name)?$/i },
    { id: "dim_brand", name: "Brand", description: "Brand or advertiser name", patterns: /^Brand$/i },
    { id: "dim_region", name: "Region / State", description: "Sub-country geographic region or state", patterns: /^Region$|^State$/i },
  ];

  return dimensionDefs.map((def) => {
    const matchingFields = dimensionFields.filter((f) => def.patterns.test(f.displayName));
    const channelMappings: ChannelDimensionMapping[] = matchingFields.map((f) => {
      const info = getSourceStreamInfo(f.source);
      return {
        channel: info.parent,
        source: f.source,
        sourceKey: f.sourceKey,
        stream: info.stream,
        dataType: (DATA_TYPE_MIGRATION[f.dataType] || "STRING") as DataTypeKey,
        status: f.status,
      };
    });

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      isSystem: true,
      channelMappings,
    };
  });
}

export const SYSTEM_DIMENSIONS: DimensionDefinition[] = buildSystemDimensions();

// --- Default transforms per data type (used by bulk add) ---
export const DEFAULT_TRANSFORMS: Record<DataTypeKey, string> = {
  CURRENCY: "SUM",
  FLOAT64: "SUM",
  NUMERIC: "SUM",
  INT64: "SUM",
  BIGNUMERIC: "SUM",
  STRING: "NONE",
  DATE: "NONE",
  JSON: "NONE",
};
