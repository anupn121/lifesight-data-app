// Auto-generated fields data from schema
// This file is imported by MetricsDimensionsTab.tsx

// --- Data Type System ---
export type DataTypeKey = "CURRENCY" | "FLOAT64" | "NUMERIC" | "INT64" | "STRING" | "DATE" | "BIGNUMERIC" | "JSON";

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
  // FACEBOOK ADS — Metrics
  // ══════════════════════════════════════════════════════════════════════
  { name: "fb_spend", displayName: "Spend", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total advertising spend" },
  { name: "fb_impressions", displayName: "Impressions", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad impressions" },
  { name: "fb_clicks", displayName: "Link Clicks", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.inline_link_clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clicks on ad links" },
  { name: "fb_all_clicks", displayName: "All Clicks", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks (all types)" },
  { name: "fb_frequency", displayName: "Frequency", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.frequency", dataType: "Ratio", transformation: "AVG", status: "Mapped", description: "Avg times each person saw the ad" },
  { name: "fb_purchase", displayName: "Purchases", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_purchase]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversion events" },
  { name: "fb_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.action_values[omni_purchase]", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to ad purchases" },
  { name: "fb_add_to_cart", displayName: "Add to Cart", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_add_to_cart]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Add-to-cart events" },
  { name: "fb_begin_checkout", displayName: "Initiated Checkout", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_initiated_checkout]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Checkout initiation events" },
  { name: "fb_leads", displayName: "Leads", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[lead_grouped]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead generation events" },
  { name: "fb_complete_registration", displayName: "Registrations", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_complete_registration]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Registration completion events" },
  { name: "fb_app_install", displayName: "App Installs", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_app_install]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "App installation events" },
  { name: "fb_activate_app", displayName: "App Activations", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_activate_app]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App activation events" },
  { name: "fb_rate", displayName: "Rate", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_rate]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Rate action events" },
  { name: "fb_tutorial_completion", displayName: "Tutorial Completion", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_tutorial_completion]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Tutorial completion events" },
  { name: "fb_achievement_unlocked", displayName: "Achievement Unlocked", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_achievement_unlocked]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Achievement unlocked events" },
  { name: "fb_spend_credits", displayName: "Spend Credits", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_spend_credits]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "In-app spend credit events" },
  { name: "fb_level_achieved", displayName: "Level Achieved", kind: "metric", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.actions[omni_level_achieved]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Level achieved events" },

  // FACEBOOK ADS — Dimensions
  { name: "fb_source", displayName: "Source", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Integration source identifier" },
  { name: "fb_parent_source", displayName: "Parent Source", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source grouping" },
  { name: "fb_account_id", displayName: "Account ID", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad account identifier" },
  { name: "fb_account_name", displayName: "Account Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad account name" },
  { name: "fb_date", displayName: "Date", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.date_start", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "fb_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign identifier" },
  { name: "fb_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "fb_adset_id", displayName: "Ad Set ID", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adset_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set identifier" },
  { name: "fb_adset_name", displayName: "Ad Set Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.adset_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set name" },
  { name: "fb_ad_id", displayName: "Ad ID", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad identifier" },
  { name: "fb_ad_name", displayName: "Ad Name", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad creative name" },
  { name: "fb_objective", displayName: "Objective", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.objective", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "fb_device_platform", displayName: "Device Platform", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.device_platform", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Device platform breakdown" },
  { name: "fb_account_currency", displayName: "Currency", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.account_currency", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency code" },
  { name: "fb_ad_status", displayName: "Ad Status", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.ad_status", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad delivery status" },
  { name: "fb_adset_status", displayName: "Ad Set Status", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "aad.dset_status", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad set delivery status" },
  { name: "fb_campaign_status", displayName: "Campaign Status", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "ad.campaign_status", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign delivery status" },
  { name: "fb_creative_id", displayName: "Creative ID", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "__creative.id__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Creative asset identifier" },
  { name: "fb_creative_status", displayName: "Creative Status", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.status", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Creative delivery status" },
  { name: "fb_tracking_url", displayName: "Tracking URL", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.url_tags", dataType: "String", transformation: "NONE", status: "Unmapped", description: "URL tags for tracking" },
  { name: "fb_photo_title", displayName: "Photo Title", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.object_story_spec.photo_data.title", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Photo creative title" },
  { name: "fb_photo_message", displayName: "Photo Message", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.object_story_spec.photo_data.message", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Photo creative primary text" },
  { name: "fb_photo_link_desc", displayName: "Photo Link Description", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.object_story_spec.photo_data.link_description", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Photo link description" },
  { name: "fb_video_cta", displayName: "Video CTA", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.object_story_spec.video_data.call_to_action.value.link", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Video call-to-action link" },
  { name: "fb_video_link_desc", displayName: "Video Link Description", kind: "dimension", source: "Facebook Ads", sourceColor: "#1877F2", sourceKey: "creative.object_story_spec.video_data.link_description", dataType: "String", transformation: "NONE", status: "Unmapped", description: "Video link description" },

  // ══════════════════════════════════════════════════════════════════════
  // FACEBOOK GEO INSIGHTS — Metrics & Dimensions
  // ══════════════════════════════════════════════════════════════════════
  { name: "fb_geo_impressions", displayName: "Impressions", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Impressions by geo" },
  { name: "fb_geo_all_clicks", displayName: "All Clicks", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "All clicks by geo" },
  { name: "fb_geo_clicks", displayName: "Link Clicks", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "inline_link_clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Link clicks by geo" },
  { name: "fb_geo_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "action_values[omni_purchase]", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Purchase revenue by geo" },
  { name: "fb_geo_registration", displayName: "Registrations", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "actions[omni_complete_registration]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Registrations by geo" },
  { name: "fb_geo_activate_app", displayName: "App Activations", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "actions[omni_activate_app]", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App activations by geo" },
  { name: "fb_geo_app_install", displayName: "App Installs", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "actions[omni_app_install]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "App installs by geo" },
  { name: "fb_geo_begin_checkout", displayName: "Checkout", kind: "metric", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "actions[omni_initiated_checkout]", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Checkouts by geo" },
  { name: "fb_geo_source", displayName: "Source", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "fb_geo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "fb_geo_country", displayName: "Country", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "country", dataType: "String", transformation: "NONE", status: "Mapped", description: "Country code" },
  { name: "fb_geo_state", displayName: "State", kind: "dimension", source: "Facebook Geo Insights", sourceColor: "#1877F2", sourceKey: "region", dataType: "String", transformation: "NONE", status: "Mapped", description: "State / region" },

  // ══════════════════════════════════════════════════════════════════════
  // GOOGLE ADS — Metrics
  // ══════════════════════════════════════════════════════════════════════
  { name: "gads_spend", displayName: "Spend", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.costMicros", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend in micros" },
  { name: "gads_impressions", displayName: "Impressions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad impressions" },
  { name: "gads_clicks", displayName: "Clicks", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total ad clicks" },
  { name: "gads_conversions", displayName: "All Conversions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.allConversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "All conversion actions" },
  { name: "gads_conv_value", displayName: "Conversions Value", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.conversionsValue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total value of conversions" },
  { name: "gads_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "metrics.attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to ads" },
  { name: "gads_purchase", displayName: "Purchases", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.purchase", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversion events" },
  { name: "gads_add_to_cart", displayName: "Add to Cart", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.add_to_cart", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Add-to-cart events" },
  { name: "gads_begin_checkout", displayName: "Begin Checkout", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.begin_checkout", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Checkout initiation events" },
  { name: "gads_signup", displayName: "Signups", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.signup", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Signup events" },
  { name: "gads_submit_lead_form", displayName: "Lead Form Submits", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.submit_lead_form", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead form submission events" },
  { name: "gads_qualified_lead", displayName: "Qualified Leads", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.qualified_lead", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Qualified lead events" },
  { name: "gads_converted_lead", displayName: "Converted Leads", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.converted_lead", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Converted lead events" },
  { name: "gads_page_view", displayName: "Page Views", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.page_view", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Page view events" },
  { name: "gads_download", displayName: "Downloads", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.download", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Download events" },
  { name: "gads_contact", displayName: "Contacts", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.contact", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Contact events" },
  { name: "gads_outbound_click", displayName: "Outbound Clicks", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.outbound_click", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Outbound click events" },
  { name: "gads_book_appointment", displayName: "Book Appointment", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.book_appointment", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Appointment booking events" },
  { name: "gads_subscribe_paid", displayName: "Paid Subscriptions", kind: "metric", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.subscribe_paid", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Paid subscription events" },

  // GOOGLE ADS — Dimensions
  { name: "gads_source", displayName: "Source", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source identifier" },
  { name: "gads_parent_source", displayName: "Parent Source", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "gads_account_id", displayName: "Account ID", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account identifier" },
  { name: "gads_account_name", displayName: "Account Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "gads_date", displayName: "Date", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "gads_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__campaign.id__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign identifier" },
  { name: "gads_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__campaign.name__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "gads_adset_id", displayName: "Ad Group ID", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__adGroup.id__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group identifier" },
  { name: "gads_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__adGroup.name__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "gads_ad_id", displayName: "Ad ID", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__adGroupAd.ad____.id__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad identifier" },
  { name: "gads_ad_name", displayName: "Ad Name", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "__adGroupAd.ad____.name__", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "gads_ad_type", displayName: "Ad Type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "adGroupAd.ad.type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad format type" },
  { name: "gads_channel_type", displayName: "Channel Type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "campaign.advertisingChannelType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX" },
  { name: "gads_objective", displayName: "Network Type", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "segments.adNetworkType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad network type" },
  { name: "gads_currency", displayName: "Currency", kind: "dimension", source: "Google Ads", sourceColor: "#34A853", sourceKey: "currencyCode", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // GOOGLE GEO INSIGHTS — Metrics & Dimensions
  // ══════════════════════════════════════════════════════════════════════
  { name: "gads_geo_impressions", displayName: "Impressions", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Impressions by geo" },
  { name: "gads_geo_clicks", displayName: "Clicks", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clicks by geo" },
  { name: "gads_geo_spend", displayName: "Spend", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Spend by geo" },
  { name: "gads_geo_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "attributed_revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue by geo" },
  { name: "gads_geo_purchase", displayName: "Purchases", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "purchase", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchases by geo" },
  { name: "gads_geo_add_to_cart", displayName: "Add to Cart", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "add_to_cart", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Add to cart by geo" },
  { name: "gads_geo_begin_checkout", displayName: "Begin Checkout", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "begin_checkout", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Begin checkout by geo" },
  { name: "gads_geo_registration", displayName: "Registrations", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "complete_registration", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Registrations by geo" },
  { name: "gads_geo_activate_app", displayName: "App Activations", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "activate_app", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App activations by geo" },
  { name: "gads_geo_app_install", displayName: "App Installs", kind: "metric", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "app_install", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App installs by geo" },
  { name: "gads_geo_source", displayName: "Source", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "gads_geo_date", displayName: "Date", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Date" },
  { name: "gads_geo_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "gads_geo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "gads_geo_location_type", displayName: "Location Type", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "location_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Location type" },
  { name: "gads_geo_country", displayName: "Country", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "country_code", dataType: "String", transformation: "NONE", status: "Mapped", description: "Country code" },
  { name: "gads_geo_state", displayName: "State", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "state", dataType: "String", transformation: "NONE", status: "Mapped", description: "State" },
  { name: "gads_geo_dma", displayName: "DMA", kind: "dimension", source: "Google Geo Insights", sourceColor: "#34A853", sourceKey: "dma", dataType: "String", transformation: "NONE", status: "Mapped", description: "Designated market area" },

  // ══════════════════════════════════════════════════════════════════════
  // TIKTOK ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "tt_spend", displayName: "Spend", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "tt_impressions", displayName: "Impressions", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "tt_clicks", displayName: "Clicks", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "tt_purchase", displayName: "Purchases", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_purchase", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total purchase conversions" },
  { name: "tt_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.total_complete_payment_rate", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from completed payments" },
  { name: "tt_source", displayName: "Source", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "tt_parent_source", displayName: "Parent Source", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "tt_account_id", displayName: "Account ID", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account ID" },
  { name: "tt_account_name", displayName: "Account Name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "tt_date", displayName: "Date", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "tt_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "campaign.campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "tt_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "campaign.campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "tt_adset_id", displayName: "Ad Set ID", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "adset.adSetId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set ID" },
  { name: "tt_adset_name", displayName: "Ad Set Name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "adset.adSetName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set name" },
  { name: "tt_ad_id", displayName: "Ad ID", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "ad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "tt_ad_name", displayName: "Ad Name", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "ad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "tt_objective", displayName: "Objective", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.objective_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "tt_currency", displayName: "Currency", kind: "dimension", source: "Tiktok Ads", sourceColor: "#EE1D52", sourceKey: "metrics.account_currency", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // SNAPCHAT ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "snap_spend", displayName: "Spend", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "snap_impressions", displayName: "Impressions", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "snap_clicks", displayName: "Swipe Ups", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "swipes", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Swipe-up clicks" },
  { name: "snap_frequency", displayName: "Frequency", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "frequency", dataType: "Ratio", transformation: "AVG", status: "Mapped", description: "Ad frequency" },
  { name: "snap_purchase", displayName: "Purchases", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversions" },
  { name: "snap_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_purchases_value", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from purchases" },
  { name: "snap_add_to_cart", displayName: "Add to Cart", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_add_cart", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Add-to-cart events" },
  { name: "snap_begin_checkout", displayName: "Begin Checkout", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_start_checkout", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Checkout initiation events" },
  { name: "snap_signup", displayName: "Signups", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_sign_ups", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Signup events" },
  { name: "snap_page_view", displayName: "Page Views", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_page_views", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Page view events" },
  { name: "snap_app_opens", displayName: "App Opens", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_app_opens", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App open events" },
  { name: "snap_add_billing", displayName: "Add Billing", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_add_billing", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Add billing events" },
  { name: "snap_subscribe", displayName: "Subscribe", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_subscribe", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Paid subscription events" },
  { name: "snap_login", displayName: "Login", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_login", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Login events" },
  { name: "snap_save", displayName: "Saves", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_save", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Save events" },
  { name: "snap_search", displayName: "Searches", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_searches", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Search events" },
  { name: "snap_wishlist", displayName: "Add to Wishlist", kind: "metric", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "conversion_add_to_wishlist", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Wishlist events" },
  // Snapchat Dimensions
  { name: "snap_source", displayName: "Source", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "snap_parent_source", displayName: "Parent Source", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "snap_account_id", displayName: "Account ID", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account ID" },
  { name: "snap_account_name", displayName: "Account Name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "snap_date", displayName: "Date", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "snap_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "snap_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "snap_adset_id", displayName: "Ad Squad ID", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "adsquad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad squad ID" },
  { name: "snap_adset_name", displayName: "Ad Squad Name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "adsquad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad squad name" },
  { name: "snap_ad_id", displayName: "Ad ID", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "ad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "snap_ad_name", displayName: "Ad Name", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "ad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "snap_objective", displayName: "Objective", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "objective", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "snap_currency", displayName: "Currency", kind: "dimension", source: "Snapchat Ads", sourceColor: "#FFFC00", sourceKey: "currency", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // PINTEREST ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "pin_spend", displayName: "Spend", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "spend_in_dollar", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "pin_impressions", displayName: "Impressions", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_impression", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "pin_clicks", displayName: "Clickthroughs", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_clickthrough", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Clickthrough events" },
  { name: "pin_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "attributed_revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue attributed to pins" },
  { name: "pin_all_conversions", displayName: "All Conversions", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_conversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total conversion events" },
  { name: "pin_checkout", displayName: "Checkouts", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_checkout", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Checkout conversions" },
  { name: "pin_begin_checkout", displayName: "Begin Checkout", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_web_checkout", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Web checkout events" },
  { name: "pin_page_visit", displayName: "Page Visits", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_page_visit", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Page visit events" },
  { name: "pin_leads", displayName: "Leads", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_lead", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead generation events" },
  { name: "pin_signups", displayName: "Signups", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_signup", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Signup events" },
  { name: "pin_frequency", displayName: "Frequency", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_impression_frequency", dataType: "Ratio", transformation: "AVG", status: "Mapped", description: "Impression frequency" },
  { name: "pin_custom", displayName: "Custom Events", kind: "metric", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "total_custom", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Custom conversion events" },
  // Pinterest Dimensions
  { name: "pin_source", displayName: "Source", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "pin_parent_source", displayName: "Parent Source", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "pin_account_id", displayName: "Account ID", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account ID" },
  { name: "pin_account_name", displayName: "Account Name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "pin_date", displayName: "Date", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "date", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "pin_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "pin_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "pin_adset_id", displayName: "Ad Group ID", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "ad_group_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group ID" },
  { name: "pin_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "ad_group_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "pin_ad_id", displayName: "Ad ID", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "ad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "pin_ad_name", displayName: "Ad Name", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "ad_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "pin_objective", displayName: "Objective", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "campaign_objective_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "pin_currency", displayName: "Currency", kind: "dimension", source: "Pinterest Ads", sourceColor: "#E60023", sourceKey: "currency", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // LINKEDIN ADS
  // ══════════════════════════════════════════════════════════════════════
  { name: "li_spend", displayName: "Spend", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "li_impressions", displayName: "Impressions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "li_clicks", displayName: "Clicks", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "li_all_conversions", displayName: "All Conversions", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "externalWebsiteConversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "External website conversions" },
  { name: "li_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "ConversionValueInLocalCurrency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "li_one_click_leads", displayName: "One-Click Leads", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "OneClickLeads", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead gen form submissions" },
  { name: "li_frequency", displayName: "Frequency", kind: "metric", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Frequency", dataType: "Ratio", transformation: "AVG", status: "Mapped", description: "Ad frequency" },
  // LinkedIn Dimensions
  { name: "li_source", displayName: "Source", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "li_parent_source", displayName: "Parent Source", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "li_account_id", displayName: "Account ID", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account ID" },
  { name: "li_account_name", displayName: "Account Name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "li_date", displayName: "Date", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "TimePeriod", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "li_campaign_id", displayName: "Campaign Group ID", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CampaignGroupId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign group ID" },
  { name: "li_campaign_name", displayName: "Campaign Group Name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CampaignGroupName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign group name" },
  { name: "li_adset_id", displayName: "Campaign ID", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CampaignId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign (ad set) ID" },
  { name: "li_adset_name", displayName: "Campaign Name", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CampaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign (ad set) name" },
  { name: "li_ad_id", displayName: "Creative ID", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CreativeId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Creative ID" },
  { name: "li_ad_type", displayName: "Ad Type", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "Type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad format type" },
  { name: "li_objective", displayName: "Objective", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "ObjectiveType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "li_currency", displayName: "Currency", kind: "dimension", source: "Linkedin Ads", sourceColor: "#0A66C2", sourceKey: "CurrencyCode", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // X ADS (Twitter)
  // ══════════════════════════════════════════════════════════════════════
  { name: "x_spend", displayName: "Spend", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "x_impressions", displayName: "Impressions", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "x_clicks", displayName: "Clicks", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "x_all_conversions", displayName: "All Conversions", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "all_conversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "All conversion events" },
  { name: "x_purchase", displayName: "Purchases", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase conversions" },
  { name: "x_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_value", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "x_qualified_lead", displayName: "Qualified Leads", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "card_engagements", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Card engagement / lead events" },
  { name: "x_page_view", displayName: "Site Visits", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_site_visits", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Site visit conversions" },
  { name: "x_download", displayName: "Downloads", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_downloads", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Download events" },
  { name: "x_signup", displayName: "Signups", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_sign_ups", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Signup events" },
  { name: "x_custom", displayName: "Custom", kind: "metric", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "conversion_custom", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "Custom conversion events" },
  // X Ads Dimensions
  { name: "x_source", displayName: "Source", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Source" },
  { name: "x_parent_source", displayName: "Parent Source", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "parent_source", dataType: "String", transformation: "NONE", status: "Mapped", description: "Parent source" },
  { name: "x_account_id", displayName: "Account ID", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "account_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account ID" },
  { name: "x_account_name", displayName: "Account Name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "account_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account name" },
  { name: "x_date", displayName: "Date", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "time_period", dataType: "Date", transformation: "CAST", status: "Mapped", description: "Report date" },
  { name: "x_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "campaign_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "x_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "x_adset_id", displayName: "Line Item ID", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "line_item_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Line item (ad set) ID" },
  { name: "x_adset_name", displayName: "Line Item Name", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "line_item_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Line item (ad set) name" },
  { name: "x_ad_id", displayName: "Ad ID", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "ad_id", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "x_ad_type", displayName: "Ad Type", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "ad_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad type" },
  { name: "x_ad_network", displayName: "Placement", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "placement", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad placement / network" },
  { name: "x_objective", displayName: "Objective", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "goal", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign goal" },
  { name: "x_currency", displayName: "Currency", kind: "dimension", source: "X Ads", sourceColor: "#1DA1F2", sourceKey: "currency", dataType: "String", transformation: "NONE", status: "Mapped", description: "Account currency" },

  // ══════════════════════════════════════════════════════════════════════
  // AMAZON ADS, MICROSOFT ADS, WALMART ADS, CRITEO, ADROLL, OUTBRAIN, VIBE, DV360
  // (Condensed — key metrics + dimensions per channel)
  // ══════════════════════════════════════════════════════════════════════

  // Amazon Ads
  { name: "amz_spend", displayName: "Spend", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "cost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad cost" },
  { name: "amz_impressions", displayName: "Impressions", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "amz_clicks", displayName: "Clicks", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "amz_purchase", displayName: "Purchases", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "purchases / purchases14d", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase events (14d attribution)" },
  { name: "amz_attributed_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "sales / sales14d", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue (14d)" },
  { name: "amz_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "campaignId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "amz_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "amz_adset_id", displayName: "Ad Group ID", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "adGroupId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group ID" },
  { name: "amz_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "adGroupName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "amz_ad_id", displayName: "Ad ID", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "adId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "amz_objective", displayName: "Objective", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "objective", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Campaign objective" },
  { name: "amz_currency", displayName: "Currency", kind: "dimension", source: "Amazon Ads", sourceColor: "#FF9900", sourceKey: "campaignBudgetCurrencyCode", dataType: "String", transformation: "NONE", status: "Mapped", description: "Currency" },

  // Microsoft Ads
  { name: "msft_spend", displayName: "Spend", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "msft_impressions", displayName: "Impressions", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "msft_clicks", displayName: "Clicks", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "msft_conversions", displayName: "All Conversions", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AllConversionsQualified", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Qualified conversions" },
  { name: "msft_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AllRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from conversions" },
  { name: "msft_campaign_id", displayName: "Campaign ID", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "CampaignId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign ID" },
  { name: "msft_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "CampaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "msft_adset_id", displayName: "Ad Group ID", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdGroupId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group ID" },
  { name: "msft_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdGroupName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "msft_ad_id", displayName: "Ad ID", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdId", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad ID" },
  { name: "msft_ad_name", displayName: "Ad Title", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdTitle", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad title" },
  { name: "msft_ad_type", displayName: "Ad Type", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad type" },
  { name: "msft_device", displayName: "Device", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "DeviceType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Device platform" },
  { name: "msft_network", displayName: "Ad Distribution", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "AdDistribution", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad network distribution" },
  { name: "msft_objective", displayName: "Objective", kind: "dimension", source: "Microsoft Ads", sourceColor: "#00A4EF", sourceKey: "GoalType", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Goal type" },

  // Walmart Ads
  { name: "wm_spend", displayName: "Spend", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "wm_impressions", displayName: "Impressions", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "wm_clicks", displayName: "Clicks", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "wm_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "wm_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "wm_adset_name", displayName: "Ad Set Name", kind: "dimension", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "adsetName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set name" },
  { name: "wm_ad_name", displayName: "Ad Name", kind: "dimension", source: "Walmart Ads", sourceColor: "#0071DC", sourceKey: "adName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },

  // Criteo Ads
  { name: "criteo_spend", displayName: "Spend", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "AdvertiserCost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "criteo_impressions", displayName: "Impressions", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Displays", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total displays/impressions" },
  { name: "criteo_clicks", displayName: "Clicks", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "criteo_conversions", displayName: "All Conversions", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "totalConversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total conversions" },
  { name: "criteo_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "RevenueGeneratedAllPc30d", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue (30d post-click)" },
  { name: "criteo_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Campaign", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "criteo_adset_name", displayName: "Ad Set Name", kind: "dimension", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Adset", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad set name" },
  { name: "criteo_ad_name", displayName: "Ad Name", kind: "dimension", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Ad", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "criteo_device", displayName: "Device", kind: "dimension", source: "Criteo Ads", sourceColor: "#F48120", sourceKey: "Device", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Device platform" },

  // Adroll Ads
  { name: "adroll_spend", displayName: "Spend", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "cost", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "adroll_impressions", displayName: "Impressions", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "adroll_clicks", displayName: "Clicks", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "adroll_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "revenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "adroll_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "adroll_adset_name", displayName: "Ad Group Name", kind: "dimension", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "adGroupName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad group name" },
  { name: "adroll_ad_name", displayName: "Ad Name", kind: "dimension", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "adName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Ad name" },
  { name: "adroll_channel", displayName: "Channel", kind: "dimension", source: "Adroll Ads", sourceColor: "#0DAEF0", sourceKey: "channel", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad network channel" },

  // Outbrain Ads
  { name: "ob_spend", displayName: "Spend", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "ob_impressions", displayName: "Impressions", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "ob_clicks", displayName: "Clicks", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "ob_conversions", displayName: "All Conversions", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "totalConversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total conversions" },
  { name: "ob_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "attributedRevenue", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Attributed revenue" },
  { name: "ob_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Outbrain Ads", sourceColor: "#F47920", sourceKey: "campaignName", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },

  // Vibe Ads
  { name: "vibe_spend", displayName: "Spend", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "spend", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total ad spend" },
  { name: "vibe_impressions", displayName: "Impressions", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "vibe_frequency", displayName: "Frequency", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "frequency", dataType: "Ratio", transformation: "AVG", status: "Mapped", description: "Ad frequency" },
  { name: "vibe_purchase", displayName: "Purchases", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_purchases", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Purchase events" },
  { name: "vibe_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "amount_of_purchases", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue from purchases" },
  { name: "vibe_page_view", displayName: "Page Views", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_page_views", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Page view events" },
  { name: "vibe_sessions", displayName: "Sessions", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_sessions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Session events" },
  { name: "vibe_leads", displayName: "Lead Form Submits", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_leads", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Lead form submissions" },
  { name: "vibe_signups", displayName: "Signups", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "number_of_signups", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Signup events" },
  { name: "vibe_installs", displayName: "App Installs", kind: "metric", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "installs", dataType: "Number", transformation: "SUM", status: "Unmapped", description: "App install events" },
  { name: "vibe_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "vibe_channel", displayName: "Channel Type", kind: "dimension", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "channel_name", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Advertising channel type" },
  { name: "vibe_device", displayName: "Device", kind: "dimension", source: "Vibe Ads", sourceColor: "#7C3AED", sourceKey: "screen", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Screen / device type" },

  // Google DV 360
  { name: "dv360_spend", displayName: "Media Cost", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "media_cost_partner_currency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Total media cost" },
  { name: "dv360_impressions", displayName: "Impressions", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "impressions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total impressions" },
  { name: "dv360_clicks", displayName: "Clicks", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "clicks", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total clicks" },
  { name: "dv360_conversions", displayName: "All Conversions", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "total_conversions", dataType: "Number", transformation: "SUM", status: "Mapped", description: "Total conversions" },
  { name: "dv360_revenue", displayName: "Attributed Revenue", kind: "metric", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "revenue_partner_currency", dataType: "Currency", transformation: "SUM", status: "Mapped", description: "Revenue in partner currency" },
  { name: "dv360_campaign_name", displayName: "Campaign Name", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "campaign_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Campaign name" },
  { name: "dv360_adset_name", displayName: "Line Item Name", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "line_item_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Line item name" },
  { name: "dv360_ad_name", displayName: "Creative Name", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "creative_name", dataType: "String", transformation: "NONE", status: "Mapped", description: "Creative name" },
  { name: "dv360_ad_type", displayName: "Creative Type", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "creative_type", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Creative format type" },
  { name: "dv360_channel", displayName: "Inventory Source", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "inventory_source", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Inventory source / channel type" },
  { name: "dv360_device", displayName: "Device", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "device_platform", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Device type" },
  { name: "dv360_network", displayName: "Exchange", kind: "dimension", source: "Google DV 360", sourceColor: "#4285F4", sourceKey: "exchange_id", dataType: "Enum", transformation: "NONE", status: "Mapped", description: "Ad exchange network" },
];

// ---------------------------------------------------------------------------
// Migration: raw fields -> typed fields
// ---------------------------------------------------------------------------

function migrateField(raw: RawField): Field {
  const info = getSourceStreamInfo(raw.source);
  return {
    ...raw,
    columnName: raw.name, // existing name is already snake_case + unique
    dataType: (DATA_TYPE_MIGRATION[raw.dataType] || "STRING") as DataTypeKey,
    stream: info.stream,
    tables: info.tables,
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
