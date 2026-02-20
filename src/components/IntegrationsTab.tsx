"use client";

import { useState, useRef, useEffect } from "react";

interface Integration {
  name: string;
  description: string;
  category: string;
  status: "Connected" | "Reconnect" | "Partial" | "Not Connected";
  color: string;
  accounts: number;
  icon?: string;
  footerLabel?: string;
}

const integrations: Integration[] = [
  // Advertising
  { name: "Facebook Ads", description: "Connect Facebook to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#1877F2", accounts: 21, icon: "fb" },
  { name: "Google Ads", description: "Connect Google to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#34A853", accounts: 4, icon: "gad" },
  { name: "Microsoft Ads", description: "Connect Microsoft to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#00A4EF", accounts: 0, icon: "ms" },
  { name: "TikTok Ads", description: "Get potential customers with TikTok leads", category: "Advertising", status: "Connected", color: "#EE1D52", accounts: 2, icon: "tt" },
  { name: "Snapchat Ads", description: "Connect Snapchat to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#FFFC00", accounts: 2, icon: "sc" },
  { name: "Pinterest Ads", description: "Connect Pinterest to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#E60023", accounts: 3, icon: "pi" },
  { name: "LinkedIn Ads", description: "Connect LinkedIn to use this integration with Lifesight", category: "Advertising", status: "Reconnect", color: "#0A66C2", accounts: 1, icon: "in" },
  { name: "X Ads (Twitter)", description: "Connect X Ads to use this integration with your platform.", category: "Advertising", status: "Connected", color: "#1DA1F2", accounts: 2, icon: "x" },
  { name: "Amazon Ads", description: "Connect Amazon to use this integration with your platform.", category: "Advertising", status: "Not Connected", color: "#FF9900", accounts: 0, icon: "amz" },
  { name: "Criteo", description: "Connect Criteo and start with automation", category: "Advertising", status: "Not Connected", color: "#F48120", accounts: 0, icon: "cr" },
  { name: "Taboola", description: "Connect Taboola to use this integration with Lifesight", category: "Advertising", status: "Not Connected", color: "#243B86", accounts: 0, icon: "tb" },
  { name: "Outbrain", description: "Connect Outbrain and start with automation", category: "Advertising", status: "Not Connected", color: "#F47920", accounts: 0, icon: "ob" },
  { name: "Spotify Ads", description: "Connect Spotify Ads to use this integration with your platform.", category: "Advertising", status: "Not Connected", color: "#1DB954", accounts: 0, icon: "sp" },
  { name: "AdRoll", description: "Connect AdRoll to use this integration with Lifesight", category: "Advertising", status: "Not Connected", color: "#0DAEF0", accounts: 0, icon: "ar" },
  { name: "Walmart Connect", description: "Connect Walmart Connect and start with automation", category: "Advertising", status: "Not Connected", color: "#0071DC", accounts: 0, icon: "wm" },
  { name: "StackAdapt", description: "Connect StackAdapt to use this integration with your platform.", category: "Advertising", status: "Not Connected", color: "#4A3AFF", accounts: 0, icon: "sa" },
  { name: "Moloco", description: "Connect Moloco and start with automation", category: "Advertising", status: "Not Connected", color: "#FF4B4B", accounts: 0, icon: "mo" },
  { name: "Vibe", description: "Connect Vibe to use this integration with your platform.", category: "Advertising", status: "Not Connected", color: "#7C3AED", accounts: 0, icon: "vb" },
  { name: "Facebook Lead Forms", description: "Connect Facebook Lead Forms and start with automation", category: "Advertising", status: "Not Connected", color: "#1877F2", accounts: 0, icon: "fl" },
  { name: "Ad.net", description: "Connect Ad.net to use this integration with your platform.", category: "Advertising", status: "Not Connected", color: "#5C6BC0", accounts: 0, icon: "an" },
  { name: "AdJoe", description: "Connect AdJoe and start with automation", category: "Advertising", status: "Not Connected", color: "#26A69A", accounts: 0, icon: "aj" },
  { name: "Adform", description: "Connect Adform to use this integration with Lifesight", category: "Advertising", status: "Not Connected", color: "#00BCD4", accounts: 0, icon: "af" },
  { name: "Adikteev", description: "Connect Adikteev and start with automation", category: "Advertising", status: "Not Connected", color: "#7986CB", accounts: 0, icon: "ak" },
  { name: "Amazon DSP", description: "Connect Amazon DSP to use this integration with your platform.", category: "Advertising", status: "Partial", color: "#FF9900", accounts: 0, icon: "dsp" },
  { name: "Appier", description: "Connect Appier and start with automation", category: "Advertising", status: "Not Connected", color: "#EF5350", accounts: 0, icon: "ap" },
  { name: "Apple Search Ads", description: "Connect Apple Search Ads and start with automation", category: "Advertising", status: "Not Connected", color: "#555555", accounts: 0, icon: "asa" },

  // Affiliate & Partnerships
  { name: "Tradedoubler", description: "Connect Tradedoubler and start with automation", category: "Affiliate & Partnerships", status: "Not Connected", color: "#00A3E0", accounts: 0, icon: "td" },
  { name: "Everflow", description: "Connect Everflow to use this integration with Lifesight", category: "Affiliate & Partnerships", status: "Not Connected", color: "#FF6B35", accounts: 0, icon: "ef" },
  { name: "CJ Affiliate", description: "Connect CJ Affiliate and start with automation", category: "Affiliate & Partnerships", status: "Not Connected", color: "#003366", accounts: 0, icon: "cj" },
  { name: "Impact", description: "Connect Impact to use this integration with your platform.", category: "Affiliate & Partnerships", status: "Not Connected", color: "#FF6D3A", accounts: 0, icon: "im" },

  // Analytics
  { name: "Google Analytics", description: "Connect Google Analytics to use this integration with your platform.", category: "Analytics", status: "Connected", color: "#F9AB00", accounts: 1, icon: "ga" },

  // CRM
  { name: "HubSpot", description: "Connect HubSpot to use this integration with your platform.", category: "CRM", status: "Connected", color: "#FF7A59", accounts: 1, icon: "hs" },
  { name: "Salesforce", description: "Connect Salesforce to use this integration with Lifesight", category: "CRM", status: "Reconnect", color: "#00A1E0", accounts: 1, icon: "sf" },

  // Custom
  { name: "Custom JS", description: "Connect custom JavaScript to one website", category: "Custom", status: "Connected", color: "#6941c6", accounts: 0, icon: "js", footerLabel: "1 Connected Website" },

  // Data
  { name: "Google Sheets", description: "Sync data from Google Sheets into your platform.", category: "Data", status: "Connected", color: "#0F9D58", accounts: 2, icon: "gs", footerLabel: "8 Connected Sheets" },
  { name: "Import CSV", description: "Import data through CSV files", category: "Data", status: "Connected", color: "#71717a", accounts: 0, icon: "csv" },
  { name: "Snowflake", description: "Connect your Snowflake data warehouse to sync tables.", category: "Data", status: "Not Connected", color: "#29B5E8", accounts: 0, icon: "sf\u2744", footerLabel: "0 Tables" },
  { name: "BigQuery", description: "Connect your BigQuery data warehouse to sync tables.", category: "Data", status: "Not Connected", color: "#4285F4", accounts: 0, icon: "bq", footerLabel: "0 Tables" },

  // E-Commerce
  { name: "Shopify", description: "Connect Shopify to use this integration with your platform.", category: "E-Commerce", status: "Connected", color: "#95BF47", accounts: 3, icon: "sh" },
  { name: "WooCommerce", description: "Connect WooCommerce and start with automation", category: "E-Commerce", status: "Not Connected", color: "#96588A", accounts: 0, icon: "wc" },
  { name: "Salesforce Commerce Cloud", description: "Connect Salesforce Commerce Cloud with Lifesight", category: "E-Commerce", status: "Not Connected", color: "#00A1E0", accounts: 0, icon: "scc" },

  // Marketing
  { name: "Klaviyo", description: "Get your data synced from Klaviyo to Moda", category: "Marketing", status: "Connected", color: "#2B2B2B", accounts: 0, icon: "kl" },
  { name: "Salesforce Marketing Cloud", description: "Connect Salesforce Marketing Cloud with your platform.", category: "Marketing", status: "Not Connected", color: "#00A1E0", accounts: 0, icon: "smc" },
  { name: "ActiveCampaign", description: "Connect ActiveCampaign and start with automation", category: "Marketing", status: "Not Connected", color: "#356AE6", accounts: 0, icon: "ac" },

  // MMP
  { name: "AppsFlyer", description: "Connect AppsFlyer to use this integration with your platform.", category: "MMP", status: "Not Connected", color: "#00C853", accounts: 0, icon: "af" },

  // Payments & Subscription
  { name: "Recharge", description: "Connect Recharge to use this integration with your platform.", category: "Payments & Subscription", status: "Not Connected", color: "#00BFA5", accounts: 0, icon: "rc" },

  // Reviews
  { name: "Judge.me", description: "Connect Judge.me to use this integration with Lifesight", category: "Reviews", status: "Not Connected", color: "#FFC107", accounts: 0, icon: "jm" },
  { name: "Fera.ai", description: "Connect Fera.ai and start with automation", category: "Reviews", status: "Not Connected", color: "#FF5252", accounts: 0, icon: "fa" },

  // CTV & OTT
  { name: "Roku", description: "Connect Roku to use this integration with your platform.", category: "CTV & OTT", status: "Not Connected", color: "#6C3C97", accounts: 0, icon: "rk" },
  { name: "Google DV360", description: "Connect Google DV360 and start with automation", category: "CTV & OTT", status: "Not Connected", color: "#4285F4", accounts: 0, icon: "dv" },
];

const allCategories = Array.from(new Set(integrations.map((i) => i.category)));
const allStatuses: Integration["status"][] = ["Connected", "Reconnect", "Partial", "Not Connected"];

const statusDotColor: Record<Integration["status"], string> = {
  Connected: "bg-[#00bc7d]",
  Reconnect: "bg-[#ff2056]",
  Partial: "bg-[#3b82f6]",
  "Not Connected": "bg-[#71717a]",
};

// ─── Recognizable SVG icons for well-known integrations ──────────────────────
function IntegrationIcon({ integration }: { integration: Integration }) {
  const size = "w-10 h-10";
  const inner = "w-6 h-6";

  // Platform-specific SVG icons
  const svgIcons: Record<string, JSX.Element> = {
    "Facebook Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
      </svg>
    ),
    "Facebook Lead Forms": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
      </svg>
    ),
    "Google Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M5.636 18.364L2.808 13.5l8.486-14.696a3 3 0 015.196 3l-8.486 14.696z" opacity="0.8" />
        <circle cx="5.5" cy="18.5" r="3" />
        <path d="M18.364 18.364l2.828-4.864L12.706 1.804" opacity="0.6" />
      </svg>
    ),
    "Google Analytics": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M18 20V4M12 20v-8M6 20v-4" strokeWidth="3" stroke="white" fill="none" strokeLinecap="round" />
      </svg>
    ),
    "Google Sheets": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M8 13h8M8 17h8M8 13v4M12 13v4" stroke="white" strokeWidth="1.2" />
      </svg>
    ),
    "Google DV360": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M8 16l3-4 2 2 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    "TikTok Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V12.8a8.2 8.2 0 004.58 1.39V10.7a4.83 4.83 0 01-1-.01 4.83 4.83 0 01-3.58-4z" />
      </svg>
    ),
    "LinkedIn Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
    "X Ads (Twitter)": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    "Shopify": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M15.34 2.61a.47.47 0 00-.42-.38c-.17-.01-3.85-.04-3.85-.04s-2.59-2.52-2.86-2.79c-.27-.27-.8-.19-.8-.19L5.75.78S3.84 2.1 3.6 2.34c-.24.24-.26.6-.26.6L2.16 18.93l9.14 1.59 6.17-1.5s-2.13-16.41-2.13-16.41zM11.12 5.41l-.73 2.24s-.82-.43-1.83-.36c-1.45.1-1.47 1-1.45 1.24.08.78 3.26 1.35 3.44 3.88.14 2-1.05 3.35-2.74 3.46-2.04.13-3.16-1.07-3.16-1.07l.43-1.83s1.12.77 2.02.72a.83.83 0 00.78-.96c-.1-1.24-2.69-1.17-2.86-3.67-.14-2.1 1.25-4.24 4.3-4.43a3.56 3.56 0 011.8.38z" />
      </svg>
    ),
    "HubSpot": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M16.75 7.46V4.77a1.7 1.7 0 001-1.55 1.7 1.7 0 10-3.42 0c0 .66.39 1.23.95 1.51v2.73a5.3 5.3 0 00-2.65 1.36l-7-5.45a2 2 0 00.08-.54 2.07 2.07 0 10-2.07 2.07c.44 0 .85-.14 1.18-.39l6.87 5.35a5.33 5.33 0 00.53 6.16l-2.05 2.05a1.65 1.65 0 00-.48-.08 1.68 1.68 0 101.68 1.68c0-.17-.03-.33-.08-.48l2.01-2.01A5.33 5.33 0 1016.75 7.46z" />
      </svg>
    ),
    "Salesforce": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M10.05 5.82a4.27 4.27 0 013.18-1.4c1.72 0 3.21 1.02 3.9 2.49a4.97 4.97 0 011.67-.29c2.76 0 5 2.24 5 5s-2.24 5-5 5h-.28a3.77 3.77 0 01-3.49 2.3c-.79 0-1.53-.24-2.14-.66A4.55 4.55 0 018.89 20a4.6 4.6 0 01-3.25-1.34A4.86 4.86 0 01.2 13.57a4.86 4.86 0 013.06-4.52 4.1 4.1 0 013.61-3.38 4.27 4.27 0 013.18 0z" />
      </svg>
    ),
    "Snowflake": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="12" cy="2" r="1.5" fill="white" /><circle cx="12" cy="22" r="1.5" fill="white" />
        <circle cx="2" cy="12" r="1.5" fill="white" /><circle cx="22" cy="12" r="1.5" fill="white" />
      </svg>
    ),
    "BigQuery": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M8 8h3M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    "Klaviyo": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M2 19l10-14 10 14H2z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    "Import CSV": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    "Custom JS": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1z" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M10 15.5c0 .83-.67 1.5-1.5 1.5S7 16.33 7 15.5v-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M14 11.5c.83 0 1.5.37 1.5 1s-.67 1-1.5 1-1.5.37-1.5 1 .67 1 1.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
    "Snapchat Ads": (
      <svg viewBox="0 0 24 24" fill="#333" className="w-3.5 h-3.5">
        <path d="M12 2C9.24 2 7.12 3.64 7.12 7.2v1.95c-.55.08-1.12.27-1.12.82 0 .64.82.78 1.17.8-.1.6-.6 1.38-1.57 2.02-.53.35-.95.73-.95 1.21 0 .48.4.85 1.13 1.14.73.29 1.72.46 2.09.86.23.25.18.67.18 1 0 .55.45 1 1 1h5.9c.55 0 1-.45 1-1 0-.33-.05-.75.18-1 .37-.4 1.36-.57 2.09-.86.73-.29 1.13-.66 1.13-1.14 0-.48-.42-.86-.95-1.21-.97-.64-1.47-1.42-1.57-2.02.35-.02 1.17-.16 1.17-.8 0-.55-.57-.74-1.12-.82V7.2C16.88 3.64 14.76 2 12 2z" />
      </svg>
    ),
    "Pinterest Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.08 2.46 7.58 5.97 9.12-.03-.71-.06-1.8.01-2.58.07-.7.47-2.97.47-2.97s-.12-.24-.12-.59c0-.55.32-.97.72-.97.34 0 .5.25.5.56 0 .34-.22.85-.33 1.32-.09.4.2.72.6.72.72 0 1.27-.76 1.27-1.85 0-.97-.7-1.65-1.69-1.65-1.15 0-1.83.87-1.83 1.76 0 .35.13.72.3.92.03.04.04.08.03.12l-.11.45c-.02.07-.06.09-.13.05-.49-.23-.8-.93-.8-1.5 0-1.22.89-2.34 2.56-2.34 1.34 0 2.39.96 2.39 2.24 0 1.34-.84 2.41-2.01 2.41-.39 0-.76-.2-.89-.44l-.24.92c-.09.34-.33.76-.49 1.02.37.11.76.18 1.16.18 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
    ),
    "Amazon Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M21 15.5c-.1 0-1.3.9-4.5 1.5-2.1.4-4.6.5-6.5.5s-4.4-.1-6.5-.5C.3 16.4.1 15.5 0 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M19 17l2-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M7 12.5c0-2.5 1.5-4 4-4s4 1.5 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
    "Amazon DSP": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M21 15.5c-.1 0-1.3.9-4.5 1.5-2.1.4-4.6.5-6.5.5s-4.4-.1-6.5-.5C.3 16.4.1 15.5 0 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M19 17l2-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M7 12.5c0-2.5 1.5-4 4-4s4 1.5 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
    "Microsoft Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
        <rect x="1" y="1" width="10" height="10" />
        <rect x="13" y="1" width="10" height="10" opacity="0.8" />
        <rect x="1" y="13" width="10" height="10" opacity="0.6" />
        <rect x="13" y="13" width="10" height="10" opacity="0.4" />
      </svg>
    ),
    "Spotify Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M7 10.5c2.5-1 6-1 8.5.5M7.5 13.5c2-.8 5-.8 7 .3M8 16.3c1.5-.6 4-.6 5.5.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
    ),
    "Roku": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M7 20h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 16v4" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
    "Apple Search Ads": (
      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2.01.76-3.27.81-1.31.05-2.3-1.32-3.14-2.53C4.25 16.76 2.94 12.88 4.7 10.24c.87-1.31 2.43-2.14 4.12-2.16 1.29-.03 2.51.87 3.29.87.79 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.63z" />
        <path d="M15 2c.23 1.12-.33 2.25-1 3.05-.7.83-1.82 1.47-2.93 1.38-.26-1.09.37-2.24 1.02-2.96C12.79 2.62 14.03 2.06 15 2z" />
      </svg>
    ),
  };

  const svgIcon = svgIcons[integration.name];

  if (svgIcon) {
    return (
      <div className={`${size} rounded-xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${integration.color}18` }}>
        <div className={`${inner} rounded-lg flex items-center justify-center`} style={{ backgroundColor: integration.color }}>
          {svgIcon}
        </div>
      </div>
    );
  }

  // Fallback: styled abbreviation
  const abbr = integration.icon || integration.name.slice(0, 2);
  return (
    <div className={`${size} rounded-xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${integration.color}18` }}>
      <div className={`${inner} rounded-lg flex items-center justify-center`} style={{ backgroundColor: integration.color }}>
        <span className="text-[8px] text-white font-bold uppercase leading-none">{abbr}</span>
      </div>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2d] bg-[#0f0f10] text-sm text-[#d1d5dc] hover:border-[#444] transition-colors min-w-[140px] justify-between"
      >
        <span>{value}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#1a1a1c] border border-[#333] rounded-lg shadow-xl z-50 min-w-[180px] py-1">
          <button
            onClick={() => { onChange(`All ${label}`); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${value === `All ${label}` ? "text-white font-medium" : "text-[#9ca3af]"}`}
          >
            All {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${value === opt ? "text-white font-medium" : "text-[#9ca3af]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Three-Dot Menu ───────────────────────────────────────────────────────────
function ThreeDotMenu() {
  return (
    <button className="p-1 rounded hover:bg-white/5 transition-colors text-[#71717a] hover:text-[#d1d5dc]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3.5" r="1" fill="currentColor" />
        <circle cx="8" cy="8" r="1" fill="currentColor" />
        <circle cx="8" cy="12.5" r="1" fill="currentColor" />
      </svg>
    </button>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({ integration }: { integration: Integration }) {
  const hasFooter = integration.accounts > 0 || !!integration.footerLabel;
  const footerText = integration.footerLabel
    || `${integration.accounts} Connected Account${integration.accounts !== 1 ? "s" : ""}`;

  return (
    <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl flex flex-col hover:border-[#333] transition-colors">
      <div className="px-5 pt-5 pb-4 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <IntegrationIcon integration={integration} />
            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-medium">{integration.name}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColor[integration.status]}`} />
              </div>
              <p className="text-[#71717a] text-xs mt-0.5 leading-relaxed">{integration.description}</p>
            </div>
          </div>
          <ThreeDotMenu />
        </div>
      </div>

      {hasFooter && (
        <div className="border-t border-[#1f1f21] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.83 8.17L3.5 5.83L1.17 8.17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.5 5.83V10.5C3.5 11.05 3.72 11.58 4.11 11.97C4.5 12.36 5.03 12.58 5.58 12.58" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.17 5.83L10.5 8.17L12.83 5.83" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.5 8.17V3.5C10.5 2.95 10.28 2.42 9.89 2.03C9.5 1.64 8.97 1.42 8.42 1.42" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{footerText}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#71717a]">
            <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  dotColor,
  description,
}: {
  title: string;
  count: number;
  dotColor: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <h3 className="text-white text-base font-semibold">{title}</h3>
        <span className="bg-[#1f1f21] text-[#9ca3af] text-xs font-semibold px-2 py-0.5 rounded-md">{count}</span>
      </div>
      <span className="text-[#475467] text-xs">{description}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IntegrationsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const filtered = integrations.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All Statuses" && i.status !== statusFilter) return false;
    if (categoryFilter !== "All Categories" && i.category !== categoryFilter) return false;
    return true;
  });

  const hasActiveFilters = search !== "" || statusFilter !== "All Statuses" || categoryFilter !== "All Categories";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setCategoryFilter("All Categories");
  };

  // Group by status buckets
  const connected = filtered.filter((i) => i.status === "Connected").sort((a, b) => a.name.localeCompare(b.name));
  const attention = filtered.filter((i) => i.status === "Reconnect" || i.status === "Partial").sort((a, b) => a.name.localeCompare(b.name));
  const notConnected = filtered.filter((i) => i.status === "Not Connected").sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]">
              <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-[#0f0f10] border border-[#2a2a2d] rounded-lg text-sm text-[#d1d5dc] pl-9 pr-3 py-2 w-60 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
          </div>
          <FilterDropdown label="Statuses" value={statusFilter} options={allStatuses} onChange={setStatusFilter} />
          <FilterDropdown label="Categories" value={categoryFilter} options={allCategories} onChange={setCategoryFilter} />
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2d] text-sm text-[#9ca3af] hover:text-white hover:border-[#444] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.75 1.75L12.25 12.25M12.25 1.75L1.75 12.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* ── Connected ──────────────────────────────────────────────────────── */}
      {connected.length > 0 && (
        <div>
          <SectionHeader
            title="Connected"
            count={connected.length}
            dotColor="bg-[#00bc7d]"
            description="Active integrations syncing data"
          />
          <div className="grid grid-cols-3 gap-4">
            {connected.map((i) => <IntegrationCard key={i.name} integration={i} />)}
          </div>
        </div>
      )}

      {/* ── Needs Attention ────────────────────────────────────────────────── */}
      {attention.length > 0 && (
        <div>
          <SectionHeader
            title="Needs Attention"
            count={attention.length}
            dotColor="bg-[#fe9a00]"
            description="Integrations that require action to resume syncing"
          />
          <div className="grid grid-cols-3 gap-4">
            {attention.map((i) => <IntegrationCard key={i.name} integration={i} />)}
          </div>
        </div>
      )}

      {/* ── Not Connected ──────────────────────────────────────────────────── */}
      {notConnected.length > 0 && (
        <div>
          <SectionHeader
            title="Available"
            count={notConnected.length}
            dotColor="bg-[#71717a]"
            description="Integrations ready to connect"
          />
          <div className="grid grid-cols-3 gap-4">
            {notConnected.map((i) => <IntegrationCard key={i.name} integration={i} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 text-[#333]">
            <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="2" />
            <path d="M35 35L26.5 26.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-[#9ca3af] text-sm">No integrations match your filters</p>
          <button onClick={resetFilters} className="text-[#6941c6] text-sm font-medium mt-2 hover:underline">
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
