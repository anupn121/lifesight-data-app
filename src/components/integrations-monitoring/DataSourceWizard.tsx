"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { CatalogIntegration, DataCategory } from "../monitoringData";
import { DATA_CATEGORY_LABELS } from "../monitoringData";
import type { MetricCategory } from "../fieldsData";
import { METRIC_CATEGORIES, initialFields, classifyColumn, SYSTEM_DIMENSIONS } from "../fieldsData";
import { IntegrationIcon } from "./icons";
import { DataCategoryPicker } from "./DataCategoryPicker";
import { DataPreviewTable } from "./DataPreviewTable";
import { ScopeTaggingEditor, type ScopeTaggingItem } from "../metrics-dimensions/ScopeTaggingEditor";
import type { AccountScope } from "../metrics-dimensions/scopeTypes";

// ─── Types ─────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  checked?: boolean;
}

interface TableColumn {
  name: string;
  type: string;
  isAutoKey?: boolean; // auto-detected as likely primary key
}

interface ColumnMapping {
  sourceColumn: string;
  category: MetricCategory | "";
  targetKey: string;
  displayName: string;
  isNewKey: boolean;
}

type DedupStrategy = "upsert" | "replace" | "append";

// Mock table columns for warehouse tables
const TABLE_COLUMNS: Record<string, TableColumn[]> = {
  "t-events": [
    { name: "event_id", type: "STRING", isAutoKey: true },
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "user_id", type: "STRING" },
    { name: "event_name", type: "STRING" },
    { name: "revenue", type: "FLOAT64" },
    { name: "session_id", type: "STRING" },
  ],
  "t-sessions": [
    { name: "session_id", type: "STRING", isAutoKey: true },
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "user_id", type: "STRING" },
    { name: "duration_sec", type: "INT64" },
    { name: "page_views", type: "INT64" },
    { name: "bounce", type: "BOOLEAN" },
  ],
  "t-pageviews": [
    { name: "view_id", type: "STRING", isAutoKey: true },
    { name: "session_id", type: "STRING" },
    { name: "url", type: "STRING" },
    { name: "timestamp", type: "TIMESTAMP", isAutoKey: true },
    { name: "referrer", type: "STRING" },
  ],
  "t-spend": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "STRING", isAutoKey: true },
    { name: "channel", type: "STRING" },
    { name: "spend", type: "FLOAT64" },
    { name: "impressions", type: "INT64" },
    { name: "clicks", type: "INT64" },
  ],
  "t-attribution": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "STRING", isAutoKey: true },
    { name: "source", type: "STRING" },
    { name: "conversions", type: "FLOAT64" },
    { name: "revenue", type: "FLOAT64" },
  ],
  "t-orders": [
    { name: "order_id", type: "STRING", isAutoKey: true },
    { name: "date", type: "DATE" },
    { name: "customer_id", type: "STRING" },
    { name: "total", type: "FLOAT64" },
    { name: "currency", type: "STRING" },
    { name: "status", type: "STRING" },
  ],
  "t-products": [
    { name: "product_id", type: "STRING", isAutoKey: true },
    { name: "name", type: "STRING" },
    { name: "category", type: "STRING" },
    { name: "price", type: "FLOAT64" },
    { name: "sku", type: "STRING" },
  ],
  // Snowflake tables
  "sf-t-revenue": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "channel", type: "VARCHAR" },
    { name: "revenue", type: "NUMBER" },
    { name: "orders", type: "NUMBER" },
    { name: "aov", type: "NUMBER" },
  ],
  "sf-t-orders": [
    { name: "order_id", type: "VARCHAR", isAutoKey: true },
    { name: "date", type: "DATE" },
    { name: "customer_id", type: "VARCHAR" },
    { name: "total", type: "NUMBER" },
    { name: "status", type: "VARCHAR" },
  ],
  "sf-t-sessions": [
    { name: "session_id", type: "VARCHAR", isAutoKey: true },
    { name: "date", type: "DATE" },
    { name: "user_id", type: "VARCHAR" },
    { name: "duration", type: "NUMBER" },
    { name: "pages", type: "NUMBER" },
  ],
  "sf-t-spend": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "VARCHAR", isAutoKey: true },
    { name: "spend", type: "NUMBER" },
    { name: "impressions", type: "NUMBER" },
    { name: "clicks", type: "NUMBER" },
  ],
  "sf-t-campaigns": [
    { name: "campaign_id", type: "VARCHAR", isAutoKey: true },
    { name: "name", type: "VARCHAR" },
    { name: "channel", type: "VARCHAR" },
    { name: "start_date", type: "DATE" },
    { name: "end_date", type: "DATE" },
  ],
  "sf-t-attribution": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "VARCHAR", isAutoKey: true },
    { name: "touchpoint", type: "VARCHAR" },
    { name: "conversions", type: "NUMBER" },
    { name: "revenue", type: "NUMBER" },
  ],
  // Redshift
  "rs-t-transactions": [
    { name: "transaction_id", type: "VARCHAR", isAutoKey: true },
    { name: "date", type: "DATE" },
    { name: "amount", type: "DECIMAL" },
    { name: "customer_id", type: "VARCHAR" },
    { name: "product_id", type: "VARCHAR" },
  ],
  "rs-t-customers": [
    { name: "customer_id", type: "VARCHAR", isAutoKey: true },
    { name: "email", type: "VARCHAR" },
    { name: "created_at", type: "TIMESTAMP" },
    { name: "segment", type: "VARCHAR" },
  ],
  "rs-t-products": [
    { name: "product_id", type: "VARCHAR", isAutoKey: true },
    { name: "name", type: "VARCHAR" },
    { name: "category", type: "VARCHAR" },
    { name: "price", type: "DECIMAL" },
  ],
  "rs-t-ad-spend": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "channel", type: "VARCHAR", isAutoKey: true },
    { name: "spend", type: "DECIMAL" },
    { name: "impressions", type: "INTEGER" },
    { name: "clicks", type: "INTEGER" },
  ],
  "rs-t-conversions": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "VARCHAR", isAutoKey: true },
    { name: "conversions", type: "INTEGER" },
    { name: "revenue", type: "DECIMAL" },
  ],
  // Databricks
  "db-t-events": [
    { name: "event_id", type: "STRING", isAutoKey: true },
    { name: "timestamp", type: "TIMESTAMP", isAutoKey: true },
    { name: "user_id", type: "STRING" },
    { name: "event_type", type: "STRING" },
    { name: "properties", type: "STRING" },
  ],
  "db-t-revenue": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "channel", type: "STRING" },
    { name: "revenue", type: "DOUBLE" },
    { name: "orders", type: "LONG" },
  ],
  "db-t-funnel": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "step", type: "STRING", isAutoKey: true },
    { name: "users", type: "LONG" },
    { name: "conversion_rate", type: "DOUBLE" },
  ],
  "db-t-campaigns": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "campaign_id", type: "STRING", isAutoKey: true },
    { name: "spend", type: "DOUBLE" },
    { name: "impressions", type: "LONG" },
    { name: "clicks", type: "LONG" },
    { name: "conversions", type: "LONG" },
  ],
  "db-t-channels": [
    { name: "date", type: "DATE", isAutoKey: true },
    { name: "channel", type: "STRING", isAutoKey: true },
    { name: "sessions", type: "LONG" },
    { name: "revenue", type: "DOUBLE" },
    { name: "bounce_rate", type: "DOUBLE" },
  ],
};

// ─── Mock Data ─────────────────────────────────────────────────────────────

const BIGQUERY_TREE: TreeNode[] = [
  {
    id: "project-1",
    label: "skyscanner-prod",
    children: [
      {
        id: "ds-analytics",
        label: "analytics_dataset",
        children: [
          { id: "t-events", label: "events_daily" },
          { id: "t-sessions", label: "user_sessions" },
          { id: "t-pageviews", label: "page_views" },
        ],
      },
      {
        id: "ds-marketing",
        label: "marketing_dataset",
        children: [
          { id: "t-spend", label: "campaign_spend" },
          { id: "t-attribution", label: "attribution_data" },
        ],
      },
      {
        id: "ds-ecommerce",
        label: "ecommerce_dataset",
        children: [
          { id: "t-orders", label: "orders" },
          { id: "t-products", label: "products" },
        ],
      },
    ],
  },
];

const SNOWFLAKE_TREE: TreeNode[] = [
  {
    id: "sf-db-analytics",
    label: "ANALYTICS_DB",
    children: [
      {
        id: "sf-schema-public",
        label: "PUBLIC",
        children: [
          { id: "sf-t-revenue", label: "revenue_daily" },
          { id: "sf-t-orders", label: "orders" },
          { id: "sf-t-sessions", label: "user_sessions" },
        ],
      },
      {
        id: "sf-schema-marketing",
        label: "MARKETING",
        children: [
          { id: "sf-t-spend", label: "ad_spend" },
          { id: "sf-t-campaigns", label: "campaigns" },
          { id: "sf-t-attribution", label: "multi_touch_attribution" },
        ],
      },
    ],
  },
];

const REDSHIFT_TREE: TreeNode[] = [
  {
    id: "rs-schema-public",
    label: "public",
    children: [
      { id: "rs-t-transactions", label: "transactions" },
      { id: "rs-t-customers", label: "customers" },
      { id: "rs-t-products", label: "products" },
    ],
  },
  {
    id: "rs-schema-marketing",
    label: "marketing",
    children: [
      { id: "rs-t-ad-spend", label: "ad_spend_daily" },
      { id: "rs-t-conversions", label: "conversions" },
    ],
  },
];

const DATABRICKS_TREE: TreeNode[] = [
  {
    id: "db-catalog-main",
    label: "main",
    children: [
      {
        id: "db-schema-analytics",
        label: "analytics",
        children: [
          { id: "db-t-events", label: "events" },
          { id: "db-t-revenue", label: "revenue_summary" },
          { id: "db-t-funnel", label: "conversion_funnel" },
        ],
      },
      {
        id: "db-schema-marketing",
        label: "marketing",
        children: [
          { id: "db-t-campaigns", label: "campaign_performance" },
          { id: "db-t-channels", label: "channel_metrics" },
        ],
      },
    ],
  },
];

function getWarehouseTree(name: string): TreeNode[] {
  if (name === "Snowflake") return SNOWFLAKE_TREE;
  if (name === "Amazon Redshift") return REDSHIFT_TREE;
  if (name === "Databricks") return DATABRICKS_TREE;
  return BIGQUERY_TREE;
}

const SHEETS_LIST = [
  { id: "sh-1", name: "Campaign Performance Q4", rows: 2340, lastUpdated: "2 hours ago" },
  { id: "sh-2", name: "Monthly Revenue Summary", rows: 156, lastUpdated: "1 day ago" },
  { id: "sh-3", name: "Ad Spend Tracker 2024", rows: 890, lastUpdated: "3 hours ago" },
  { id: "sh-4", name: "Keyword Rankings", rows: 1205, lastUpdated: "6 hours ago" },
];

const MOCK_COLUMNS: Record<string, { sourceColumn: string; suggestedCategory: MetricCategory }[]> = {
  BigQuery: [
    { sourceColumn: "revenue_usd", suggestedCategory: "kpi" },
    { sourceColumn: "total_orders", suggestedCategory: "kpi" },
    { sourceColumn: "ad_spend", suggestedCategory: "paid_marketing" },
    { sourceColumn: "impressions", suggestedCategory: "paid_marketing" },
    { sourceColumn: "clicks", suggestedCategory: "paid_marketing" },
    { sourceColumn: "organic_visits", suggestedCategory: "organic" },
    { sourceColumn: "bounce_rate", suggestedCategory: "contextual" },
    { sourceColumn: "avg_session_duration", suggestedCategory: "contextual" },
  ],
  "Google Sheets": [
    { sourceColumn: "revenue", suggestedCategory: "kpi" },
    { sourceColumn: "conversions", suggestedCategory: "kpi" },
    { sourceColumn: "spend", suggestedCategory: "paid_marketing" },
    { sourceColumn: "cpc", suggestedCategory: "paid_marketing" },
    { sourceColumn: "organic_traffic", suggestedCategory: "organic" },
    { sourceColumn: "weather_index", suggestedCategory: "contextual" },
  ],
};

const DATA_SOURCE_INTEGRATIONS = new Set(["BigQuery", "Google Sheets", "Snowflake", "Amazon Redshift", "Databricks"]);

// ─── Mock Streams Data (for standard integrations) ──────────────────────────

interface StreamInfo {
  id: string;
  name: string;
  frequency: string;
  description: string;
  usedIn: string[];
}

const MOCK_STREAMS: Record<string, StreamInfo[]> = {
  "Facebook Ads": [
    { id: "fb-campaigns", name: "Campaigns", frequency: "Every 6 hours", description: "Campaign-level performance metrics", usedIn: ["Marketing Mix Model", "Attribution"] },
    { id: "fb-adsets", name: "Ad Sets", frequency: "Every 6 hours", description: "Ad set targeting and delivery data", usedIn: ["Attribution"] },
    { id: "fb-ads", name: "Ads", frequency: "Every 6 hours", description: "Individual ad creative performance", usedIn: ["Creative Analysis"] },
    { id: "fb-insights", name: "Account Insights", frequency: "Daily", description: "Account-level aggregate metrics", usedIn: ["Marketing Mix Model", "Executive Dashboard"] },
  ],
  "Google Ads": [
    { id: "ga-campaigns", name: "Campaigns", frequency: "Every 6 hours", description: "Campaign performance and budget data", usedIn: ["Marketing Mix Model", "Attribution"] },
    { id: "ga-adgroups", name: "Ad Groups", frequency: "Every 6 hours", description: "Ad group level metrics and targeting", usedIn: ["Attribution"] },
    { id: "ga-keywords", name: "Keywords", frequency: "Daily", description: "Search keyword performance data", usedIn: ["SEO Analysis", "Attribution"] },
    { id: "ga-search-terms", name: "Search Terms", frequency: "Daily", description: "Actual search queries triggering ads", usedIn: ["SEO Analysis"] },
  ],
  "TikTok Ads": [
    { id: "tt-campaigns", name: "Campaigns", frequency: "Every 12 hours", description: "Campaign-level spend and performance", usedIn: ["Marketing Mix Model"] },
    { id: "tt-adgroups", name: "Ad Groups", frequency: "Every 12 hours", description: "Ad group targeting and delivery", usedIn: ["Attribution"] },
    { id: "tt-ads", name: "Ads", frequency: "Every 12 hours", description: "Creative-level performance metrics", usedIn: ["Creative Analysis"] },
  ],
  default: [
    { id: "def-main", name: "Main Data", frequency: "Daily", description: "Primary integration data stream", usedIn: ["Marketing Mix Model"] },
    { id: "def-metrics", name: "Performance Metrics", frequency: "Daily", description: "Key performance indicators", usedIn: ["Executive Dashboard"] },
  ],
};

function getStreamsForIntegration(name: string): StreamInfo[] {
  return MOCK_STREAMS[name] || MOCK_STREAMS["default"];
}

// ─── Mock Mapping Template Data ────────────────────────────────────────────

interface MappingTemplateField {
  sourceField: string;
  lifesightField: string;
  category: MetricCategory;
  displayName: string;
  isEditable: boolean;
  fieldType: "metric" | "dimension";
}

const MOCK_MAPPING_TEMPLATES: Record<string, MappingTemplateField[]> = {
  "Facebook Ads": [
    { sourceField: "campaign_name", lifesightField: "fb_campaign_name", category: "paid_marketing", displayName: "Campaign Name", isEditable: true, fieldType: "dimension" },
    { sourceField: "ad_set_name", lifesightField: "fb_ad_set_name", category: "paid_marketing", displayName: "Ad Set Name", isEditable: true, fieldType: "dimension" },
    { sourceField: "spend", lifesightField: "fb_ads_spend", category: "paid_marketing", displayName: "Facebook Ads Spend", isEditable: true, fieldType: "metric" },
    { sourceField: "impressions", lifesightField: "fb_ads_impressions", category: "paid_marketing", displayName: "Facebook Ads Impressions", isEditable: true, fieldType: "metric" },
    { sourceField: "clicks", lifesightField: "fb_ads_clicks", category: "paid_marketing", displayName: "Facebook Ads Clicks", isEditable: true, fieldType: "metric" },
    { sourceField: "conversions", lifesightField: "fb_ads_conversions", category: "paid_marketing", displayName: "Facebook Ads Conversions", isEditable: true, fieldType: "metric" },
    { sourceField: "cpc", lifesightField: "fb_ads_cpc", category: "paid_marketing", displayName: "Facebook Ads CPC", isEditable: true, fieldType: "metric" },
    { sourceField: "cpm", lifesightField: "fb_ads_cpm", category: "paid_marketing", displayName: "Facebook Ads CPM", isEditable: true, fieldType: "metric" },
  ],
  "Google Ads": [
    { sourceField: "campaign_name", lifesightField: "google_campaign_name", category: "paid_marketing", displayName: "Campaign Name", isEditable: true, fieldType: "dimension" },
    { sourceField: "keyword", lifesightField: "google_keyword", category: "paid_marketing", displayName: "Keyword", isEditable: true, fieldType: "dimension" },
    { sourceField: "cost", lifesightField: "google_ads_cost", category: "paid_marketing", displayName: "Google Ads Cost", isEditable: true, fieldType: "metric" },
    { sourceField: "impressions", lifesightField: "google_ads_impressions", category: "paid_marketing", displayName: "Google Ads Impressions", isEditable: true, fieldType: "metric" },
    { sourceField: "clicks", lifesightField: "google_ads_clicks", category: "paid_marketing", displayName: "Google Ads Clicks", isEditable: true, fieldType: "metric" },
    { sourceField: "conversions", lifesightField: "google_ads_conversions", category: "paid_marketing", displayName: "Google Ads Conversions", isEditable: true, fieldType: "metric" },
    { sourceField: "search_impression_share", lifesightField: "google_ads_impression_share", category: "paid_marketing", displayName: "Google Ads Impression Share", isEditable: true, fieldType: "metric" },
  ],
  "TikTok Ads": [
    { sourceField: "campaign_name", lifesightField: "tiktok_campaign_name", category: "paid_marketing", displayName: "Campaign Name", isEditable: true, fieldType: "dimension" },
    { sourceField: "spend", lifesightField: "tiktok_ads_spend", category: "paid_marketing", displayName: "TikTok Ads Spend", isEditable: true, fieldType: "metric" },
    { sourceField: "impressions", lifesightField: "tiktok_ads_impressions", category: "paid_marketing", displayName: "TikTok Ads Impressions", isEditable: true, fieldType: "metric" },
    { sourceField: "clicks", lifesightField: "tiktok_ads_clicks", category: "paid_marketing", displayName: "TikTok Ads Clicks", isEditable: true, fieldType: "metric" },
    { sourceField: "conversions", lifesightField: "tiktok_ads_conversions", category: "paid_marketing", displayName: "TikTok Ads Conversions", isEditable: true, fieldType: "metric" },
  ],
  default: [
    { sourceField: "metric_1", lifesightField: "integration_metric_1", category: "kpi", displayName: "Metric 1", isEditable: true, fieldType: "metric" },
    { sourceField: "metric_2", lifesightField: "integration_metric_2", category: "kpi", displayName: "Metric 2", isEditable: true, fieldType: "metric" },
  ],
};

function getMappingTemplate(name: string): MappingTemplateField[] {
  return (MOCK_MAPPING_TEMPLATES[name] || MOCK_MAPPING_TEMPLATES["default"]).map((f) => ({ ...f }));
}

// ─── Step Components ───────────────────────────────────────────────────────

function StepAuthorize({
  integration,
  onNext,
  onInviteUser,
  isDataSource,
  channelName,
  onChangeChannelName,
  connected,
  onChangeConnected,
  authValues: authValuesProp,
  onChangeAuthValues,
  onChangeIntegrationType,
}: {
  integration: CatalogIntegration;
  onNext: () => void;
  onInviteUser?: (name: string) => void;
  isDataSource?: boolean;
  channelName?: string;
  onChangeChannelName?: (v: string) => void;
  connected?: boolean;
  onChangeConnected?: (v: boolean) => void;
  authValues?: Record<string, string>;
  onChangeAuthValues?: (v: Record<string, string>) => void;
  /** When set, renders a "Change integration type" link in the header so
      the user can switch to a different source (opens the custom source
      picker view in the parent). Only passed from non-native JSP flows. */
  onChangeIntegrationType?: () => void;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const isApiKey = integration.authType === "api_key";
  const [sheetUrl, setSheetUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"oauth" | "url">("oauth");
  const [localConnected, setLocalConnected] = useState(false);
  const isConnected = connected ?? localConnected;
  const setIsConnected = onChangeConnected ?? setLocalConnected;
  const [localAuthValues, setLocalAuthValues] = useState<Record<string, string>>({});
  const authValues = authValuesProp ?? localAuthValues;
  const updateAuthValue = (key: string, value: string) => {
    const next = { ...authValues, [key]: value };
    if (onChangeAuthValues) onChangeAuthValues(next);
    else setLocalAuthValues(next);
  };
  // Dynamic auth fields for API key integrations
  const defaultAuthFields: { key: string; label: string; type: "text" | "password" | "textarea"; placeholder: string }[] = [
    { key: "account_id", label: "Account ID", type: "text", placeholder: `Enter your ${integration.name} account ID` },
    { key: "bearer_token", label: "Bearer Token", type: "password", placeholder: "Paste your API token or bearer token" },
  ];
  const authFields = integration.authFields ?? defaultAuthFields;
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const allAuthFilled = isApiKey ? authFields.every((f) => (authValues[f.key] || "").trim() !== "") : true;

  const isWarehouse = !isGoogleSheets && isDataSource;
  const [credMode, setCredMode] = useState<"saved" | "new">("saved");
  const [selectedCredId, setSelectedCredId] = useState<string>("");
  const canProceed = isDataSource
    ? (channelName || "").trim().length > 0 && isConnected
    : true;

  // Data-source path (BigQuery / Snowflake / Redshift / Databricks / Google Sheets)
  if (isDataSource) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Contextual banner shown only in JSP flow. Matches the FileIntegrationWizard
            version for visual consistency — see its implementation for the design rationale. */}
        {onChangeIntegrationType && (
          <div className="mb-6 bg-[#027b8e]/6 border border-[#027b8e]/25 rounded-[10px] overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-[8px] bg-[#027b8e]/12 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.25" stroke="#027b8e" strokeWidth="1.3" />
                  <path d="M9 5.5V9.5M9 12V12.2" stroke="#027b8e" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-primary)] text-sm font-semibold leading-tight">
                  Setting up &ldquo;{channelName || integration.name}&rdquo;
                </div>
              </div>
              <button
                onClick={onChangeIntegrationType}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-[32px] rounded-[8px] bg-[var(--bg-card)] border border-[#027b8e]/40 text-[#027b8e] hover:bg-[#027b8e]/10 hover:border-[#027b8e] text-xs font-semibold transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 4h7l-2-2M11.5 10h-7l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Change source type
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <IntegrationIcon integration={integration} />
          <div>
            <h2 className="text-[var(--text-primary)] text-xl font-semibold">Set up {integration.name}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Name your integration and connect your data source.</p>
          </div>
        </div>

        {/* Integration Name */}
        <div className="mb-6">
          <label className="text-[var(--text-secondary)] text-sm font-medium block mb-2">Integration Name</label>
          <input
            type="text"
            value={channelName || ""}
            onChange={(e) => onChangeChannelName?.(e.target.value)}
            placeholder={`e.g., Revenue Data, Attribution Model, ${integration.name} Analytics`}
            className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
          <p className="text-[var(--text-dim)] text-xs mt-2">This name will appear on your integrations list. Use something recognizable.</p>
        </div>

        <div className="border-t border-[var(--border-primary)] mb-6" />

        {/* Credential selector for warehouses */}
        {isWarehouse && (() => {
          const DEMO_SAVED_CREDS: { id: string; label: string; description: string; values: Record<string, string> }[] = integration.name === "BigQuery" ? [
            { id: "cred-1", label: "Production", description: "skyscanner-prod / Service Account", values: { project_id: "skyscanner-prod", service_account_json: "{...service-account-key...}" } },
            { id: "cred-2", label: "Staging", description: "skyscanner-staging / Service Account", values: { project_id: "skyscanner-staging", service_account_json: "{...staging-key...}" } },
          ] : integration.name === "Snowflake" ? [
            { id: "cred-1", label: "Production Warehouse", description: "account.snowflakecomputing.com / COMPUTE_WH", values: { host: "account.snowflakecomputing.com", account: "skyscanner", warehouse: "COMPUTE_WH", database: "ANALYTICS_DB", schema: "PUBLIC", username: "svc_lifesight", password: "••••••" } },
          ] : integration.name === "Amazon Redshift" ? [
            { id: "cred-1", label: "Analytics Cluster", description: "cluster.us-east-1.redshift.amazonaws.com", values: { host: "cluster.us-east-1.redshift.amazonaws.com", port: "5439", database: "analytics", username: "lifesight_ro", password: "••••••" } },
          ] : integration.name === "Databricks" ? [
            { id: "cred-1", label: "Azure Workspace", description: "adb-1234.azuredatabricks.net", values: { host: "adb-1234.azuredatabricks.net", http_path: "/sql/1.0/warehouses/abc123", access_token: "dapi..." } },
          ] : [];

          const handleSelectCred = (cred: typeof DEMO_SAVED_CREDS[0]) => {
            setSelectedCredId(cred.id);
            setCredMode("saved");
            for (const [key, val] of Object.entries(cred.values)) updateAuthValue(key, val);
            setIsConnected(true);
          };

          return (
            <div className="mb-6">
              <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Credentials</label>

              {DEMO_SAVED_CREDS.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {DEMO_SAVED_CREDS.map((cred) => {
                    const isActive = isConnected && selectedCredId === cred.id && credMode === "saved";
                    return (
                      <button
                        key={cred.id}
                        onClick={() => handleSelectCred(cred)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          isActive ? "border-[#00bc7d] bg-[#00bc7d]/5" : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? "border-[#00bc7d]" : "border-[var(--border-secondary)]"}`}>
                          {isActive && <div className="w-2 h-2 rounded-full bg-[#00bc7d]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] text-sm font-medium">{cred.label}</span>
                            {isActive && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00bc7d]/10 text-[#00bc7d] font-medium">Connected</span>}
                          </div>
                          <span className="text-[var(--text-dim)] text-xs">{cred.description}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke={isActive ? "#00bc7d" : "var(--text-dim)"} strokeWidth="1.2" fill="none" />
                          <path d="M5 7V5a3 3 0 016 0v2" stroke={isActive ? "#00bc7d" : "var(--text-dim)"} strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => { setCredMode("new"); setIsConnected(false); setSelectedCredId(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  credMode === "new" ? "border-[#027b8e] bg-[#027b8e]/5" : "border-dashed border-[var(--border-secondary)] hover:border-[var(--border-secondary)]"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${credMode === "new" ? "border-[#027b8e]" : "border-[var(--border-secondary)]"}`}>
                  {credMode === "new" && <div className="w-2 h-2 rounded-full bg-[#027b8e]" />}
                </div>
                <div className="flex-1">
                  <span className="text-[var(--text-primary)] text-sm font-medium">Add new credentials</span>
                  <span className="text-[var(--text-dim)] text-xs block">Enter new {integration.name} credentials</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-[var(--text-dim)]"><path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>

              {credMode === "new" && isApiKey && (
                <div className="mt-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                  <div className="px-4 py-4 flex flex-col gap-3">
                    {authFields.map((field) => (
                      <div key={field.key}>
                        <label className="text-[var(--text-muted)] text-xs font-medium block mb-1.5">{field.label}</label>
                        {field.type === "textarea" ? (
                          <textarea value={authValues[field.key] || ""} onChange={(e) => updateAuthValue(field.key, e.target.value)} placeholder={field.placeholder} rows={3}
                            className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors resize-none font-mono text-xs" />
                        ) : field.type === "password" ? (
                          <div className="relative">
                            <input type={visibleFields.has(field.key) ? "text" : "password"} value={authValues[field.key] || ""} onChange={(e) => updateAuthValue(field.key, e.target.value)} placeholder={field.placeholder}
                              className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 pr-10 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
                            <button type="button" onClick={() => setVisibleFields((prev) => { const next = new Set(prev); if (next.has(field.key)) next.delete(field.key); else next.add(field.key); return next; })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" /><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>
                            </button>
                          </div>
                        ) : (
                          <input type="text" value={authValues[field.key] || ""} onChange={(e) => updateAuthValue(field.key, e.target.value)} placeholder={field.placeholder}
                            className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
                        )}
                      </div>
                    ))}
                    <button onClick={() => { setIsConnected(true); if ((channelName || "").trim()) onNext(); }} disabled={!allAuthFilled || !(channelName || "").trim()}
                      className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Verify &amp; Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Google Sheets connection */}
        {isGoogleSheets && !isConnected && (
          <div className="mb-6">
            <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Connect to {integration.name}</label>
            <div className="flex gap-2 p-1 bg-[var(--bg-card-inner)] rounded-[6px] border border-[var(--border-primary)] mb-4">
              <button onClick={() => setAuthMethod("oauth")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${authMethod === "oauth" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>Google Account</button>
              <button onClick={() => setAuthMethod("url")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${authMethod === "url" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>Sheet URL</button>
            </div>
            {authMethod === "url" && (
              <input type="text" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 mb-4 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
            )}
            <button onClick={() => setIsConnected(true)} disabled={authMethod === "url" && !sheetUrl.trim()}
              className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              Authenticate
            </button>
          </div>
        )}

        {/* Continue button */}
        {canProceed && (
          <button
            onClick={onNext}
            className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors mb-4"
          >
            Continue
          </button>
        )}

        {/* Invite teammate */}
        {onInviteUser && (
          <button
            onClick={() => onInviteUser(integration.name)}
            className="w-full flex items-center gap-3 px-5 py-3 bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-[8px] hover:border-[#027b8e]/40 hover:bg-[var(--hover-bg)] transition-colors mb-4"
          >
            <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-card-inner)] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10.67 14v-1.33a2.67 2.67 0 00-2.67-2.67H4a2.67 2.67 0 00-2.67 2.67V14" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="6" cy="5.33" r="2" stroke="var(--text-dim)" strokeWidth="1.2" />
                <path d="M13.33 5.33v4M11.33 7.33h4" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="text-[var(--text-secondary)] text-sm font-medium block">Don&apos;t have access?</span>
              <span className="text-[var(--text-dim)] text-[11px]">Request a teammate or invite someone new</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-dim)] flex-shrink-0"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {/* Help documentation */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#2b7fff]/10 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
              <path d="M6.5 6.5a1.5 1.5 0 012.83.7c0 1-1.33 1.3-1.33 1.3" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.5" fill="#2b7fff" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[var(--text-primary)] text-sm font-medium block">Need help connecting {integration.name}?</span>
            <p className="text-[var(--text-dim)] text-xs mt-0.5 leading-relaxed">
              Check our setup guide for step-by-step instructions on how to connect and configure this integration.
            </p>
            <button className="mt-2 text-[#2b7fff] text-xs font-medium hover:underline transition-colors flex items-center gap-1">
              View documentation
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1h6v6M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard integration path — richer layout
  return (
    <div className="max-w-xl mx-auto">
      {/* Centered hero with integration branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-[12px] flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${integration.color}18` }}>
          <IntegrationIcon integration={integration} />
        </div>
        <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-1">Connect {integration.name}</h2>
        <p className="text-[var(--text-muted)] text-sm">Securely authenticate Lifesight to sync your data</p>
      </div>

      {/* Auth card — show when not yet connected */}
      {!isConnected && (
        <>
          {isApiKey ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden mb-4">
              <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#027b8e]/10 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 1L9 5h4l-5 10 1-6H5l5-8z" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <span className="text-[var(--text-primary)] text-sm font-medium">API Credentials</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                {authFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[var(--text-muted)] text-xs font-medium block mb-1.5">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={authValues[field.key] || ""}
                        onChange={(e) => updateAuthValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors resize-none font-mono text-xs"
                      />
                    ) : field.type === "password" ? (
                      <div className="relative">
                        <input
                          type={visibleFields.has(field.key) ? "text" : "password"}
                          value={authValues[field.key] || ""}
                          onChange={(e) => updateAuthValue(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 pr-10 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setVisibleFields((prev) => { const next = new Set(prev); if (next.has(field.key)) next.delete(field.key); else next.add(field.key); return next; })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                        >
                          {visibleFields.has(field.key) ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" /><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" /><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M2 12L12 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={authValues[field.key] || ""}
                        onChange={(e) => updateAuthValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setIsConnected(true)}
                  disabled={!allAuthFilled}
                  className="w-full px-4 h-[36px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Verify & Connect
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden mb-4">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[6px] bg-[#027b8e]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#027b8e" strokeWidth="1.2" fill="none" />
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[var(--text-primary)] text-sm font-medium block">OAuth 2.0 Authentication</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsConnected(true)}
                  className="px-5 h-[32px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  Authenticate
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Connected state — shown after authentication */}
      {isConnected && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-[8px] bg-[#00bc7d]/5 border border-[#00bc7d]/20 mb-4">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#00bc7d" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[#00bc7d] text-xs font-medium">Connected as marketing@acme.com</span>
            </div>
            <button
              onClick={() => setIsConnected(false)}
              className="text-[var(--text-dim)] text-[10px] hover:text-[var(--text-muted)] transition-colors"
            >
              Change account
            </button>
          </div>
          <button
            onClick={onNext}
            className="w-full px-4 h-[36px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            Continue
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}

      {/* Invite teammate option */}
      {onInviteUser && (
        <button
          onClick={() => onInviteUser(integration.name)}
          className="w-full flex items-center gap-3 px-5 py-3 bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-[8px] hover:border-[#027b8e]/40 hover:bg-[var(--hover-bg)] transition-colors mb-4"
        >
          <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-card-inner)] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10.67 14v-1.33a2.67 2.67 0 00-2.67-2.67H4a2.67 2.67 0 00-2.67 2.67V14" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="6" cy="5.33" r="2" stroke="var(--text-dim)" strokeWidth="1.2" />
              <path d="M13.33 5.33v4M11.33 7.33h4" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="text-[var(--text-secondary)] text-sm font-medium block">Don&apos;t have access?</span>
            <span className="text-[var(--text-dim)] text-[11px]">Request a teammate or invite someone new</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-dim)] flex-shrink-0"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}

      {/* Help documentation */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-[6px] bg-[#2b7fff]/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
            <path d="M6.5 6.5a1.5 1.5 0 012.83.7c0 1-1.33 1.3-1.33 1.3" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.5" fill="#2b7fff" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[var(--text-primary)] text-sm font-medium block">Need help connecting {integration.name}?</span>
          <p className="text-[var(--text-dim)] text-xs mt-0.5 leading-relaxed">
            Check our setup guide for step-by-step instructions on how to connect and configure this integration.
          </p>
          <button className="mt-2 text-[#2b7fff] text-xs font-medium hover:underline transition-colors flex items-center gap-1">
            View documentation
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1h6v6M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Select Accounts (for non-data-source integrations) ───────────────────

interface MockAccount {
  id: string;
  name: string;
  accountId: string;
}

function getMockAccounts(integration: CatalogIntegration): MockAccount[] {
  // Expanded to 10 accounts so the tagging UX is realistic — matches the
  // user's example ("10 account IDs: 3 to GAP, 4 to Banana Republic, 3 to Old Navy").
  return [
    { id: `${integration.name} - GAP US 1`, name: "GAP US (Prospecting)", accountId: "act_283847291" },
    { id: `${integration.name} - GAP US 2`, name: "GAP US (Retargeting)", accountId: "act_192736485" },
    { id: `${integration.name} - GAP US 3`, name: "GAP US (Brand)", accountId: "act_847362910" },
    { id: `${integration.name} - BR US 1`, name: "Banana Republic US (Main)", accountId: "act_501928374" },
    { id: `${integration.name} - BR US 2`, name: "Banana Republic US (Catalog)", accountId: "act_612837465" },
    { id: `${integration.name} - BR US 3`, name: "Banana Republic US (Lookalike)", accountId: "act_720394857" },
    { id: `${integration.name} - BR US 4`, name: "Banana Republic US (Retarget)", accountId: "act_839201847" },
    { id: `${integration.name} - ON UK 1`, name: "Old Navy UK (Main)", accountId: "act_948372615" },
    { id: `${integration.name} - ON UK 2`, name: "Old Navy UK (Seasonal)", accountId: "act_103847291" },
    { id: `${integration.name} - ON UK 3`, name: "Old Navy UK (App Install)", accountId: "act_217384901" },
  ];
}

function StepSelectAccounts({
  integration,
  selectedAccounts,
  onToggleAccount,
  onNext,
}: {
  integration: CatalogIntegration;
  selectedAccounts: string[];
  onToggleAccount: (account: string) => void;
  onNext: () => void;
}) {
  const mockAccounts = getMockAccounts(integration);
  const streams = getStreamsForIntegration(integration.name);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with integration branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
          <IntegrationIcon integration={integration} />
        </div>
        <div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">Select Accounts</h2>
          <p className="text-[var(--text-muted)] text-sm">Choose which {integration.name} accounts to sync</p>
        </div>
      </div>

      {/* Account cards */}
      <div className="flex flex-col gap-2 mb-6">
        {mockAccounts.map((account) => {
          const isSelected = selectedAccounts.includes(account.id);
          return (
            <button
              key={account.id}
              onClick={() => onToggleAccount(account.id)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-[8px] border-[1.5px] transition-all text-left ${
                isSelected ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
              }`}
            >
              <span
                className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? "bg-[#027b8e] border-[#027b8e] text-white" : "border-[var(--border-secondary)]"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[var(--text-primary)] text-sm font-medium block">{account.name}</span>
                <span className="text-[var(--text-dim)] text-xs">{account.accountId}</span>
              </div>
              {isSelected && (
                <span className="text-[#027b8e] text-[11px] font-medium flex-shrink-0">Selected</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-muted)] text-xs">
          {selectedAccounts.length} account{selectedAccounts.length !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onNext}
          disabled={selectedAccounts.length === 0}
          className="px-6 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Tag Accounts Step (optional) ─────────────────────────────────────────
// Native ad channels get this step after account selection. The user can
// skip entirely or tag some accounts with Brand / Product / Country / Region.

function StepTagAccounts({
  integration,
  selectedAccounts,
  scopes,
  onScopesChange,
  onComplete,
  onSkip,
}: {
  integration: CatalogIntegration;
  selectedAccounts: string[];
  scopes: Record<string, AccountScope>;
  onScopesChange: (next: Record<string, AccountScope>) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const mockAccounts = getMockAccounts(integration);
  const items: ScopeTaggingItem[] = mockAccounts
    .filter((a) => selectedAccounts.includes(a.id))
    .map((a) => ({ id: a.id, name: a.name, badge: a.accountId }));

  const taggedCount = Object.values(scopes).filter((s) => s && Object.keys(s).some((k) => s[k as keyof AccountScope])).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
          <IntegrationIcon integration={integration} />
        </div>
        <div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">Tag accounts <span className="text-[var(--text-muted)] text-sm font-normal">— optional</span></h2>
          <p className="text-[var(--text-muted)] text-sm">
            Associate each account with a Brand, Product, Country, and Region so you can filter and group metrics downstream.
          </p>
        </div>
      </div>

      {/* Inline info banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-[#2b7fff]/5 border border-[#2b7fff]/20 rounded-[8px] mb-5 mt-4">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#2b7fff] flex-shrink-0 mt-[2px]">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 9.5V6M7 4.5v0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-medium text-[#2b7fff]">Tip:</span> Select multiple accounts, then use <span className="font-semibold">Apply tags to N selected</span> to tag them all at once (e.g., 3 accounts → <span className="font-mono text-[var(--text-primary)]">Brand: GAP, Country: US</span>).
        </p>
      </div>

      <ScopeTaggingEditor kind="accounts" items={items} value={scopes} onChange={onScopesChange} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <span className="text-[var(--text-muted)] text-xs">
          {taggedCount > 0 ? `${taggedCount}/${items.length} tagged` : "No tagging required — you can always tag later"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="px-4 h-[30px] rounded-[6px] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
          >
            Skip tagging
          </button>
          <button
            onClick={onComplete}
            className="px-5 h-[30px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-xs font-semibold transition-colors"
          >
            Connect {integration.name}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Select Tables Step ───────────────────────────────────────────────────

// Flatten warehouse tree into dataset → tables structure for cleaner rendering
function flattenTree(tree: TreeNode[]): { dataset: string; datasetId: string; tables: { id: string; label: string }[] }[] {
  const result: { dataset: string; datasetId: string; tables: { id: string; label: string }[] }[] = [];
  for (const node of tree) {
    if (node.children) {
      for (const child of node.children) {
        if (child.children) {
          // 3-level: project > dataset > table
          result.push({ dataset: child.label, datasetId: child.id, tables: child.children.map((t) => ({ id: t.id, label: t.label })) });
        } else {
          // 2-level: schema > table (Redshift)
          if (!result.find((r) => r.datasetId === node.id)) {
            result.push({ dataset: node.label, datasetId: node.id, tables: [] });
          }
          result.find((r) => r.datasetId === node.id)!.tables.push({ id: child.id, label: child.label });
        }
      }
    }
  }
  return result;
}

function TreeCheckbox({
  node,
  depth,
  checked,
  expanded,
  onToggleCheck,
  onToggleExpand,
}: {
  node: TreeNode;
  depth: number;
  checked: Set<string>;
  expanded: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleExpand: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isLeaf = !hasChildren;
  const isChecked = checked.has(node.id);

  // Check if some children are checked (for partial state)
  const allLeafIds = useMemo(() => {
    const ids: string[] = [];
    const collect = (n: TreeNode) => {
      if (!n.children || n.children.length === 0) ids.push(n.id);
      else n.children.forEach(collect);
    };
    collect(node);
    return ids;
  }, [node]);

  const checkedLeafCount = allLeafIds.filter((id) => checked.has(id)).length;
  const isPartial = checkedLeafCount > 0 && checkedLeafCount < allLeafIds.length;
  const isAllChecked = checkedLeafCount === allLeafIds.length && allLeafIds.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[var(--hover-item)] transition-colors cursor-pointer group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => {
          if (hasChildren) onToggleExpand(node.id);
          else onToggleCheck(node.id);
        }}
      >
        {hasChildren ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`flex-shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
          >
            <path d="M5 3L9 7L5 11" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="w-3.5" />
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLeaf) onToggleCheck(node.id);
            else {
              // Toggle all leaves under this node
              allLeafIds.forEach((id) => onToggleCheck(id));
            }
          }}
          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isLeaf
              ? isChecked
                ? "bg-[#027b8e] border-[#027b8e]"
                : "border-[var(--border-secondary)] hover:border-[#027b8e]"
              : isAllChecked
              ? "bg-[#027b8e] border-[#027b8e]"
              : isPartial
              ? "bg-[#027b8e]/30 border-[#027b8e]"
              : "border-[var(--border-secondary)] hover:border-[#027b8e]"
          }`}
        >
          {(isLeaf ? isChecked : isAllChecked) && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {!isLeaf && isPartial && !isAllChecked && (
            <div className="w-2 h-0.5 bg-white rounded-full" />
          )}
        </button>

        {/* Icon for folders vs tables */}
        {hasChildren ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <path d="M1.5 3.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v5.5a1 1 0 01-1 1h-9a1 1 0 01-1-1V3.5z" stroke="var(--text-dim)" strokeWidth="1" fill="none" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="var(--text-dim)" strokeWidth="1" fill="none" />
            <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="var(--text-dim)" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        )}

        <span className={`text-sm ${isLeaf ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"}`}>
          {node.label}
        </span>
      </div>

      {hasChildren && isExpanded && node.children!.map((child) => (
        <TreeCheckbox
          key={child.id}
          node={child}
          depth={depth + 1}
          checked={checked}
          expanded={expanded}
          onToggleCheck={onToggleCheck}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}

function StepSelectTables({
  integration,
  selectedTables,
  onSelectTables,
  selectedKeys,
  onToggleKey,
  onNext,
}: {
  integration: CatalogIntegration;
  selectedTables: Set<string>;
  onSelectTables: (tables: Set<string>) => void;
  selectedKeys: Record<string, Set<string>>;
  onToggleKey: (tableId: string, colName: string) => void;
  onNext: () => void;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const isWarehouse = !isGoogleSheets;
  const warehouseTree = isWarehouse ? getWarehouseTree(integration.name) : [];
  const defaultExpanded = useMemo(() => {
    const ids = new Set<string>();
    for (const node of warehouseTree) {
      ids.add(node.id);
      if (node.children) for (const child of node.children) ids.add(child.id);
    }
    return ids;
  }, [warehouseTree]);
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const toggleCheck = (id: string) => {
    if (isWarehouse) {
      const next = new Set(selectedTables);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectTables(next);
    } else {
      const next = new Set(selectedSheets);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedSheets(next);
      onSelectTables(next);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const selectionCount = isWarehouse ? selectedTables.size : selectedSheets.size;


  if (!isWarehouse) {
    // Google Sheets: simple list
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Select Sheets</h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">Choose which sheets to import.</p>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-6">
          <div className="divide-y divide-[var(--border-primary)]">
            {SHEETS_LIST.map((sheet) => {
              const isSelected = selectedSheets.has(sheet.id);
              return (
                <button key={sheet.id} onClick={() => toggleCheck(sheet.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-[#027b8e]/5" : "hover:bg-[var(--hover-item)]"}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"}`}>
                    {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{sheet.name}</span>
                    <span className="text-[var(--text-dim)] text-xs">{sheet.rows.toLocaleString()} rows · Updated {sheet.lastUpdated}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] text-xs">{selectionCount} sheet{selectionCount !== 1 ? "s" : ""} selected</span>
          <button onClick={onNext} disabled={selectionCount === 0}
            className="px-6 py-2.5 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
        </div>
      </div>
    );
  }

  // Warehouse: single list with inline column expansion
  const datasets = useMemo(() => flattenTree(warehouseTree), [warehouseTree]);
  const [search, setSearch] = useState("");
  const [collapsedDatasets, setCollapsedDatasets] = useState<Set<string>>(new Set());
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const filteredDatasets = useMemo(() => {
    if (!search) return datasets;
    const q = search.toLowerCase();
    return datasets.map((ds) => ({
      ...ds,
      tables: ds.tables.filter((t) => t.label.toLowerCase().includes(q)),
    })).filter((ds) => ds.tables.length > 0);
  }, [datasets, search]);

  const toggleDatasetCollapse = (id: string) => {
    setCollapsedDatasets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleTableClick = (tableId: string) => {
    const isSelected = selectedTables.has(tableId);
    if (!isSelected) {
      toggleCheck(tableId);
      setExpandedTable(tableId);
    } else {
      setExpandedTable(expandedTable === tableId ? null : tableId);
    }
  };

  return (
    <div>
      {/* Header with Continue button */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-1">Select Tables</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Choose which {integration.name} tables to sync. Select a table to configure its primary key.
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={selectionCount === 0}
          className="flex items-center gap-2 px-5 h-[36px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ml-6"
        >
          Continue
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
          <circle cx="7.33" cy="7.33" r="4.33" stroke="currentColor" strokeWidth="1.2" />
          <path d="M13 13l-3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-10 pr-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
        />
      </div>

      {/* Dataset sections */}
      <div className="flex flex-col gap-5">
        {filteredDatasets.map((ds) => {
          const isCollapsed = collapsedDatasets.has(ds.datasetId);
          const selectedInDs = ds.tables.filter((t) => selectedTables.has(t.id)).length;
          return (
            <div key={ds.datasetId}>
              {/* Dataset header */}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => toggleDatasetCollapse(ds.datasetId)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`flex-shrink-0 transition-transform duration-150 ${isCollapsed ? "" : "rotate-90"}`}>
                    <path d="M3 1.5L7 5L3 8.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <path d="M1.5 3.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v5.5a1 1 0 01-1 1h-9a1 1 0 01-1-1V3.5z" stroke="var(--text-dim)" strokeWidth="1" fill="none" />
                  </svg>
                  <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">{ds.dataset}</span>
                </button>
                <span className="text-[var(--text-dim)] text-[10px] font-medium bg-[var(--bg-badge)] px-1.5 py-0.5 rounded-[4px]">{ds.tables.length}</span>
                {selectedInDs > 0 && (
                  <span className="text-[#027b8e] text-[10px] font-semibold bg-[#027b8e]/10 px-1.5 py-0.5 rounded-[4px]">{selectedInDs} selected</span>
                )}
              </div>

              {/* Table card */}
              {!isCollapsed && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                  {ds.tables.map((table, tableIdx) => {
                    const isSelected = selectedTables.has(table.id);
                    const isExpanded = expandedTable === table.id && isSelected;
                    const cols = TABLE_COLUMNS[table.id];
                    const keys = selectedKeys[table.id] || new Set<string>();
                    const keyList = Array.from(keys);
                    const isLast = tableIdx === ds.tables.length - 1;

                    return (
                      <div key={table.id}>
                        {/* Table row */}
                        <button
                          onClick={() => handleTableClick(table.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 group ${
                            !isLast && !isExpanded ? "border-b border-[var(--border-subtle)]" : ""
                          } ${
                            isSelected ? "bg-[var(--hover-bg)]" : "hover:bg-[var(--hover-item)]"
                          }`}
                        >
                          {/* Checkbox */}
                          <span
                            onClick={(e) => { e.stopPropagation(); const wasSelected = selectedTables.has(table.id); toggleCheck(table.id); if (wasSelected) setExpandedTable(null); else setExpandedTable(table.id); }}
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)] group-hover:border-[#027b8e]/50"
                            }`}
                          >
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </span>
                          {/* Table icon */}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                            <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke={isSelected ? "#027b8e" : "var(--text-dim)"} strokeWidth="1" fill="none" />
                            <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke={isSelected ? "#027b8e" : "var(--text-dim)"} strokeWidth="0.7" strokeLinecap="round" />
                          </svg>
                          <span className={`text-sm flex-1 ${isSelected ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}`}>{table.label}</span>
                          {/* Column count + expand indicator */}
                          {isSelected && cols && (
                            <span className="text-[var(--text-dim)] text-[10px]">{cols.length} cols</span>
                          )}
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`flex-shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}>
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Inline column panel */}
                        {isExpanded && cols && (
                          <div className={`bg-[var(--bg-card-inner)] mx-3 mb-3 rounded-lg overflow-hidden border border-[var(--border-primary)] ${!isLast ? "border-b border-[var(--border-subtle)]" : ""}`}>
                            {/* Key summary — at the top */}
                            <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2">
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                                <path d="M8 1.5a3.5 3.5 0 00-3.08 5.16L1.5 10.08V12.5h2.42l.58-.58v-1.34h1.34l1.24-1.24A3.5 3.5 0 108 1.5z" stroke={keyList.length > 0 ? "#fe9a00" : "var(--text-dim)"} strokeWidth="1.2" fill="none" />
                                {keyList.length > 0 && <circle cx="9.25" cy="4.75" r="0.75" fill="#fe9a00" />}
                              </svg>
                              {keyList.length > 0 ? (
                                <span className="text-[#fe9a00] text-xs font-medium">Primary key: {keyList.join(" + ")}</span>
                              ) : (
                                <span className="text-[var(--text-dim)] text-xs">Click PK to set primary key columns for deduplication</span>
                              )}
                            </div>
                            {/* Column header */}
                            <div className="grid grid-cols-3 px-4 py-2 border-b border-[var(--border-subtle)]">
                              <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider">Column</span>
                              <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider text-center">Type</span>
                              <span className="text-[var(--text-label)] text-[10px] font-semibold uppercase tracking-wider text-right">Key</span>
                            </div>
                            {/* Column rows */}
                            {cols.map((col) => {
                              const isKey = keys.has(col.name);
                              return (
                                <div
                                  key={col.name}
                                  className={`grid grid-cols-3 px-4 py-2.5 border-b border-[var(--border-subtle)] last:border-b-0 ${
                                    isKey ? "bg-[#fe9a00]/5" : ""
                                  }`}
                                >
                                  <code className={`text-[11px] font-mono ${isKey ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"}`}>{col.name}</code>
                                  <span className="text-[var(--text-dim)] text-[10px] font-mono text-center">{col.type}</span>
                                  <div className="flex justify-end">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onToggleKey(table.id, col.name); }}
                                      className={`w-[42px] h-[22px] rounded-[4px] flex items-center justify-center gap-1 transition-all text-[10px] font-medium ${
                                        isKey
                                          ? "bg-[#fe9a00] text-white"
                                          : "bg-transparent border border-[var(--border-secondary)] text-[var(--text-dim)] hover:border-[#fe9a00]/40 hover:text-[#fe9a00]"
                                      }`}
                                      title={isKey ? "Remove from primary key" : "Set as primary key"}
                                    >
                                      <svg width="8" height="8" viewBox="0 0 14 14" fill="none"><path d="M8 1.5a3.5 3.5 0 00-3.08 5.16L1.5 10.08V12.5h2.42l.58-.58v-1.34h1.34l1.24-1.24A3.5 3.5 0 108 1.5z" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                                      PK
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredDatasets.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-badge)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="var(--text-dim)" strokeWidth="1.2" />
                <path d="M18 18l-4-4" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)] text-sm">No tables match your search</p>
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[var(--text-muted)] text-xs">{selectionCount} table{selectionCount !== 1 ? "s" : ""} selected</span>
        {selectionCount > 0 && (
          <button onClick={() => { onSelectTables(new Set()); setExpandedTable(null); }} className="text-[var(--text-dim)] text-[10px] hover:text-[var(--text-muted)] transition-colors">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

const CATEGORY_DESCRIPTIONS: Record<DataCategory, string> = {
  kpi: "Revenue, conversions, orders, and key business metrics",
  paid_marketing: "Ad spend, impressions, clicks from paid channels",
  organic: "Organic traffic, social engagement, email marketing",
  contextual: "External factors like weather, holidays, blog content",
};

const CATEGORY_ICONS: Record<DataCategory, string> = {
  kpi: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  paid_marketing: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  organic: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  contextual: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

function StepChannelName({
  channelName,
  onChangeChannelName,
  onNext,
  isJspPreFilled,
  selectedCategories,
  onToggleCategory,
}: {
  channelName: string;
  onChangeChannelName: (v: string) => void;
  onNext: () => void;
  isJspPreFilled?: boolean;
  selectedCategories: DataCategory[];
  onToggleCategory: (cat: DataCategory) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">What kind of data is this?</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Select one or more categories that describe this data. This determines how fields are organized in Metrics &amp; Dimensions.
      </p>

      {/* Data category multi-select cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {(Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]).map((cat) => {
          const { label, color } = DATA_CATEGORY_LABELS[cat];
          const isSelected = selectedCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className="flex flex-col items-start gap-1.5 p-3 rounded-[8px] border text-left transition-all duration-150"
              style={{
                borderColor: isSelected ? `${color}60` : "var(--border-primary)",
                backgroundColor: isSelected ? `${color}10` : "transparent",
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <div
                  className="w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? color : "var(--border-secondary)",
                    backgroundColor: isSelected ? color : "transparent",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d={CATEGORY_ICONS[cat]} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[var(--text-primary)] text-[12px] font-semibold">{label}</span>
              </div>
              <p className="text-[var(--text-dim)] text-[10px] leading-snug pl-6">{CATEGORY_DESCRIPTIONS[cat]}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="text-[var(--text-secondary)] text-sm font-medium block mb-2">Channel Name</label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => onChangeChannelName(e.target.value)}
          placeholder="e.g., SkyScanner, Kayak, Internal CRM"
          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
        />
        <p className="text-[var(--text-dim)] text-xs mt-2">
          Name this data source to identify it (e.g., SkyScanner, Kayak, Internal CRM)
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={!channelName.trim() || selectedCategories.length === 0}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Category Combobox ─────────────────────────────────────────────────────

function CategoryDropdown({
  value,
  onChange,
}: {
  value: MetricCategory | "";
  onChange: (v: MetricCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? METRIC_CATEGORIES[value] : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm transition-colors hover:border-[#027b8e] text-left min-w-[140px]"
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="text-[var(--text-primary)] truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-[var(--text-label)]">Select...</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] shadow-[var(--shadow-popover)] overflow-hidden">
          {(Object.entries(METRIC_CATEGORIES) as [MetricCategory, { label: string; color: string; description: string }][]).map(
            ([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-item)] ${
                  value === key ? "bg-[#027b8e]/5" : ""
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="min-w-0">
                  <span className="text-[var(--text-primary)] text-sm block">{cat.label}</span>
                  <span className="text-[var(--text-dim)] text-[10px] block truncate">{cat.description}</span>
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Target Key Combobox ───────────────────────────────────────────────────

function TargetKeyCombobox({
  value,
  category,
  sourceColumn,
  onChange,
  onDisplayNameChange,
}: {
  value: string;
  category: MetricCategory | "";
  sourceColumn?: string;
  onChange: (v: string, isNew: boolean) => void;
  onDisplayNameChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDimension = sourceColumn ? classifyColumn(sourceColumn) === "dimension" : false;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredMetricFields = useMemo(() => {
    if (isDimension) return [];
    let fields = initialFields.filter((f) => f.kind === "metric");
    if (category) fields = fields.filter((f) => f.metricCategory === category);
    if (search) {
      const q = search.toLowerCase();
      fields = fields.filter((f) => f.name.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q));
    }
    return fields.slice(0, 15);
  }, [category, search, isDimension]);

  const filteredDimensions = useMemo(() => {
    if (!isDimension) return [];
    let dims = SYSTEM_DIMENSIONS.filter((d) => d.channelMappings.length > 0 || d.isSystem);
    if (search) { const q = search.toLowerCase(); dims = dims.filter((d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)); }
    return dims;
  }, [search, isDimension]);

  return (
    <div className="relative" ref={ref}>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : value}
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setSearch(value); }}
        placeholder={isDimension ? "Select dimension..." : "Search or type new..."}
        className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors min-w-[160px]"
      />

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] shadow-[var(--shadow-popover)] overflow-hidden max-h-[240px] overflow-y-auto">
          {/* Metric suggestions */}
          {!isDimension && filteredMetricFields.map((field) => (
            <button key={field.name} onClick={() => { onChange(field.name, false); onDisplayNameChange(field.displayName); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)]">
              <div className="min-w-0">
                <span className="text-[var(--text-primary)] text-sm block truncate">{field.name}</span>
                <span className="text-[var(--text-dim)] text-[10px] block truncate">{field.displayName}</span>
              </div>
              {field.metricCategory && <span className="w-2 h-2 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: METRIC_CATEGORIES[field.metricCategory]?.color }} />}
            </button>
          ))}
          {/* Dimension definition suggestions */}
          {isDimension && filteredDimensions.map((dim) => (
            <button key={dim.id} onClick={() => { onChange(dim.id, false); onDisplayNameChange(dim.name); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)]">
              <div className="min-w-0">
                <span className="text-[var(--text-primary)] text-sm block truncate">{dim.name}</span>
                <span className="text-[var(--text-dim)] text-[10px] block truncate">{dim.channelMappings.length} sources mapped</span>
              </div>
              <span className="w-2 h-2 rounded-full flex-shrink-0 ml-2 bg-[#027b8e]" />
            </button>
          ))}

          {search.trim() && (
            <button onClick={() => { onChange(search.trim(), true); setOpen(false); setSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-item)] border-t border-[var(--border-primary)]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="#027b8e" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span className="text-[#027b8e] text-sm font-medium">Create &quot;{search.trim()}&quot;</span>
            </button>
          )}

          {!search.trim() && filteredMetricFields.length === 0 && filteredDimensions.length === 0 && (
            <div className="px-3 py-4 text-center text-[var(--text-dim)] text-xs">
              No {isDimension ? "dimensions" : "fields"} found{category && !isDimension ? ` in ${METRIC_CATEGORIES[category]?.label}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Column Mapping Step (with Smart Mapper choice for data sources) ──────

function StepColumnMapping({
  integration,
  mappings,
  onUpdateMapping,
  onNext,
}: {
  integration: CatalogIntegration;
  mappings: ColumnMapping[];
  onUpdateMapping: (index: number, update: Partial<ColumnMapping>) => void;
  onNext: () => void;
}) {
  const [mapperMode, setMapperMode] = useState<"choice" | "smart" | "manual">("choice");
  const allMapped = mappings.every((m) => m.category && m.targetKey && m.displayName);

  const handleSmartMapper = () => {
    // Auto-fill mappings using classifyColumn heuristics
    mappings.forEach((m, i) => {
      const role = classifyColumn(m.sourceColumn);
      const suggestedCat: MetricCategory | "" = role === "metric" ? "paid_marketing" : "";
      const suggestedKey = m.sourceColumn.toLowerCase().replace(/\s+/g, "_");
      const suggestedDisplay = m.sourceColumn.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (!m.category) onUpdateMapping(i, { category: suggestedCat });
      if (!m.targetKey) onUpdateMapping(i, { targetKey: suggestedKey, isNewKey: true });
      if (!m.displayName) onUpdateMapping(i, { displayName: suggestedDisplay });
    });
    setMapperMode("smart");
  };

  // Mapper choice screen
  if (mapperMode === "choice") {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">How would you like to map columns?</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          Choose a mapping approach for your {integration.name} data.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleSmartMapper}
            className="text-left p-5 rounded-[8px] border-[1.5px] border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[#027b8e] hover:bg-[#027b8e]/3 transition-all"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#027b8e]/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L9 9.5 6 11l.5-3.5L4 5l3.5-.5L9 1.5z" stroke="#027b8e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] text-sm font-semibold block">Smart Mapper</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">Recommended</span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              AI-powered column detection automatically maps categories, target fields, and display names.
            </p>
          </button>
          <button
            onClick={() => setMapperMode("manual")}
            className="text-left p-5 rounded-[8px] border-[1.5px] border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] transition-all"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-badge)] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 2l3 3-9.5 9.5H3.5v-3L13 2z" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="text-[var(--text-primary)] text-sm font-semibold">Manual Mapper</span>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Map each column manually with full control over every mapping.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[var(--text-primary)] text-xl font-semibold">Map Columns</h2>
        <button onClick={() => setMapperMode("choice")} className="text-[#027b8e] text-xs hover:underline transition-colors">
          Change mapping method
        </button>
      </div>
      {mapperMode === "smart" && (
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1 2.5 2.5.4-1.8 1.8.4 2.5L6 7l-2.1 1.2.4-2.5L2.5 3.9 5 3.5 6 1z" fill="#027b8e" />
          </svg>
          <span className="text-[#027b8e] text-xs font-medium">Smart Mapper applied — review and adjust as needed</span>
        </div>
      )}
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Map each detected column to a category and target field. Pick from existing fields or create new ones.
      </p>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden mb-6">
        {/* Header */}
        <div className="grid grid-cols-[1fr_160px_180px_180px] gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider">Source Column</span>
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider">Category</span>
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider">Target Key Name</span>
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider">Display Name</span>
        </div>

        {/* Rows */}
        {mappings.map((mapping, i) => (
          <div
            key={mapping.sourceColumn}
            className="grid grid-cols-[1fr_160px_180px_180px] gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 items-center"
          >
            {/* Source Column (read-only) + role badge */}
            <div className="flex items-center gap-2">
              <span className={`flex-shrink-0 text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center ${classifyColumn(mapping.sourceColumn) === "metric" ? "bg-[#2b7fff]/15 text-[#2b7fff]" : "bg-[#027b8e]/15 text-[#027b8e]"}`}>
                {classifyColumn(mapping.sourceColumn) === "metric" ? "M" : "D"}
              </span>
              <code className="text-[var(--text-secondary)] text-sm bg-[var(--bg-card-inner)] px-2 py-0.5 rounded font-mono">
                {mapping.sourceColumn}
              </code>
            </div>

            {/* Category */}
            <CategoryDropdown
              value={mapping.category}
              onChange={(cat) => onUpdateMapping(i, { category: cat })}
            />

            {/* Target Key */}
            <TargetKeyCombobox
              value={mapping.targetKey}
              category={mapping.category}
              sourceColumn={mapping.sourceColumn}
              onChange={(key, isNew) => onUpdateMapping(i, { targetKey: key, isNewKey: isNew })}
              onDisplayNameChange={(name) => onUpdateMapping(i, { displayName: name })}
            />

            {/* Display Name */}
            <input
              type="text"
              value={mapping.displayName}
              onChange={(e) => onUpdateMapping(i, { displayName: e.target.value })}
              placeholder="Display name..."
              className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!allMapped}
          className="px-6 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Schedule & Sync Step ──────────────────────────────────────────────────

const SCHEDULE_HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SCHEDULE_MINS = ["00", "15", "30", "45"];
const WEEK_DAYS = [
  { value: "monday", label: "Mon" }, { value: "tuesday", label: "Tue" }, { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" }, { value: "friday", label: "Fri" }, { value: "saturday", label: "Sat" }, { value: "sunday", label: "Sun" },
];

const DEDUP_OPTIONS: { value: DedupStrategy; label: string; desc: string; badge?: string }[] = [
  { value: "upsert", label: "Upsert", desc: "Update existing rows by primary key, insert new ones. Best for most cases.", badge: "Recommended" },
  { value: "replace", label: "Full Replace", desc: "Drop and re-create the table on each sync. Use when source data is a complete snapshot." },
  { value: "append", label: "Append Only", desc: "Always insert new rows without checking for duplicates. Use for event/log data." },
];

function StepScheduleAndSync({
  integration,
  dedupStrategy,
  onChangeDedupStrategy,
  frequency,
  onChangeFrequency,
  refreshDay,
  onChangeDay,
  refreshHour,
  onChangeHour,
  refreshMinute,
  onChangeMinute,
  refreshAmPm,
  onChangeAmPm,
  selectedKeys,
  selectedTables,
  onNext,
}: {
  integration: CatalogIntegration;
  dedupStrategy: DedupStrategy;
  onChangeDedupStrategy: (s: DedupStrategy) => void;
  frequency: "daily" | "weekly" | "monthly";
  onChangeFrequency: (f: "daily" | "weekly" | "monthly") => void;
  refreshDay: string;
  onChangeDay: (d: string) => void;
  refreshHour: string;
  onChangeHour: (h: string) => void;
  refreshMinute: string;
  onChangeMinute: (m: string) => void;
  refreshAmPm: "AM" | "PM";
  onChangeAmPm: (ap: "AM" | "PM") => void;
  selectedKeys: Record<string, Set<string>>;
  selectedTables: Set<string>;
  onNext: () => void;
}) {
  const tz = useMemo(() => {
    const name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date());
    const abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return { name, abbr };
  }, []);

  const scheduleLabel = useMemo(() => {
    const time = `${refreshHour}:${refreshMinute} ${refreshAmPm}`;
    if (frequency === "daily") return `Every day at ${time}`;
    if (frequency === "weekly") return `Every ${refreshDay.charAt(0).toUpperCase() + refreshDay.slice(1)} at ${time}`;
    return `Monthly at ${time}`;
  }, [frequency, refreshDay, refreshHour, refreshMinute, refreshAmPm]);

  // Check if upsert needs keys
  const tablesWithoutKeys = dedupStrategy === "upsert"
    ? Array.from(selectedTables).filter((t) => !(selectedKeys[t]?.size > 0))
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Schedule &amp; Sync</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Configure how and when data syncs from {integration.name}.</p>

      {/* ── Dedup Strategy ────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6h8M4 10h8M2 2h12v12H2z" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <h3 className="text-[var(--text-primary)] text-base font-semibold">Deduplication</h3>
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-4">How should we handle duplicate rows when syncing new data?</p>

        <div className="flex flex-col gap-2 mb-4">
          {DEDUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeDedupStrategy(opt.value)}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                dedupStrategy === opt.value ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                dedupStrategy === opt.value ? "border-[#027b8e]" : "border-[var(--border-secondary)]"
              }`}>
                {dedupStrategy === opt.value && <div className="w-2 h-2 rounded-full bg-[#027b8e]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] text-sm font-medium">{opt.label}</span>
                  {opt.badge && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">{opt.badge}</span>}
                </div>
                <p className="text-[var(--text-dim)] text-xs mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Warning if upsert selected but tables have no keys */}
        {dedupStrategy === "upsert" && tablesWithoutKeys.length > 0 && (
          <div className="flex items-start gap-2 bg-[#fe9a00]/5 border border-[#fe9a00]/20 rounded-lg px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="6" stroke="#fe9a00" strokeWidth="1.2" />
              <path d="M8 5.5v3" stroke="#fe9a00" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#fe9a00" />
            </svg>
            <p className="text-[#fe9a00] text-xs leading-relaxed">
              <strong>{tablesWithoutKeys.length} table{tablesWithoutKeys.length > 1 ? "s" : ""}</strong> ha{tablesWithoutKeys.length > 1 ? "ve" : "s"} no primary key set. Go back to Select Tables to set keys, or switch to Full Replace / Append Only.
            </p>
          </div>
        )}
      </div>

      {/* ── Schedule Section ──────────────────────────────── */}
      <div className="border-t border-[var(--border-primary)] pt-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="var(--text-muted)" strokeWidth="1.2" />
            <path d="M8 5v3.5l2.5 1.5" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="text-[var(--text-primary)] text-base font-semibold">Sync Schedule</h3>
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-5">Set how often we should pull new data from {integration.name}.</p>

        <div className="mb-5">
          <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Frequency</label>
          <div className="flex gap-3">
            {(["daily", "weekly", "monthly"] as const).map((f) => (
              <button key={f} onClick={() => onChangeFrequency(f)} className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                frequency === f ? "border-[#027b8e] bg-[#027b8e]/5 text-[#027b8e]" : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
              }`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>

        {frequency === "weekly" && (
          <div className="mb-5">
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Day of Week</label>
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((d) => (
                <button key={d.value} onClick={() => onChangeDay(d.value)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  refreshDay === d.value ? "bg-[#027b8e] text-white" : "bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}>{d.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Time</label>
          <div className="flex items-center gap-2">
            <select value={refreshHour} onChange={(e) => onChangeHour(e.target.value)}
              className="w-[72px] px-2.5 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none text-center cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              {SCHEDULE_HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
            </select>
            <span className="text-[var(--text-muted)] text-lg font-light">:</span>
            <select value={refreshMinute} onChange={(e) => onChangeMinute(e.target.value)}
              className="w-[72px] px-2.5 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none text-center cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              {SCHEDULE_MINS.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <div className="flex rounded-lg border border-[var(--border-secondary)] overflow-hidden">
              <button onClick={() => onChangeAmPm("AM")} className={`px-3 py-2 text-xs font-medium transition-colors ${refreshAmPm === "AM" ? "bg-[#027b8e] text-white" : "bg-[var(--bg-card-inner)] text-[var(--text-muted)]"}`}>AM</button>
              <button onClick={() => onChangeAmPm("PM")} className={`px-3 py-2 text-xs font-medium transition-colors border-l border-[var(--border-secondary)] ${refreshAmPm === "PM" ? "bg-[#027b8e] text-white" : "bg-[var(--bg-card-inner)] text-[var(--text-muted)]"}`}>PM</button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <circle cx="6" cy="6" r="4.5" stroke="var(--text-dim)" strokeWidth="0.8" />
              <path d="M6 3.5v2.8l1.8 1" stroke="var(--text-dim)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-dim)] text-xs">
              All times in <span className="text-[var(--text-muted)] font-medium">{tz.name.replace(/_/g, " ")}</span> ({tz.abbr})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#027b8e]/5 border border-[#027b8e]/15">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#027b8e" strokeWidth="1" />
            <path d="M8 5v3.5l2.5 1.5" stroke="#027b8e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[#027b8e] text-xs font-medium">{scheduleLabel} ({tz.abbr})</span>
        </div>
      </div>

      <button onClick={onNext} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
        Continue
      </button>
    </div>
  );
}

// ─── Review Step ───────────────────────────────────────────────────────────

function StepReview({
  integration,
  channelName,
  selectedTables,
  selectedKeys,
  dedupStrategy,
  frequency,
  refreshDay,
  refreshHour,
  refreshMinute,
  refreshAmPm,
  onComplete,
}: {
  integration: CatalogIntegration;
  channelName: string;
  selectedTables: Set<string>;
  selectedKeys: Record<string, Set<string>>;
  dedupStrategy: DedupStrategy;
  frequency: string;
  refreshDay: string;
  refreshHour: string;
  refreshMinute: string;
  refreshAmPm: string;
  onComplete: () => void;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const tableLabel = isGoogleSheets ? "Sheets" : "Tables";

  const scheduleLabel = useMemo(() => {
    const time = `${refreshHour}:${refreshMinute} ${refreshAmPm}`;
    if (frequency === "daily") return `Every day at ${time}`;
    if (frequency === "weekly") return `Every ${refreshDay.charAt(0).toUpperCase() + refreshDay.slice(1)} at ${time}`;
    return `Monthly at ${time}`;
  }, [frequency, refreshDay, refreshHour, refreshMinute, refreshAmPm]);

  const tz = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || "";
  }, []);

  const dedupLabels: Record<DedupStrategy, string> = { upsert: "Upsert", replace: "Full Replace", append: "Append Only" };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review &amp; Schedule</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Review your configuration and set a sync schedule.</p>

      <div className="flex flex-col gap-4 mb-6">
        {/* Integration */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Integration</span>
          <div className="flex items-center gap-3">
            <IntegrationIcon integration={integration} />
            <div>
              <span className="text-[var(--text-primary)] text-sm font-medium block">{channelName}</span>
              <span className="text-[var(--text-dim)] text-xs">via {integration.name}</span>
            </div>
          </div>
        </div>

        {/* Data Source Details */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
            <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider">Data Source</span>
          </div>
          <div className="px-4 py-3">
            {/* Group selected tables by their dataset */}
            {(() => {
              // Build dataset → tables mapping from the tree
              const tree = getWarehouseTree(integration.name);
              const groups: { project?: string; dataset: string; tables: { id: string; label: string; keys: string[] }[] }[] = [];
              for (const node of tree) {
                if (node.children) {
                  for (const child of node.children) {
                    if (child.children) {
                      const selectedInDs = child.children.filter((t) => selectedTables.has(t.id));
                      if (selectedInDs.length > 0) {
                        groups.push({
                          project: node.label,
                          dataset: child.label,
                          tables: selectedInDs.map((t) => ({ id: t.id, label: t.label, keys: Array.from(selectedKeys[t.id] || []) })),
                        });
                      }
                    } else if (selectedTables.has(child.id)) {
                      const existing = groups.find((g) => g.dataset === node.label);
                      if (existing) {
                        existing.tables.push({ id: child.id, label: child.label, keys: Array.from(selectedKeys[child.id] || []) });
                      } else {
                        groups.push({
                          dataset: node.label,
                          tables: [{ id: child.id, label: child.label, keys: Array.from(selectedKeys[child.id] || []) }],
                        });
                      }
                    }
                  }
                }
              }
              return groups.map((g, gi) => (
                <div key={gi} className={gi > 0 ? "mt-3 pt-3 border-t border-[var(--border-subtle)]" : ""}>
                  {/* Project / Dataset path */}
                  <div className="flex items-center gap-2 mb-3">
                    {g.project && (
                      <>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                          <path d="M1.5 3.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v5.5a1 1 0 01-1 1h-9a1 1 0 01-1-1V3.5z" stroke="var(--text-dim)" strokeWidth="1" fill="none" />
                        </svg>
                        <span className="text-[var(--text-muted)] text-sm">{g.project}</span>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </>
                    )}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <path d="M1.5 3.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v5.5a1 1 0 01-1 1h-9a1 1 0 01-1-1V3.5z" stroke="#027b8e" strokeWidth="1" fill="none" />
                    </svg>
                    <span className="text-[var(--text-primary)] text-sm font-semibold">{g.dataset}</span>
                  </div>
                  {/* Tables */}
                  <div className="flex flex-col gap-2 ml-4">
                    {g.tables.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--bg-card-inner)]">
                        <div className="flex items-center gap-2.5">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                            <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="#027b8e" strokeWidth="1" fill="none" />
                            <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="#027b8e" strokeWidth="0.7" strokeLinecap="round" />
                          </svg>
                          <span className="text-[var(--text-primary)] text-sm font-mono">{t.label}</span>
                        </div>
                        {t.keys.length > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-[#fe9a00] font-medium">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8 1.5a3.5 3.5 0 00-3.08 5.16L1.5 10.08V12.5h2.42l.58-.58v-1.34h1.34l1.24-1.24A3.5 3.5 0 108 1.5z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                            {t.keys.join(" + ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Dedup strategy */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Deduplication Strategy</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">{dedupLabels[dedupStrategy]}</span>
        </div>

        {/* Schedule */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Sync Schedule</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">{scheduleLabel} ({tz})</span>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors"
      >
        Connect {channelName}
      </button>
    </div>
  );
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────

const DATA_SOURCE_STEPS = ["Name & Connect", "Select Tables", "Data Type", "Review", "Schedule & Sync", "Confirm"];

// ─── Data Type Step ───────────────────────────────────────────────────────
// Asks the user to declare what kind of data they're bringing in.
// Routing downstream depends on this choice rather than auto-detection.

function StepDataType({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: MetricCategory[];
  onChange: (v: MetricCategory[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">What kind of data is this?</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Select one or more — this helps us route your data to the right place so you can build models and dashboards on top of it.
      </p>

      <DataCategoryPicker value={value} onChange={onChange} />

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="px-6 py-2.5 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#027b8e]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Review Preview Step ──────────────────────────────────────────────────
// Shows a sample preview of the source data. For KPI/Paid Marketing, also
// asks the user to pick the layout (Long/Wide) using marketer-friendly wording.

function StepReviewPreview({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review your data</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Here&apos;s a sample of what we found in your source. Make sure this looks right before continuing.
      </p>

      <DataPreviewTable />

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
const STANDARD_STEPS = ["Authenticate", "Select Accounts", "Tag Accounts"];

// ─── Main Wizard Component ─────────────────────────────────────────────────

export default function DataSourceWizard({
  integration,
  onBack,
  onGoHome,
  onComplete,
  initialAlias = "",
  onInviteUser,
  savedCredentials,
  onSaveCredentials,
  onChangeIntegrationType,
}: {
  integration: CatalogIntegration;
  onBack: () => void;
  onGoHome: () => void;
  onComplete: (name: string, dataCategories?: DataCategory[]) => void;
  initialAlias?: string;
  onInviteUser?: (name: string) => void;
  savedCredentials?: Record<string, string>;
  onSaveCredentials?: (values: Record<string, string>) => void;
  /** Optional — when passed, Step 1 shows a "Change integration type" link */
  onChangeIntegrationType?: () => void;
}) {
  const isDataSource = DATA_SOURCE_INTEGRATIONS.has(integration.name);
  const steps = isDataSource ? DATA_SOURCE_STEPS : STANDARD_STEPS;

  const [step, setStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Record<string, Set<string>>>({});
  const [channelName, setChannelName] = useState(initialAlias);
  const [dsConnected, setDsConnected] = useState(false);
  const [stdConnected, setStdConnected] = useState(false);
  const [dsAuthValues, setDsAuthValues] = useState<Record<string, string>>(savedCredentials || {});
  const [dataCategory, setDataCategory] = useState<MetricCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>([]);
  const [dedupStrategy, setDedupStrategy] = useState<DedupStrategy>("upsert");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [refreshDay, setRefreshDay] = useState("monday");
  const [refreshHour, setRefreshHour] = useState("6");
  const [refreshMinute, setRefreshMinute] = useState("00");
  const [refreshAmPm, setRefreshAmPm] = useState<"AM" | "PM">("AM");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountScopes, setAccountScopes] = useState<Record<string, AccountScope>>({});
  const [mappings, setMappings] = useState<ColumnMapping[]>(() => {
    if (!isDataSource) return [];
    const cols = MOCK_COLUMNS[integration.name] || MOCK_COLUMNS["BigQuery"];
    return cols.map((c) => ({
      sourceColumn: c.sourceColumn,
      category: c.suggestedCategory,
      targetKey: "",
      displayName: "",
      isNewKey: false,
    }));
  });
  const updateMapping = (index: number, update: Partial<ColumnMapping>) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...update } : m)));
  };

  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(account) ? prev.filter((a) => a !== account) : [...prev, account]
    );
  };

  const toggleKey = (tableId: string, colName: string) => {
    setSelectedKeys((prev) => {
      const current = prev[tableId] || new Set<string>();
      const next = new Set(current);
      if (next.has(colName)) next.delete(colName);
      else next.add(colName);
      return { ...prev, [tableId]: next };
    });
  };

  // Auto-set keys from TABLE_COLUMNS when a table is selected
  useEffect(() => {
    for (const tableId of Array.from(selectedTables)) {
      if (!selectedKeys[tableId]) {
        const cols = TABLE_COLUMNS[tableId];
        if (cols) {
          const autoKeys = new Set(cols.filter((c) => c.isAutoKey).map((c) => c.name));
          if (autoKeys.size > 0) {
            setSelectedKeys((prev) => ({ ...prev, [tableId]: autoKeys }));
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTables]);

  const advanceStep = (next: number) => {
    setStep(next);
    setHighestStepReached((prev) => Math.max(prev, next));
  };

  const handleComplete = () => {
    const name = isDataSource && channelName.trim() ? channelName.trim() : integration.name;
    if (isDataSource && onSaveCredentials && Object.keys(dsAuthValues).length > 0) {
      onSaveCredentials(dsAuthValues);
    }
    onComplete(name, selectedCategories.length > 0 ? selectedCategories : undefined);
  };


  const toggleCategory = (cat: DataCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border-primary)] pb-0 -mx-4 px-4">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0 shrink-0">
          <button onClick={onGoHome} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Integrations
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Add Integration
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[var(--text-primary)] font-medium">{isDataSource && channelName ? channelName : integration.name} Setup</span>
        </div>

        {/* Center: Step tabs */}
        <div className="flex-1 flex items-center justify-center gap-0">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            const canNavigate = stepNum <= highestStepReached && stepNum !== step;
            return (
              <button
                key={label}
                onClick={() => canNavigate && setStep(stepNum)}
                disabled={!canNavigate}
                className={`relative px-4 py-3 flex items-center gap-2 transition-colors ${
                  canNavigate ? "cursor-pointer hover:bg-[var(--hover-item)] rounded-[6px]" : "cursor-default"
                }`}
              >
                <span
                  className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                    isComplete
                      ? "bg-[#00bc7d] text-white"
                      : isActive
                      ? "bg-[#027b8e] text-white"
                      : "bg-[var(--bg-badge)] text-[var(--text-dim)]"
                  }`}
                >
                  {isComplete ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </span>
                <span
                  className={`text-sm font-medium hidden lg:block ${
                    isActive ? "text-[#027b8e]" : isComplete ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)]"
                  }`}
                >
                  {label}
                </span>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#027b8e] rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Right: spacer for balance */}
        <div className="min-w-0 shrink-0 w-[180px]" />
      </div>

      {/* Step content */}
      <div className="py-6">
        {isDataSource ? (
          <>
            {step === 1 && (
              <StepAuthorize integration={integration} onNext={() => advanceStep(2)} onInviteUser={onInviteUser} isDataSource channelName={channelName} onChangeChannelName={setChannelName} connected={dsConnected} onChangeConnected={setDsConnected} authValues={dsAuthValues} onChangeAuthValues={setDsAuthValues} onChangeIntegrationType={onChangeIntegrationType} />
            )}
            {step === 2 && (
              <StepSelectTables
                integration={integration}
                selectedTables={selectedTables}
                onSelectTables={setSelectedTables}
                selectedKeys={selectedKeys}
                onToggleKey={toggleKey}
                onNext={() => advanceStep(3)}
              />
            )}
            {step === 3 && (
              <StepDataType
                value={dataCategory}
                onChange={setDataCategory}
                onBack={() => setStep(2)}
                onNext={() => advanceStep(4)}
              />
            )}
            {step === 4 && (
              <StepReviewPreview
                onBack={() => setStep(3)}
                onNext={() => advanceStep(5)}
              />
            )}
            {step === 5 && (
              <StepScheduleAndSync
                integration={integration}
                dedupStrategy={dedupStrategy}
                onChangeDedupStrategy={setDedupStrategy}
                frequency={frequency}
                onChangeFrequency={setFrequency}
                refreshDay={refreshDay}
                onChangeDay={setRefreshDay}
                refreshHour={refreshHour}
                onChangeHour={setRefreshHour}
                refreshMinute={refreshMinute}
                onChangeMinute={setRefreshMinute}
                refreshAmPm={refreshAmPm}
                onChangeAmPm={setRefreshAmPm}
                selectedKeys={selectedKeys}
                selectedTables={selectedTables}
                onNext={() => advanceStep(6)}
              />
            )}
            {step === 6 && (
              <StepReview
                integration={integration}
                channelName={channelName}
                selectedTables={selectedTables}
                selectedKeys={selectedKeys}
                dedupStrategy={dedupStrategy}
                frequency={frequency}
                refreshDay={refreshDay}
                refreshHour={refreshHour}
                refreshMinute={refreshMinute}
                refreshAmPm={refreshAmPm}
                onComplete={handleComplete}
              />
            )}
          </>
        ) : (
          <>
            {step === 1 && (
              <StepAuthorize integration={integration} onNext={() => advanceStep(2)} onInviteUser={onInviteUser} connected={stdConnected} onChangeConnected={setStdConnected} />
            )}
            {step === 2 && (
              <StepSelectAccounts
                integration={integration}
                selectedAccounts={selectedAccounts}
                onToggleAccount={toggleAccount}
                onNext={() => advanceStep(3)}
              />
            )}
            {step === 3 && (
              <StepTagAccounts
                integration={integration}
                selectedAccounts={selectedAccounts}
                scopes={accountScopes}
                onScopesChange={setAccountScopes}
                onComplete={handleComplete}
                onSkip={handleComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
