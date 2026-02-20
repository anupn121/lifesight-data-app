// Monitoring data and types
// Used by MonitoringTab.tsx

export type IntegrationStatus = "Active" | "Warning" | "Reconnect" | "Failed";
export type ConnectionType = "Source" | "Destination";
export type IntegrationCategory =
  | "Advertising"
  | "Analytics"
  | "CRM"
  | "E-commerce"
  | "Affiliate & Partnerships"
  | "MMP"
  | "CTV & OTT"
  | "Reviews"
  | "Payments"
  | "Data Warehouse"
  | "Custom";
export type AccountStatus = "Active" | "Stale" | "Error" | "Inactive";
export type SyncHealthStatus = "healthy" | "warning" | "failed";

export interface OverviewMetric {
  label: string;
  value: string;
  icon?: string;
}

export interface Account {
  name: string;
  status: AccountStatus;
  lastRefreshed: string;
  dataUntil: string;
  metrics: Record<string, string>;
}

export interface Integration {
  name: string;
  icon: string;
  color: string;
  connectionType: ConnectionType;
  category: IntegrationCategory;
  status: IntegrationStatus;
  subtitle: string;
  overviewMetrics: OverviewMetric[];
  earliestDate: string;
  latestDate: string;
  reliableThrough: string;
  alertMessage?: string;
  alertType?: "warning" | "error";
  accounts: Account[];
  accountColumns: string[];
  syncHealthDays: SyncHealthStatus[];
}

// ─── All Categories ─────────────────────────────────────────────────────────
export const ALL_CATEGORIES: IntegrationCategory[] = [
  "Advertising",
  "Analytics",
  "CRM",
  "E-commerce",
  "MMP",
  "CTV & OTT",
  "Affiliate & Partnerships",
  "Reviews",
  "Payments",
  "Data Warehouse",
  "Custom",
];

export const ALL_STATUSES: IntegrationStatus[] = [
  "Active",
  "Warning",
  "Reconnect",
  "Failed",
];

// ─── Sample Integrations ────────────────────────────────────────────────────
export const allIntegrations: Integration[] = [
  // 1. Meta Ads — Source, Advertising, Warning
  {
    name: "Meta Ads",
    icon: "f",
    color: "#1877F2",
    connectionType: "Source",
    category: "Advertising",
    status: "Warning",
    subtitle: "4 accounts \u00b7 Last sync 2 min ago",
    overviewMetrics: [
      { label: "Spend", value: "$124.5K" },
      { label: "Impressions", value: "8.2M" },
      { label: "Clicks", value: "342K" },
      { label: "Attrib. Rev", value: "$892K" },
    ],
    earliestDate: "Jan 1, 2023",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 26, 2025",
    alertMessage: "One account is stale and data is missing for 2 days.",
    alertType: "warning",
    accounts: [
      { name: "US Brand Awareness", status: "Active", lastRefreshed: "Jan 29, 2025, 08:32 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$45.2K", Impressions: "3.1M", Clicks: "128K", "Attrib. Rev": "$312K" } },
      { name: "Global Retargeting", status: "Stale", lastRefreshed: "Jan 27, 2025, 08:30 AM", dataUntil: "Jan 27, 2025", metrics: { Spend: "$32.1K", Impressions: "2.4M", Clicks: "95K", "Attrib. Rev": "$245K" } },
      { name: "EU Prospecting", status: "Active", lastRefreshed: "Jan 29, 2025, 08:28 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$28.8K", Impressions: "1.6M", Clicks: "72K", "Attrib. Rev": "$198K" } },
      { name: "APAC Campaigns", status: "Active", lastRefreshed: "Jan 29, 2025, 08:25 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$18.4K", Impressions: "1.1M", Clicks: "47K", "Attrib. Rev": "$137K" } },
    ],
    accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
    syncHealthDays: ["healthy", "healthy", "healthy", "warning", "warning", "healthy", "healthy"],
  },

  // 2. Google Ads — Source, Advertising, Active
  {
    name: "Google Ads",
    icon: "G",
    color: "#34A853",
    connectionType: "Source",
    category: "Advertising",
    status: "Active",
    subtitle: "7 accounts \u00b7 Last sync 5 min ago",
    overviewMetrics: [
      { label: "Spend", value: "$98.3K" },
      { label: "Impressions", value: "12.1M" },
      { label: "Clicks", value: "521K" },
      { label: "Attrib. Rev", value: "$1.2M" },
    ],
    earliestDate: "Feb 1, 2023",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 28, 2025",
    accounts: [
      { name: "Brand Search", status: "Active", lastRefreshed: "Jan 29, 2025, 07:55 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$22.1K", Impressions: "2.8M", Clicks: "142K", "Attrib. Rev": "$380K" } },
      { name: "Shopping Campaigns", status: "Active", lastRefreshed: "Jan 29, 2025, 07:50 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$18.5K", Impressions: "2.1M", Clicks: "98K", "Attrib. Rev": "$295K" } },
      { name: "Performance Max", status: "Active", lastRefreshed: "Jan 29, 2025, 07:48 AM", dataUntil: "Jan 29, 2025", metrics: { Spend: "$15.2K", Impressions: "1.9M", Clicks: "82K", "Attrib. Rev": "$210K" } },
      { name: "Display Network", status: "Active", lastRefreshed: "Jan 29, 2025, 07:45 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$14.8K", Impressions: "2.5M", Clicks: "75K", "Attrib. Rev": "$125K" } },
      { name: "YouTube Ads", status: "Active", lastRefreshed: "Jan 29, 2025, 07:42 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$12.3K", Impressions: "1.5M", Clicks: "58K", "Attrib. Rev": "$98K" } },
      { name: "Discovery Ads", status: "Active", lastRefreshed: "Jan 29, 2025, 07:40 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$8.7K", Impressions: "0.8M", Clicks: "38K", "Attrib. Rev": "$55K" } },
      { name: "Demand Gen", status: "Active", lastRefreshed: "Jan 29, 2025, 07:38 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$6.7K", Impressions: "0.5M", Clicks: "28K", "Attrib. Rev": "$42K" } },
    ],
    accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  },

  // 3. TikTok Ads — Source, Advertising, Reconnect
  {
    name: "TikTok Ads",
    icon: "T",
    color: "#EE1D52",
    connectionType: "Source",
    category: "Advertising",
    status: "Reconnect",
    subtitle: "2 accounts \u00b7 Last sync 1 day ago",
    overviewMetrics: [
      { label: "Spend", value: "$42.1K" },
      { label: "Impressions", value: "5.6M" },
      { label: "Clicks", value: "198K" },
      { label: "Attrib. Rev", value: "$310K" },
    ],
    earliestDate: "Mar 15, 2023",
    latestDate: "Jan 28, 2025",
    reliableThrough: "Jan 27, 2025",
    alertMessage: "Connection expired. Please re-authenticate your TikTok Ads account.",
    alertType: "error",
    accounts: [
      { name: "TikTok US Campaigns", status: "Inactive", lastRefreshed: "Jan 28, 2025, 10:15 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$28.5K", Impressions: "3.8M", Clicks: "132K", "Attrib. Rev": "$215K" } },
      { name: "TikTok EU Campaigns", status: "Inactive", lastRefreshed: "Jan 28, 2025, 10:10 AM", dataUntil: "Jan 28, 2025", metrics: { Spend: "$13.6K", Impressions: "1.8M", Clicks: "66K", "Attrib. Rev": "$95K" } },
    ],
    accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "warning", "failed"],
  },

  // 4. LinkedIn Ads — Source, Advertising, Failed
  {
    name: "LinkedIn Ads",
    icon: "in",
    color: "#0A66C2",
    connectionType: "Source",
    category: "Advertising",
    status: "Failed",
    subtitle: "1 account \u00b7 Last sync 5 days ago",
    overviewMetrics: [
      { label: "Spend", value: "$18.2K" },
      { label: "Impressions", value: "1.1M" },
      { label: "Clicks", value: "42K" },
      { label: "Attrib. Rev", value: "$85K" },
    ],
    earliestDate: "Aug 1, 2023",
    latestDate: "Jan 24, 2025",
    reliableThrough: "Jan 22, 2025",
    alertMessage: "API authentication failed. All syncs have been failing for 5 days.",
    alertType: "error",
    accounts: [
      { name: "LinkedIn B2B Campaigns", status: "Error", lastRefreshed: "Jan 24, 2025, 02:15 PM", dataUntil: "Jan 24, 2025", metrics: { Spend: "$18.2K", Impressions: "1.1M", Clicks: "42K", "Attrib. Rev": "$85K" } },
    ],
    accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
    syncHealthDays: ["failed", "failed", "failed", "failed", "failed", "failed", "failed"],
  },

  // 5. AppsFlyer — Source, MMP, Active
  {
    name: "AppsFlyer",
    icon: "A",
    color: "#4FD1C5",
    connectionType: "Source",
    category: "MMP",
    status: "Active",
    subtitle: "1 account \u00b7 Last sync 8 min ago",
    overviewMetrics: [
      { label: "Installs", value: "145K" },
      { label: "Sessions", value: "2.3M" },
      { label: "Events", value: "890K" },
      { label: "Revenue", value: "$520K" },
    ],
    earliestDate: "Jan 1, 2023",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 28, 2025",
    accounts: [
      { name: "AppsFlyer Production", status: "Active", lastRefreshed: "Jan 29, 2025, 08:50 AM", dataUntil: "Jan 29, 2025", metrics: { Installs: "145K", Sessions: "2.3M", Events: "890K", Revenue: "$520K" } },
    ],
    accountColumns: ["Installs", "Sessions", "Events", "Revenue"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  },

  // 6. HubSpot — Source, CRM, Active
  {
    name: "HubSpot",
    icon: "H",
    color: "#FF7A59",
    connectionType: "Source",
    category: "CRM",
    status: "Active",
    subtitle: "1 account \u00b7 Last sync 5 min ago",
    overviewMetrics: [
      { label: "Total Contacts", value: "52.3K" },
      { label: "New Leads", value: "1,847" },
      { label: "Deals Won", value: "234" },
      { label: "Activities", value: "12.5K" },
    ],
    earliestDate: "Mar 15, 2023",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 28, 2025",
    accounts: [
      { name: "HubSpot Main", status: "Active", lastRefreshed: "Jan 29, 2025, 09:00 AM", dataUntil: "Jan 29, 2025", metrics: { "Total Contacts": "52.3K", "New Leads": "1,847", "Deals Won": "234", Activities: "12.5K" } },
    ],
    accountColumns: ["Total Contacts", "New Leads", "Deals Won", "Activities"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  },

  // 7. Salesforce — Source, CRM, Failed
  {
    name: "Salesforce",
    icon: "S",
    color: "#00A1E0",
    connectionType: "Source",
    category: "CRM",
    status: "Failed",
    subtitle: "1 account \u00b7 Last sync 3 days ago",
    overviewMetrics: [
      { label: "Total Contacts", value: "78.1K" },
      { label: "New Leads", value: "2,341" },
      { label: "Deals Won", value: "189" },
      { label: "Activities", value: "8.9K" },
    ],
    earliestDate: "Jun 1, 2023",
    latestDate: "Jan 26, 2025",
    reliableThrough: "Jan 24, 2025",
    alertMessage: "API rate limit exceeded. Data has been frozen since Jan 26, 2025.",
    alertType: "error",
    accounts: [
      { name: "Salesforce Production", status: "Error", lastRefreshed: "Jan 26, 2025, 11:30 AM", dataUntil: "Jan 26, 2025", metrics: { "Total Contacts": "78.1K", "New Leads": "2,341", "Deals Won": "189", Activities: "8.9K" } },
    ],
    accountColumns: ["Total Contacts", "New Leads", "Deals Won", "Activities"],
    syncHealthDays: ["healthy", "healthy", "healthy", "failed", "failed", "failed", "failed"],
  },

  // 8. BigQuery — Destination, Data Warehouse, Active
  {
    name: "BigQuery",
    icon: "B",
    color: "#4285F4",
    connectionType: "Destination",
    category: "Data Warehouse",
    status: "Active",
    subtitle: "1 account \u00b7 Last sync 1 min ago",
    overviewMetrics: [
      { label: "Tables Synced", value: "24" },
      { label: "Total Rows", value: "148M" },
      { label: "Daily Volume", value: "2.3M" },
      { label: "Avg Latency", value: "1.2s" },
    ],
    earliestDate: "Jan 1, 2023",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 29, 2025",
    accounts: [
      { name: "BigQuery Production", status: "Active", lastRefreshed: "Jan 29, 2025, 09:10 AM", dataUntil: "Jan 29, 2025", metrics: { "Tables Synced": "24", "Total Rows": "148M", "Daily Volume": "2.3M", "Avg Latency": "1.2s" } },
    ],
    accountColumns: ["Tables Synced", "Total Rows", "Daily Volume", "Avg Latency"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  },

  // 9. Google Sheets — Source, Data Warehouse, Active
  {
    name: "Google Sheets",
    icon: "G",
    color: "#0F9D58",
    connectionType: "Source",
    category: "Data Warehouse",
    status: "Active",
    subtitle: "3 sheets \u00b7 Last sync 15 min ago",
    overviewMetrics: [
      { label: "Sheets", value: "3" },
      { label: "Total Rows", value: "12.4K" },
      { label: "Frequency", value: "Hourly" },
      { label: "Last Update", value: "15m ago" },
    ],
    earliestDate: "Sep 1, 2024",
    latestDate: "Jan 29, 2025",
    reliableThrough: "Jan 29, 2025",
    accounts: [
      { name: "Marketing Budget Sheet", status: "Active", lastRefreshed: "Jan 29, 2025, 08:45 AM", dataUntil: "Jan 29, 2025", metrics: { Sheets: "1", "Total Rows": "5.2K", Frequency: "Hourly", "Last Update": "15m ago" } },
      { name: "Offline Revenue Data", status: "Active", lastRefreshed: "Jan 29, 2025, 08:40 AM", dataUntil: "Jan 29, 2025", metrics: { Sheets: "1", "Total Rows": "4.8K", Frequency: "Hourly", "Last Update": "20m ago" } },
      { name: "Custom Targets", status: "Active", lastRefreshed: "Jan 29, 2025, 08:35 AM", dataUntil: "Jan 29, 2025", metrics: { Sheets: "1", "Total Rows": "2.4K", Frequency: "Daily", "Last Update": "1h ago" } },
    ],
    accountColumns: ["Sheets", "Total Rows", "Frequency", "Last Update"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  },
];

// ─── Heatmap date labels ────────────────────────────────────────────────────
export const heatmapDates = ["Jan 23", "Jan 24", "Jan 25", "Jan 26", "Jan 27", "Jan 28", "Jan 29"];
