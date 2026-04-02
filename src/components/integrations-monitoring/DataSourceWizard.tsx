"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { CatalogIntegration, DataCategory } from "../monitoringData";
import { DATA_CATEGORY_LABELS } from "../monitoringData";
import type { MetricCategory } from "../fieldsData";
import { METRIC_CATEGORIES, initialFields, classifyColumn, SYSTEM_DIMENSIONS } from "../fieldsData";
import { IntegrationIcon } from "./icons";

// ─── Types ─────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  checked?: boolean;
}

interface ColumnMapping {
  sourceColumn: string;
  category: MetricCategory | "";
  targetKey: string;
  displayName: string;
  isNewKey: boolean;
}

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

const DATA_SOURCE_INTEGRATIONS = new Set(["BigQuery", "Google Sheets"]);

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
}: {
  integration: CatalogIntegration;
  onNext: () => void;
  onInviteUser?: (name: string) => void;
  isDataSource?: boolean;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const isApiKey = integration.authType === "api_key";
  const [sheetUrl, setSheetUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"oauth" | "url">("oauth");
  // Dynamic auth fields for API key integrations
  const defaultAuthFields: { key: string; label: string; type: "text" | "password" | "textarea"; placeholder: string }[] = [
    { key: "account_id", label: "Account ID", type: "text", placeholder: `Enter your ${integration.name} account ID` },
    { key: "bearer_token", label: "Bearer Token", type: "password", placeholder: "Paste your API token or bearer token" },
  ];
  const authFields = integration.authFields ?? defaultAuthFields;
  const [authValues, setAuthValues] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const allAuthFilled = isApiKey ? authFields.every((f) => (authValues[f.key] || "").trim() !== "") : true;
  // Data-source path (BigQuery / Google Sheets) — compact centered layout
  if (isDataSource) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${integration.color}20` }}>
            <IntegrationIcon integration={integration} />
          </div>
        </div>
        <h2 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-1">
          Connect {integration.name}
        </h2>
        <p className="text-[var(--text-muted)] text-sm text-center mb-8">
          {isGoogleSheets ? "Connect your Google account or paste a sheet URL" : `Authenticate Lifesight to access your ${integration.name} data`}
        </p>

        {isGoogleSheets && (
          <div className="flex gap-2 p-1 bg-[var(--bg-card-inner)] rounded-[6px] border border-[var(--border-primary)] mb-4">
            <button onClick={() => setAuthMethod("oauth")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${authMethod === "oauth" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>Google Account</button>
            <button onClick={() => setAuthMethod("url")} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${authMethod === "url" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>Sheet URL</button>
          </div>
        )}
        {isGoogleSheets && authMethod === "url" && (
          <input type="text" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 mb-4 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
        )}
        <button onClick={onNext} disabled={isGoogleSheets && authMethod === "url" && !sheetUrl.trim()} className="w-full px-4 h-[36px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Authenticate
        </button>
        {onInviteUser && (
          <button onClick={() => onInviteUser(integration.name)} className="w-full mt-3 text-center text-[#027b8e] text-xs hover:underline transition-colors">
            Don&apos;t have access? Invite a teammate
          </button>
        )}
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

      {/* Auth card */}
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
                    onChange={(e) => setAuthValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors resize-none font-mono text-xs"
                  />
                ) : field.type === "password" ? (
                  <div className="relative">
                    <input
                      type={visibleFields.has(field.key) ? "text" : "password"}
                      value={authValues[field.key] || ""}
                      onChange={(e) => setAuthValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
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
                    onChange={(e) => setAuthValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
                  />
                )}
              </div>
            ))}
            <button
              onClick={onNext}
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
              onClick={onNext}
              className="px-5 h-[32px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors flex items-center gap-2 flex-shrink-0"
            >
              Authenticate
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
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
  const mockAccounts = [
    { id: `${integration.name} - Main Account`, name: "Main Account", accountId: "act_283847291" },
    { id: `${integration.name} - Secondary`, name: "Secondary Account", accountId: "act_192736485" },
    { id: `${integration.name} - Testing`, name: "Testing Account", accountId: "act_847362910" },
  ];
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

// ─── Standard Mapping Step (with Lifesight template) ─────────────────────

function StepStandardMapping({
  integration,
  templateFields,
  onUpdateField,
  onNext,
}: {
  integration: CatalogIntegration;
  templateFields: MappingTemplateField[];
  onUpdateField: (index: number, update: Partial<MappingTemplateField>) => void;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<"none" | "template" | "custom">("template");
  const streams = getStreamsForIntegration(integration.name);
  const metricCount = templateFields.filter((f) => f.fieldType === "metric").length;
  const dimensionCount = templateFields.filter((f) => f.fieldType === "dimension").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with integration branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
          <IntegrationIcon integration={integration} />
        </div>
        <div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">Field Mapping</h2>
          <p className="text-[var(--text-muted)] text-sm">Map {integration.name} fields to Lifesight metrics and dimensions</p>
        </div>
      </div>

      {/* Two choice cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setMode("template")}
          className={`text-left p-4 rounded-[8px] border-[1.5px] transition-all ${
            mode === "template" ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke={mode === "template" ? "#027b8e" : "var(--text-dim)"} strokeWidth="1.2" fill="none" />
              <path d="M5 6h6M5 8.5h4M5 11h5" stroke={mode === "template" ? "#027b8e" : "var(--text-dim)"} strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Lifesight Template</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">Recommended</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed">
            Pre-configured mapping based on best practices for {integration.name}. Fields are automatically mapped to the right metrics and dimensions.
          </p>
          <div className="flex gap-3 mt-3">
            <span className="text-[var(--text-dim)] text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2b7fff]" />{metricCount} metrics
            </span>
            <span className="text-[var(--text-dim)] text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#027b8e]" />{dimensionCount} dimensions
            </span>
          </div>
        </button>

        <button
          onClick={() => setMode("custom")}
          className={`text-left p-4 rounded-[8px] border-[1.5px] transition-all ${
            mode === "custom" ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M11.5 1.5l3 3-8.5 8.5H3v-3l8.5-8.5z" stroke={mode === "custom" ? "#027b8e" : "var(--text-dim)"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Custom Template</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed">
            Start from the template and customize each field. Change types, rename fields, and adjust categories to match your workflow.
          </p>
          <div className="flex gap-3 mt-3">
            <span className="text-[var(--text-dim)] text-[11px]">Full control over every field</span>
          </div>
        </button>
      </div>

      {/* Mapping table — shown when either mode is selected */}
      {mode !== "none" && (
        <>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden mb-4">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_1fr_1fr_140px] gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
              <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Source Field</span>
              <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Type</span>
              <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Display Name</span>
              <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Lifesight Field</span>
              <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Category</span>
            </div>

            {templateFields.map((field, i) => (
              <div
                key={field.sourceField}
                className="grid grid-cols-[1fr_80px_1fr_1fr_140px] gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 items-center"
              >
                {/* Source Field */}
                <code className="text-[var(--text-secondary)] text-sm bg-[var(--bg-card-inner)] px-2 py-0.5 rounded font-mono text-xs">{field.sourceField}</code>

                {/* Type toggle */}
                {mode === "custom" ? (
                  <button
                    onClick={() => onUpdateField(i, { fieldType: field.fieldType === "metric" ? "dimension" : "metric" })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      field.fieldType === "metric" ? "bg-[#2b7fff]/15 text-[#2b7fff] hover:bg-[#2b7fff]/25" : "bg-[#027b8e]/15 text-[#027b8e] hover:bg-[#027b8e]/25"
                    }`}
                  >
                    {field.fieldType === "metric" ? "Metric" : "Dimension"}
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    field.fieldType === "metric" ? "bg-[#2b7fff]/15 text-[#2b7fff]" : "bg-[#027b8e]/15 text-[#027b8e]"
                  }`}>
                    {field.fieldType === "metric" ? "Metric" : "Dimension"}
                  </span>
                )}

                {/* Display Name */}
                {mode === "custom" ? (
                  <input
                    type="text"
                    value={field.displayName}
                    onChange={(e) => onUpdateField(i, { displayName: e.target.value })}
                    className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
                  />
                ) : (
                  <span className="text-[var(--text-secondary)] text-sm truncate">{field.displayName}</span>
                )}

                {/* Lifesight Field */}
                {mode === "custom" ? (
                  <input
                    type="text"
                    value={field.lifesightField}
                    onChange={(e) => onUpdateField(i, { lifesightField: e.target.value })}
                    className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
                  />
                ) : (
                  <span className="text-[var(--text-secondary)] text-sm truncate">{field.lifesightField}</span>
                )}

                {/* Category */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: METRIC_CATEGORIES[field.category]?.color }} />
                  <span className="text-[var(--text-secondary)] text-sm truncate">{METRIC_CATEGORIES[field.category]?.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Help text */}
          <div className="flex items-start gap-2.5 mb-6 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[6px] px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="6" stroke="var(--text-dim)" strokeWidth="1.2" />
              <path d="M7 6.5V10" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy="4.5" r="0.75" fill="var(--text-dim)" />
            </svg>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              These mappings determine how {integration.name} data flows into your Lifesight models. Need to make changes later? Head to the <strong className="text-[var(--text-secondary)]">Metrics &amp; Dimensions</strong> tab where you can edit, add, or remove any field mapping at any time.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="px-6 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Standard Review Step ────────────────────────────────────────────────

function StepStandardReview({
  integration,
  selectedAccounts,
  templateFields,
  onComplete,
}: {
  integration: CatalogIntegration;
  selectedAccounts: string[];
  templateFields: MappingTemplateField[];
  onComplete: () => void;
}) {
  const streams = getStreamsForIntegration(integration.name);
  const metricCount = templateFields.filter((f) => f.fieldType === "metric").length;
  const dimensionCount = templateFields.filter((f) => f.fieldType === "dimension").length;

  const metricFields = templateFields.filter((f) => f.fieldType === "metric");
  const dimensionFields = templateFields.filter((f) => f.fieldType === "dimension");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with integration branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
          <IntegrationIcon integration={integration} />
        </div>
        <div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold">Review &amp; Connect</h2>
          <p className="text-[var(--text-muted)] text-sm">Confirm your setup before syncing</p>
        </div>
      </div>

      {/* Summary cards — 3-col */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5 text-center">
          <span className="text-[var(--text-primary)] text-lg font-semibold block">{selectedAccounts.length}</span>
          <span className="text-[var(--text-dim)] text-xs">Account{selectedAccounts.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5 text-center">
          <span className="text-[#2b7fff] text-lg font-semibold block">{metricCount}</span>
          <span className="text-[var(--text-dim)] text-xs">Metrics</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5 text-center">
          <span className="text-[#027b8e] text-lg font-semibold block">{dimensionCount}</span>
          <span className="text-[var(--text-dim)] text-xs">Dimensions</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {/* Accounts */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5">
          <span className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-[1.12px] block mb-2">Accounts</span>
          <div className="flex flex-wrap gap-2">
            {selectedAccounts.map((a) => (
              <span key={a} className="px-2 py-[5.5px] rounded-[4px] bg-[var(--bg-badge)] text-[var(--text-secondary)] text-xs font-medium">{a}</span>
            ))}
          </div>
        </div>

        {/* Metrics Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#2b7fff]" />
            <span className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-[1.12px]">Metrics ({metricCount})</span>
          </div>
          <div className="flex flex-col gap-2">
            {metricFields.map((m) => (
              <div key={m.sourceField} className="flex items-center gap-3 text-sm">
                <code className="text-[var(--text-muted)] bg-[var(--bg-card-inner)] px-1.5 py-0.5 rounded font-mono text-xs">{m.sourceField}</code>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="var(--text-dim)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-[#ebebeb] font-medium text-xs">{m.displayName}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: METRIC_CATEGORIES[m.category]?.color }} />
                  <span className="text-[var(--text-dim)] text-[10.5px]">{METRIC_CATEGORIES[m.category]?.label}</span>
                </span>
              </div>
            ))}
            {metricFields.length === 0 && (
              <span className="text-[var(--text-dim)] text-xs italic">No metrics mapped</span>
            )}
          </div>
        </div>

        {/* Dimensions Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#027b8e]" />
            <span className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-[1.12px]">Dimensions ({dimensionCount})</span>
          </div>
          <div className="flex flex-col gap-2">
            {dimensionFields.map((m) => (
              <div key={m.sourceField} className="flex items-center gap-3 text-sm">
                <code className="text-[var(--text-muted)] bg-[var(--bg-card-inner)] px-1.5 py-0.5 rounded font-mono text-xs">{m.sourceField}</code>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="var(--text-dim)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-[#ebebeb] font-medium text-xs">{m.displayName}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: METRIC_CATEGORIES[m.category]?.color }} />
                  <span className="text-[var(--text-dim)] text-[10.5px]">{METRIC_CATEGORIES[m.category]?.label}</span>
                </span>
              </div>
            ))}
            {dimensionFields.length === 0 && (
              <span className="text-[var(--text-dim)] text-xs italic">No dimensions mapped</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
      >
        Connect {integration.name}
      </button>
    </div>
  );
}

// ─── Tree View ─────────────────────────────────────────────────────────────

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
  onNext,
}: {
  integration: CatalogIntegration;
  selectedTables: Set<string>;
  onSelectTables: (tables: Set<string>) => void;
  onNext: () => void;
}) {
  const isBigQuery = integration.name === "BigQuery";
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["project-1", "ds-analytics", "ds-marketing", "ds-ecommerce"]));
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    if (isBigQuery) {
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

  const selectionCount = isBigQuery ? selectedTables.size : selectedSheets.size;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
        {isBigQuery ? "Select Tables" : "Select Sheets"}
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {isBigQuery
          ? "Choose which BigQuery tables to sync into Lifesight"
          : "Choose which sheets to import"}
      </p>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden mb-6">
        {isBigQuery ? (
          <div className="p-3 max-h-[400px] overflow-y-auto">
            {BIGQUERY_TREE.map((node) => (
              <TreeCheckbox
                key={node.id}
                node={node}
                depth={0}
                checked={selectedTables}
                expanded={expanded}
                onToggleCheck={toggleCheck}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {SHEETS_LIST.map((sheet) => {
              const isSelected = selectedSheets.has(sheet.id);
              return (
                <button
                  key={sheet.id}
                  onClick={() => toggleCheck(sheet.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected ? "bg-[#027b8e]/5" : "hover:bg-[var(--hover-item)]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{sheet.name}</span>
                    <span className="text-[var(--text-dim)] text-xs">{sheet.rows.toLocaleString()} rows · Updated {sheet.lastUpdated}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[var(--text-muted)] text-xs">
          {selectionCount} {isBigQuery ? "table" : "sheet"}{selectionCount !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onNext}
          disabled={selectionCount === 0}
          className="px-6 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
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
        {isJspPreFilled && (
          <p className="text-[#027b8e] text-xs mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.32 2.68L10 4.18l-2 1.95.47 2.75L6 7.7 3.53 8.88 4 6.13 2 4.18l2.68-.5L6 1z" fill="#027b8e" /></svg>
            Pre-filled from your setup plan
          </p>
        )}
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

// ─── Review Step ───────────────────────────────────────────────────────────

function StepReview({
  integration,
  channelName,
  selectedTables,
  mappings,
  onComplete,
}: {
  integration: CatalogIntegration;
  channelName: string;
  selectedTables: Set<string>;
  mappings: ColumnMapping[];
  onComplete: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review & Complete</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Review your configuration before connecting.</p>

      <div className="flex flex-col gap-4 mb-8">
        {/* Integration */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Integration</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: integration.color }}>
              <IntegrationIcon integration={integration} />
            </div>
            <span className="text-[var(--text-primary)] text-sm font-medium">{integration.name}</span>
          </div>
        </div>

        {/* Channel Name */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Channel Name</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">{channelName}</span>
        </div>

        {/* Tables/Sheets */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">
            {integration.name === "BigQuery" ? "Selected Tables" : "Selected Sheets"}
          </span>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTables).map((id) => (
              <span
                key={id}
                className="px-2.5 py-1 rounded-[4px] bg-[var(--bg-badge)] text-[var(--text-secondary)] text-xs font-medium"
              >
                {id}
              </span>
            ))}
          </div>
        </div>

        {/* Column Mappings */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-3">
            Column Mappings ({mappings.length})
          </span>
          <div className="flex flex-col gap-2">
            {mappings.map((m) => (
              <div key={m.sourceColumn} className="flex items-center gap-3 text-sm">
                <code className="text-[var(--text-muted)] bg-[var(--bg-card-inner)] px-1.5 py-0.5 rounded font-mono text-xs">
                  {m.sourceColumn}
                </code>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--text-dim)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {m.category && (
                  <span
                    className="px-2 py-[3px] rounded-[4px] text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${METRIC_CATEGORIES[m.category].color}15`,
                      color: METRIC_CATEGORIES[m.category].color,
                      border: `1px solid ${METRIC_CATEGORIES[m.category].color}30`,
                    }}
                  >
                    {METRIC_CATEGORIES[m.category].label}
                  </span>
                )}
                <span className="text-[var(--text-primary)] font-medium">{m.displayName}</span>
                {m.isNewKey && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">New</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
      >
        Connect {channelName}
      </button>
    </div>
  );
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────

const DATA_SOURCE_STEPS = ["Authenticate", "Select Data", "Classify Data", "Column Mapping", "Review"];
const STANDARD_STEPS = ["Authenticate", "Select Accounts", "Mapping", "Review"];

// ─── Main Wizard Component ─────────────────────────────────────────────────

export default function DataSourceWizard({
  integration,
  onBack,
  onGoHome,
  onComplete,
  initialAlias = "",
  onInviteUser,
}: {
  integration: CatalogIntegration;
  onBack: () => void;
  onGoHome: () => void;
  onComplete: (name: string, dataCategories?: DataCategory[]) => void;
  initialAlias?: string;
  onInviteUser?: (name: string) => void;
}) {
  const isDataSource = DATA_SOURCE_INTEGRATIONS.has(integration.name);
  const steps = isDataSource ? DATA_SOURCE_STEPS : STANDARD_STEPS;

  const [step, setStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [channelName, setChannelName] = useState(initialAlias);
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
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
  const [templateFields, setTemplateFields] = useState<MappingTemplateField[]>(() => getMappingTemplate(integration.name));

  const updateMapping = (index: number, update: Partial<ColumnMapping>) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...update } : m)));
  };

  const updateTemplateField = (index: number, update: Partial<MappingTemplateField>) => {
    setTemplateFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...update } : f)));
  };

  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(account) ? prev.filter((a) => a !== account) : [...prev, account]
    );
  };

  const advanceStep = (next: number) => {
    setStep(next);
    setHighestStepReached((prev) => Math.max(prev, next));
  };

  const handleComplete = () => {
    onComplete(integration.name, selectedCategories.length > 0 ? selectedCategories : undefined);
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
          <span className="text-[var(--text-primary)] font-medium">{integration.name} Setup</span>
        </div>

        {/* Center: Step tabs */}
        <div className="flex-1 flex items-center justify-center gap-0">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            const canNavigate = stepNum > 1 && stepNum <= highestStepReached && stepNum !== step;
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
              <StepAuthorize integration={integration} onNext={() => advanceStep(2)} onInviteUser={onInviteUser} isDataSource />
            )}
            {step === 2 && (
              <StepSelectTables
                integration={integration}
                selectedTables={selectedTables}
                onSelectTables={setSelectedTables}
                onNext={() => advanceStep(3)}
              />
            )}
            {step === 3 && (
              <StepChannelName
                channelName={channelName}
                onChangeChannelName={setChannelName}
                onNext={() => advanceStep(4)}
                isJspPreFilled={!!initialAlias}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
              />
            )}
            {step === 4 && (
              <StepColumnMapping
                integration={integration}
                mappings={mappings}
                onUpdateMapping={updateMapping}
                onNext={() => advanceStep(5)}
              />
            )}
            {step === 5 && (
              <StepReview
                integration={integration}
                channelName={channelName}
                selectedTables={selectedTables}
                mappings={mappings}
                onComplete={handleComplete}
              />
            )}
          </>
        ) : (
          <>
            {step === 1 && (
              <StepAuthorize integration={integration} onNext={() => advanceStep(2)} onInviteUser={onInviteUser} />
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
              <StepStandardMapping
                integration={integration}
                templateFields={templateFields}
                onUpdateField={updateTemplateField}
                onNext={() => advanceStep(4)}
              />
            )}
            {step === 4 && (
              <StepStandardReview
                integration={integration}
                selectedAccounts={selectedAccounts}
                templateFields={templateFields}
                onComplete={handleComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
