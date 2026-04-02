import type { CatalogIntegration } from "../monitoringData";

export const catalogIntegrations: CatalogIntegration[] = [
  // Advertising → paid_marketing
  { name: "Facebook Ads", description: "Connect Facebook to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#1877F2", accounts: 21, icon: "fb", isRecommended: true, dataCategory: "paid_marketing" },
  { name: "Google Ads", description: "Connect Google to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#34A853", accounts: 4, icon: "gad", isRecommended: true, dataCategory: "paid_marketing" },
  { name: "Microsoft Ads", description: "Connect Microsoft to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#00A4EF", accounts: 0, icon: "ms", dataCategory: "paid_marketing" },
  { name: "TikTok Ads", description: "Get potential customers with TikTok leads", category: "Advertising", status: "CONNECTED", color: "#EE1D52", accounts: 2, icon: "tt", isRecommended: true, dataCategory: "paid_marketing" },
  { name: "Snapchat Ads", description: "Connect Snapchat to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#FFFC00", accounts: 2, icon: "sc", isRecommended: true, dataCategory: "paid_marketing" },
  { name: "Pinterest Ads", description: "Connect Pinterest to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#E60023", accounts: 3, icon: "pi", dataCategory: "paid_marketing" },
  { name: "LinkedIn Ads", description: "Connect LinkedIn to use this integration with Lifesight", category: "Advertising", status: "ACTION_REQUIRED", color: "#0A66C2", accounts: 1, icon: "in", dataCategory: "paid_marketing" },
  { name: "X Ads (Twitter)", description: "Connect X Ads to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#1DA1F2", accounts: 2, icon: "x", dataCategory: "paid_marketing" },
  { name: "Amazon Ads", description: "Connect Amazon to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#FF9900", accounts: 0, icon: "amz", dataCategory: "paid_marketing" },
  { name: "Criteo", description: "Connect Criteo and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#F48120", accounts: 0, icon: "cr", dataCategory: "paid_marketing", authType: "api_key" },
  { name: "Taboola", description: "Connect Taboola to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#243B86", accounts: 0, icon: "tb", dataCategory: "paid_marketing", authType: "api_key" },
  { name: "Outbrain", description: "Connect Outbrain and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#F47920", accounts: 0, icon: "ob", dataCategory: "paid_marketing", authType: "api_key" },
  { name: "Spotify Ads", description: "Connect Spotify Ads to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#1DB954", accounts: 0, icon: "sp", isRequested: true, requestedDate: "2025-12-15", dataCategory: "paid_marketing" },
  { name: "AdRoll", description: "Connect AdRoll to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#0DAEF0", accounts: 0, icon: "ar", dataCategory: "paid_marketing" },
  { name: "Walmart Connect Ads", description: "Connect Walmart Connect Ads and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#0071DC", accounts: 0, icon: "wm", isPartner: true, partnerBenefit: "Credit matching up to $500", dataCategory: "paid_marketing" },
  { name: "StackAdapt", description: "Connect StackAdapt to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#4A3AFF", accounts: 0, icon: "sa", dataCategory: "paid_marketing" },
  { name: "Moloco", description: "Connect Moloco and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#FF4B4B", accounts: 0, icon: "mo", dataCategory: "paid_marketing" },
  { name: "Vibe Ads", description: "Connect Vibe Ads to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#7C3AED", accounts: 0, icon: "vb", isPartner: true, partnerBenefit: "3 months free credits", dataCategory: "paid_marketing" },
  { name: "Facebook Lead Forms", description: "Connect Facebook Lead Forms and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#1877F2", accounts: 0, icon: "fl", dataCategory: "paid_marketing" },
  { name: "Ad.net", description: "Connect Ad.net to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#5C6BC0", accounts: 0, icon: "an", dataCategory: "paid_marketing" },
  { name: "AdJoe", description: "Connect AdJoe and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#26A69A", accounts: 0, icon: "aj", dataCategory: "paid_marketing" },
  { name: "Adform", description: "Connect Adform to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#00BCD4", accounts: 0, icon: "af", dataCategory: "paid_marketing" },
  { name: "Adikteev", description: "Connect Adikteev and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#7986CB", accounts: 0, icon: "ak", dataCategory: "paid_marketing" },
  { name: "Amazon DSP", description: "Connect Amazon DSP to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#FF9900", accounts: 0, icon: "dsp", dataCategory: "paid_marketing" },
  { name: "Appier", description: "Connect Appier and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#EF5350", accounts: 0, icon: "ap", dataCategory: "paid_marketing" },
  { name: "Apple Search Ads", description: "Connect Apple Search Ads and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#555555", accounts: 0, icon: "asa", isRequested: true, requestedDate: "2026-01-08", dataCategory: "paid_marketing" },
  // Affiliate & Partnerships → paid_marketing
  { name: "Tradedoubler", description: "Connect Tradedoubler and start with automation", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#00A3E0", accounts: 0, icon: "td", dataCategory: "paid_marketing" },
  { name: "Everflow", description: "Connect Everflow to use this integration with Lifesight", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#FF6B35", accounts: 0, icon: "ef", dataCategory: "paid_marketing" },
  { name: "CJ Affiliate", description: "Connect CJ Affiliate and start with automation", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#003366", accounts: 0, icon: "cj", dataCategory: "paid_marketing" },
  { name: "Impact", description: "Connect Impact to use this integration with your platform.", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#FF6D3A", accounts: 0, icon: "im", dataCategory: "paid_marketing" },
  // Analytics → contextual
  { name: "Google Analytics", description: "Connect Google Analytics to use this integration with your platform.", category: "Analytics", status: "CONNECTED", color: "#F9AB00", accounts: 1, icon: "ga", isRecommended: true, dataCategory: "contextual" },
  // CRM → organic
  { name: "HubSpot", description: "Connect HubSpot to use this integration with your platform.", category: "CRM", status: "CONNECTED", color: "#FF7A59", accounts: 1, icon: "hs", isRecommended: true, dataCategory: "organic" },
  { name: "Salesforce", description: "Connect Salesforce to use this integration with Lifesight", category: "CRM", status: "ACTION_REQUIRED", color: "#00A1E0", accounts: 1, icon: "sf", dataCategory: "organic" },
  // Custom — no default data category
  { name: "Custom JS", description: "Connect custom JavaScript to one website", category: "Custom", status: "CONNECTED", color: "#027b8e", accounts: 0, icon: "js", footerLabel: "1 Connected Website" },
  // Data — no default data category (generic containers)
  { name: "Google Sheets", description: "Sync data from Google Sheets into your platform.", category: "Data", status: "CONNECTED", color: "#0F9D58", accounts: 2, icon: "gs", footerLabel: "8 Connected Sheets" },
  { name: "Import CSV", description: "Import data through CSV files", category: "Data", status: "CONNECTED", color: "#71717a", accounts: 0, icon: "csv" },
  { name: "Snowflake", description: "Connect your Snowflake data warehouse to sync tables.", category: "Data", status: "NOT_CONNECTED", color: "#29B5E8", accounts: 0, icon: "sf❄", footerLabel: "0 Tables", authType: "api_key", authFields: [
    { key: "host", label: "Host", type: "text", placeholder: "account.snowflakecomputing.com" },
    { key: "account", label: "Account", type: "text", placeholder: "your_account_id" },
    { key: "warehouse", label: "Warehouse", type: "text", placeholder: "COMPUTE_WH" },
    { key: "database", label: "Database", type: "text", placeholder: "ANALYTICS_DB" },
    { key: "schema", label: "Schema", type: "text", placeholder: "PUBLIC" },
    { key: "username", label: "Username", type: "text", placeholder: "your_username" },
    { key: "password", label: "Password", type: "password", placeholder: "Enter password" },
  ] },
  { name: "BigQuery", description: "Connect your BigQuery data warehouse to sync tables.", category: "Data", status: "NOT_CONNECTED", color: "#4285F4", accounts: 0, icon: "bq", footerLabel: "0 Tables", authType: "api_key", authFields: [
    { key: "project_id", label: "Project ID", type: "text", placeholder: "my-gcp-project" },
    { key: "service_account_json", label: "Service Account JSON", type: "textarea", placeholder: "Paste your service account JSON key" },
  ] },
  { name: "Amazon Redshift", description: "Connect your Redshift data warehouse to sync tables and views.", category: "Data", status: "NOT_CONNECTED", color: "#8C4FFF", accounts: 0, icon: "rs", footerLabel: "0 Tables", authType: "api_key", authFields: [
    { key: "host", label: "Host", type: "text", placeholder: "cluster.region.redshift.amazonaws.com" },
    { key: "port", label: "Port", type: "text", placeholder: "5439" },
    { key: "database", label: "Database", type: "text", placeholder: "analytics" },
    { key: "username", label: "Username", type: "text", placeholder: "your_username" },
    { key: "password", label: "Password", type: "password", placeholder: "Enter password" },
  ] },
  { name: "Databricks", description: "Connect Databricks to sync data from your lakehouse.", category: "Data", status: "NOT_CONNECTED", color: "#FF3621", accounts: 0, icon: "db", footerLabel: "0 Tables", authType: "api_key", authFields: [
    { key: "host", label: "Workspace URL", type: "text", placeholder: "adb-xxxx.azuredatabricks.net" },
    { key: "http_path", label: "HTTP Path", type: "text", placeholder: "/sql/1.0/warehouses/xxxx" },
    { key: "access_token", label: "Access Token", type: "password", placeholder: "Enter your personal access token" },
  ] },
  { name: "Amazon S3", description: "Import data files from Amazon S3 buckets.", category: "Data", status: "NOT_CONNECTED", color: "#569A31", accounts: 0, icon: "s3" },
  { name: "Google Cloud Storage", description: "Import data files from Google Cloud Storage buckets.", category: "Data", status: "NOT_CONNECTED", color: "#4285F4", accounts: 0, icon: "gcs" },
  { name: "SFTP", description: "Connect to an SFTP server to import data files.", category: "Data", status: "NOT_CONNECTED", color: "#607D8B", accounts: 0, icon: "sftp" },
  { name: "Excel Upload", description: "Upload Excel (.xlsx) files to import data.", category: "Data", status: "NOT_CONNECTED", color: "#217346", accounts: 0, icon: "xl" },
  // E-Commerce → kpi
  { name: "Shopify", description: "Connect Shopify to use this integration with your platform.", category: "E-Commerce", status: "CONNECTED", color: "#95BF47", accounts: 3, icon: "sh", isRecommended: true, dataCategory: "kpi" },
  { name: "WooCommerce", description: "Connect WooCommerce and start with automation", category: "E-Commerce", status: "NOT_CONNECTED", color: "#96588A", accounts: 0, icon: "wc", dataCategory: "kpi" },
  { name: "Salesforce Commerce Cloud", description: "Connect Salesforce Commerce Cloud with Lifesight", category: "E-Commerce", status: "NOT_CONNECTED", color: "#00A1E0", accounts: 0, icon: "scc", dataCategory: "kpi" },
  // Marketing → organic
  { name: "Klaviyo", description: "Get your data synced from Klaviyo to Moda", category: "Marketing", status: "CONNECTED", color: "#2B2B2B", accounts: 0, icon: "kl", isRecommended: true, dataCategory: "organic" },
  { name: "Salesforce Marketing Cloud", description: "Connect Salesforce Marketing Cloud with your platform.", category: "Marketing", status: "NOT_CONNECTED", color: "#00A1E0", accounts: 0, icon: "smc", dataCategory: "organic" },
  { name: "ActiveCampaign", description: "Connect ActiveCampaign and start with automation", category: "Marketing", status: "NOT_CONNECTED", color: "#356AE6", accounts: 0, icon: "ac", dataCategory: "organic" },
  // MMP → paid_marketing
  { name: "AppsFlyer", description: "Connect AppsFlyer to use this integration with your platform.", category: "MMP", status: "NOT_CONNECTED", color: "#00C853", accounts: 0, icon: "af", dataCategory: "paid_marketing" },
  // Payments & Subscription → kpi
  { name: "Recharge", description: "Connect Recharge to use this integration with your platform.", category: "Payments & Subscription", status: "NOT_CONNECTED", color: "#00BFA5", accounts: 0, icon: "rc", dataCategory: "kpi" },
  // Reviews → contextual
  { name: "Judge.me", description: "Connect Judge.me to use this integration with Lifesight", category: "Reviews", status: "NOT_CONNECTED", color: "#FFC107", accounts: 0, icon: "jm", dataCategory: "contextual" },
  { name: "Fera.ai", description: "Connect Fera.ai and start with automation", category: "Reviews", status: "NOT_CONNECTED", color: "#FF5252", accounts: 0, icon: "fa", dataCategory: "contextual" },
  // CTV & OTT → paid_marketing
  { name: "Roku Ads", description: "Connect Roku Ads to use this integration with your platform.", category: "CTV & OTT", status: "NOT_CONNECTED", color: "#6C3C97", accounts: 0, icon: "rk", isPartner: true, partnerBenefit: "Free $200 ad credits", dataCategory: "paid_marketing" },
  { name: "Google DV360", description: "Connect Google DV360 and start with automation", category: "CTV & OTT", status: "NOT_CONNECTED", color: "#4285F4", accounts: 0, icon: "dv", isRequested: true, requestedDate: "2026-02-20", dataCategory: "paid_marketing" },
];

// Planned integrations — shown in the App Wishlist tab for users to request
export interface PlannedIntegration {
  name: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  eta?: string; // e.g. "Q2 2026"
}

export const plannedIntegrations: PlannedIntegration[] = [
  { name: "Braze", description: "Customer engagement platform for cross-channel messaging.", category: "Marketing", color: "#00C4B3", icon: "bz", eta: "Q2 2026" },
  { name: "Iterable", description: "Cross-channel marketing automation for growth.", category: "Marketing", color: "#6032D6", icon: "it", eta: "Q2 2026" },
  { name: "Attentive", description: "SMS and email marketing platform for e-commerce.", category: "Marketing", color: "#000000", icon: "at", eta: "Q3 2026" },
  { name: "Postscript", description: "SMS marketing platform built for Shopify brands.", category: "Marketing", color: "#7C3AED", icon: "ps", eta: "Q3 2026" },
  { name: "Yotpo", description: "E-commerce marketing platform for reviews, loyalty, and referrals.", category: "Reviews", color: "#263B5E", icon: "yp", eta: "Q2 2026" },
  { name: "Gorgias", description: "Helpdesk and customer support platform for e-commerce.", category: "CRM", color: "#1F2937", icon: "gg", eta: "Q3 2026" },
  { name: "Triple Whale", description: "Attribution and analytics platform for DTC brands.", category: "Analytics", color: "#2563EB", icon: "tw", eta: "Q2 2026" },
  { name: "Northbeam", description: "Cross-channel marketing attribution and media mix modeling.", category: "Analytics", color: "#10B981", icon: "nb", eta: "Q3 2026" },
  { name: "Stripe", description: "Payment processing and revenue analytics.", category: "Payments", color: "#635BFF", icon: "st", eta: "Q2 2026" },
  { name: "Segment", description: "Customer data platform for collecting and routing data.", category: "Data", color: "#52BD94", icon: "sg", eta: "Q3 2026" },
];
