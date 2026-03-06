"use client";

import type { CatalogIntegration } from "../monitoringData";

export const svgIcons: Record<string, JSX.Element> = {
  "Facebook Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" /></svg>),
  "Facebook Lead Forms": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" /></svg>),
  "Google Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M5.636 18.364L2.808 13.5l8.486-14.696a3 3 0 015.196 3l-8.486 14.696z" opacity="0.8" /><circle cx="5.5" cy="18.5" r="3" /><path d="M18.364 18.364l2.828-4.864L12.706 1.804" opacity="0.6" /></svg>),
  "Google Analytics": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M18 20V4M12 20v-8M6 20v-4" strokeWidth="3" stroke="white" fill="none" strokeLinecap="round" /></svg>),
  "Google Sheets": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M8 13h8M8 17h8M8 13v4M12 13v4" stroke="white" strokeWidth="1.2" /></svg>),
  "Google DV360": (<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="white" strokeWidth="1.5" /><path d="M8 16l3-4 2 2 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>),
  "TikTok Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V12.8a8.2 8.2 0 004.58 1.39V10.7a4.83 4.83 0 01-1-.01 4.83 4.83 0 01-3.58-4z" /></svg>),
  "LinkedIn Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" /></svg>),
  "X Ads (Twitter)": (<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>),
  "Shopify": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M15.34 2.61a.47.47 0 00-.42-.38c-.17-.01-3.85-.04-3.85-.04s-2.59-2.52-2.86-2.79c-.27-.27-.8-.19-.8-.19L5.75.78S3.84 2.1 3.6 2.34c-.24.24-.26.6-.26.6L2.16 18.93l9.14 1.59 6.17-1.5s-2.13-16.41-2.13-16.41zM11.12 5.41l-.73 2.24s-.82-.43-1.83-.36c-1.45.1-1.47 1-1.45 1.24.08.78 3.26 1.35 3.44 3.88.14 2-1.05 3.35-2.74 3.46-2.04.13-3.16-1.07-3.16-1.07l.43-1.83s1.12.77 2.02.72a.83.83 0 00.78-.96c-.1-1.24-2.69-1.17-2.86-3.67-.14-2.1 1.25-4.24 4.3-4.43a3.56 3.56 0 011.8.38z" /></svg>),
  "HubSpot": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M16.75 7.46V4.77a1.7 1.7 0 001-1.55 1.7 1.7 0 10-3.42 0c0 .66.39 1.23.95 1.51v2.73a5.3 5.3 0 00-2.65 1.36l-7-5.45a2 2 0 00.08-.54 2.07 2.07 0 10-2.07 2.07c.44 0 .85-.14 1.18-.39l6.87 5.35a5.33 5.33 0 00.53 6.16l-2.05 2.05a1.65 1.65 0 00-.48-.08 1.68 1.68 0 101.68 1.68c0-.17-.03-.33-.08-.48l2.01-2.01A5.33 5.33 0 1016.75 7.46z" /></svg>),
  "Salesforce": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M10.05 5.82a4.27 4.27 0 013.18-1.4c1.72 0 3.21 1.02 3.9 2.49a4.97 4.97 0 011.67-.29c2.76 0 5 2.24 5 5s-2.24 5-5 5h-.28a3.77 3.77 0 01-3.49 2.3c-.79 0-1.53-.24-2.14-.66A4.55 4.55 0 018.89 20a4.6 4.6 0 01-3.25-1.34A4.86 4.86 0 01.2 13.57a4.86 4.86 0 013.06-4.52 4.1 4.1 0 013.61-3.38 4.27 4.27 0 013.18 0z" /></svg>),
  "Snowflake": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" /><circle cx="12" cy="2" r="1.5" fill="white" /><circle cx="12" cy="22" r="1.5" fill="white" /><circle cx="2" cy="12" r="1.5" fill="white" /><circle cx="22" cy="12" r="1.5" fill="white" /></svg>),
  "BigQuery": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M8 8h3M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>),
  "Klaviyo": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M2 19l10-14 10 14H2z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
  "Import CSV": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>),
  "Custom JS": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M10 15.5c0 .83-.67 1.5-1.5 1.5S7 16.33 7 15.5v-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M14 11.5c.83 0 1.5.37 1.5 1s-.67 1-1.5 1-1.5.37-1.5 1 .67 1 1.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>),
  "Snapchat Ads": (<svg viewBox="0 0 24 24" fill="#333" className="w-3.5 h-3.5"><path d="M12 2C9.24 2 7.12 3.64 7.12 7.2v1.95c-.55.08-1.12.27-1.12.82 0 .64.82.78 1.17.8-.1.6-.6 1.38-1.57 2.02-.53.35-.95.73-.95 1.21 0 .48.4.85 1.13 1.14.73.29 1.72.46 2.09.86.23.25.18.67.18 1 0 .55.45 1 1 1h5.9c.55 0 1-.45 1-1 0-.33-.05-.75.18-1 .37-.4 1.36-.57 2.09-.86.73-.29 1.13-.66 1.13-1.14 0-.48-.42-.86-.95-1.21-.97-.64-1.47-1.42-1.57-2.02.35-.02 1.17-.16 1.17-.8 0-.55-.57-.74-1.12-.82V7.2C16.88 3.64 14.76 2 12 2z" /></svg>),
  "Pinterest Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.08 2.46 7.58 5.97 9.12-.03-.71-.06-1.8.01-2.58.07-.7.47-2.97.47-2.97s-.12-.24-.12-.59c0-.55.32-.97.72-.97.34 0 .5.25.5.56 0 .34-.22.85-.33 1.32-.09.4.2.72.6.72.72 0 1.27-.76 1.27-1.85 0-.97-.7-1.65-1.69-1.65-1.15 0-1.83.87-1.83 1.76 0 .35.13.72.3.92.03.04.04.08.03.12l-.11.45c-.02.07-.06.09-.13.05-.49-.23-.8-.93-.8-1.5 0-1.22.89-2.34 2.56-2.34 1.34 0 2.39.96 2.39 2.24 0 1.34-.84 2.41-2.01 2.41-.39 0-.76-.2-.89-.44l-.24.92c-.09.34-.33.76-.49 1.02.37.11.76.18 1.16.18 5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>),
  "Amazon Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M21 15.5c-.1 0-1.3.9-4.5 1.5-2.1.4-4.6.5-6.5.5s-4.4-.1-6.5-.5C.3 16.4.1 15.5 0 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M19 17l2-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M7 12.5c0-2.5 1.5-4 4-4s4 1.5 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>),
  "Amazon DSP": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M21 15.5c-.1 0-1.3.9-4.5 1.5-2.1.4-4.6.5-6.5.5s-4.4-.1-6.5-.5C.3 16.4.1 15.5 0 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M19 17l2-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M7 12.5c0-2.5 1.5-4 4-4s4 1.5 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>),
  "Microsoft Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><rect x="1" y="1" width="10" height="10" /><rect x="13" y="1" width="10" height="10" opacity="0.8" /><rect x="1" y="13" width="10" height="10" opacity="0.6" /><rect x="13" y="13" width="10" height="10" opacity="0.4" /></svg>),
  "Spotify Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M7 10.5c2.5-1 6-1 8.5.5M7.5 13.5c2-.8 5-.8 7 .3M8 16.3c1.5-.6 4-.6 5.5.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" /></svg>),
  "Roku Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" /><path d="M7 20h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 16v4" stroke="white" strokeWidth="1.5" /></svg>),
  "Roku": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" /><path d="M7 20h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 16v4" stroke="white" strokeWidth="1.5" /></svg>),
  "Apple Search Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2.01.76-3.27.81-1.31.05-2.3-1.32-3.14-2.53C4.25 16.76 2.94 12.88 4.7 10.24c.87-1.31 2.43-2.14 4.12-2.16 1.29-.03 2.51.87 3.29.87.79 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.63z" /><path d="M15 2c.23 1.12-.33 2.25-1 3.05-.7.83-1.82 1.47-2.93 1.38-.26-1.09.37-2.24 1.02-2.96C12.79 2.62 14.03 2.06 15 2z" /></svg>),
  "Vibe Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /></svg>),
  "Walmart Connect Ads": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2v7M17.2 5.5l-3.5 6.06M17.2 18.5l-3.5-6.06M12 22v-7M6.8 18.5l3.5-6.06M6.8 5.5l3.5 6.06" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>),
  "Amazon Redshift": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2L4 6v12l8 4 8-4V6l-8-4z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 6l8 4 8-4M12 10v12" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" /></svg>),
  "Databricks": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2L3 7l9 5 9-5-9-5z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M3 12l9 5 9-5" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M3 17l9 5 9-5" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /></svg>),
  "Amazon S3": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M4 4h16v16H4z" fill="none" stroke="white" strokeWidth="1.5" rx="2" /><path d="M4 9h16M4 15h16" stroke="white" strokeWidth="1.2" fill="none" /><path d="M12 4v5M12 15v5" stroke="white" strokeWidth="1.2" fill="none" /></svg>),
  "Google Cloud Storage": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>),
  "SFTP": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M4 4h16v16H4z" fill="none" stroke="white" strokeWidth="1.5" rx="2" /><path d="M8 12h8M12 8v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M7 7l2 2M15 7l2 2M7 17l2-2M15 17l2-2" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" /></svg>),
  "Excel Upload": (<svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="white" strokeWidth="1.5" /><path d="M14 2v6h6" stroke="white" strokeWidth="1.5" fill="none" /><path d="M9 13l6 6M15 13l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>),
};

export function IntegrationIcon({ integration }: { integration: CatalogIntegration }) {
  const size = "w-10 h-10";
  const inner = "w-6 h-6";
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

  const abbr = integration.icon || integration.name.slice(0, 2);
  return (
    <div className={`${size} rounded-xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${integration.color}18` }}>
      <div className={`${inner} rounded-lg flex items-center justify-center`} style={{ backgroundColor: integration.color }}>
        <span className="text-[8px] text-white font-bold uppercase leading-none">{abbr}</span>
      </div>
    </div>
  );
}

export function IntegrationIconSmall({ integration }: { integration: CatalogIntegration }) {
  const svgIcon = svgIcons[integration.name];
  if (svgIcon) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: integration.color }}>
          {svgIcon}
        </div>
      </div>
    );
  }
  const abbr = integration.icon || integration.name.slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: integration.color }}>
        <span className="text-[7px] text-white font-bold uppercase leading-none">{abbr}</span>
      </div>
    </div>
  );
}
