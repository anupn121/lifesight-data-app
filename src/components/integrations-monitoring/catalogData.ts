import type { CatalogIntegration } from "../monitoringData";

export const catalogIntegrations: CatalogIntegration[] = [
  // Advertising
  { name: "Facebook Ads", description: "Connect Facebook to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#1877F2", accounts: 21, icon: "fb", isRecommended: true },
  { name: "Google Ads", description: "Connect Google to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#34A853", accounts: 4, icon: "gad", isRecommended: true },
  { name: "Microsoft Ads", description: "Connect Microsoft to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#00A4EF", accounts: 0, icon: "ms" },
  { name: "TikTok Ads", description: "Get potential customers with TikTok leads", category: "Advertising", status: "CONNECTED", color: "#EE1D52", accounts: 2, icon: "tt", isRecommended: true },
  { name: "Snapchat Ads", description: "Connect Snapchat to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#FFFC00", accounts: 2, icon: "sc", isRecommended: true },
  { name: "Pinterest Ads", description: "Connect Pinterest to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#E60023", accounts: 3, icon: "pi" },
  { name: "LinkedIn Ads", description: "Connect LinkedIn to use this integration with Lifesight", category: "Advertising", status: "ACTION_REQUIRED", color: "#0A66C2", accounts: 1, icon: "in" },
  { name: "X Ads (Twitter)", description: "Connect X Ads to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#1DA1F2", accounts: 2, icon: "x" },
  { name: "Amazon Ads", description: "Connect Amazon to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#FF9900", accounts: 0, icon: "amz" },
  { name: "Criteo", description: "Connect Criteo and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#F48120", accounts: 0, icon: "cr" },
  { name: "Taboola", description: "Connect Taboola to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#243B86", accounts: 0, icon: "tb" },
  { name: "Outbrain", description: "Connect Outbrain and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#F47920", accounts: 0, icon: "ob" },
  { name: "Spotify Ads", description: "Connect Spotify Ads to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#1DB954", accounts: 0, icon: "sp", isRequested: true, requestedDate: "2025-12-15" },
  { name: "AdRoll", description: "Connect AdRoll to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#0DAEF0", accounts: 0, icon: "ar" },
  { name: "Walmart Connect Ads", description: "Connect Walmart Connect Ads and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#0071DC", accounts: 0, icon: "wm", isPartner: true, partnerBenefit: "Credit matching up to $500" },
  { name: "StackAdapt", description: "Connect StackAdapt to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#4A3AFF", accounts: 0, icon: "sa" },
  { name: "Moloco", description: "Connect Moloco and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#FF4B4B", accounts: 0, icon: "mo" },
  { name: "Vibe Ads", description: "Connect Vibe Ads to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#7C3AED", accounts: 0, icon: "vb", isPartner: true, partnerBenefit: "3 months free credits" },
  { name: "Facebook Lead Forms", description: "Connect Facebook Lead Forms and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#1877F2", accounts: 0, icon: "fl" },
  { name: "Ad.net", description: "Connect Ad.net to use this integration with your platform.", category: "Advertising", status: "NOT_CONNECTED", color: "#5C6BC0", accounts: 0, icon: "an" },
  { name: "AdJoe", description: "Connect AdJoe and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#26A69A", accounts: 0, icon: "aj" },
  { name: "Adform", description: "Connect Adform to use this integration with Lifesight", category: "Advertising", status: "NOT_CONNECTED", color: "#00BCD4", accounts: 0, icon: "af" },
  { name: "Adikteev", description: "Connect Adikteev and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#7986CB", accounts: 0, icon: "ak" },
  { name: "Amazon DSP", description: "Connect Amazon DSP to use this integration with your platform.", category: "Advertising", status: "CONNECTED", color: "#FF9900", accounts: 0, icon: "dsp" },
  { name: "Appier", description: "Connect Appier and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#EF5350", accounts: 0, icon: "ap" },
  { name: "Apple Search Ads", description: "Connect Apple Search Ads and start with automation", category: "Advertising", status: "NOT_CONNECTED", color: "#555555", accounts: 0, icon: "asa", isRequested: true, requestedDate: "2026-01-08" },
  // Affiliate & Partnerships
  { name: "Tradedoubler", description: "Connect Tradedoubler and start with automation", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#00A3E0", accounts: 0, icon: "td" },
  { name: "Everflow", description: "Connect Everflow to use this integration with Lifesight", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#FF6B35", accounts: 0, icon: "ef" },
  { name: "CJ Affiliate", description: "Connect CJ Affiliate and start with automation", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#003366", accounts: 0, icon: "cj" },
  { name: "Impact", description: "Connect Impact to use this integration with your platform.", category: "Affiliate & Partnerships", status: "NOT_CONNECTED", color: "#FF6D3A", accounts: 0, icon: "im" },
  // Analytics
  { name: "Google Analytics", description: "Connect Google Analytics to use this integration with your platform.", category: "Analytics", status: "CONNECTED", color: "#F9AB00", accounts: 1, icon: "ga", isRecommended: true },
  // CRM
  { name: "HubSpot", description: "Connect HubSpot to use this integration with your platform.", category: "CRM", status: "CONNECTED", color: "#FF7A59", accounts: 1, icon: "hs", isRecommended: true },
  { name: "Salesforce", description: "Connect Salesforce to use this integration with Lifesight", category: "CRM", status: "ACTION_REQUIRED", color: "#00A1E0", accounts: 1, icon: "sf" },
  // Custom
  { name: "Custom JS", description: "Connect custom JavaScript to one website", category: "Custom", status: "CONNECTED", color: "#6941c6", accounts: 0, icon: "js", footerLabel: "1 Connected Website" },
  // Data
  { name: "Google Sheets", description: "Sync data from Google Sheets into your platform.", category: "Data", status: "CONNECTED", color: "#0F9D58", accounts: 2, icon: "gs", footerLabel: "8 Connected Sheets" },
  { name: "Import CSV", description: "Import data through CSV files", category: "Data", status: "CONNECTED", color: "#71717a", accounts: 0, icon: "csv" },
  { name: "Snowflake", description: "Connect your Snowflake data warehouse to sync tables.", category: "Data", status: "NOT_CONNECTED", color: "#29B5E8", accounts: 0, icon: "sf❄", footerLabel: "0 Tables" },
  { name: "BigQuery", description: "Connect your BigQuery data warehouse to sync tables.", category: "Data", status: "NOT_CONNECTED", color: "#4285F4", accounts: 0, icon: "bq", footerLabel: "0 Tables" },
  { name: "Amazon Redshift", description: "Connect your Redshift data warehouse to sync tables and views.", category: "Data", status: "NOT_CONNECTED", color: "#8C4FFF", accounts: 0, icon: "rs", footerLabel: "0 Tables" },
  { name: "Databricks", description: "Connect Databricks to sync data from your lakehouse.", category: "Data", status: "NOT_CONNECTED", color: "#FF3621", accounts: 0, icon: "db", footerLabel: "0 Tables" },
  { name: "Amazon S3", description: "Import data files from Amazon S3 buckets.", category: "Data", status: "NOT_CONNECTED", color: "#569A31", accounts: 0, icon: "s3" },
  // E-Commerce
  { name: "Shopify", description: "Connect Shopify to use this integration with your platform.", category: "E-Commerce", status: "CONNECTED", color: "#95BF47", accounts: 3, icon: "sh", isRecommended: true },
  { name: "WooCommerce", description: "Connect WooCommerce and start with automation", category: "E-Commerce", status: "NOT_CONNECTED", color: "#96588A", accounts: 0, icon: "wc" },
  { name: "Salesforce Commerce Cloud", description: "Connect Salesforce Commerce Cloud with Lifesight", category: "E-Commerce", status: "NOT_CONNECTED", color: "#00A1E0", accounts: 0, icon: "scc" },
  // Marketing
  { name: "Klaviyo", description: "Get your data synced from Klaviyo to Moda", category: "Marketing", status: "CONNECTED", color: "#2B2B2B", accounts: 0, icon: "kl", isRecommended: true },
  { name: "Salesforce Marketing Cloud", description: "Connect Salesforce Marketing Cloud with your platform.", category: "Marketing", status: "NOT_CONNECTED", color: "#00A1E0", accounts: 0, icon: "smc" },
  { name: "ActiveCampaign", description: "Connect ActiveCampaign and start with automation", category: "Marketing", status: "NOT_CONNECTED", color: "#356AE6", accounts: 0, icon: "ac" },
  // MMP
  { name: "AppsFlyer", description: "Connect AppsFlyer to use this integration with your platform.", category: "MMP", status: "NOT_CONNECTED", color: "#00C853", accounts: 0, icon: "af" },
  // Payments & Subscription
  { name: "Recharge", description: "Connect Recharge to use this integration with your platform.", category: "Payments & Subscription", status: "NOT_CONNECTED", color: "#00BFA5", accounts: 0, icon: "rc" },
  // Reviews
  { name: "Judge.me", description: "Connect Judge.me to use this integration with Lifesight", category: "Reviews", status: "NOT_CONNECTED", color: "#FFC107", accounts: 0, icon: "jm" },
  { name: "Fera.ai", description: "Connect Fera.ai and start with automation", category: "Reviews", status: "NOT_CONNECTED", color: "#FF5252", accounts: 0, icon: "fa" },
  // CTV & OTT
  { name: "Roku Ads", description: "Connect Roku Ads to use this integration with your platform.", category: "CTV & OTT", status: "NOT_CONNECTED", color: "#6C3C97", accounts: 0, icon: "rk", isPartner: true, partnerBenefit: "Free $200 ad credits" },
  { name: "Google DV360", description: "Connect Google DV360 and start with automation", category: "CTV & OTT", status: "NOT_CONNECTED", color: "#4285F4", accounts: 0, icon: "dv", isRequested: true, requestedDate: "2026-02-20" },
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
