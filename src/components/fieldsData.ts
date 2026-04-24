// Auto-generated fields data from schema
// This file is imported by MetricsDimensionsTab.tsx

// --- Data Type System ---
export type DataTypeKey = "CURRENCY" | "FLOAT64" | "NUMERIC" | "INT64" | "STRING" | "DATE" | "BIGNUMERIC" | "JSON";

// --- Metric Category System ---
export type MetricCategory = "kpi" | "paid_marketing" | "organic" | "contextual";
export type VariableType = "Binary" | "Continuous" | "Categorical";
export type KpiSubtype = "Revenue" | "Conversions" | "Installs" | "Orders" | "Store Visits" | "Registrations" | "Reach" | "Subscriptions" | "Admissions";
export type PaidMarketingMetricType = "Spends" | "Impressions" | "Clicks" | "Other";

export const METRIC_CATEGORIES: Record<MetricCategory, { label: string; color: string; description: string }> = {
  kpi: { label: "KPIs", color: "#00bc7d", description: "Revenue, Conversions, Installs, Orders, etc." },
  paid_marketing: { label: "Paid Marketing", color: "#2b7fff", description: "Spends, Impressions, Clicks grouped by ad platform" },
  organic: { label: "Organic", color: "#fe9a00", description: "Binary, Continuous, Categorical variables" },
  contextual: { label: "Contextual", color: "#027b8e", description: "Binary, Continuous, Categorical variables" },
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
  /** User confirmed the sample data looks right in the editor. Renders as `Validated`. */
  validated?: boolean;
  /** Which account / sheet / table this field ultimately came from, scoped by business tags (Brand / Product / Country / Region). */
  accountScope?: import("./metrics-dimensions/scopeTypes").AccountScope;
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
  // Non-ad-platform sources
  Shopify: {
    color: "#95BF47",
    streams: {
      "Orders": { sources: ["Shopify Orders"], tables: ["shopify_orders", "shopify_order_items"] },
      "Products": { sources: ["Shopify Products"], tables: ["shopify_products", "shopify_variants"] },
      "Customers": { sources: ["Shopify Customers"], tables: ["shopify_customers"] },
    },
  },
  HubSpot: {
    color: "#FF7A59",
    streams: {
      "Contacts": { sources: ["HubSpot Contacts"], tables: ["hubspot_contacts"] },
      "Email Campaigns": { sources: ["HubSpot Email"], tables: ["hubspot_email_events", "hubspot_campaigns"] },
      "Deals": { sources: ["HubSpot Deals"], tables: ["hubspot_deals"] },
    },
  },
  Klaviyo: {
    color: "#2B2B2B",
    streams: {
      "Campaigns": { sources: ["Klaviyo Campaigns"], tables: ["klaviyo_campaigns", "klaviyo_campaign_stats"] },
      "Flows": { sources: ["Klaviyo Flows"], tables: ["klaviyo_flows", "klaviyo_flow_stats"] },
    },
  },
  "Google Analytics": {
    color: "#F9AB00",
    streams: {
      "Web Traffic": { sources: ["GA4 Web"], tables: ["ga4_sessions", "ga4_events"] },
      "Conversions": { sources: ["GA4 Conversions"], tables: ["ga4_conversions"] },
    },
  },
};

// Parents that use free-text table/sheet name input instead of stream dropdown
export const DATA_SOURCE_PARENTS = new Set(["BigQuery", "Snowflake", "Google Sheets", "CSV"]);

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
  { name: "vibe_impressions", displayName: "Impressions", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Total impressions" },
  { name: "vibe_purchase", displayName: "Purchases", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_purchases", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Purchase events" },
  { name: "vibe_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "amount_of_purchases", dataType: "Currency", transformation: "SUM", status: "Unmapped", description: "Revenue from purchases" },
  { name: "vibe_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Campaign name" },

  // Google DV 360
  { name: "dv360_spend", displayName: "Media Cost", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "media_cost_partner_currency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total media cost" },
  { name: "dv360_impressions", displayName: "Impressions", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "dv360_clicks", displayName: "Clicks", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Total clicks" },
  { name: "dv360_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "revenue_partner_currency", dataType: "Currency", transformation: "SUM", status: "Unmapped", description: "Revenue in partner currency" },
  { name: "dv360_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // ══════════════════════════════════════════════════════════════════════
  // SHOPIFY (KPI category)
  // ══════════════════════════════════════════════════════════════════════
  { name: "shopify_total_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_price", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total order revenue including tax and shipping" },
  { name: "shopify_orders_count", displayName: "Purchases", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.count", dataType: "Number", transformation: "COUNT", status: "Mapped", description: "Total number of completed orders" },
  { name: "shopify_aov", displayName: "Average Order Value", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_price", dataType: "Currency", transformation: "AVG", status: "Mapped", description: "Average revenue per order" },
  { name: "shopify_refund_amount", displayName: "Refund Amount", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "refunds.total_amount", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total refunded amount" },
  { name: "shopify_discount_amount", displayName: "Discount Amount", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_discounts", dataType: "Currency", transformation: "SUM", status: "Unmapped", description: "Total discounts applied" },
  { name: "shopify_new_customers", displayName: "New Customers", kind: "metric", source: "Shopify Customers", sourceColor: "#95BF47", sourceKey: "customers.new_count", dataType: "Number", transformation: "COUNT", status: "Mapped", description: "First-time purchasers" },
  { name: "shopify_repeat_rate", displayName: "Repeat Purchase Rate", kind: "metric", source: "Shopify Customers", sourceColor: "#95BF47", sourceKey: "customers.repeat_rate", dataType: "Percentage", transformation: "AVG", status: "Unmapped", description: "Percentage of returning customers" },
  { name: "shopify_items_sold", displayName: "Items Sold", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "line_items.quantity", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total units sold across all orders" },
  { name: "shopify_order_date", displayName: "Date", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.created_at", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Order creation date" },
  { name: "shopify_product_title", displayName: "Product Name", kind: "dimension", source: "Shopify Products", sourceColor: "#95BF47", sourceKey: "products.title", dataType: "String", transformation: "NONE", status: "Mapped", description: "Product title" },
  { name: "shopify_product_type", displayName: "Product Type", kind: "dimension", source: "Shopify Products", sourceColor: "#95BF47", sourceKey: "products.product_type", dataType: "String", transformation: "NONE", status: "Mapped", description: "Product category type" },
  { name: "shopify_order_channel", displayName: "Sales Channel", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.source_name", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Channel the order originated from" },

  // ══════════════════════════════════════════════════════════════════════
  // HUBSPOT (Organic category)
  // ══════════════════════════════════════════════════════════════════════
  { name: "hs_email_delivered", displayName: "Emails Delivered", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_delivered", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total emails successfully delivered" },
  { name: "hs_email_opens", displayName: "Email Opens", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_opens", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total email open events" },
  { name: "hs_email_clicks", displayName: "Email Clicks", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total click events from emails" },
  { name: "hs_email_unsubs", displayName: "Unsubscribes", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_unsubscribes", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Total email unsubscribe events" },
  { name: "hs_contacts_created", displayName: "New Contacts", kind: "metric", source: "HubSpot Contacts", sourceColor: "#FF7A59", sourceKey: "contacts.created_count", dataType: "Number", transformation: "COUNT", status: "Mapped", description: "New contacts created" },
  { name: "hs_deals_won_revenue", displayName: "Deals Won Revenue", kind: "metric", source: "HubSpot Deals", sourceColor: "#FF7A59", sourceKey: "deals.amount", dataType: "Currency", transformation: "SUM", status: "Unmapped", description: "Total revenue from closed-won deals" },
  { name: "hs_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Email campaign name" },
  { name: "hs_send_date", displayName: "Date", kind: "dimension", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.send_date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Campaign send date" },
  { name: "hs_lifecycle_stage", displayName: "Lifecycle Stage", kind: "dimension", source: "HubSpot Contacts", sourceColor: "#FF7A59", sourceKey: "contacts.lifecyclestage", dataType: "String", transformation: "NONE", status: "Mapped", description: "Contact lifecycle stage" },

  // ══════════════════════════════════════════════════════════════════════
  // KLAVIYO (Organic category)
  // ══════════════════════════════════════════════════════════════════════
  { name: "kl_campaign_revenue", displayName: "Campaign Revenue", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.attributed_revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to email/SMS campaigns" },
  { name: "kl_campaign_recipients", displayName: "Recipients", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_recipients", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total campaign recipients" },
  { name: "kl_campaign_opens", displayName: "Campaign Opens", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_unique_opens", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Unique opens per campaign" },
  { name: "kl_flow_revenue", displayName: "Flow Revenue", kind: "metric", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.attributed_revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to automated flows" },
  { name: "kl_flow_recipients", displayName: "Flow Recipients", kind: "metric", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.num_recipients", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Total flow recipients" },
  { name: "kl_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Klaviyo campaign name" },
  { name: "kl_flow_name", displayName: "Flow Name", kind: "dimension", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Automation flow name" },
  { name: "kl_send_date", displayName: "Date", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.send_time", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Campaign send date" },

  // ══════════════════════════════════════════════════════════════════════
  // GOOGLE ANALYTICS 4 (Contextual category)
  // ══════════════════════════════════════════════════════════════════════
  { name: "ga4_sessions", displayName: "Sessions", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.session_count", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total website sessions" },
  { name: "ga4_users", displayName: "Active Users", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.active_users", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Unique active users" },
  { name: "ga4_page_views", displayName: "Page Views", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.page_view_count", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total page view events" },
  { name: "ga4_bounce_rate", displayName: "Bounce Rate", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.bounce_rate", dataType: "Percentage", transformation: "AVG", status: "Unmapped", description: "Percentage of single-page sessions" },
  { name: "ga4_avg_session_duration", displayName: "Avg Session Duration", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.avg_session_duration", dataType: "Number", transformation: "AVG", status: "Unmapped", description: "Average time spent per session in seconds" },
  { name: "ga4_conversion_rate", displayName: "Conversion Rate", kind: "metric", source: "GA4 Conversions", sourceColor: "#F9AB00", sourceKey: "conversions.rate", dataType: "Percentage", transformation: "AVG", status: "Mapped", description: "Session-level conversion rate" },
  { name: "ga4_date", displayName: "Date", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.event_date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Event date" },
  { name: "ga4_source_medium", displayName: "Source / Medium", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "traffic_source.source_medium", dataType: "String", transformation: "NONE", status: "Mapped", description: "Traffic source and medium" },
  { name: "ga4_landing_page", displayName: "Landing Page", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "events.page_location", dataType: "String", transformation: "NONE", status: "Unmapped", description: "First page URL of the session" },
  { name: "ga4_device_category", displayName: "Device Category", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "device.category", dataType: "String", transformation: "NONE", status: "Mapped", description: "Desktop, mobile, or tablet" },
  { name: "ga4_country", displayName: "Country", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "geo.country", dataType: "String", transformation: "NONE", status: "Mapped", description: "User country" },
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
  // Paid Marketing — all ad-platform metrics go here (including conversions/revenue)
  if (AD_PLATFORM_SOURCES.has(source)) {
    if (/^spend$|^media cost$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" };
    }
    if (/^impressions$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" };
    }
    if (/^clicks$|^link clicks$|^all clicks$|^swipe ups$|^clickthroughs$/i.test(displayName)) {
      return { metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" };
    }
    return { metricCategory: "paid_marketing", paidMarketingMetricType: "Other" };
  }

  // KPI — only from non-ad sources (e-commerce, CRM, etc.)
  if (/attributed revenue|conversions? value/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Revenue" };
  }
  if (/^purchases$|^all conversions$|^add to cart$|^begin checkout$|^initiated checkout$|^checkout$|^checkouts$|^leads$|^one-click leads$|^qualified leads$|^converted leads$|^lead form submits$|^all clicks$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Conversions" };
  }
  if (/^app installs$|^app activations$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Installs" };
  }
  if (/^registrations$|^signups$|^complete registration$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Registrations" };
  }
  if (/^page views$|^page visits$|^site visits$|^sessions$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Reach" };
  }
  if (/^paid subscriptions$|^subscribe$/i.test(displayName)) {
    return { metricCategory: "kpi", kpiSubtype: "Subscriptions" };
  }

  // KPI fallback — if source is a known e-commerce/CRM platform, classify as KPI
  const srcLower = source.toLowerCase();
  if (/shopify|woocommerce|salesforce commerce|recharge/i.test(srcLower)) {
    return { metricCategory: "kpi", kpiSubtype: "Revenue" };
  }

  // Default: contextual / continuous for non-ad, non-KPI metrics
  return { metricCategory: "contextual", variableType: "Continuous" };
}

// ---------------------------------------------------------------------------
// Derive category for dimension fields based on source
// ---------------------------------------------------------------------------
function deriveDimensionCategory(source: string): MetricCategory {
  if (AD_PLATFORM_SOURCES.has(source)) return "paid_marketing";
  const src = source.toLowerCase();
  if (/shopify|woocommerce|salesforce commerce|recharge/i.test(src)) return "kpi";
  if (/hubspot|salesforce(?! commerce)|klaviyo|activecampaign|judge|fera/i.test(src)) return "organic";
  if (/google sheets|csv|snowflake|bigquery/i.test(src)) return "contextual";
  return "contextual";
}

// ---------------------------------------------------------------------------
// Classify a column as metric or dimension by name/dataType (used in wizards)
// ---------------------------------------------------------------------------
export function classifyColumn(name: string, dataType?: string): "metric" | "dimension" {
  const n = name.toLowerCase();
  if (/^date$|_date$|^month$|^year$|^week$|^quarter$|^day$/i.test(n)) return "dimension";
  if (/_(id|key)$|^id_|^account|^channel|^country|^region|^city|^state$/i.test(n)) return "dimension";
  if (/^campaign|^ad_set|^ad_group|^objective|^device|^browser|^platform|^brand$/i.test(n)) return "dimension";
  if (/_(name|type|category|stage|medium|page)$/i.test(n)) return "dimension";
  if (dataType === "DATE" || dataType === "STRING") return "dimension";
  if (/spend|cost|revenue|impressions|clicks|conversions|purchases|installs|opens|bounces/i.test(n)) return "metric";
  if (/rate$|_count$|_amount$|_total$|_value$/i.test(n)) return "metric";
  if (dataType && /INT|FLOAT|NUMERIC|CURRENCY|BIGNUMERIC/i.test(dataType)) return "metric";
  return "dimension";
}

// ---------------------------------------------------------------------------
// Migration: raw fields -> typed fields
// ---------------------------------------------------------------------------

function migrateField(raw: RawField): Field {
  const info = getSourceStreamInfo(raw.source);
  const derived = raw.kind === "metric"
    ? deriveMetricCategory(raw.displayName, raw.source)
    : { metricCategory: deriveDimensionCategory(raw.source), variableType: undefined, kpiSubtype: undefined, paidMarketingMetricType: undefined };
  return {
    ...raw,
    columnName: raw.name,
    dataType: (DATA_TYPE_MIGRATION[raw.dataType] || "STRING") as DataTypeKey,
    stream: info.stream,
    tables: info.tables,
    metricCategory: raw.metricCategory ?? derived.metricCategory,
    variableType: raw.variableType ?? derived.variableType,
    kpiSubtype: raw.kpiSubtype ?? derived.kpiSubtype,
    paidMarketingMetricType: raw.paidMarketingMetricType ?? derived.paidMarketingMetricType,
  };
}

// Seed example account scopes across mock data so the filter + breakdown UI
// has something to render. In a real app, each field's accountScope would be
// set by the tagging step in the integration wizard.
const DEMO_SCOPE_ROTATION: Record<string, import("./metrics-dimensions/scopeTypes").AccountScope[]> = {
  Facebook: [
    { brand: "GAP", product: "Apparel", country: "US", region: "California" },
    { brand: "Banana Republic", product: "Apparel", country: "US", region: "New York" },
    { brand: "Old Navy", product: "Apparel", country: "UK", region: "London" },
  ],
  Google: [
    { brand: "GAP", product: "Apparel", country: "US", region: "US East" },
    { brand: "Banana Republic", product: "Apparel", country: "US", region: "US West" },
    { brand: "Old Navy", product: "Footwear", country: "UK", region: "London" },
  ],
  TikTok: [
    { brand: "GAP", product: "Apparel", country: "US", region: "US West" },
    { brand: "Old Navy", product: "Footwear", country: "US", region: "US East" },
  ],
  Snapchat: [{ brand: "Banana Republic", product: "Apparel", country: "US", region: "California" }],
  Pinterest: [{ brand: "Old Navy", product: "Footwear", country: "UK", region: "APAC" }],
  Shopify: [{ brand: "GAP", product: "Apparel", country: "US", region: "US East" }],
};

function applyDemoScopes(fields: Field[]): Field[] {
  const counters: Record<string, number> = {};
  return fields.map((f) => {
    const info = getSourceStreamInfo(f.source);
    const rotation = DEMO_SCOPE_ROTATION[info.parent];
    if (!rotation || rotation.length === 0) return f;
    const i = (counters[info.parent] ?? 0) % rotation.length;
    counters[info.parent] = (counters[info.parent] ?? 0) + 1;
    return { ...f, accountScope: rotation[i] };
  });
}

export const initialFields: Field[] = applyDemoScopes(rawFields.map(migrateField));

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
  { name: "Custom Connector", color: "#027b8e" },
  { name: "Google Sheets", color: "#0F9D58" },
  { name: "CSV", color: "#71717a" },
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
  channel: string;
  source: string;
  sourceKey: string;
  stream: string;
  dataType: DataTypeKey;
  status: "Mapped" | "Unmapped";
}

export interface DimensionDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  channelMappings: ChannelDimensionMapping[];
}

function buildSystemDimensions(): DimensionDefinition[] {
  const dimensionFields = rawFields.filter((f) => f.kind === "dimension");
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
    { id: "dim_product", name: "Product Name", description: "Product or item name from e-commerce sources", patterns: /^Product( Name| Type)?$/i },
    { id: "dim_sales_channel", name: "Sales Channel", description: "Sales or distribution channel", patterns: /^Sales Channel$/i },
    { id: "dim_lifecycle", name: "Lifecycle Stage", description: "Customer lifecycle or funnel stage", patterns: /^Lifecycle Stage$/i },
    { id: "dim_flow", name: "Flow Name", description: "Automation flow or sequence name", patterns: /^Flow Name$/i },
    { id: "dim_source_medium", name: "Source / Medium", description: "Traffic source and medium combination", patterns: /^Source.?Medium$/i },
    { id: "dim_landing_page", name: "Landing Page", description: "Entry page URL or path", patterns: /^Landing Page$/i },
    { id: "dim_device", name: "Device Category", description: "Device type (desktop, mobile, tablet)", patterns: /^Device Category$/i },
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
    return { id: def.id, name: def.name, description: def.description, isSystem: true, channelMappings };
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

// ---------------------------------------------------------------------------
// Demo mode: pre-built field sets injected when integrations connect
// ---------------------------------------------------------------------------

const DEMO_FIELDS: Record<string, Field[]> = {
  // ══════════════════════════════════════════════════════════════════════════
  // FACEBOOK ADS — Ad & Creative level data from Marketing API
  // ══════════════════════════════════════════════════════════════════════════
  "Facebook Ads": [
    // Spend & Delivery
    { name: "fb_spend", displayName: "Spend", columnName: "fb_spend", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.spend", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "fb_impressions", displayName: "Impressions", columnName: "fb_impressions", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions served", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "fb_reach", displayName: "Reach", columnName: "fb_reach", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.reach", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Unique users who saw the ad", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "fb_frequency", displayName: "Frequency", columnName: "fb_frequency", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.frequency", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Average times each user saw the ad", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Clicks
    { name: "fb_clicks", displayName: "Link Clicks", columnName: "fb_clicks", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.inline_link_clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Clicks on ad links", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "fb_ctr", displayName: "CTR", columnName: "fb_ctr", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.inline_link_click_ctr", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Link click-through rate", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_cpc", displayName: "CPC", columnName: "fb_cpc", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.cost_per_inline_link_click", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Cost per link click", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_cpm", displayName: "CPM", columnName: "fb_cpm", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.cpm", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Cost per thousand impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Conversions
    { name: "fb_purchases", displayName: "Purchases", columnName: "fb_purchases", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_purchase]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Purchase conversion events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_purchase_value", displayName: "Purchase Value", columnName: "fb_purchase_value", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.action_values[omni_purchase]", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total purchase conversion value", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_roas", displayName: "ROAS", columnName: "fb_roas", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.purchase_roas", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Return on ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_add_to_cart", displayName: "Add to Cart", columnName: "fb_add_to_cart", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_add_to_cart]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Add-to-cart events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_initiate_checkout", displayName: "Initiate Checkout", columnName: "fb_initiate_checkout", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_initiated_checkout]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Checkout initiation events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_leads", displayName: "Leads", columnName: "fb_leads", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[lead_grouped]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Lead generation events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_view_content", displayName: "View Content", columnName: "fb_view_content", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_view_content]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Content view events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_complete_registration", displayName: "Complete Registration", columnName: "fb_complete_registration", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_complete_registration]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Registration completion events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_cost_per_purchase", displayName: "Cost per Purchase", columnName: "fb_cost_per_purchase", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.cost_per_action_type[omni_purchase]", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Average cost per purchase", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Video
    { name: "fb_thruplays", displayName: "ThruPlays", columnName: "fb_thruplays", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[video_view]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video views to completion or 15s", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_video_p25", displayName: "Video Watched 25%", columnName: "fb_video_p25", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.video_p25_watched_actions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video plays reaching 25%", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_video_p50", displayName: "Video Watched 50%", columnName: "fb_video_p50", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.video_p50_watched_actions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video plays reaching 50%", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_video_p75", displayName: "Video Watched 75%", columnName: "fb_video_p75", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.video_p75_watched_actions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video plays reaching 75%", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_video_p100", displayName: "Video Watched 100%", columnName: "fb_video_p100", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.video_p100_watched_actions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video plays reaching completion", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Engagement
    { name: "fb_post_reactions", displayName: "Post Reactions", columnName: "fb_post_reactions", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[post_reaction]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Likes, loves, and other reactions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_post_comments", displayName: "Post Comments", columnName: "fb_post_comments", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[comment]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Comments on ad posts", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "fb_post_shares", displayName: "Post Shares", columnName: "fb_post_shares", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[post]", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Shares of ad posts", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Dimensions — Ad & Creative level
    { name: "fb_date", displayName: "Date", columnName: "fb_date", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.date_start", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "fb_account_name", displayName: "Account Name", columnName: "fb_account_name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.account_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad account name", metricCategory: "paid_marketing" },
    { name: "fb_campaign_name", displayName: "Campaign Name", columnName: "fb_campaign_name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "fb_campaign_id", displayName: "Campaign ID", columnName: "fb_campaign_id", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_id", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign ID", metricCategory: "paid_marketing" },
    { name: "fb_adset_name", displayName: "Ad Set Name", columnName: "fb_adset_name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adset_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad set name", metricCategory: "paid_marketing" },
    { name: "fb_ad_name", displayName: "Ad Name", columnName: "fb_ad_name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative name", metricCategory: "paid_marketing" },
    { name: "fb_ad_id", displayName: "Ad ID", columnName: "fb_ad_id", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_id", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad ID", metricCategory: "paid_marketing" },
    { name: "fb_objective", displayName: "Objective", columnName: "fb_objective", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.objective", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective (CONVERSIONS, REACH, TRAFFIC)", metricCategory: "paid_marketing" },
    { name: "fb_country", displayName: "Country", columnName: "fb_country", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.country", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Country targeting", metricCategory: "paid_marketing" },
    { name: "fb_age", displayName: "Age", columnName: "fb_age", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.age", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Age breakdown (18-24, 25-34, etc.)", metricCategory: "paid_marketing" },
    { name: "fb_gender", displayName: "Gender", columnName: "fb_gender", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.gender", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Gender breakdown", metricCategory: "paid_marketing" },
    { name: "fb_placement", displayName: "Placement", columnName: "fb_placement", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.publisher_platform", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Placement (Facebook Feed, Instagram Feed, Stories, Reels)", metricCategory: "paid_marketing" },
    { name: "fb_creative_headline", displayName: "Creative Headline", columnName: "fb_creative_headline", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adcreatives.title", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative headline text", metricCategory: "paid_marketing" },
    { name: "fb_creative_body", displayName: "Creative Body", columnName: "fb_creative_body", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adcreatives.body", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative body text", metricCategory: "paid_marketing" },
    { name: "fb_creative_image_url", displayName: "Creative Image URL", columnName: "fb_creative_image_url", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adcreatives.image_url", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative image/thumbnail URL", metricCategory: "paid_marketing" },
    { name: "fb_cta_type", displayName: "CTA Type", columnName: "fb_cta_type", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adcreatives.call_to_action_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Call-to-action button type (SHOP_NOW, LEARN_MORE)", metricCategory: "paid_marketing" },
    { name: "fb_destination_url", displayName: "Destination URL", columnName: "fb_destination_url", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adcreatives.link_url", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad landing page URL", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE ADS — Ad & Creative level data from Google Ads API
  // ══════════════════════════════════════════════════════════════════════════
  "Google Ads": [
    { name: "gads_spend", displayName: "Spend", columnName: "gads_spend", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.cost_micros", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "gads_impressions", displayName: "Impressions", columnName: "gads_impressions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "gads_clicks", displayName: "Clicks", columnName: "gads_clicks", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "gads_ctr", displayName: "CTR", columnName: "gads_ctr", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.ctr", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Click-through rate", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_avg_cpc", displayName: "Avg CPC", columnName: "gads_avg_cpc", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.average_cpc", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Average cost per click", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_conversions", displayName: "Conversions", columnName: "gads_conversions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.conversions", dataType: "FLOAT64", transformation: "SUM", status: "Mapped", description: "Total conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_conversion_value", displayName: "Conversion Value", columnName: "gads_conversion_value", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.conversions_value", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total conversion value", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_all_conversions", displayName: "All Conversions", columnName: "gads_all_conversions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.all_conversions", dataType: "FLOAT64", transformation: "SUM", status: "Mapped", description: "All conversions including cross-device", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_cost_per_conversion", displayName: "Cost per Conversion", columnName: "gads_cost_per_conversion", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.cost_per_conversion", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Average cost per conversion", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_roas", displayName: "ROAS", columnName: "gads_roas", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.conversions_value_per_cost", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Return on ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_search_impr_share", displayName: "Search Impression Share", columnName: "gads_search_impr_share", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.search_impression_share", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Impression share on search network", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_quality_score", displayName: "Quality Score", columnName: "gads_quality_score", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.historical_quality_score", dataType: "INT64", transformation: "AVG", status: "Mapped", description: "Keyword quality score (1-10)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_video_views", displayName: "Video Views", columnName: "gads_video_views", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.video_views", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total video views (YouTube)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "gads_video_view_rate", displayName: "Video View Rate", columnName: "gads_video_view_rate", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.video_view_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Video views / impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    // Dimensions
    { name: "gads_date", displayName: "Date", columnName: "gads_date", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "gads_account_name", displayName: "Account Name", columnName: "gads_account_name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "customer.descriptive_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Google Ads account name", metricCategory: "paid_marketing" },
    { name: "gads_campaign_name", displayName: "Campaign Name", columnName: "gads_campaign_name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "campaign.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "gads_campaign_id", displayName: "Campaign ID", columnName: "gads_campaign_id", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "campaign.id", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign ID", metricCategory: "paid_marketing" },
    { name: "gads_adgroup_name", displayName: "Ad Group Name", columnName: "gads_adgroup_name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad group name", metricCategory: "paid_marketing" },
    { name: "gads_ad_id", displayName: "Ad ID", columnName: "gads_ad_id", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_ad.ad.id", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad ID", metricCategory: "paid_marketing" },
    { name: "gads_ad_type", displayName: "Ad Type", columnName: "gads_ad_type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_ad.ad.type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad type (RSA, RDA, VIDEO_AD)", metricCategory: "paid_marketing" },
    { name: "gads_headline", displayName: "Headline", columnName: "gads_headline", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_ad.ad.responsive_search_ad.headlines", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad headline text", metricCategory: "paid_marketing" },
    { name: "gads_description", displayName: "Description", columnName: "gads_description", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_ad.ad.responsive_search_ad.descriptions", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad description text", metricCategory: "paid_marketing" },
    { name: "gads_final_url", displayName: "Final URL", columnName: "gads_final_url", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_ad.ad.final_urls", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad landing page URL", metricCategory: "paid_marketing" },
    { name: "gads_channel_type", displayName: "Channel Type", columnName: "gads_channel_type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "campaign.advertising_channel_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX", metricCategory: "paid_marketing" },
    { name: "gads_network", displayName: "Network", columnName: "gads_network", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.ad_network_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad network type", metricCategory: "paid_marketing" },
    { name: "gads_device", displayName: "Device", columnName: "gads_device", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.device", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Device type (MOBILE, DESKTOP, TABLET)", metricCategory: "paid_marketing" },
    { name: "gads_keyword", displayName: "Keyword", columnName: "gads_keyword", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_criterion.keyword.text", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Search keyword text", metricCategory: "paid_marketing" },
    { name: "gads_match_type", displayName: "Match Type", columnName: "gads_match_type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "ad_group_criterion.keyword.match_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Keyword match type (EXACT, PHRASE, BROAD)", metricCategory: "paid_marketing" },
    { name: "gads_search_term", displayName: "Search Term", columnName: "gads_search_term", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "search_term_view.search_term", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Actual search query that triggered the ad", metricCategory: "paid_marketing" },
    { name: "gads_country", displayName: "Country", columnName: "gads_country", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "geographic_view.country_criterion_id", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Country targeting", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // TIKTOK ADS
  // ══════════════════════════════════════════════════════════════════════════
  "TikTok Ads": [
    { name: "tt_spend", displayName: "Spend", columnName: "tt_spend", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.spend", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "tt_impressions", displayName: "Impressions", columnName: "tt_impressions", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "tt_reach", displayName: "Reach", columnName: "tt_reach", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.reach", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Unique users reached", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "tt_clicks", displayName: "Clicks", columnName: "tt_clicks", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "tt_ctr", displayName: "CTR", columnName: "tt_ctr", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.ctr", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Click-through rate", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_cpc", displayName: "CPC", columnName: "tt_cpc", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.cpc", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Cost per click", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_conversions", displayName: "Conversions", columnName: "tt_conversions", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_complete_payment", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total purchase conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_conversion_value", displayName: "Conversion Value", columnName: "tt_conversion_value", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_complete_payment_rate", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total conversion value", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_add_to_cart", displayName: "Add to Cart", columnName: "tt_add_to_cart", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_add_to_cart", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Add-to-cart events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_video_views", displayName: "Video Views", columnName: "tt_video_views", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.video_play_actions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total video view events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_video_completion", displayName: "Video Completions", columnName: "tt_video_completion", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.video_views_p100", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video views to 100%", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_likes", displayName: "Likes", columnName: "tt_likes", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.likes", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Ad likes", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_shares", displayName: "Shares", columnName: "tt_shares", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.shares", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Ad shares", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_comments", displayName: "Comments", columnName: "tt_comments", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.comments", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Ad comments", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "tt_date", displayName: "Date", columnName: "tt_date", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "dimensions.stat_time_day", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "tt_campaign_name", displayName: "Campaign Name", columnName: "tt_campaign_name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "campaign.campaign_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "tt_adgroup_name", displayName: "Ad Group Name", columnName: "tt_adgroup_name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "adgroup.adgroup_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad group name", metricCategory: "paid_marketing" },
    { name: "tt_ad_name", displayName: "Ad Name", columnName: "tt_ad_name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "ad.ad_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative name", metricCategory: "paid_marketing" },
    { name: "tt_objective", displayName: "Objective", columnName: "tt_objective", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "campaign.objective_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective", metricCategory: "paid_marketing" },
    { name: "tt_country", displayName: "Country", columnName: "tt_country", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "dimensions.country_code", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Country code", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // SNAPCHAT ADS
  // ══════════════════════════════════════════════════════════════════════════
  "Snapchat Ads": [
    { name: "snap_spend", displayName: "Spend", columnName: "snap_spend", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.spend", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "snap_impressions", displayName: "Impressions", columnName: "snap_impressions", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "snap_swipe_ups", displayName: "Swipe Ups", columnName: "snap_swipe_ups", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.swipes", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Swipe-up clicks on ads", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "snap_reach", displayName: "Reach", columnName: "snap_reach", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.uniques", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Unique users reached", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "snap_purchases", displayName: "Purchases", columnName: "snap_purchases", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.conversion_purchases", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Purchase conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "snap_purchase_value", displayName: "Purchase Value", columnName: "snap_purchase_value", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.conversion_purchases_value", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue from purchases", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "snap_video_views", displayName: "Video Views", columnName: "snap_video_views", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.video_views", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video views (2+ seconds)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "snap_shares", displayName: "Shares", columnName: "snap_shares", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.shares", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Ad shares", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "snap_date", displayName: "Date", columnName: "snap_date", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "stats.start_time", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "snap_campaign_name", displayName: "Campaign Name", columnName: "snap_campaign_name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "campaign.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "snap_adsquad_name", displayName: "Ad Squad Name", columnName: "snap_adsquad_name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "adsquad.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad squad name", metricCategory: "paid_marketing" },
    { name: "snap_ad_name", displayName: "Ad Name", columnName: "snap_ad_name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "ad.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad creative name", metricCategory: "paid_marketing" },
    { name: "snap_objective", displayName: "Objective", columnName: "snap_objective", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "campaign.objective", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // PINTEREST ADS
  // ══════════════════════════════════════════════════════════════════════════
  "Pinterest Ads": [
    { name: "pin_spend", displayName: "Spend", columnName: "pin_spend", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.SPEND_IN_DOLLAR", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "pin_impressions", displayName: "Impressions", columnName: "pin_impressions", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.IMPRESSION_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "pin_clicks", displayName: "Outbound Clicks", columnName: "pin_clicks", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.OUTBOUND_CLICK_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Clicks leading to external URL", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "pin_saves", displayName: "Saves", columnName: "pin_saves", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.REPIN_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Pin saves to user boards", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_checkout", displayName: "Checkouts", columnName: "pin_checkout", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.CHECKOUT_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Checkout completion events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_checkout_value", displayName: "Checkout Value", columnName: "pin_checkout_value", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.CHECKOUT_VALUE_IN_DOLLAR", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total checkout revenue", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_add_to_cart", displayName: "Add to Cart", columnName: "pin_add_to_cart", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.ADD_TO_CART_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Add-to-cart events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_leads", displayName: "Leads", columnName: "pin_leads", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.LEAD_1", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Lead generation events", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_video_views", displayName: "Video Views", columnName: "pin_video_views", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "metrics.VIDEO_V50_MRC_VIEWS", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video views (MRC standard)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "pin_date", displayName: "Date", columnName: "pin_date", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "pin_campaign_name", displayName: "Campaign Name", columnName: "pin_campaign_name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "pin_adgroup_name", displayName: "Ad Group Name", columnName: "pin_adgroup_name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "ad_group.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad group name", metricCategory: "paid_marketing" },
    { name: "pin_objective", displayName: "Objective", columnName: "pin_objective", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign.objective_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // LINKEDIN ADS
  // ══════════════════════════════════════════════════════════════════════════
  "LinkedIn Ads": [
    { name: "li_spend", displayName: "Spend", columnName: "li_spend", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "costInLocalCurrency", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "li_impressions", displayName: "Impressions", columnName: "li_impressions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "li_clicks", displayName: "Clicks", columnName: "li_clicks", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "li_conversions", displayName: "Conversions", columnName: "li_conversions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "externalWebsiteConversions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "External website conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "li_conversion_value", displayName: "Conversion Value", columnName: "li_conversion_value", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "conversionValueInLocalCurrency", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue from conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "li_leads", displayName: "Lead Form Leads", columnName: "li_leads", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "oneClickLeads", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "LinkedIn lead gen form submissions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "li_social_actions", displayName: "Social Actions", columnName: "li_social_actions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "totalEngagements", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Likes, comments, shares, follows combined", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "li_video_views", displayName: "Video Views", columnName: "li_video_views", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "videoViews", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Video views (2+ seconds)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "li_date", displayName: "Date", columnName: "li_date", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "dateRange.start", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "li_campaign_group_name", displayName: "Campaign Group Name", columnName: "li_campaign_group_name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "campaignGroup.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign group name", metricCategory: "paid_marketing" },
    { name: "li_campaign_name", displayName: "Campaign Name", columnName: "li_campaign_name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "campaign.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "li_objective", displayName: "Objective", columnName: "li_objective", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "campaign.objectiveType", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective", metricCategory: "paid_marketing" },
    { name: "li_ad_format", displayName: "Ad Format", columnName: "li_ad_format", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "campaign.type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "SPONSORED_CONTENT, MESSAGE_AD, DYNAMIC_AD, TEXT_AD", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // X ADS (Twitter)
  // ══════════════════════════════════════════════════════════════════════════
  "X Ads (Twitter)": [
    { name: "x_spend", displayName: "Spend", columnName: "x_spend", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.billed_charge_local_micro", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "x_impressions", displayName: "Impressions", columnName: "x_impressions", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "x_clicks", displayName: "Link Clicks", columnName: "x_clicks", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.url_clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Clicks on URLs in the ad", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "x_engagements", displayName: "Engagements", columnName: "x_engagements", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.engagements", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total engagements", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_likes", displayName: "Likes", columnName: "x_likes", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.likes", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Post likes", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_retweets", displayName: "Retweets", columnName: "x_retweets", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.retweets", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Post retweets", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_purchases", displayName: "Purchases", columnName: "x_purchases", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.conversion_purchases", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Purchase conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_purchase_value", displayName: "Purchase Value", columnName: "x_purchase_value", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.conversion_purchases_value", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue from purchases", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_video_views", displayName: "Video Views", columnName: "x_video_views", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "metrics.video_total_views", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total video views", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "x_date", displayName: "Date", columnName: "x_date", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "time_period", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "x_campaign_name", displayName: "Campaign Name", columnName: "x_campaign_name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "campaign.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "x_line_item_name", displayName: "Line Item Name", columnName: "x_line_item_name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "line_item.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Line item (ad group equivalent)", metricCategory: "paid_marketing" },
    { name: "x_objective", displayName: "Objective", columnName: "x_objective", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "campaign.objective", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign objective", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // MICROSOFT ADS
  // ══════════════════════════════════════════════════════════════════════════
  "Microsoft Ads": [
    { name: "msft_spend", displayName: "Spend", columnName: "msft_spend", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Spend", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "msft_impressions", displayName: "Impressions", columnName: "msft_impressions", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "msft_clicks", displayName: "Clicks", columnName: "msft_clicks", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "msft_conversions", displayName: "Conversions", columnName: "msft_conversions", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Conversions", dataType: "FLOAT64", transformation: "SUM", status: "Mapped", description: "Total conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "msft_revenue", displayName: "Revenue", columnName: "msft_revenue", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AllRevenue", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total conversion revenue", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "msft_roas", displayName: "ROAS", columnName: "msft_roas", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "ReturnOnAdSpend", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Return on ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "msft_quality_score", displayName: "Quality Score", columnName: "msft_quality_score", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "QualityScore", dataType: "INT64", transformation: "AVG", status: "Mapped", description: "Keyword quality score (1-10)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "msft_date", displayName: "Date", columnName: "msft_date", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "TimePeriod", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "msft_campaign_name", displayName: "Campaign Name", columnName: "msft_campaign_name", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "CampaignName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "msft_adgroup_name", displayName: "Ad Group Name", columnName: "msft_adgroup_name", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdGroupName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad group name", metricCategory: "paid_marketing" },
    { name: "msft_keyword", displayName: "Keyword", columnName: "msft_keyword", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Keyword", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Search keyword", metricCategory: "paid_marketing" },
    { name: "msft_device", displayName: "Device", columnName: "msft_device", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "DeviceType", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Device type", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // AMAZON DSP
  // ══════════════════════════════════════════════════════════════════════════
  "Amazon DSP": [
    { name: "dsp_spend", displayName: "Spend", columnName: "dsp_spend", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "totalCost", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total DSP spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "dsp_impressions", displayName: "Impressions", columnName: "dsp_impressions", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "dsp_clicks", displayName: "Clicks", columnName: "dsp_clicks", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "clickThroughs", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "dsp_dpv", displayName: "Detail Page Views", columnName: "dsp_dpv", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "detailPageViews", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Product detail page views", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "dsp_purchases", displayName: "Purchases", columnName: "dsp_purchases", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "totalPurchases14d", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Attributed purchases (14-day)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "dsp_sales", displayName: "Sales", columnName: "dsp_sales", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "totalSales14d", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Attributed sales revenue", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "dsp_roas", displayName: "ROAS", columnName: "dsp_roas", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "totalRoas14d", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Return on ad spend (14-day)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "dsp_ntb_purchases", displayName: "NTB Purchases", columnName: "dsp_ntb_purchases", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "newToBrandPurchases14d", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "New-to-brand purchases", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "dsp_date", displayName: "Date", columnName: "dsp_date", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "dsp_order_name", displayName: "Order Name", columnName: "dsp_order_name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "orderName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "DSP order (campaign) name", metricCategory: "paid_marketing" },
    { name: "dsp_line_item_name", displayName: "Line Item Name", columnName: "dsp_line_item_name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "lineItemName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Line item (ad group) name", metricCategory: "paid_marketing" },
    { name: "dsp_creative_name", displayName: "Creative Name", columnName: "dsp_creative_name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "creativeName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Creative name", metricCategory: "paid_marketing" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE ANALYTICS 4
  // ══════════════════════════════════════════════════════════════════════════
  "Google Analytics": [
    { name: "ga4_sessions", displayName: "Sessions", columnName: "ga4_sessions", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "sessions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total sessions", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_users", displayName: "Total Users", columnName: "ga4_users", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "totalUsers", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total unique users", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_new_users", displayName: "New Users", columnName: "ga4_new_users", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "newUsers", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "First-time users", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_page_views", displayName: "Page Views", columnName: "ga4_page_views", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "screenPageViews", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total page/screen views", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_avg_session_duration", displayName: "Avg Session Duration", columnName: "ga4_avg_session_duration", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "averageSessionDuration", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Average session duration in seconds", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_bounce_rate", displayName: "Bounce Rate", columnName: "ga4_bounce_rate", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "bounceRate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Percentage of non-engaged sessions", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_engagement_rate", displayName: "Engagement Rate", columnName: "ga4_engagement_rate", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "engagementRate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Percentage of engaged sessions", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_conversions", displayName: "Conversions", columnName: "ga4_conversions", kind: "metric", source: "GA4 Conversions", sourceColor: "#F9AB00", sourceKey: "conversions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total key events (conversions)", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_purchase_revenue", displayName: "Purchase Revenue", columnName: "ga4_purchase_revenue", kind: "metric", source: "GA4 Conversions", sourceColor: "#F9AB00", sourceKey: "purchaseRevenue", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "E-commerce purchase revenue", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_add_to_carts", displayName: "Add to Carts", columnName: "ga4_add_to_carts", kind: "metric", source: "GA4 Conversions", sourceColor: "#F9AB00", sourceKey: "addToCarts", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Add-to-cart events", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_event_count", displayName: "Event Count", columnName: "ga4_event_count", kind: "metric", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "eventCount", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total events fired", metricCategory: "contextual", variableType: "Continuous" },
    { name: "ga4_date", displayName: "Date", columnName: "ga4_date", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Event date", metricCategory: "contextual" },
    { name: "ga4_source_medium", displayName: "Source / Medium", columnName: "ga4_source_medium", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "sessionSourceMedium", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Traffic source and medium", metricCategory: "contextual" },
    { name: "ga4_campaign", displayName: "Campaign", columnName: "ga4_campaign", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "sessionCampaignName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name from UTM", metricCategory: "contextual" },
    { name: "ga4_landing_page", displayName: "Landing Page", columnName: "ga4_landing_page", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "landingPage", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "First page URL of the session", metricCategory: "contextual" },
    { name: "ga4_device_category", displayName: "Device Category", columnName: "ga4_device_category", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "deviceCategory", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Desktop, mobile, or tablet", metricCategory: "contextual" },
    { name: "ga4_country", displayName: "Country", columnName: "ga4_country", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "country", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "User country", metricCategory: "contextual" },
    { name: "ga4_event_name", displayName: "Event Name", columnName: "ga4_event_name", kind: "dimension", source: "GA4 Web", sourceColor: "#F9AB00", sourceKey: "eventName", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Event name (page_view, purchase, add_to_cart)", metricCategory: "contextual" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // HUBSPOT
  // ══════════════════════════════════════════════════════════════════════════
  "HubSpot": [
    { name: "hs_emails_sent", displayName: "Emails Sent", columnName: "hs_emails_sent", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_sent", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total emails sent", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_emails_delivered", displayName: "Emails Delivered", columnName: "hs_emails_delivered", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_delivered", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total emails delivered", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_email_opens", displayName: "Email Opens", columnName: "hs_email_opens", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_opens", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total email open events", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_open_rate", displayName: "Open Rate", columnName: "hs_open_rate", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.open_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Unique opens / delivered", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_email_clicks", displayName: "Email Clicks", columnName: "hs_email_clicks", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total link clicks in emails", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_click_rate", displayName: "Click Rate", columnName: "hs_click_rate", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.click_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Unique clicks / delivered", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_email_unsubs", displayName: "Unsubscribes", columnName: "hs_email_unsubs", kind: "metric", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.num_unsubscribes", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Email unsubscribe events", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_contacts_created", displayName: "New Contacts", columnName: "hs_contacts_created", kind: "metric", source: "HubSpot Contacts", sourceColor: "#FF7A59", sourceKey: "contacts.created_count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "New contacts created", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_mqls", displayName: "MQLs", columnName: "hs_mqls", kind: "metric", source: "HubSpot Contacts", sourceColor: "#FF7A59", sourceKey: "contacts.mql_count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "Marketing qualified leads", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_deals_created", displayName: "Deals Created", columnName: "hs_deals_created", kind: "metric", source: "HubSpot Deals", sourceColor: "#FF7A59", sourceKey: "deals.created_count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "New deals created", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_deals_won_revenue", displayName: "Deals Won Revenue", columnName: "hs_deals_won_revenue", kind: "metric", source: "HubSpot Deals", sourceColor: "#FF7A59", sourceKey: "deals.amount", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue from closed-won deals", metricCategory: "organic", variableType: "Continuous" },
    { name: "hs_send_date", displayName: "Date", columnName: "hs_send_date", kind: "dimension", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.send_date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Campaign send date", metricCategory: "organic" },
    { name: "hs_campaign_name", displayName: "Campaign Name", columnName: "hs_campaign_name", kind: "dimension", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Email campaign name", metricCategory: "organic" },
    { name: "hs_subject_line", displayName: "Subject Line", columnName: "hs_subject_line", kind: "dimension", source: "HubSpot Email", sourceColor: "#FF7A59", sourceKey: "campaigns.subject", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Email subject line", metricCategory: "organic" },
    { name: "hs_lifecycle_stage", displayName: "Lifecycle Stage", columnName: "hs_lifecycle_stage", kind: "dimension", source: "HubSpot Contacts", sourceColor: "#FF7A59", sourceKey: "contacts.lifecyclestage", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Contact lifecycle stage", metricCategory: "organic" },
    { name: "hs_deal_stage", displayName: "Deal Stage", columnName: "hs_deal_stage", kind: "dimension", source: "HubSpot Deals", sourceColor: "#FF7A59", sourceKey: "deals.dealstage", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Deal pipeline stage", metricCategory: "organic" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // KLAVIYO
  // ══════════════════════════════════════════════════════════════════════════
  "Klaviyo": [
    { name: "kl_campaign_revenue", displayName: "Campaign Revenue", columnName: "kl_campaign_revenue", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.attributed_revenue", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue attributed to campaigns", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_campaign_recipients", displayName: "Recipients", columnName: "kl_campaign_recipients", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_recipients", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total campaign recipients", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_campaign_opens", displayName: "Unique Opens", columnName: "kl_campaign_opens", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_unique_opens", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Unique opens per campaign", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_campaign_clicks", displayName: "Unique Clicks", columnName: "kl_campaign_clicks", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_unique_clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Unique clicks per campaign", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_open_rate", displayName: "Open Rate", columnName: "kl_open_rate", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.open_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Unique opens / recipients", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_click_rate", displayName: "Click Rate", columnName: "kl_click_rate", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.click_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Unique clicks / delivered", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_campaign_unsubs", displayName: "Unsubscribes", columnName: "kl_campaign_unsubs", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.num_unsubscribes", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Campaign unsubscribes", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_campaign_orders", displayName: "Attributed Orders", columnName: "kl_campaign_orders", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.attributed_orders", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Orders attributed to campaign", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_flow_revenue", displayName: "Flow Revenue", columnName: "kl_flow_revenue", kind: "metric", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.attributed_revenue", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue attributed to flows", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_flow_recipients", displayName: "Flow Recipients", columnName: "kl_flow_recipients", kind: "metric", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.num_recipients", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total flow recipients", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_flow_orders", displayName: "Flow Orders", columnName: "kl_flow_orders", kind: "metric", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.attributed_orders", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Orders attributed to flows", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_sms_sent", displayName: "SMS Sent", columnName: "kl_sms_sent", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.sms_sent", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "SMS messages sent", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_sms_revenue", displayName: "SMS Revenue", columnName: "kl_sms_revenue", kind: "metric", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.sms_attributed_revenue", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Revenue attributed to SMS", metricCategory: "organic", variableType: "Continuous" },
    { name: "kl_send_date", displayName: "Date", columnName: "kl_send_date", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.send_time", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Campaign send date", metricCategory: "organic" },
    { name: "kl_campaign_name", displayName: "Campaign Name", columnName: "kl_campaign_name", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Klaviyo campaign name", metricCategory: "organic" },
    { name: "kl_campaign_type", displayName: "Campaign Type", columnName: "kl_campaign_type", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.channel", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Channel type (email, sms)", metricCategory: "organic" },
    { name: "kl_flow_name", displayName: "Flow Name", columnName: "kl_flow_name", kind: "dimension", source: "Klaviyo Flows", sourceColor: "#2B2B2B", sourceKey: "flows.name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Automation flow name", metricCategory: "organic" },
    { name: "kl_list_name", displayName: "List Name", columnName: "kl_list_name", kind: "dimension", source: "Klaviyo Campaigns", sourceColor: "#2B2B2B", sourceKey: "campaigns.list_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Recipient list or segment name", metricCategory: "organic" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // SHOPIFY
  // ══════════════════════════════════════════════════════════════════════════
  "Shopify": [
    { name: "shopify_total_revenue", displayName: "Revenue", columnName: "shopify_total_revenue", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_price", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total order revenue", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_gross_sales", displayName: "Gross Sales", columnName: "shopify_gross_sales", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.subtotal_price", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Sales before discounts and returns", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_net_sales", displayName: "Net Sales", columnName: "shopify_net_sales", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.net_sales", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Sales after discounts and returns", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_orders_count", displayName: "Purchases", columnName: "shopify_orders_count", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "Total completed orders", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "shopify_aov", displayName: "Average Order Value", columnName: "shopify_aov", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_price", dataType: "CURRENCY", transformation: "AVG", status: "Mapped", description: "Average revenue per order", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_items_sold", displayName: "Items Sold", columnName: "shopify_items_sold", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "line_items.quantity", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total units sold", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "shopify_refund_amount", displayName: "Refund Amount", columnName: "shopify_refund_amount", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "refunds.total_amount", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total refunded amount", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_discount_amount", displayName: "Discounts", columnName: "shopify_discount_amount", kind: "metric", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.total_discounts", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total discounts applied", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "shopify_new_customers", displayName: "New Customers", columnName: "shopify_new_customers", kind: "metric", source: "Shopify Customers", sourceColor: "#95BF47", sourceKey: "customers.new_count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "First-time purchasers", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "shopify_returning_customers", displayName: "Returning Customers", columnName: "shopify_returning_customers", kind: "metric", source: "Shopify Customers", sourceColor: "#95BF47", sourceKey: "customers.returning_count", dataType: "INT64", transformation: "COUNT", status: "Mapped", description: "Repeat purchasers", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "shopify_repeat_rate", displayName: "Repeat Purchase Rate", columnName: "shopify_repeat_rate", kind: "metric", source: "Shopify Customers", sourceColor: "#95BF47", sourceKey: "customers.repeat_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Percentage of returning customers", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "shopify_order_date", displayName: "Date", columnName: "shopify_order_date", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.created_at", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Order creation date", metricCategory: "kpi" },
    { name: "shopify_product_title", displayName: "Product Name", columnName: "shopify_product_title", kind: "dimension", source: "Shopify Products", sourceColor: "#95BF47", sourceKey: "products.title", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Product title", metricCategory: "kpi" },
    { name: "shopify_product_type", displayName: "Product Type", columnName: "shopify_product_type", kind: "dimension", source: "Shopify Products", sourceColor: "#95BF47", sourceKey: "products.product_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Product category type", metricCategory: "kpi" },
    { name: "shopify_order_channel", displayName: "Sales Channel", columnName: "shopify_order_channel", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.source_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Sales channel (web, pos, mobile)", metricCategory: "kpi" },
    { name: "shopify_discount_code", displayName: "Discount Code", columnName: "shopify_discount_code", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.discount_codes.code", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Applied discount code", metricCategory: "kpi" },
    { name: "shopify_country", displayName: "Country", columnName: "shopify_country", kind: "dimension", source: "Shopify Orders", sourceColor: "#95BF47", sourceKey: "orders.shipping_address.country", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Shipping country", metricCategory: "kpi" },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // STACKADAPT
  // ══════════════════════════════════════════════════════════════════════════
  "StackAdapt": [
    { name: "stackadapt_spend", displayName: "Spend", columnName: "stackadapt_spend", kind: "metric", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "cost", dataType: "CURRENCY", transformation: "SUM", status: "Mapped", description: "Total ad spend", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "stackadapt_impressions", displayName: "Impressions", columnName: "stackadapt_impressions", kind: "metric", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "impressions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total impressions", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "stackadapt_clicks", displayName: "Clicks", columnName: "stackadapt_clicks", kind: "metric", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "clicks", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total clicks", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "stackadapt_conversions", displayName: "Conversions", columnName: "stackadapt_conversions", kind: "metric", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "conversions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "stackadapt_date", displayName: "Date", columnName: "stackadapt_date", kind: "dimension", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Report date", metricCategory: "paid_marketing" },
    { name: "stackadapt_campaign_name", displayName: "Campaign Name", columnName: "stackadapt_campaign_name", kind: "dimension", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "campaign_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "stackadapt_ad_type", displayName: "Ad Type", columnName: "stackadapt_ad_type", kind: "dimension", source: "StackAdapt", sourceColor: "#4A3AFF", sourceKey: "ad_type", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Ad type (native, display, video, CTV, audio)", metricCategory: "paid_marketing" },
  ],

  // File/Sheet uploads
  "Blogs": [
    { name: "blog_pageviews", displayName: "Pageviews", columnName: "blog_pageviews", kind: "metric", source: "Blogs", sourceColor: "#0F9D58", sourceKey: "uploaded.blog_pageviews", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total blog pageviews", metricCategory: "contextual", variableType: "Continuous" },
    { name: "blog_sessions", displayName: "Sessions", columnName: "blog_sessions", kind: "metric", source: "Blogs", sourceColor: "#0F9D58", sourceKey: "uploaded.blog_sessions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total blog sessions", metricCategory: "contextual", variableType: "Continuous" },
    { name: "blog_bounce_rate", displayName: "Bounce Rate", columnName: "blog_bounce_rate", kind: "metric", source: "Blogs", sourceColor: "#0F9D58", sourceKey: "uploaded.blog_bounce_rate", dataType: "FLOAT64", transformation: "AVG", status: "Mapped", description: "Average bounce rate", metricCategory: "contextual", variableType: "Continuous" },
    { name: "blog_post_title", displayName: "Post Title", columnName: "blog_post_title", kind: "dimension", source: "Blogs", sourceColor: "#0F9D58", sourceKey: "uploaded.blog_post_title", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Blog post title", metricCategory: "contextual" },
    { name: "blog_date", displayName: "Date", columnName: "blog_date", kind: "dimension", source: "Blogs", sourceColor: "#0F9D58", sourceKey: "uploaded.blog_date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Publish date", metricCategory: "contextual" },
  ],
  "Events": [
    { name: "event_registrations", displayName: "Registrations", columnName: "event_registrations", kind: "metric", source: "Events", sourceColor: "#DB4437", sourceKey: "uploaded.event_registrations", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total event registrations", metricCategory: "organic", variableType: "Continuous" },
    { name: "event_attendees", displayName: "Attendees", columnName: "event_attendees", kind: "metric", source: "Events", sourceColor: "#DB4437", sourceKey: "uploaded.event_attendees", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Total event attendees", metricCategory: "organic", variableType: "Continuous" },
    { name: "event_conversions", displayName: "Conversions", columnName: "event_conversions", kind: "metric", source: "Events", sourceColor: "#DB4437", sourceKey: "uploaded.event_conversions", dataType: "INT64", transformation: "SUM", status: "Mapped", description: "Post-event conversions", metricCategory: "organic", variableType: "Continuous" },
    { name: "event_name", displayName: "Event Name", columnName: "event_name", kind: "dimension", source: "Events", sourceColor: "#DB4437", sourceKey: "uploaded.event_name", dataType: "STRING", transformation: "NONE", status: "Mapped", description: "Event name", metricCategory: "organic" },
    { name: "event_date", displayName: "Date", columnName: "event_date", kind: "dimension", source: "Events", sourceColor: "#DB4437", sourceKey: "uploaded.event_date", dataType: "DATE", transformation: "NONE", status: "Mapped", description: "Event date", metricCategory: "organic" },
  ],
  "Influencer Costs": [
    { name: "inf_spend", displayName: "Influencer Spend", columnName: "inf_spend", kind: "metric", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_spend", dataType: "CURRENCY", transformation: "SUM", status: "Unmapped", description: "Total spend on influencer campaigns", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "inf_impressions", displayName: "Impressions", columnName: "inf_impressions", kind: "metric", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_impressions", dataType: "INT64", transformation: "SUM", status: "Unmapped", description: "Total impressions from influencer posts", metricCategory: "paid_marketing", paidMarketingMetricType: "Impressions" },
    { name: "inf_engagements", displayName: "Engagements", columnName: "inf_engagements", kind: "metric", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_engagements", dataType: "INT64", transformation: "SUM", status: "Unmapped", description: "Likes, comments, shares", metricCategory: "paid_marketing", paidMarketingMetricType: "Clicks" },
    { name: "inf_conversions", displayName: "Conversions", columnName: "inf_conversions", kind: "metric", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_conversions", dataType: "INT64", transformation: "SUM", status: "Unmapped", description: "Attributed conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "inf_date", displayName: "Date", columnName: "inf_date", kind: "dimension", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_date", dataType: "DATE", transformation: "NONE", status: "Unmapped", description: "Campaign date", metricCategory: "paid_marketing" },
    { name: "inf_influencer_name", displayName: "Influencer", columnName: "inf_influencer_name", kind: "dimension", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_influencer_name", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Influencer name", metricCategory: "paid_marketing" },
    { name: "inf_platform", displayName: "Platform", columnName: "inf_platform", kind: "dimension", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_platform", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Social media platform", metricCategory: "paid_marketing" },
    { name: "inf_campaign_name", displayName: "Campaign", columnName: "inf_campaign_name", kind: "dimension", source: "Influencer Costs", sourceColor: "#71717a", sourceKey: "uploaded.inf_campaign_name", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Influencer campaign name", metricCategory: "paid_marketing" },
  ],
  "Revenue & Orders": [
    { name: "bq_revenue", displayName: "Revenue", columnName: "bq_revenue", kind: "metric", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.revenue", dataType: "CURRENCY", transformation: "SUM", status: "Unmapped", description: "Total order revenue", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "bq_orders", displayName: "Orders", columnName: "bq_orders", kind: "metric", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.orders", dataType: "INT64", transformation: "COUNT", status: "Unmapped", description: "Total completed orders", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "bq_aov", displayName: "Average Order Value", columnName: "bq_aov", kind: "metric", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.aov", dataType: "CURRENCY", transformation: "AVG", status: "Unmapped", description: "Average revenue per order", metricCategory: "kpi", kpiSubtype: "Revenue" },
    { name: "bq_new_customers", displayName: "New Customers", columnName: "bq_new_customers", kind: "metric", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.new_customers", dataType: "INT64", transformation: "COUNT", status: "Unmapped", description: "First-time purchasers", metricCategory: "kpi", kpiSubtype: "Conversions" },
    { name: "bq_order_date", displayName: "Date", columnName: "bq_order_date", kind: "dimension", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.order_date", dataType: "DATE", transformation: "NONE", status: "Unmapped", description: "Order date", metricCategory: "kpi" },
    { name: "bq_product_category", displayName: "Product Category", columnName: "bq_product_category", kind: "dimension", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.product_category", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Product category", metricCategory: "kpi" },
    { name: "bq_country", displayName: "Country", columnName: "bq_country", kind: "dimension", source: "Revenue & Orders (BigQuery)", sourceColor: "#4285F4", sourceKey: "bigquery.country", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Customer country", metricCategory: "kpi" },
  ],
  "Attribution Data": [
    { name: "attr_conversions", displayName: "Attributed Conversions", columnName: "attr_conversions", kind: "metric", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.conversions", dataType: "FLOAT64", transformation: "SUM", status: "Unmapped", description: "Multi-touch attributed conversions", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "attr_revenue", displayName: "Attributed Revenue", columnName: "attr_revenue", kind: "metric", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.revenue", dataType: "CURRENCY", transformation: "SUM", status: "Unmapped", description: "Multi-touch attributed revenue", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "attr_spend", displayName: "Channel Spend", columnName: "attr_spend", kind: "metric", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.spend", dataType: "CURRENCY", transformation: "SUM", status: "Unmapped", description: "Channel spend for attribution period", metricCategory: "paid_marketing", paidMarketingMetricType: "Spends" },
    { name: "attr_roas", displayName: "Attributed ROAS", columnName: "attr_roas", kind: "metric", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.roas", dataType: "FLOAT64", transformation: "AVG", status: "Unmapped", description: "Return on ad spend (attributed)", metricCategory: "paid_marketing", paidMarketingMetricType: "Other" },
    { name: "attr_date", displayName: "Date", columnName: "attr_date", kind: "dimension", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.date", dataType: "DATE", transformation: "NONE", status: "Unmapped", description: "Attribution date", metricCategory: "paid_marketing" },
    { name: "attr_channel", displayName: "Channel", columnName: "attr_channel", kind: "dimension", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.channel", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Marketing channel", metricCategory: "paid_marketing" },
    { name: "attr_campaign", displayName: "Campaign", columnName: "attr_campaign", kind: "dimension", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.campaign", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Campaign name", metricCategory: "paid_marketing" },
    { name: "attr_model", displayName: "Attribution Model", columnName: "attr_model", kind: "dimension", source: "Attribution Data (Snowflake)", sourceColor: "#29B5E8", sourceKey: "snowflake.model", dataType: "STRING", transformation: "NONE", status: "Unmapped", description: "Attribution model (last-touch, linear, time-decay)", metricCategory: "paid_marketing" },
  ],
};

// Aliases for common name variations
DEMO_FIELDS["Meta Ads"] = DEMO_FIELDS["Facebook Ads"];

export function getDemoFieldsForIntegration(integrationName: string): Field[] {
  return DEMO_FIELDS[integrationName] || [];
}

const DEMO_TACTICS: Record<string, string[]> = {
  "Facebook Ads": ["Meta MOF", "Meta Retargeting", "Instagram Video", "Meta BOF", "Instagram Stories", "Advantage+ Shopping"],
  "Meta Ads": ["Meta MOF", "Meta Retargeting", "Instagram Video", "Meta BOF", "Instagram Stories", "Advantage+ Shopping"],
  "Google Ads": ["Google Shopping", "Google Search Brand", "Google Search Non-Brand", "Google Display", "YouTube Video", "Performance Max"],
  "TikTok Ads": ["TikTok TOF", "TikTok Retargeting", "TikTok Spark Ads"],
  "Snapchat Ads": ["Snapchat Awareness", "Snapchat Retargeting"],
  "Pinterest Ads": ["Pinterest Shopping", "Pinterest Awareness"],
  "LinkedIn Ads": ["LinkedIn Lead Gen", "LinkedIn Awareness"],
  "X Ads (Twitter)": ["X Awareness", "X Website Traffic"],
  "Microsoft Ads": ["Bing Search Brand", "Bing Search Non-Brand", "Bing Shopping"],
  "Amazon DSP": ["Amazon DSP Retargeting", "Amazon DSP Prospecting"],
  "StackAdapt": ["StackAdapt Programmatic", "StackAdapt CTV"],
};

export function getDemoTacticsForIntegration(integrationName: string): string[] {
  return DEMO_TACTICS[integrationName] || [];
}
