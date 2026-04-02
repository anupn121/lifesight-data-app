"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { CatalogIntegration } from "../monitoringData";
import type { MetricCategory } from "../fieldsData";
import { METRIC_CATEGORIES, initialFields, classifyColumn, SYSTEM_DIMENSIONS } from "../fieldsData";
import { IntegrationIcon } from "./icons";

// ─── Types ─────────────────────────────────────────────────────────────────

type FileDataType = "mmm" | "experiments" | "custom_costs" | "cogs" | "custom";
type DataCategory = MetricCategory; // kpi | paid_marketing | organic | contextual

interface ColumnMapping {
  sourceColumn: string;
  included: boolean;
  category: DataCategory | "";
  targetKey: string;
  displayName: string;
  isNewKey: boolean;
  platform?: string;
}

// Auto-detect ad platform from column name patterns
const PLATFORM_PATTERNS: { pattern: RegExp; id: string; name: string }[] = [
  { pattern: /^(meta|fb|facebook)/i, id: "meta", name: "Meta" },
  { pattern: /^(google|gads|ga_)/i, id: "google", name: "Google" },
  { pattern: /^(tiktok|tt_)/i, id: "tiktok", name: "TikTok" },
  { pattern: /^(snap|snapchat)/i, id: "snapchat", name: "Snapchat" },
  { pattern: /^(pin|pinterest)/i, id: "pinterest", name: "Pinterest" },
  { pattern: /^(li_|linkedin)/i, id: "linkedin", name: "LinkedIn" },
  { pattern: /^stackadapt/i, id: "stackadapt", name: "StackAdapt" },
  { pattern: /^(x_|twitter)/i, id: "x", name: "X" },
];

function detectPlatform(columnName: string): string {
  for (const { pattern, id } of PLATFORM_PATTERNS) {
    if (pattern.test(columnName)) return id;
  }
  return "";
}

const PLATFORM_OPTIONS = [
  { id: "", label: "None" },
  { id: "meta", label: "Meta" },
  { id: "google", label: "Google" },
  { id: "tiktok", label: "TikTok" },
  { id: "snapchat", label: "Snapchat" },
  { id: "pinterest", label: "Pinterest" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "stackadapt", label: "StackAdapt" },
  { id: "x", label: "X" },
];

interface SampleRow {
  [key: string]: string;
}

type SampleMode = "auto" | "upload";
type RefreshFrequency = "daily" | "weekly" | "monthly";
type RefreshDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const STEPS = [
  "Data Type & Name",
  "Connect",
  "Select Source",
  "Sample Data",
  "Map Columns",
  "Schedule",
  "Review",
];

// Integrations that skip "Select Source" (they provide data at upload/connect time)
const SKIP_SELECT_SOURCE = new Set(["Import CSV", "Excel Upload"]);
// Integrations that skip "Connect" step (file uploads authenticate implicitly)
const UPLOAD_ONLY = new Set(["Import CSV", "Excel Upload"]);

// ─── File Data Type Cards ──────────────────────────────────────────────────

const FILE_DATA_TYPES: Record<FileDataType, { label: string; color: string; icon: JSX.Element; description: string; examples: string }> = {
  mmm: {
    label: "MMM",
    color: "#2b7fff",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 20L7 8l5 8 4-12 5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: "Media Mix Modeling data — channel-level spend, impressions, and KPIs for statistical modeling.",
    examples: "Daily spend by channel, Impressions, Clicks, Revenue, Conversions",
  },
  experiments: {
    label: "Experiments",
    color: "#00bc7d",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 3v6l-4 8a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-4-8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
        <circle cx="14" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
    description: "Incrementality and geo experiment results — test vs control group performance data.",
    examples: "Test/Control groups, Geo regions, Lift metrics, Experiment dates",
  },
  custom_costs: {
    label: "Custom Costs",
    color: "#fe9a00",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: "Additional marketing or operational costs not captured by native integrations.",
    examples: "Agency fees, Influencer costs, Offline media spend, Production costs",
  },
  cogs: {
    label: "COGS",
    color: "#027b8e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    description: "Cost of Goods Sold — product-level costs for margin and profitability analysis.",
    examples: "Product costs, Shipping costs, Fulfillment costs, Returns",
  },
  custom: {
    label: "Custom",
    color: "#9CA3AF",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91A6 6 0 0114.7 6.3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    description: "Any other data that doesn't fit the categories above. Full flexibility for custom use cases.",
    examples: "Weather data, Economic indicators, CRM data, Custom KPIs",
  },
};

// Legacy category info (kept for column mapping compatibility)
const CATEGORY_INFO: Record<DataCategory, { label: string; color: string; icon: JSX.Element; examples: string }> = {
  kpi: {
    label: "KPI",
    color: "#00bc7d",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    examples: "Revenue, Conversions, Orders, Installs, Subscriptions",
  },
  paid_marketing: {
    label: "Paid Marketing",
    color: "#2b7fff",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    examples: "Facebook Ads spend, Google Ads clicks, Kayak, Skyscanner, TikTok impressions",
  },
  organic: {
    label: "Organic / Owned",
    color: "#fe9a00",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22c4-4 8-7.58 8-12a8 8 0 10-16 0c0 4.42 4 8 8 12z" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    examples: "Instagram impressions, Email open rates, SEO traffic, Newsletter signups",
  },
  contextual: {
    label: "Contextual",
    color: "#027b8e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    examples: "Weather index, Competitor activity, Economic indicators, Seasonality flags",
  },
};

// ─── Mock Sample Data ──────────────────────────────────────────────────────

const MOCK_SAMPLE: Record<string, { columns: string[]; rows: SampleRow[] }> = {
  default: {
    columns: ["date", "channel", "spend", "impressions", "clicks", "conversions", "revenue"],
    rows: [
      { date: "2025-01-06", channel: "facebook", spend: "12500", impressions: "3100000", clicks: "128000", conversions: "1847", revenue: "312000" },
      { date: "2025-01-06", channel: "google", spend: "8400", impressions: "2800000", clicks: "142000", conversions: "2103", revenue: "380000" },
      { date: "2025-01-13", channel: "facebook", spend: "13200", impressions: "3400000", clicks: "135000", conversions: "1920", revenue: "328000" },
      { date: "2025-01-13", channel: "google", spend: "9100", impressions: "2900000", clicks: "148000", conversions: "2250", revenue: "395000" },
      { date: "2025-01-20", channel: "facebook", spend: "11800", impressions: "2900000", clicks: "118000", conversions: "1680", revenue: "290000" },
    ],
  },
};

const MOCK_SAMPLE_MMM = {
  columns: ["date", "meta_spend", "google_spend", "tiktok_spend", "meta_impressions", "google_impressions", "tiktok_impressions", "meta_clicks", "google_clicks"],
  rows: [
    { date: "2025-01-06", meta_spend: "12500", google_spend: "8400", tiktok_spend: "4200", meta_impressions: "3100000", google_impressions: "2800000", tiktok_impressions: "1500000", meta_clicks: "128000", google_clicks: "142000" },
    { date: "2025-01-13", meta_spend: "13200", google_spend: "9100", tiktok_spend: "4800", meta_impressions: "3400000", google_impressions: "2900000", tiktok_impressions: "1600000", meta_clicks: "135000", google_clicks: "148000" },
    { date: "2025-01-20", meta_spend: "11800", google_spend: "8800", tiktok_spend: "3900", meta_impressions: "2900000", google_impressions: "2700000", tiktok_impressions: "1400000", meta_clicks: "118000", google_clicks: "139000" },
  ],
};

function getMockSample(_source: string, dataType?: FileDataType | null) {
  if (dataType === "mmm") return MOCK_SAMPLE_MMM;
  return MOCK_SAMPLE.default;
}

// ─── Step 1: Data Type & Name ──────────────────────────────────────────────

function StepDataTypeAlias({
  integration,
  selectedFileDataType,
  aliasName,
  selectedCategories,
  onSelectFileDataType,
  onChangeAlias,
  onToggleCategory,
  onNext,
  isJspPreFilled,
}: {
  integration: CatalogIntegration;
  selectedFileDataType: FileDataType | null;
  aliasName: string;
  selectedCategories: Set<DataCategory>;
  onSelectFileDataType: (dt: FileDataType) => void;
  onChangeAlias: (v: string) => void;
  onToggleCategory: (cat: DataCategory) => void;
  onNext: () => void;
  isJspPreFilled?: boolean;
}) {
  const canProceed = selectedFileDataType !== null && aliasName.trim().length > 0 && selectedCategories.size > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <IntegrationIcon integration={integration} />
        <div>
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">What kind of data is this?</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Select the data type and categories. This determines how fields are organized in Metrics &amp; Dimensions.
          </p>
        </div>
      </div>

      {/* File data type cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.entries(FILE_DATA_TYPES) as [FileDataType, typeof FILE_DATA_TYPES[FileDataType]][]).map(([key, info]) => {
          const isSelected = selectedFileDataType === key;
          return (
            <button
              key={key}
              onClick={() => onSelectFileDataType(key)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-current shadow-sm"
                  : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
              }`}
              style={isSelected ? { borderColor: info.color, backgroundColor: `${info.color}08` } : undefined}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${info.color}15`, color: info.color }}
              >
                {info.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] text-sm font-semibold">{info.label}</span>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill={info.color} />
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{info.description}</p>
                <p className="text-[var(--text-label)] text-[10px] mt-1.5 italic">{info.examples}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Data category multi-select */}
      <div className="mb-6">
        <label className="text-[var(--text-secondary)] text-sm font-medium block mb-2">Data Categories</label>
        <p className="text-[var(--text-dim)] text-xs mb-3">Select one or more categories this data belongs to.</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(CATEGORY_INFO) as [DataCategory, typeof CATEGORY_INFO[DataCategory]][]).map(([cat, info]) => {
            const isSelected = selectedCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleCategory(cat)}
                className="flex flex-col items-start gap-1.5 p-2.5 rounded-[8px] border text-left transition-all duration-150"
                style={{
                  borderColor: isSelected ? `${info.color}60` : "var(--border-primary)",
                  backgroundColor: isSelected ? `${info.color}10` : "transparent",
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      borderColor: isSelected ? info.color : "var(--border-secondary)",
                      backgroundColor: isSelected ? info.color : "transparent",
                    }}
                  >
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[var(--text-primary)] text-[11px] font-semibold">{info.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alias name */}
      <div className="mb-6">
        <label className="text-[var(--text-secondary)] text-sm font-medium block mb-2">
          Integration Name
        </label>
        <input
          type="text"
          value={aliasName}
          onChange={(e) => onChangeAlias(e.target.value)}
          placeholder={`e.g., Kayak via ${integration.name}, Instagram Organic Data`}
          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
        />
        <p className="text-[var(--text-dim)] text-xs mt-2">
          This name will appear on your integrations dashboard. Use something recognizable.
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
        disabled={!canProceed}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 2: Connect / Authenticate ────────────────────────────────────────

function StepConnect({
  integration,
  onNext,
  onInviteUser,
}: {
  integration: CatalogIntegration;
  onNext: () => void;
  onInviteUser?: (name: string) => void;
}) {
  const [fileName, setFileName] = useState("");
  const isUpload = UPLOAD_ONLY.has(integration.name);
  const isGoogleSheets = integration.name === "Google Sheets";
  const isS3 = integration.name === "Amazon S3";
  const isGCS = integration.name === "Google Cloud Storage";
  const isSFTP = integration.name === "SFTP";

  if (isUpload) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <IntegrationIcon integration={integration} />
        </div>
        <h2 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-2">
          Upload Your File
        </h2>
        <p className="text-[var(--text-muted)] text-sm text-center mb-8">
          {integration.name === "Import CSV" ? "Upload a CSV file to import data." : "Upload an Excel (.xlsx) file to import data."}
        </p>
        <div
          className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center hover:border-[#027b8e] transition-colors cursor-pointer mb-4"
          onClick={() => setFileName(integration.name === "Import CSV" ? "campaign_data.csv" : "marketing_report.xlsx")}
        >
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4l6 6m0 0l6 6m-6-6l6-6m-6 6l-6 6" stroke="#00bc7d" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[var(--text-primary)] text-sm font-medium">{fileName}</span>
              <span className="text-[var(--text-dim)] text-xs">(click to change)</span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3">
                <path d="M16 6v14M10 12l6-6 6 6" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 22h20" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-[var(--text-muted)] text-sm">
                Drag and drop or <span className="text-[#027b8e] font-medium">browse</span>
              </p>
              <p className="text-[var(--text-dim)] text-xs mt-1">
                {integration.name === "Import CSV" ? ".csv files up to 50MB" : ".xlsx files up to 50MB"}
              </p>
            </>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={!fileName}
          className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        {onInviteUser && (
          <button
            onClick={() => onInviteUser(integration.name)}
            className="w-full mt-3 text-center text-[#027b8e] text-sm hover:underline transition-colors"
          >
            Don&apos;t have access? Invite someone
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <IntegrationIcon integration={integration} />
      </div>
      <h2 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-2">
        Connect {integration.name}
      </h2>
      <p className="text-[var(--text-muted)] text-sm text-center mb-8">
        {isGoogleSheets && "Connect your Google account to access your spreadsheets."}
        {isS3 && "Provide your AWS credentials to access S3 buckets."}
        {isGCS && "Provide your Google Cloud credentials to access storage buckets."}
        {isSFTP && "Enter your SFTP server details to connect."}
        {!isGoogleSheets && !isS3 && !isGCS && !isSFTP && `Authorize Lifesight to access your ${integration.name} data.`}
      </p>

      {isGoogleSheets && (
        <button
          onClick={onNext}
          className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="white" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity="0.8" />
          </svg>
          Connect Google Account
        </button>
      )}

      {isS3 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Access Key ID</label>
            <input type="text" placeholder="AKIA..." className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Secret Access Key</label>
            <input type="password" placeholder="Your secret key" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Region</label>
            <input type="text" placeholder="us-east-1" defaultValue="us-east-1" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <button onClick={onNext} className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors">
            Connect
          </button>
        </div>
      )}

      {isGCS && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Project ID</label>
            <input type="text" placeholder="my-project-id" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Service Account Key (JSON)</label>
            <div
              className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-6 text-center hover:border-[#027b8e] transition-colors cursor-pointer"
              onClick={() => {}}
            >
              <p className="text-[var(--text-muted)] text-sm">Upload service account JSON key</p>
            </div>
          </div>
          <button onClick={onNext} className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors">
            Connect
          </button>
        </div>
      )}

      {isSFTP && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div>
              <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Host</label>
              <input type="text" placeholder="sftp.example.com" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Port</label>
              <input type="text" placeholder="22" defaultValue="22" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Username</label>
            <input type="text" placeholder="username" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Password or SSH Key</label>
            <input type="password" placeholder="Password" className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <button onClick={onNext} className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors">
            Connect
          </button>
        </div>
      )}

      {!isGoogleSheets && !isS3 && !isGCS && !isSFTP && (
        <button onClick={onNext} className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors">
          Authorize Access
        </button>
      )}

      {onInviteUser && (
        <button
          onClick={() => onInviteUser(integration.name)}
          className="w-full mt-4 text-center text-[#027b8e] text-sm hover:underline transition-colors"
        >
          Don&apos;t have access? Invite someone
        </button>
      )}
    </div>
  );
}

// ─── Step 3: Select Source ──────────────────────────────────────────────────

const MOCK_SHEETS = [
  { id: "sh-1", name: "Campaign Performance Q4", rows: 2340, lastUpdated: "2 hours ago" },
  { id: "sh-2", name: "Monthly Revenue Summary", rows: 156, lastUpdated: "1 day ago" },
  { id: "sh-3", name: "Ad Spend Tracker 2024", rows: 890, lastUpdated: "3 hours ago" },
  { id: "sh-4", name: "Keyword Rankings", rows: 1205, lastUpdated: "6 hours ago" },
];

const MOCK_BUCKETS = [
  { name: "marketing-data-prod", files: 245, lastModified: "1 hour ago" },
  { name: "analytics-exports", files: 89, lastModified: "3 hours ago" },
  { name: "campaign-reports-2025", files: 34, lastModified: "1 day ago" },
];

const MOCK_SFTP_FILES = [
  { name: "/data/exports/weekly_spend.csv", size: "2.4 MB", lastModified: "2 hours ago" },
  { name: "/data/exports/campaign_metrics.csv", size: "1.8 MB", lastModified: "1 day ago" },
  { name: "/data/exports/revenue_daily.csv", size: "890 KB", lastModified: "6 hours ago" },
];

function StepSelectSource({
  integration,
  selectedSource,
  onSelect,
  onNext,
}: {
  integration: CatalogIntegration;
  selectedSource: string;
  onSelect: (source: string) => void;
  onNext: () => void;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const isS3 = integration.name === "Amazon S3";
  const isGCS = integration.name === "Google Cloud Storage";
  const isSFTP = integration.name === "SFTP";

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
        {isGoogleSheets ? "Select a Sheet" : isSFTP ? "Select a File" : "Select a Bucket"}
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {isGoogleSheets && "Choose which spreadsheet contains your data."}
        {(isS3 || isGCS) && "Select the bucket containing your data files."}
        {isSFTP && "Navigate to the file you want to import."}
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {isGoogleSheets && MOCK_SHEETS.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => onSelect(sheet.name)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
              selectedSource === sheet.name
                ? "border-[#027b8e] bg-[#027b8e]/5"
                : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="2" fill="#0F9D58" opacity="0.15" />
                <path d="M6 8h8M6 11h8M6 14h5" stroke="#0F9D58" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <div>
                <span className="text-[var(--text-primary)] text-sm font-medium block">{sheet.name}</span>
                <span className="text-[var(--text-dim)] text-xs">{sheet.rows.toLocaleString()} rows · Updated {sheet.lastUpdated}</span>
              </div>
            </div>
            {selectedSource === sheet.name && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#027b8e" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}

        {(isS3 || isGCS) && MOCK_BUCKETS.map((bucket) => (
          <button
            key={bucket.name}
            onClick={() => onSelect(bucket.name)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
              selectedSource === bucket.name
                ? "border-[#027b8e] bg-[#027b8e]/5"
                : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="2" fill={integration.color} opacity="0.15" />
                <path d="M6 7h8M6 10h8M6 13h8" stroke={integration.color} strokeWidth="1" />
              </svg>
              <div>
                <span className="text-[var(--text-primary)] text-sm font-medium block">{bucket.name}</span>
                <span className="text-[var(--text-dim)] text-xs">{bucket.files} files · Modified {bucket.lastModified}</span>
              </div>
            </div>
            {selectedSource === bucket.name && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#027b8e" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}

        {isSFTP && MOCK_SFTP_FILES.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelect(file.name)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
              selectedSource === file.name
                ? "border-[#027b8e] bg-[#027b8e]/5"
                : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M11 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z" fill="#607D8B" opacity="0.15" stroke="#607D8B" strokeWidth="1" />
              </svg>
              <div>
                <span className="text-[var(--text-primary)] text-sm font-medium block font-mono text-xs">{file.name}</span>
                <span className="text-[var(--text-dim)] text-xs">{file.size} · Modified {file.lastModified}</span>
              </div>
            </div>
            {selectedSource === file.name && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#027b8e" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!selectedSource}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 4: Sample Data ───────────────────────────────────────────────────

function StepSampleData({
  integration,
  sampleMode,
  onChangeSampleMode,
  sampleData,
  onSkip,
  onNext,
}: {
  integration: CatalogIntegration;
  sampleMode: SampleMode;
  onChangeSampleMode: (mode: SampleMode) => void;
  sampleData: { columns: string[]; rows: SampleRow[] } | null;
  onSkip: () => void;
  onNext: () => void;
}) {
  const [uploadedFileName, setUploadedFileName] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Preview Sample Data</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Review a sample of your data to set up column mapping. You can also upload a separate sample file.
      </p>

      {/* Toggle */}
      <div className="flex gap-2 p-1 bg-[var(--bg-card-inner)] rounded-lg border border-[var(--border-primary)] mb-6 w-fit">
        <button
          onClick={() => onChangeSampleMode("auto")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            sampleMode === "auto" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Auto-fetched Preview
        </button>
        <button
          onClick={() => onChangeSampleMode("upload")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            sampleMode === "upload" ? "bg-[#027b8e] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Upload Sample File
        </button>
      </div>

      {sampleMode === "auto" && sampleData && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
                  {sampleData.columns.map((col) => (
                    <th key={col} className="px-3 py-2.5 text-left text-[var(--text-label)] font-semibold uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)] last:border-b-0">
                    {sampleData.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap font-mono">
                        {row[col] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-[var(--bg-card-inner)] border-t border-[var(--border-primary)]">
            <span className="text-[var(--text-dim)] text-xs">
              Showing {sampleData.rows.length} of {sampleData.rows.length} sample rows · {sampleData.columns.length} columns detected
            </span>
          </div>
        </div>
      )}

      {sampleMode === "upload" && (
        <div
          className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center hover:border-[#027b8e] transition-colors cursor-pointer mb-6"
          onClick={() => setUploadedFileName("sample_data.csv")}
        >
          {uploadedFileName ? (
            <div className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#00bc7d" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[var(--text-primary)] text-sm font-medium">{uploadedFileName}</span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3">
                <path d="M16 6v14M10 12l6-6 6 6" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 22h20" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-[var(--text-muted)] text-sm">Upload a sample CSV or Excel file</p>
              <p className="text-[var(--text-dim)] text-xs mt-1">We&apos;ll detect columns from the first few rows</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onNext}
          disabled={sampleMode === "upload" && !uploadedFileName}
          className="flex-1 px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Mapping
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] text-sm font-medium hover:bg-[var(--hover-item)] transition-colors"
        >
          Skip — Map Later
        </button>
      </div>
      <p className="text-[var(--text-dim)] text-xs mt-2 text-center">
        You can always map columns later from the Metrics &amp; Dimensions tab.
      </p>
    </div>
  );
}

// ─── Shared: Category Dropdown ─────────────────────────────────────────────

function CategoryDropdown({ value, onChange }: { value: DataCategory | ""; onChange: (v: DataCategory) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = value ? METRIC_CATEGORIES[value] : null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm transition-colors hover:border-[#027b8e] text-left min-w-[130px]">
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="text-[var(--text-primary)] truncate text-xs">{selected.label}</span>
          </span>
        ) : (
          <span className="text-[var(--text-label)] text-xs">Select...</span>
        )}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="flex-shrink-0"><path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-52 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-[var(--shadow-popover)] overflow-hidden">
          {(Object.entries(METRIC_CATEGORIES) as [DataCategory, { label: string; color: string; description: string }][]).map(([key, cat]) => (
            <button key={key} onClick={() => { onChange(key); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)] ${value === key ? "bg-[#027b8e]/5" : ""}`}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-[var(--text-primary)] text-xs">{cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared: Target Key Combobox ───────────────────────────────────────────

function TargetKeyCombobox({ value, category, sourceColumn, onChange, onDisplayNameChange }: {
  value: string; category: DataCategory | ""; sourceColumn?: string; onChange: (v: string, isNew: boolean) => void; onDisplayNameChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const isDimension = sourceColumn ? classifyColumn(sourceColumn) === "dimension" : false;
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // For metrics: show fields filtered by category. For dimensions: show SYSTEM_DIMENSIONS.
  const filteredMetricFields = useMemo(() => {
    if (isDimension) return [];
    let fields = initialFields.filter((f) => f.kind === "metric");
    if (category) fields = fields.filter((f) => f.metricCategory === category);
    if (search) { const q = search.toLowerCase(); fields = fields.filter((f) => f.name.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q)); }
    return fields.slice(0, 12);
  }, [category, search, isDimension]);

  const filteredDimensions = useMemo(() => {
    if (!isDimension) return [];
    let dims = SYSTEM_DIMENSIONS.filter((d) => d.channelMappings.length > 0 || d.isSystem);
    if (search) { const q = search.toLowerCase(); dims = dims.filter((d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)); }
    return dims;
  }, [search, isDimension]);

  return (
    <div className="relative" ref={ref}>
      <input type="text" value={open ? search : value} onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }} onFocus={() => { setOpen(true); setSearch(value); }}
        placeholder={isDimension ? "Select dimension..." : "Search or create..."} className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-xs text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors min-w-[140px]" />
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-[var(--shadow-popover)] overflow-hidden max-h-[200px] overflow-y-auto">
          {/* Metric suggestions */}
          {!isDimension && filteredMetricFields.map((field) => (
            <button key={field.name} onClick={() => { onChange(field.name, false); onDisplayNameChange(field.displayName); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)]">
              <div className="min-w-0"><span className="text-[var(--text-primary)] text-xs block truncate">{field.name}</span></div>
              {field.metricCategory && <span className="w-2 h-2 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: METRIC_CATEGORIES[field.metricCategory]?.color }} />}
            </button>
          ))}
          {/* Dimension definition suggestions */}
          {isDimension && filteredDimensions.map((dim) => (
            <button key={dim.id} onClick={() => { onChange(dim.id, false); onDisplayNameChange(dim.name); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)]">
              <div className="min-w-0">
                <span className="text-[var(--text-primary)] text-xs block truncate">{dim.name}</span>
                <span className="text-[var(--text-dim)] text-[10px] block truncate">{dim.channelMappings.length} sources mapped</span>
              </div>
              <span className="w-2 h-2 rounded-full flex-shrink-0 ml-2 bg-[#027b8e]" />
            </button>
          ))}
          {search.trim() && (
            <button onClick={() => { onChange(search.trim(), true); onDisplayNameChange(search.trim()); setOpen(false); setSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-item)] border-t border-[var(--border-primary)]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="#027b8e" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span className="text-[#027b8e] text-xs font-medium">Create &quot;{search.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Column Mapping ────────────────────────────────────────────────

// ─── Smart Mapper vs Manual Choice ────────────────────────────────────────

function StepMapperChoice({
  onSelectSmart,
  onSelectManual,
}: {
  onSelectSmart: () => void;
  onSelectManual: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">How would you like to map columns?</h2>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Choose a mapping approach. You can always adjust individual mappings afterwards.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Smart Mapper */}
        <button
          onClick={onSelectSmart}
          className="text-left p-5 rounded-xl border-[1.5px] border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[#027b8e] hover:bg-[#027b8e]/3 transition-all group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#027b8e]/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L9 9.5 6 11l.5-3.5L4 5l3.5-.5L9 1.5z" stroke="#027b8e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M3 14.5l1.5-1.5M14 14.5l-1.5-1.5M9 14v2" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[var(--text-primary)] text-sm font-semibold block">Smart Mapper</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">Recommended</span>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-3">
            AI-powered column detection automatically identifies metrics, dimensions, and categories based on column names and sample data.
          </p>
          <div className="flex items-center gap-2 text-[var(--text-dim)] text-[11px]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
              <path d="M4 6l1.5 1.5L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Auto-fills categories, target fields, and display names
          </div>
        </button>

        {/* Manual Mapper */}
        <button
          onClick={onSelectManual}
          className="text-left p-5 rounded-xl border-[1.5px] border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] transition-all group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-badge)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13 2l3 3-9.5 9.5H3.5v-3L13 2z" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M11 4l3 3" stroke="var(--text-muted)" strokeWidth="1.2" />
              </svg>
            </div>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Manual Mapper</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-3">
            Map each column manually. Choose categories, target fields, and display names for each column yourself.
          </p>
          <div className="flex items-center gap-2 text-[var(--text-dim)] text-[11px]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Full control over every mapping
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Map Columns ──────────────────────────────────────────────────

function StepColumnMapping({
  mappings,
  defaultCategory,
  onToggleInclude,
  onUpdateMapping,
  onNext,
  mapperChoice,
  onChangeChoice,
}: {
  mappings: ColumnMapping[];
  defaultCategory: DataCategory | "";
  onToggleInclude: (index: number) => void;
  onUpdateMapping: (index: number, update: Partial<ColumnMapping>) => void;
  onNext: () => void;
  mapperChoice: "smart" | "manual";
  onChangeChoice: () => void;
}) {
  const includedCount = mappings.filter((m) => m.included).length;
  const mappedCount = mappings.filter((m) => m.included && m.category && m.targetKey).length;
  const hasPaidMarketing = mappings.some((m) => m.included && m.category === "paid_marketing");
  const gridCols = hasPaidMarketing
    ? "grid-cols-[40px_1fr_140px_110px_160px_160px]"
    : "grid-cols-[40px_1fr_140px_160px_160px]";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[var(--text-primary)] text-xl font-semibold">Map Columns</h2>
        <button onClick={onChangeChoice} className="text-[#027b8e] text-xs hover:underline transition-colors">
          Change mapping method
        </button>
      </div>
      {mapperChoice === "smart" && (
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1 2.5 2.5.4-1.8 1.8.4 2.5L6 7l-2.1 1.2.4-2.5L2.5 3.9 5 3.5 6 1z" fill="#027b8e" />
          </svg>
          <span className="text-[#027b8e] text-xs font-medium">Smart Mapper applied — review and adjust as needed</span>
        </div>
      )}
      <p className="text-[var(--text-muted)] text-sm mb-1">
        Select the columns you want to import and map them to target fields. You can map the rest later.
      </p>
      <p className="text-[var(--text-dim)] text-xs mb-6">
        {mappedCount} of {includedCount} selected columns mapped
      </p>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className={`grid ${gridCols} gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]`}>
          <span></span>
          <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Source Column</span>
          <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Category</span>
          {hasPaidMarketing && <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Platform</span>}
          <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Target Field</span>
          <span className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-wider">Display Name</span>
        </div>

        {mappings.map((mapping, i) => (
          <div key={mapping.sourceColumn} className={`grid ${gridCols} gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 items-center ${!mapping.included ? "opacity-40" : ""}`}>
            {/* Checkbox */}
            <button onClick={() => onToggleInclude(i)} className="flex items-center justify-center">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${mapping.included ? "bg-[#027b8e] border-[#027b8e]" : "border-[var(--border-secondary)]"}`}>
                {mapping.included && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            </button>

            {/* Source Column + role badge */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`flex-shrink-0 text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center ${classifyColumn(mapping.sourceColumn) === "metric" ? "bg-[#2b7fff]/15 text-[#2b7fff]" : "bg-[#027b8e]/15 text-[#027b8e]"}`}>
                {classifyColumn(mapping.sourceColumn) === "metric" ? "M" : "D"}
              </span>
              <code className="text-[var(--text-secondary)] text-xs bg-[var(--bg-card-inner)] px-2 py-0.5 rounded font-mono truncate">{mapping.sourceColumn}</code>
            </div>

            {/* Category */}
            {mapping.included ? (
              <CategoryDropdown value={mapping.category} onChange={(cat) => onUpdateMapping(i, { category: cat })} />
            ) : <span />}

            {/* Platform — only shown when any column has paid_marketing */}
            {hasPaidMarketing && (
              mapping.included && mapping.category === "paid_marketing" ? (
                <select
                  value={mapping.platform || ""}
                  onChange={(e) => onUpdateMapping(i, { platform: e.target.value || undefined })}
                  className="px-2 py-1.5 rounded-[6px] border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              ) : <span />
            )}

            {/* Target Key */}
            {mapping.included ? (
              <TargetKeyCombobox value={mapping.targetKey} category={mapping.category} sourceColumn={mapping.sourceColumn} onChange={(key, isNew) => onUpdateMapping(i, { targetKey: key, isNewKey: isNew })} onDisplayNameChange={(name) => onUpdateMapping(i, { displayName: name })} />
            ) : <span />}

            {/* Display Name */}
            {mapping.included ? (
              <input type="text" value={mapping.displayName} onChange={(e) => onUpdateMapping(i, { displayName: e.target.value })} placeholder="Display name..."
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-xs text-[var(--text-primary)] placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
            ) : <span />}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 bg-[#2b7fff]/5 border border-[#2b7fff]/20 rounded-lg px-4 py-3 mb-6">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
          <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
          <path d="M8 5.5v3" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="#2b7fff" />
        </svg>
        <p className="text-[#2b7fff] text-xs leading-relaxed">
          Unmapped columns can be mapped anytime from the <strong>Metrics &amp; Dimensions</strong> tab.
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={includedCount === 0}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 6: Refresh Schedule ──────────────────────────────────────────────

const DAYS: { value: RefreshDay; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function StepRefreshSchedule({
  integration,
  frequency,
  day,
  onChangeFrequency,
  onChangeDay,
  onNext,
}: {
  integration: CatalogIntegration;
  frequency: RefreshFrequency;
  day: RefreshDay;
  onChangeFrequency: (f: RefreshFrequency) => void;
  onChangeDay: (d: RefreshDay) => void;
  onNext: () => void;
}) {
  const isUpload = UPLOAD_ONLY.has(integration.name);

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Refresh Schedule</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {isUpload
          ? "Set how often you plan to re-upload updated data. We'll remind you when a refresh is due."
          : "Set how often we should pull new data from your source."}
      </p>

      {/* Frequency */}
      <div className="mb-6">
        <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Frequency</label>
        <div className="flex gap-3">
          {(["daily", "weekly", "monthly"] as RefreshFrequency[]).map((f) => (
            <button
              key={f}
              onClick={() => onChangeFrequency(f)}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                frequency === f
                  ? "border-[#027b8e] bg-[#027b8e]/5 text-[#027b8e]"
                  : "border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Day picker for weekly */}
      {frequency === "weekly" && (
        <div className="mb-6">
          <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Day of Week</label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => onChangeDay(d.value)}
                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  day === d.value
                    ? "bg-[#027b8e] text-white"
                    : "bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {d.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isUpload && (
        <div className="flex items-start gap-2 bg-[#fe9a00]/5 border border-[#fe9a00]/20 rounded-lg px-4 py-3 mb-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="6" stroke="#fe9a00" strokeWidth="1.2" />
            <path d="M8 5.5v3" stroke="#fe9a00" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="#fe9a00" />
          </svg>
          <p className="text-[#fe9a00] text-xs leading-relaxed">
            For file uploads, you&apos;ll need to come back and upload the updated file each time.
            We&apos;ll send a reminder when a refresh is due.
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 8: Review ────────────────────────────────────────────────────────

function StepReview({
  integration,
  aliasName,
  selectedCategories,
  fileDataType,
  selectedSource,
  mappings,
  frequency,
  day,
  skippedMapping,
  onComplete,
}: {
  integration: CatalogIntegration;
  aliasName: string;
  selectedCategories: Set<DataCategory>;
  fileDataType: FileDataType | null;
  selectedSource: string;
  mappings: ColumnMapping[];
  frequency: RefreshFrequency;
  day: RefreshDay;
  skippedMapping: boolean;
  onComplete: () => void;
}) {
  const includedMappings = mappings.filter((m) => m.included && m.targetKey);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review &amp; Complete</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Review your configuration before connecting.</p>

      <div className="flex flex-col gap-4 mb-8">
        {/* Integration */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Integration</span>
          <div className="flex items-center gap-3">
            <IntegrationIcon integration={integration} />
            <div>
              <span className="text-[var(--text-primary)] text-sm font-medium block">{aliasName}</span>
              <span className="text-[var(--text-dim)] text-xs">via {integration.name}</span>
            </div>
          </div>
        </div>

        {/* Data Type */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Data Type</span>
          {fileDataType && FILE_DATA_TYPES[fileDataType] ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{
              backgroundColor: `${FILE_DATA_TYPES[fileDataType].color}15`,
              color: FILE_DATA_TYPES[fileDataType].color,
              border: `1px solid ${FILE_DATA_TYPES[fileDataType].color}30`,
            }}>
              {FILE_DATA_TYPES[fileDataType].label}
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedCategories).map((cat) => (
                <span key={cat} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{
                  backgroundColor: `${METRIC_CATEGORIES[cat].color}15`,
                  color: METRIC_CATEGORIES[cat].color,
                  border: `1px solid ${METRIC_CATEGORIES[cat].color}30`,
                }}>
                  {METRIC_CATEGORIES[cat].label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Source */}
        {selectedSource && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
            <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Source</span>
            <span className="text-[var(--text-primary)] text-sm font-medium">{selectedSource}</span>
          </div>
        )}

        {/* Column Mappings */}
        {!skippedMapping && includedMappings.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
            <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-3">
              Column Mappings ({includedMappings.length})
            </span>
            <div className="flex flex-col gap-2">
              {includedMappings.map((m) => (
                <div key={m.sourceColumn} className="flex items-center gap-3 text-sm">
                  <code className="text-[var(--text-muted)] bg-[var(--bg-card-inner)] px-1.5 py-0.5 rounded font-mono text-xs">{m.sourceColumn}</code>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="var(--text-dim)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {m.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
                      backgroundColor: `${METRIC_CATEGORIES[m.category].color}15`,
                      color: METRIC_CATEGORIES[m.category].color,
                      border: `1px solid ${METRIC_CATEGORIES[m.category].color}30`,
                    }}>{METRIC_CATEGORIES[m.category].label}</span>
                  )}
                  <span className="text-[var(--text-primary)] text-xs font-medium">{m.displayName || m.targetKey}</span>
                  {m.isNewKey && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#027b8e]/10 text-[#027b8e] font-medium">New</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {skippedMapping && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
            <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Column Mapping</span>
            <span className="text-[var(--text-muted)] text-sm">Skipped — map later from Metrics &amp; Dimensions</span>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Refresh Schedule</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">
            {frequency === "weekly" ? `Weekly on ${day.charAt(0).toUpperCase() + day.slice(1)}` : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
          </span>
        </div>
      </div>

      <button onClick={onComplete} className="w-full px-4 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors">
        Connect {aliasName}
      </button>
    </div>
  );
}

// ─── Main Wizard Component ─────────────────────────────────────────────────

export default function FileIntegrationWizard({
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
  onComplete: (name: string, mappings?: ColumnMapping[]) => void;
  initialAlias?: string;
  onInviteUser?: (name: string) => void;
}) {
  const skipSelectSource = SKIP_SELECT_SOURCE.has(integration.name);
  const skipConnect = false; // All sources need some form of connection/upload

  // Compute effective steps (remove steps that don't apply)
  const effectiveSteps = useMemo(() => {
    const steps = [...STEPS];
    if (skipSelectSource) {
      return steps.filter((s) => s !== "Select Source");
    }
    return steps;
  }, [skipSelectSource]);

  const [step, setStep] = useState(1);
  const [selectedFileDataType, setSelectedFileDataType] = useState<FileDataType | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<DataCategory>>(new Set());
  const [aliasName, setAliasName] = useState(initialAlias);
  const [selectedSource, setSelectedSource] = useState("");
  const [sampleMode, setSampleMode] = useState<SampleMode>("auto");
  const [skippedMapping, setSkippedMapping] = useState(false);
  const [mapperChoice, setMapperChoice] = useState<"smart" | "manual" | null>(null);
  const [frequency, setFrequency] = useState<RefreshFrequency>("weekly");
  const [day, setDay] = useState<RefreshDay>("monday");

  // Sample data — changes when file data type is selected
  const sampleData = useMemo(() => getMockSample(integration.name, selectedFileDataType), [integration.name, selectedFileDataType]);

  // Column mappings derived from sample data
  const [mappings, setMappings] = useState<ColumnMapping[]>(() => {
    const cols = sampleData.columns;
    return cols.map((col) => ({
      sourceColumn: col,
      included: true,
      category: "" as DataCategory | "",
      targetKey: "",
      displayName: "",
      isNewKey: false,
    }));
  });

  // Re-derive mappings when data type changes (new sample columns)
  useEffect(() => {
    setMappings(sampleData.columns.map((col) => ({
      sourceColumn: col,
      included: true,
      category: "" as DataCategory | "",
      targetKey: "",
      displayName: "",
      isNewKey: false,
    })));
    setMapperChoice(null);
  }, [sampleData]);

  const defaultCategory: DataCategory | "" = selectedCategories.size === 1 ? Array.from(selectedCategories)[0] : "";

  // Pre-fill categories only for metric-like columns (not dimensions like date, channel)
  useEffect(() => {
    if (defaultCategory) {
      setMappings((prev) =>
        prev.map((m) => {
          if (m.category !== "") return m;
          const role = classifyColumn(m.sourceColumn);
          return role === "metric" ? { ...m, category: defaultCategory } : m;
        })
      );
    }
  }, [defaultCategory]);

  // When Smart Mapper is selected, auto-fill mappings using classifyColumn + platform detection
  const handleSmartMapperApply = () => {
    setMapperChoice("smart");
    setMappings((prev) =>
      prev.map((m) => {
        const role = classifyColumn(m.sourceColumn);
        const suggestedCat: DataCategory | "" = role === "metric" ? (defaultCategory || "paid_marketing") : "";
        const suggestedKey = m.sourceColumn.toLowerCase().replace(/\s+/g, "_");
        const suggestedDisplay = m.sourceColumn.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        // Auto-detect platform from column name for paid_marketing columns
        const detectedPlatform = (suggestedCat === "paid_marketing" || m.category === "paid_marketing")
          ? detectPlatform(m.sourceColumn)
          : "";
        return {
          ...m,
          included: true,
          category: m.category || suggestedCat,
          targetKey: m.targetKey || suggestedKey,
          displayName: m.displayName || suggestedDisplay,
          isNewKey: !m.targetKey,
          platform: m.platform || detectedPlatform,
        };
      })
    );
  };

  const handleSelectFileDataType = (dt: FileDataType) => {
    setSelectedFileDataType(dt);
    // Map file data type to a default metric category for column pre-fill
    const catMap: Record<FileDataType, DataCategory> = {
      mmm: "paid_marketing",
      experiments: "kpi",
      custom_costs: "paid_marketing",
      cogs: "kpi",
      custom: "contextual",
    };
    setSelectedCategories(new Set([catMap[dt]]));
  };

  const handleToggleCategory = (cat: DataCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleToggleInclude = (index: number) => {
    setMappings((prev) => prev.map((m, i) => i === index ? { ...m, included: !m.included } : m));
  };

  const handleUpdateMapping = (index: number, update: Partial<ColumnMapping>) => {
    setMappings((prev) => prev.map((m, i) => i === index ? { ...m, ...update } : m));
  };

  const handleSkipMapping = () => {
    setSkippedMapping(true);
    // Jump to schedule step
    const scheduleStepIndex = effectiveSteps.indexOf("Schedule") + 1;
    setStep(scheduleStepIndex);
  };

  // Map step number to step name
  const currentStepName = effectiveSteps[step - 1];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Top Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border-primary)] pb-0 -mx-4 px-4 mb-0">
        {/* Left: Back */}
        <div className="flex items-center gap-1.5 text-sm min-w-0 shrink-0">
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#027b8e] transition-colors">
            Add Integration
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[var(--text-primary)] font-medium truncate">{aliasName || integration.name}</span>
        </div>

        {/* Center: Step tabs */}
        <div className="flex-1 flex items-center justify-center gap-0.5">
          {effectiveSteps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            return (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${
                  isActive ? "text-[#027b8e]" : isComplete ? "text-[var(--text-muted)]" : "text-[var(--text-dim)]"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? "bg-[#027b8e] text-white" : isComplete ? "bg-[#00bc7d] text-white" : "bg-[var(--bg-badge)] text-[var(--text-dim)]"
                }`}>
                  {isComplete ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : stepNum}
                </span>
                <span className="hidden lg:inline">{label}</span>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#027b8e] rounded-full" />}
              </div>
            );
          })}
        </div>

        {/* Right: step counter */}
        <div className="min-w-0 shrink-0 w-[100px] text-right">
          <span className="text-[var(--text-dim)] text-xs">Step {step} of {effectiveSteps.length}</span>
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────── */}
      <div className="flex-1 py-8 px-4">
        {currentStepName === "Data Type & Name" && (
          <StepDataTypeAlias
            integration={integration}
            selectedFileDataType={selectedFileDataType}
            aliasName={aliasName}
            selectedCategories={selectedCategories}
            onSelectFileDataType={handleSelectFileDataType}
            onChangeAlias={setAliasName}
            onToggleCategory={(cat) => setSelectedCategories((prev) => {
              const next = new Set(prev);
              if (next.has(cat)) next.delete(cat); else next.add(cat);
              return next;
            })}
            onNext={() => setStep(step + 1)}
            isJspPreFilled={!!initialAlias}
          />
        )}
        {currentStepName === "Connect" && (
          <StepConnect integration={integration} onNext={() => setStep(step + 1)} onInviteUser={onInviteUser} />
        )}
        {currentStepName === "Select Source" && (
          <StepSelectSource
            integration={integration}
            selectedSource={selectedSource}
            onSelect={setSelectedSource}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Sample Data" && (
          <StepSampleData
            integration={integration}
            sampleMode={sampleMode}
            onChangeSampleMode={setSampleMode}
            sampleData={sampleData}
            onSkip={handleSkipMapping}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Map Columns" && !mapperChoice && (
          <StepMapperChoice
            onSelectSmart={handleSmartMapperApply}
            onSelectManual={() => setMapperChoice("manual")}
          />
        )}
        {currentStepName === "Map Columns" && mapperChoice && (
          <StepColumnMapping
            mappings={mappings}
            defaultCategory={defaultCategory}
            onToggleInclude={handleToggleInclude}
            onUpdateMapping={handleUpdateMapping}
            onNext={() => setStep(step + 1)}
            mapperChoice={mapperChoice}
            onChangeChoice={() => setMapperChoice(null)}
          />
        )}
        {currentStepName === "Schedule" && (
          <StepRefreshSchedule
            integration={integration}
            frequency={frequency}
            day={day}
            onChangeFrequency={setFrequency}
            onChangeDay={setDay}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Review" && (
          <StepReview
            integration={integration}
            aliasName={aliasName}
            selectedCategories={selectedCategories}
            fileDataType={selectedFileDataType}
            selectedSource={selectedSource}
            mappings={mappings}
            frequency={frequency}
            day={day}
            skippedMapping={skippedMapping}
            onComplete={() => onComplete(aliasName, mappings)}
          />
        )}
      </div>
    </div>
  );
}
