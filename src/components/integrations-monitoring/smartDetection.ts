// ═══════════════════════════════════════════════════════════════════════════
//  SMART DETECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
//  Mock detection for the Smart Import Wizard. In production this would be
//  replaced by real queries against Sheets API / BigQuery INFORMATION_SCHEMA
//  / INFORMATION_SCHEMA.COLUMNS + aggregation queries. For now it returns
//  hardcoded scenarios so the UI can be built and demoed against all 12
//  format cases across the 4 data categories.
//
//  See smart_source_detection_algorithm.md for the full design.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────

export type DataCategory = "paid_marketing" | "kpi" | "organic" | "contextual";
export type ColumnRole =
  | "date"
  | "dimension"
  | "source"
  | "campaign"
  | "ad_group"
  | "ad"
  | "account"
  | "event_name"
  | "paid_metric"
  | "kpi_metric"
  | "organic_metric"
  | "contextual_continuous"
  | "contextual_binary"
  | "ignored";

export type Granularity =
  | "ad"
  | "creative"
  | "ad_group"
  | "campaign"
  | "account"
  | "channel"
  | "daily"
  | "event"
  | "transaction";

export type FormatShape = "long" | "wide" | "single_source" | "event";

export interface DetectedColumn {
  name: string;
  role: ColumnRole;
  category?: DataCategory;
  displayName: string;
  /** For wide format, the channel prefix this column belongs to */
  channelPrefix?: string;
  /** For binary columns, the two distinct values observed */
  binaryValues?: [number, number];
  /** Min/max for continuous variables */
  valueRange?: [number, number];
  /** Sample values for preview */
  sampleValues: (string | number)[];
}

export interface DetectedSource {
  rawValue: string;       // the value in the data (e.g., "FB")
  matchedName: string;    // resolved platform name (e.g., "Facebook Ads")
  iconLetter: string;     // short letter for the icon circle
  iconColor: string;      // brand color
  rowCount: number;       // rows in this source (from GROUP BY)
  percentage: number;     // % of total rows
}

export interface DetectionResult {
  /** One-plain-sentence summary the user sees */
  summary: string;
  /** Detected format shape */
  shape: FormatShape;
  /** Detected granularity */
  granularity: Granularity;
  /** Primary category (mixed shows all) */
  primaryCategory: DataCategory;
  /** All categories present (for mixed data) */
  categories: DataCategory[];
  /** Columns with their detected roles */
  columns: DetectedColumn[];
  /** Sources found (empty if single source / no source column) */
  sources: DetectedSource[];
  /** True if data has no source column and user must pick a channel */
  requiresSourcePick: boolean;
  /** Suggested channel if single-source was detected from filename */
  suggestedChannel?: string;
  /** Total row count */
  totalRows: number;
  /** Date range */
  dateRange: { earliest: string; latest: string; days: number };
  /** Stratified preview: rows the user sees */
  previewRows: Record<string, string | number>[];
  /** Routing: where data goes */
  routing: Array<{
    category: DataCategory;
    label: string;
    destination: string;
  }>;
  /** Sparse metric warnings (source → missing metrics) */
  sparseMetrics?: Array<{ source: string; missing: string[] }>;
  /** Scenario ID (for debugging/demos) */
  scenarioId: string;
}

// ─── Source Colors & Icons ─────────────────────────────────────────────────

const SOURCE_META: Record<string, { color: string; letter: string }> = {
  "Facebook Ads": { color: "#1877F2", letter: "f" },
  "Google Ads": { color: "#34A853", letter: "G" },
  "TikTok Ads": { color: "#EE1D52", letter: "T" },
  "LinkedIn Ads": { color: "#0077B5", letter: "in" },
  "Snapchat Ads": { color: "#FFFC00", letter: "S" },
  "Pinterest Ads": { color: "#E60023", letter: "P" },
  "Amazon Ads": { color: "#FF9900", letter: "a" },
  "Microsoft Ads": { color: "#00A4EF", letter: "M" },
  "TV": { color: "#6B7280", letter: "TV" },
  "Radio": { color: "#8B5CF6", letter: "R" },
  "Print": { color: "#64748B", letter: "P" },
  "OOH": { color: "#0EA5E9", letter: "O" },
};

export function getSourceMeta(name: string): { color: string; letter: string } {
  return SOURCE_META[name] || { color: "#6B7280", letter: name.charAt(0).toUpperCase() };
}

// Known platforms for the single-source picker
export const KNOWN_PLATFORMS = [
  "Facebook Ads",
  "Google Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Snapchat Ads",
  "Pinterest Ads",
  "Amazon Ads",
  "Microsoft Ads",
  "TV",
  "Radio",
  "Print",
  "OOH",
];

// ─── 12 Mock Scenarios ─────────────────────────────────────────────────────

// Helper to pick a source based on key hints
function makeSource(name: string, rowCount: number, total: number): DetectedSource {
  const meta = getSourceMeta(name);
  return {
    rawValue: name,
    matchedName: name,
    iconLetter: meta.letter,
    iconColor: meta.color,
    rowCount,
    percentage: Math.round((rowCount / total) * 100),
  };
}

// ─── Scenario PM1: Long format, multi-source, campaign-level ──────────────
const SCENARIO_PM1: DetectionResult = {
  scenarioId: "PM1",
  summary: "Ad spend data from Facebook, Google, and TikTok",
  shape: "long",
  granularity: "campaign",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing"],
  totalRows: 2847,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01", "2024-01-01", "2024-01-02"] },
    { name: "source", role: "source", displayName: "Source", sampleValues: ["Facebook", "Google", "TikTok"] },
    { name: "campaign_name", role: "campaign", displayName: "Campaign", sampleValues: ["Brand Q1", "Search Q1", "Video Awareness"] },
    { name: "spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", sampleValues: [5240, 3120, 2180], valueRange: [100, 8500] },
    { name: "impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", sampleValues: [248300, 145200, 98400] },
    { name: "clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", sampleValues: [3120, 2450, 1820] },
  ],
  sources: [
    makeSource("Facebook Ads", 1200, 2847),
    makeSource("Google Ads", 890, 2847),
    makeSource("TikTok Ads", 520, 2847),
  ],
  previewRows: [
    { date: "2024-01-01", source: "Facebook", campaign_name: "Brand Q1", spend: 5240, impressions: 248300, clicks: 3120 },
    { date: "2024-01-01", source: "Google", campaign_name: "Search Q1", spend: 3120, impressions: 145200, clicks: 2450 },
    { date: "2024-01-01", source: "TikTok", campaign_name: "Video Awareness", spend: 2180, impressions: 98400, clicks: 1820 },
    { date: "2024-01-02", source: "Facebook", campaign_name: "Brand Q1", spend: 4980, impressions: 239100, clicks: 2980 },
    { date: "2024-01-02", source: "Google", campaign_name: "Search Q1", spend: 3080, impressions: 142100, clicks: 2410 },
    { date: "2024-01-02", source: "TikTok", campaign_name: "Video Awareness", spend: 2250, impressions: 101200, clicks: 1890 },
  ],
  routing: [
    { category: "paid_marketing", label: "Campaign-level spend from 3 channels", destination: "ad_insights" },
  ],
};

// ─── Scenario PM2: Wide format (channel-prefixed) ──────────────────────────
const SCENARIO_PM2: DetectionResult = {
  scenarioId: "PM2",
  summary: "Channel-level spend data for Facebook, Google, and TikTok (wide format)",
  shape: "wide",
  granularity: "channel",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing"],
  totalRows: 730,
  dateRange: { earliest: "2023-01-01", latest: "2024-12-31", days: 730 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01", "2024-01-02"] },
    { name: "fb_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "fb_", sampleValues: [5000, 4800] },
    { name: "fb_impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", channelPrefix: "fb_", sampleValues: [250000, 240000] },
    { name: "fb_clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", channelPrefix: "fb_", sampleValues: [3200, 3100] },
    { name: "fb_cpc", role: "paid_metric", category: "paid_marketing", displayName: "CPC", channelPrefix: "fb_", sampleValues: [1.56, 1.55] },
    { name: "google_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "google_", sampleValues: [3000, 2900] },
    { name: "google_impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", channelPrefix: "google_", sampleValues: [120000, 115000] },
    { name: "tt_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "tt_", sampleValues: [2000, 1950] },
    { name: "tt_impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", channelPrefix: "tt_", sampleValues: [80000, 78000] },
    { name: "tt_clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", channelPrefix: "tt_", sampleValues: [1600, 1570] },
  ],
  sources: [
    makeSource("Facebook Ads", 730, 2190),
    makeSource("Google Ads", 730, 2190),
    makeSource("TikTok Ads", 730, 2190),
  ],
  sparseMetrics: [
    { source: "Google Ads", missing: ["clicks", "cpc"] },
    { source: "TikTok Ads", missing: ["cpc"] },
  ],
  previewRows: [
    { date: "2024-01-01", fb_spend: 5000, fb_impressions: 250000, fb_clicks: 3200, fb_cpc: 1.56, google_spend: 3000, google_impressions: 120000, tt_spend: 2000, tt_impressions: 80000, tt_clicks: 1600 },
    { date: "2024-01-02", fb_spend: 4800, fb_impressions: 240000, fb_clicks: 3100, fb_cpc: 1.55, google_spend: 2900, google_impressions: 115000, tt_spend: 1950, tt_impressions: 78000, tt_clicks: 1570 },
  ],
  routing: [
    { category: "paid_marketing", label: "Unpivoted into channel-level spend for 3 channels", destination: "paid_agg_input" },
  ],
};

// ─── Scenario PM3: Mixed wide format (paid + KPI + organic + contextual) ───
const SCENARIO_PM3: DetectionResult = {
  scenarioId: "PM3",
  summary: "Complete MMM dataset with spend, revenue, organic, and contextual variables",
  shape: "wide",
  granularity: "daily",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing", "kpi", "organic", "contextual"],
  totalRows: 730,
  dateRange: { earliest: "2023-01-01", latest: "2024-12-31", days: 730 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01", "2024-01-02"] },
    { name: "fb_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "fb_", sampleValues: [5000, 4800] },
    { name: "fb_impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", channelPrefix: "fb_", sampleValues: [250000, 240000] },
    { name: "google_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "google_", sampleValues: [3000, 2900] },
    { name: "google_impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", channelPrefix: "google_", sampleValues: [120000, 115000] },
    { name: "tv_spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", channelPrefix: "tv_", sampleValues: [15000, 12000] },
    { name: "revenue", role: "kpi_metric", category: "kpi", displayName: "Revenue", sampleValues: [48200, 45100] },
    { name: "orders", role: "kpi_metric", category: "kpi", displayName: "Orders", sampleValues: [312, 289] },
    { name: "email_opens", role: "organic_metric", category: "organic", displayName: "Email Opens", sampleValues: [4500, 4320] },
    { name: "organic_imps", role: "organic_metric", category: "organic", displayName: "Organic Impressions", sampleValues: [125000, 118000] },
    { name: "temperature", role: "contextual_continuous", category: "contextual", displayName: "Temperature", valueRange: [32, 105], sampleValues: [72, 68] },
    { name: "product_launch", role: "contextual_binary", category: "contextual", displayName: "Product Launch", binaryValues: [0, 1], sampleValues: [0, 0] },
  ],
  sources: [
    makeSource("Facebook Ads", 730, 2190),
    makeSource("Google Ads", 730, 2190),
    makeSource("TV", 730, 2190),
  ],
  previewRows: [
    { date: "2024-01-01", fb_spend: 5000, fb_impressions: 250000, google_spend: 3000, google_impressions: 120000, tv_spend: 15000, revenue: 48200, orders: 312, email_opens: 4500, organic_imps: 125000, temperature: 72, product_launch: 0 },
    { date: "2024-01-02", fb_spend: 4800, fb_impressions: 240000, google_spend: 2900, google_impressions: 115000, tv_spend: 12000, revenue: 45100, orders: 289, email_opens: 4320, organic_imps: 118000, temperature: 68, product_launch: 0 },
    { date: "2024-01-15", fb_spend: 7200, fb_impressions: 310000, google_spend: 4100, google_impressions: 145000, tv_spend: 18000, revenue: 62100, orders: 428, email_opens: 5100, organic_imps: 142000, temperature: 70, product_launch: 1 },
  ],
  routing: [
    { category: "paid_marketing", label: "fb_, google_, tv_ unpivoted into channel spend", destination: "paid_agg_input" },
    { category: "kpi", label: "revenue, orders as outcome variables", destination: "kpi_data" },
    { category: "organic", label: "email_opens, organic_imps", destination: "organic_data" },
    { category: "contextual", label: "temperature (continuous), product_launch (binary)", destination: "contextual_data" },
  ],
};

// ─── Scenario PM4: Single source, no source column ─────────────────────────
const SCENARIO_PM4: DetectionResult = {
  scenarioId: "PM4",
  summary: "Facebook Ads campaign data with spend, impressions, and clicks",
  shape: "single_source",
  granularity: "campaign",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing"],
  totalRows: 1247,
  dateRange: { earliest: "2024-10-01", latest: "2024-12-31", days: 92 },
  requiresSourcePick: true,
  suggestedChannel: "Facebook Ads",
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-10-01", "2024-10-02"] },
    { name: "campaign", role: "campaign", displayName: "Campaign", sampleValues: ["Brand Awareness Q4", "Holiday Retargeting"] },
    { name: "spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", sampleValues: [5240, 2100] },
    { name: "impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", sampleValues: [248300, 89400] },
    { name: "clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", sampleValues: [3120, 1845] },
  ],
  sources: [],
  previewRows: [
    { date: "2024-10-01", campaign: "Brand Awareness Q4", spend: 5240, impressions: 248300, clicks: 3120 },
    { date: "2024-10-01", campaign: "Holiday Retargeting", spend: 2100, impressions: 89400, clicks: 1845 },
    { date: "2024-10-02", campaign: "Brand Awareness Q4", spend: 4980, impressions: 239100, clicks: 2980 },
    { date: "2024-10-02", campaign: "Holiday Retargeting", spend: 2050, impressions: 85200, clicks: 1720 },
  ],
  routing: [
    { category: "paid_marketing", label: "Campaign-level spend (source will be set during import)", destination: "ad_insights" },
  ],
};

// ─── Scenario PM5: Granular single source (account > campaign > ad_group > ad) ─
const SCENARIO_PM5: DetectionResult = {
  scenarioId: "PM5",
  summary: "Ad-level Google Ads data with account, campaign, ad group, and ad hierarchy",
  shape: "single_source",
  granularity: "ad",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing"],
  totalRows: 8420,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: true,
  suggestedChannel: "Google Ads",
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "account_id", role: "account", displayName: "Account", sampleValues: ["acc-001", "acc-002"] },
    { name: "campaign_id", role: "campaign", displayName: "Campaign", sampleValues: ["camp-1001", "camp-1002"] },
    { name: "ad_group_id", role: "ad_group", displayName: "Ad Group", sampleValues: ["ag-5001", "ag-5002"] },
    { name: "ad_id", role: "ad", displayName: "Ad", sampleValues: ["ad-9001", "ad-9002"] },
    { name: "spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", sampleValues: [125.5, 98.2] },
    { name: "impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", sampleValues: [8400, 6200] },
    { name: "clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", sampleValues: [145, 98] },
  ],
  sources: [],
  previewRows: [
    { date: "2024-01-01", account_id: "acc-001", campaign_id: "camp-1001", ad_group_id: "ag-5001", ad_id: "ad-9001", spend: 125.5, impressions: 8400, clicks: 145 },
    { date: "2024-01-01", account_id: "acc-001", campaign_id: "camp-1001", ad_group_id: "ag-5001", ad_id: "ad-9002", spend: 98.2, impressions: 6200, clicks: 98 },
    { date: "2024-01-01", account_id: "acc-001", campaign_id: "camp-1002", ad_group_id: "ag-5002", ad_id: "ad-9003", spend: 156.8, impressions: 9100, clicks: 172 },
  ],
  routing: [
    { category: "paid_marketing", label: "Ad-level spend with full hierarchy", destination: "ad_insights" },
  ],
};

// ─── Scenario PM6: Granular multi-source ───────────────────────────────────
const SCENARIO_PM6: DetectionResult = {
  scenarioId: "PM6",
  summary: "Ad-level data from Facebook and Google with account, campaign, and ad hierarchy",
  shape: "long",
  granularity: "ad",
  primaryCategory: "paid_marketing",
  categories: ["paid_marketing"],
  totalRows: 15200,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "source", role: "source", displayName: "Source", sampleValues: ["Facebook", "Google"] },
    { name: "account_id", role: "account", displayName: "Account", sampleValues: ["fb-1", "g-1"] },
    { name: "campaign_id", role: "campaign", displayName: "Campaign", sampleValues: ["camp-1001", "camp-2001"] },
    { name: "ad_group_id", role: "ad_group", displayName: "Ad Group", sampleValues: ["ag-5001"] },
    { name: "ad_id", role: "ad", displayName: "Ad", sampleValues: ["ad-9001"] },
    { name: "spend", role: "paid_metric", category: "paid_marketing", displayName: "Spend", sampleValues: [125.5, 98.2] },
    { name: "impressions", role: "paid_metric", category: "paid_marketing", displayName: "Impressions", sampleValues: [8400, 6200] },
    { name: "clicks", role: "paid_metric", category: "paid_marketing", displayName: "Clicks", sampleValues: [145, 98] },
  ],
  sources: [
    makeSource("Facebook Ads", 9200, 15200),
    makeSource("Google Ads", 6000, 15200),
  ],
  previewRows: [
    { date: "2024-01-01", source: "Facebook", account_id: "fb-1", campaign_id: "camp-1001", ad_group_id: "ag-5001", ad_id: "ad-9001", spend: 125.5, impressions: 8400, clicks: 145 },
    { date: "2024-01-01", source: "Google", account_id: "g-1", campaign_id: "camp-2001", ad_group_id: "ag-6001", ad_id: "ad-8001", spend: 98.2, impressions: 6200, clicks: 98 },
    { date: "2024-01-01", source: "Facebook", account_id: "fb-1", campaign_id: "camp-1002", ad_group_id: "ag-5002", ad_id: "ad-9002", spend: 156.8, impressions: 9100, clicks: 172 },
  ],
  routing: [
    { category: "paid_marketing", label: "Ad-level multi-source spend with hierarchy", destination: "ad_insights" },
  ],
};

// ─── Scenario K1: Event format KPI ─────────────────────────────────────────
const SCENARIO_K1: DetectionResult = {
  scenarioId: "K1",
  summary: "KPI data: 3 events detected (purchase, add_to_cart, signup)",
  shape: "event",
  granularity: "event",
  primaryCategory: "kpi",
  categories: ["kpi"],
  totalRows: 2190,
  dateRange: { earliest: "2023-01-01", latest: "2024-12-31", days: 730 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "event_name", role: "event_name", displayName: "Event", sampleValues: ["purchase", "add_to_cart", "signup"] },
    { name: "value", role: "kpi_metric", category: "kpi", displayName: "Value", sampleValues: [48200, 312, 87] },
  ],
  sources: [],
  previewRows: [
    { date: "2024-01-01", event_name: "purchase", value: 48200 },
    { date: "2024-01-01", event_name: "add_to_cart", value: 312 },
    { date: "2024-01-01", event_name: "signup", value: 87 },
    { date: "2024-01-02", event_name: "purchase", value: 52100 },
    { date: "2024-01-02", event_name: "add_to_cart", value: 289 },
    { date: "2024-01-02", event_name: "signup", value: 94 },
  ],
  routing: [
    { category: "kpi", label: "purchase (Revenue), add_to_cart (Conversions), signup (Registrations)", destination: "kpi_data" },
  ],
};

// ─── Scenario K2: Event format with multi-source values ────────────────────
const SCENARIO_K2: DetectionResult = {
  scenarioId: "K2",
  summary: "KPI events from Amazon and DTC store (purchase, signup)",
  shape: "event",
  granularity: "event",
  primaryCategory: "kpi",
  categories: ["kpi"],
  totalRows: 1460,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "source", role: "source", displayName: "Source", sampleValues: ["Amazon", "DTC"] },
    { name: "event_name", role: "event_name", displayName: "Event", sampleValues: ["purchase", "signup"] },
    { name: "value_amazon", role: "kpi_metric", category: "kpi", displayName: "Value (Amazon)", sampleValues: [12400, 48] },
    { name: "value_dtc", role: "kpi_metric", category: "kpi", displayName: "Value (DTC)", sampleValues: [35800, 128] },
  ],
  sources: [
    { rawValue: "Amazon", matchedName: "Amazon", iconLetter: "a", iconColor: "#FF9900", rowCount: 730, percentage: 50 },
    { rawValue: "DTC", matchedName: "DTC Store", iconLetter: "D", iconColor: "#027b8e", rowCount: 730, percentage: 50 },
  ],
  previewRows: [
    { date: "2024-01-01", source: "Amazon", event_name: "purchase", value_amazon: 12400, value_dtc: 0 },
    { date: "2024-01-01", source: "DTC", event_name: "purchase", value_amazon: 0, value_dtc: 35800 },
    { date: "2024-01-01", source: "Amazon", event_name: "signup", value_amazon: 48, value_dtc: 0 },
    { date: "2024-01-01", source: "DTC", event_name: "signup", value_amazon: 0, value_dtc: 128 },
  ],
  routing: [
    { category: "kpi", label: "Per-source KPI values (Amazon vs DTC)", destination: "kpi_data" },
  ],
};

// ─── Scenario K3: Wide aggregated KPI ──────────────────────────────────────
const SCENARIO_K3: DetectionResult = {
  scenarioId: "K3",
  summary: "Daily aggregated KPI data: revenue and orders",
  shape: "wide",
  granularity: "daily",
  primaryCategory: "kpi",
  categories: ["kpi"],
  totalRows: 365,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "revenue", role: "kpi_metric", category: "kpi", displayName: "Revenue", sampleValues: [48200, 45100] },
    { name: "orders", role: "kpi_metric", category: "kpi", displayName: "Orders", sampleValues: [312, 289] },
  ],
  sources: [],
  previewRows: [
    { date: "2024-01-01", revenue: 48200, orders: 312 },
    { date: "2024-01-02", revenue: 45100, orders: 289 },
    { date: "2024-01-03", revenue: 52300, orders: 342 },
  ],
  routing: [
    { category: "kpi", label: "Daily revenue and orders", destination: "kpi_data" },
  ],
};

// ─── Scenario K4: Wide aggregated KPI with source ─────────────────────────
const SCENARIO_K4: DetectionResult = {
  scenarioId: "K4",
  summary: "Daily KPI data per source (revenue and orders from Amazon and DTC)",
  shape: "long",
  granularity: "daily",
  primaryCategory: "kpi",
  categories: ["kpi"],
  totalRows: 730,
  dateRange: { earliest: "2024-01-01", latest: "2024-12-31", days: 365 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "source", role: "source", displayName: "Source", sampleValues: ["Amazon", "DTC"] },
    { name: "revenue", role: "kpi_metric", category: "kpi", displayName: "Revenue", sampleValues: [12400, 35800] },
    { name: "orders", role: "kpi_metric", category: "kpi", displayName: "Orders", sampleValues: [48, 264] },
  ],
  sources: [
    { rawValue: "Amazon", matchedName: "Amazon", iconLetter: "a", iconColor: "#FF9900", rowCount: 365, percentage: 50 },
    { rawValue: "DTC", matchedName: "DTC Store", iconLetter: "D", iconColor: "#027b8e", rowCount: 365, percentage: 50 },
  ],
  previewRows: [
    { date: "2024-01-01", source: "Amazon", revenue: 12400, orders: 48 },
    { date: "2024-01-01", source: "DTC", revenue: 35800, orders: 264 },
    { date: "2024-01-02", source: "Amazon", revenue: 11800, orders: 45 },
    { date: "2024-01-02", source: "DTC", revenue: 33300, orders: 244 },
  ],
  routing: [
    { category: "kpi", label: "Daily KPI values split by source", destination: "kpi_data" },
  ],
};

// ─── Scenario OC1: Mixed organic + contextual with multi-source ────────────
const SCENARIO_OC1: DetectionResult = {
  scenarioId: "OC1",
  summary: "Organic and contextual data with holidays, weather, and social impressions",
  shape: "long",
  granularity: "daily",
  primaryCategory: "organic",
  categories: ["organic", "contextual"],
  totalRows: 1095,
  dateRange: { earliest: "2023-01-01", latest: "2024-12-31", days: 730 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "source", role: "source", displayName: "Source", sampleValues: ["Instagram", "TikTok", "YouTube"] },
    { name: "impressions", role: "organic_metric", category: "organic", displayName: "Organic Impressions", sampleValues: [125000, 89000, 62000] },
    { name: "is_holiday", role: "contextual_binary", category: "contextual", displayName: "Holiday", binaryValues: [0, 1], sampleValues: [0, 1] },
    { name: "temperature", role: "contextual_continuous", category: "contextual", displayName: "Temperature", valueRange: [32, 105], sampleValues: [72, 68] },
  ],
  sources: [
    { rawValue: "Instagram", matchedName: "Instagram", iconLetter: "i", iconColor: "#E4405F", rowCount: 365, percentage: 33 },
    { rawValue: "TikTok", matchedName: "TikTok", iconLetter: "T", iconColor: "#EE1D52", rowCount: 365, percentage: 33 },
    { rawValue: "YouTube", matchedName: "YouTube", iconLetter: "Y", iconColor: "#FF0000", rowCount: 365, percentage: 34 },
  ],
  previewRows: [
    { date: "2024-01-01", source: "Instagram", impressions: 125000, is_holiday: 1, temperature: 72 },
    { date: "2024-01-01", source: "TikTok", impressions: 89000, is_holiday: 1, temperature: 72 },
    { date: "2024-01-01", source: "YouTube", impressions: 62000, is_holiday: 1, temperature: 72 },
    { date: "2024-01-02", source: "Instagram", impressions: 118000, is_holiday: 0, temperature: 68 },
  ],
  routing: [
    { category: "organic", label: "Organic impressions by channel", destination: "organic_data" },
    { category: "contextual", label: "is_holiday (binary), temperature (continuous)", destination: "contextual_data" },
  ],
};

// ─── Scenario OC2: Single contextual variable (date, value) ───────────────
const SCENARIO_OC2: DetectionResult = {
  scenarioId: "OC2",
  summary: "Daily fuel price data (single contextual variable)",
  shape: "single_source",
  granularity: "daily",
  primaryCategory: "contextual",
  categories: ["contextual"],
  totalRows: 730,
  dateRange: { earliest: "2023-01-01", latest: "2024-12-31", days: 730 },
  requiresSourcePick: false,
  columns: [
    { name: "date", role: "date", displayName: "Date", sampleValues: ["2024-01-01"] },
    { name: "value", role: "contextual_continuous", category: "contextual", displayName: "Fuel Price", valueRange: [2.89, 4.52], sampleValues: [3.49, 3.52] },
  ],
  sources: [],
  previewRows: [
    { date: "2024-01-01", value: 3.49 },
    { date: "2024-01-02", value: 3.52 },
    { date: "2024-01-03", value: 3.48 },
  ],
  routing: [
    { category: "contextual", label: "Daily fuel price (continuous)", destination: "contextual_data" },
  ],
};

// ─── Scenario Catalog ──────────────────────────────────────────────────────

export const ALL_SCENARIOS: DetectionResult[] = [
  SCENARIO_PM1,
  SCENARIO_PM2,
  SCENARIO_PM3,
  SCENARIO_PM4,
  SCENARIO_PM5,
  SCENARIO_PM6,
  SCENARIO_K1,
  SCENARIO_K2,
  SCENARIO_K3,
  SCENARIO_K4,
  SCENARIO_OC1,
  SCENARIO_OC2,
];

// Scenario map for name-based deterministic lookup
const SCENARIO_BY_ID: Record<string, DetectionResult> = {
  PM1: SCENARIO_PM1,
  PM2: SCENARIO_PM2,
  PM3: SCENARIO_PM3,
  PM4: SCENARIO_PM4,
  PM5: SCENARIO_PM5,
  PM6: SCENARIO_PM6,
  K1: SCENARIO_K1,
  K2: SCENARIO_K2,
  K3: SCENARIO_K3,
  K4: SCENARIO_K4,
  OC1: SCENARIO_OC1,
  OC2: SCENARIO_OC2,
};

// ─── Name → Scenario Mapping ───────────────────────────────────────────────
// Deterministic lookup so users can demo specific scenarios by naming their
// file/sheet/table appropriately. Falls back to hash-based picker.

const NAME_HINTS: Array<{ pattern: RegExp; scenarioId: string }> = [
  // Explicit scenario markers
  { pattern: /pm1|long.*multi|multi.*source.*campaign/i, scenarioId: "PM1" },
  { pattern: /pm2|wide.*channel|channel.*wide/i, scenarioId: "PM2" },
  { pattern: /pm3|mmm|mixed|full.*dataset/i, scenarioId: "PM3" },
  { pattern: /pm4|single.*source|facebook.*q4|fb.*q4/i, scenarioId: "PM4" },
  { pattern: /pm5|ad.*level|granular.*single/i, scenarioId: "PM5" },
  { pattern: /pm6|granular.*multi/i, scenarioId: "PM6" },
  { pattern: /k1|event.*kpi|kpi.*event/i, scenarioId: "K1" },
  { pattern: /k2|amazon.*dtc|multi.*kpi/i, scenarioId: "K2" },
  { pattern: /k3|daily.*kpi|revenue.*orders/i, scenarioId: "K3" },
  { pattern: /k4|kpi.*source/i, scenarioId: "K4" },
  { pattern: /oc1|organic.*context|instagram|social.*organic/i, scenarioId: "OC1" },
  { pattern: /oc2|fuel|weather|single.*contextual/i, scenarioId: "OC2" },
  // Generic hints
  { pattern: /facebook|fb_/i, scenarioId: "PM4" },
  { pattern: /google|gads/i, scenarioId: "PM1" },
  { pattern: /campaign.*performance/i, scenarioId: "PM1" },
  { pattern: /revenue|sales/i, scenarioId: "K3" },
  { pattern: /holiday|weather/i, scenarioId: "OC1" },
];

/**
 * Pick a deterministic scenario from a file/sheet/table name.
 * If no match, hash the name to pick one consistently.
 */
export function detectScenarioFromName(name: string | undefined): DetectionResult {
  if (!name) return SCENARIO_PM1;

  const lower = name.toLowerCase();
  for (const hint of NAME_HINTS) {
    if (hint.pattern.test(lower)) {
      return SCENARIO_BY_ID[hint.scenarioId];
    }
  }

  // Hash fallback — deterministic across reloads
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % ALL_SCENARIOS.length;
  return ALL_SCENARIOS[idx];
}

// ─── Summary Metadata ─────────────────────────────────────────────────────

/**
 * Generate the small metadata line shown under the one-line summary.
 * e.g. "2,847 rows · Campaign level · Jan – Dec 2024"
 */
export function formatMetadataLine(result: DetectionResult): string {
  const granularityLabel: Record<Granularity, string> = {
    ad: "Ad level",
    creative: "Creative level",
    ad_group: "Ad group level",
    campaign: "Campaign level",
    account: "Account level",
    channel: "Channel level",
    daily: "Daily",
    event: "Event level",
    transaction: "Transaction level",
  };

  const rows = result.totalRows.toLocaleString();
  const gran = granularityLabel[result.granularity];
  const dateRange = formatDateRange(result.dateRange.earliest, result.dateRange.latest);

  return `${rows} rows · ${gran} · ${dateRange}`;
}

function formatDateRange(earliest: string, latest: string): string {
  const e = new Date(earliest);
  const l = new Date(latest);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearDiff = l.getFullYear() - e.getFullYear();
  if (yearDiff === 0) {
    return `${months[e.getMonth()]} – ${months[l.getMonth()]} ${e.getFullYear()}`;
  }
  return `${months[e.getMonth()]} ${e.getFullYear()} – ${months[l.getMonth()]} ${l.getFullYear()}`;
}

// ─── Category Metadata (for UI) ────────────────────────────────────────────

export const CATEGORY_META: Record<DataCategory, { label: string; color: string; icon: string }> = {
  paid_marketing: { label: "Paid Marketing", color: "#2b7fff", icon: "💰" },
  kpi: { label: "KPI", color: "#00bc7d", icon: "💵" },
  organic: { label: "Organic", color: "#fe9a00", icon: "🌱" },
  contextual: { label: "Contextual", color: "#a855f7", icon: "🌡" },
};
