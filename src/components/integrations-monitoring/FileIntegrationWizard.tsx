"use client";

import { useState, useMemo } from "react";
import type { CatalogIntegration } from "../monitoringData";
import type { MetricCategory } from "../fieldsData";
import { IntegrationIcon } from "./icons";
import { DataCategoryPicker } from "./DataCategoryPicker";
import { DataPreviewTable } from "./DataPreviewTable";
import { ScopeTaggingEditor, type ScopeTaggingItem } from "../metrics-dimensions/ScopeTaggingEditor";
import type { AccountScope } from "../metrics-dimensions/scopeTypes";

// ─── Types ─────────────────────────────────────────────────────────────────

type RefreshFrequency = "daily" | "weekly" | "monthly";
type RefreshDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const STEPS = [
  "Name & Connect",
  "Tag Source",
  "Data Type",
  "Review",
  "Schedule",
];

const UPLOAD_ONLY = new Set(["CSV", "Excel Upload"]);

// ─── Mock Source Data ─────────────────────────────────────────────────────

const MOCK_SPREADSHEETS = [
  {
    id: "ss-1",
    name: "Campaign Performance Q4",
    sheets: [
      { id: "sh-1a", name: "Facebook Ads" },
      { id: "sh-1b", name: "Google Ads" },
      { id: "sh-1c", name: "Summary" },
    ],
  },
  {
    id: "ss-2",
    name: "Monthly Revenue Summary",
    sheets: [
      { id: "sh-2a", name: "Revenue by Channel" },
      { id: "sh-2b", name: "Revenue by Product" },
    ],
  },
  {
    id: "ss-3",
    name: "Ad Spend Tracker 2024",
    sheets: [
      { id: "sh-3a", name: "Monthly Spend" },
      { id: "sh-3b", name: "Daily Breakdown" },
      { id: "sh-3c", name: "Budget vs Actual" },
    ],
  },
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

// ─── Step 1: Name & Connect ──────────────────────────────────────────────

function StepNameAndConnect({
  integration,
  aliasName,
  onChangeAlias,
  selectedSource,
  onSelectSource,
  fileName,
  onChangeFileName,
  connected,
  onChangeConnected,
  onNext,
  onInviteUser,
  onChangeIntegrationType,
}: {
  integration: CatalogIntegration;
  aliasName: string;
  onChangeAlias: (v: string) => void;
  selectedSource: string;
  onSelectSource: (source: string) => void;
  fileName: string;
  onChangeFileName: (v: string) => void;
  connected: boolean;
  onChangeConnected: (v: boolean) => void;
  onNext: () => void;
  onInviteUser?: (name: string) => void;
  /** When set, renders a "Change integration type" link in the header that
      lets the user switch to a different source (opens the custom source
      picker view in the parent). Only passed when the wizard was opened
      from a non-native JSP flow. */
  onChangeIntegrationType?: () => void;
}) {

  const isUpload = UPLOAD_ONLY.has(integration.name);
  const isGoogleSheets = integration.name === "Google Sheets";
  const isS3 = integration.name === "Amazon S3";
  const isGCS = integration.name === "Google Cloud Storage";
  const isSFTP = integration.name === "SFTP";
  const needsSourceSelection = isGoogleSheets || isS3 || isGCS || isSFTP;

  const canProceed = aliasName.trim().length > 0 && (
    isUpload ? !!fileName :
    needsSourceSelection ? (connected && !!selectedSource) :
    connected
  );

  return (
    <div className="max-w-lg mx-auto">
      {/* Contextual banner shown only in JSP flow (when onChangeIntegrationType
          is provided). Gives the user explicit context ("Setting up X for Y")
          and a prominent Change button so they can switch sources without
          losing the current integration alias. */}
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
                Setting up &ldquo;{aliasName || integration.name}&rdquo;
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
          value={aliasName}
          onChange={(e) => onChangeAlias(e.target.value)}
          placeholder={`e.g., Kayak via ${integration.name}, Instagram Organic Data`}
          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
        />
        <p className="text-[var(--text-dim)] text-xs mt-2">This name will appear on your integrations list. Use something recognizable.</p>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-primary)] mb-6" />

      {/* Upload area for CSV/Excel */}
      {isUpload && (
        <>
          <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Upload Your File</label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-4 ${fileName ? "border-[#00bc7d]/30 bg-[#00bc7d]/3" : "border-[var(--border-secondary)] hover:border-[#027b8e]"}`}
            onClick={() => onChangeFileName(integration.name === "CSV" ? "campaign_data.csv" : "marketing_report.xlsx")}
          >
            {fileName ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#00bc7d" />
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[var(--text-primary)] text-sm font-medium">{fileName}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onChangeFileName(""); }}
                  className="text-[var(--text-dim)] text-xs hover:text-[#027b8e] transition-colors"
                >
                  Remove and upload a different file
                </button>
              </div>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3">
                  <path d="M16 6v14M10 12l6-6 6 6" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 22h20" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-[var(--text-muted)] text-sm">Drag and drop or <span className="text-[#027b8e] font-medium">browse</span></p>
                <p className="text-[var(--text-dim)] text-xs mt-1">{integration.name === "CSV" ? ".csv files up to 50MB" : ".xlsx files up to 50MB"}</p>
              </>
            )}
          </div>
        </>
      )}

      {/* Connection for non-upload integrations */}
      {!isUpload && !connected && (
        <div className="mb-6">
          <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">Connect to {integration.name}</label>

          {isGoogleSheets && (
            <button
              onClick={() => onChangeConnected(true)}
              className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
              <button onClick={() => onChangeConnected(true)} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
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
                <div className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-6 text-center hover:border-[#027b8e] transition-colors cursor-pointer" onClick={() => {}}>
                  <p className="text-[var(--text-muted)] text-sm">Upload service account JSON key</p>
                </div>
              </div>
              <button onClick={() => onChangeConnected(true)} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
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
              <button onClick={() => onChangeConnected(true)} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
                Connect
              </button>
            </div>
          )}

          {!isGoogleSheets && !isS3 && !isGCS && !isSFTP && (
            <button onClick={() => onChangeConnected(true)} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
              Authorize Access
            </button>
          )}
        </div>
      )}

      {/* Connected success + source selector */}
      {!isUpload && connected && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-[#00bc7d]/5 border border-[#00bc7d]/20">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#00bc7d" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[#00bc7d] text-xs font-medium">Connected to {integration.name}</span>
            </div>
            <button onClick={() => { onChangeConnected(false); onSelectSource(""); }} className="text-[var(--text-dim)] text-[10px] hover:text-[var(--text-muted)] transition-colors">
              Change account
            </button>
          </div>

          {needsSourceSelection && (
            <>
              <label className="text-[var(--text-secondary)] text-sm font-medium block mb-3">
                {isGoogleSheets ? "Select a Sheet" : isSFTP ? "Select a File" : "Select a Bucket"}
              </label>
              <div className="flex flex-col gap-2">
                {isGoogleSheets && MOCK_SPREADSHEETS.map((ss) => (
                  <div key={ss.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                        <rect x="2" y="2" width="16" height="16" rx="2" fill="#0F9D58" opacity="0.15" />
                        <path d="M6 8h8M6 11h8M6 14h5" stroke="#0F9D58" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <span className="text-[var(--text-primary)] text-[12px] font-semibold">{ss.name}</span>
                      <span className="text-[var(--text-dim)] text-[10px] ml-auto">{ss.sheets.length} sheets</span>
                    </div>
                    <div className="border-t border-[var(--border-subtle)]">
                      {ss.sheets.map((sheet) => {
                        const sheetLabel = `${ss.name} / ${sheet.name}`;
                        const isSelected = selectedSource === sheetLabel;
                        return (
                          <button
                            key={sheet.id}
                            onClick={() => onSelectSource(sheetLabel)}
                            className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 text-left transition-colors border-b border-[var(--border-subtle)] last:border-b-0 ${
                              isSelected ? "bg-[#027b8e]/5" : "hover:bg-[var(--hover-item)]"
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                              <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke={isSelected ? "#027b8e" : "var(--text-dim)"} strokeWidth="1" fill="none" />
                              <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke={isSelected ? "#027b8e" : "var(--text-dim)"} strokeWidth="0.7" strokeLinecap="round" />
                            </svg>
                            <span className={`text-[12px] flex-1 ${isSelected ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}`}>{sheet.name}</span>
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" fill="#027b8e" />
                                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {(isS3 || isGCS) && MOCK_BUCKETS.map((bucket) => (
                  <button
                    key={bucket.name}
                    onClick={() => onSelectSource(bucket.name)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                      selectedSource === bucket.name ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
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
                    onClick={() => onSelectSource(file.name)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                      selectedSource === file.name ? "border-[#027b8e] bg-[#027b8e]/5" : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
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
            </>
          )}
        </div>
      )}

      {/* Continue button — appears after connecting/uploading */}
      {(isUpload || connected) && (
        <div className="relative group/btn mb-4">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#027b8e]"
          >
            Continue
          </button>
          {!canProceed && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <span className="text-[var(--text-muted)] text-xs">
                {!aliasName.trim()
                  ? "Enter an integration name to continue"
                  : isUpload && !fileName
                  ? "Upload a file to continue"
                  : needsSourceSelection && !selectedSource
                  ? "Select a sheet to continue"
                  : "Complete all fields to continue"}
              </span>
            </div>
          )}
        </div>
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
            <span className="text-[var(--text-secondary)] text-sm font-medium block">Don&apos;t have data?</span>
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
          <span className="text-[var(--text-primary)] text-sm font-medium block">Need help uploading data using {integration.name}?</span>
          <p className="text-[var(--text-dim)] text-xs mt-0.5 leading-relaxed">
            Check our setup guide for step-by-step instructions on how to upload and configure your data.
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

// ─── Step 2: Smart Detection ──────────────────────────────────────────────
// Replaces the old mock-data preview step. Runs the detection engine against
// the selected source name (file name / sheet name / bucket path) and shows
// a simple one-line confirmation with an Import button. The old preview is
// still accessible via "Something's off → Show all columns".

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

// ─── Tag Source Step (optional) ─────────────────────────────────────────
// Shown between Name & Connect and Data Type. For files/spreadsheets, a
// single "source" is picked (sheet, bucket, file) — so the editor usually
// renders one row. For Google Sheets with multiple sheets selected later,
// the list would grow.

function StepTagSource({
  integration,
  selectedSource,
  aliasName,
  fileName,
  scopes,
  onScopesChange,
  onBack,
  onNext,
}: {
  integration: CatalogIntegration;
  selectedSource: string;
  aliasName: string;
  fileName: string;
  scopes: Record<string, AccountScope>;
  onScopesChange: (next: Record<string, AccountScope>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const kind = integration.name === "CSV" || integration.name === "Excel Upload" ? "table" : integration.name === "Google Sheets" ? "sheet" : "table";
  const items: ScopeTaggingItem[] = useMemo(() => {
    const name = selectedSource || fileName || aliasName;
    if (!name) return [];
    return [
      {
        id: name,
        name,
        subtitle: `From ${integration.name}`,
      },
    ];
  }, [selectedSource, fileName, aliasName, integration.name]);

  const taggedCount = Object.values(scopes).filter((s) => s && Object.keys(s).some((k) => s[k as keyof AccountScope])).length;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
        Tag source <span className="text-[var(--text-muted)] text-base font-normal">— optional</span>
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-5">
        Associate this {kind} with a Brand, Product, Country, and Region so you can filter and group metrics in Data Transformation later.
      </p>

      <div className="flex items-start gap-2 px-3 py-2 bg-[#2b7fff]/5 border border-[#2b7fff]/20 rounded-[8px] mb-5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#2b7fff] flex-shrink-0 mt-[2px]">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 9.5V6M7 4.5v0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-medium text-[#2b7fff]">Tip:</span> This step is entirely optional. If your data already contains brand or country columns, you can skip tagging and use those columns directly.
        </p>
      </div>

      <ScopeTaggingEditor kind={kind === "sheet" ? "sheets" : "tables"} items={items} value={scopes} onChange={onScopesChange} />

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-xs">
            {taggedCount > 0 ? `${taggedCount}/${items.length} tagged` : "Optional — skip if not needed"}
          </span>
          <button
            onClick={onNext}
            className="px-6 py-2.5 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors"
          >
            {taggedCount > 0 ? "Continue" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

// ─── Step 3: Review & Schedule ────────────────────────────────────────────

const DAYS: { value: RefreshDay; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function StepReviewAndSchedule({
  integration,
  aliasName,
  selectedSource,
  frequency,
  day,
  refreshHour,
  refreshMinute,
  refreshAmPm,
  refreshMonthDay,
  onChangeFrequency,
  onChangeDay,
  onChangeHour,
  onChangeMinute,
  onChangeAmPm,
  onChangeMonthDay,
  onComplete,
}: {
  integration: CatalogIntegration;
  aliasName: string;
  selectedSource: string;
  frequency: RefreshFrequency;
  day: RefreshDay;
  refreshHour: string;
  refreshMinute: string;
  refreshAmPm: "AM" | "PM";
  refreshMonthDay: string;
  onChangeFrequency: (f: RefreshFrequency) => void;
  onChangeDay: (d: RefreshDay) => void;
  onChangeHour: (h: string) => void;
  onChangeMinute: (m: string) => void;
  onChangeAmPm: (ap: "AM" | "PM") => void;
  onChangeMonthDay: (d: string) => void;
  onComplete: () => void;
}) {
  const isUpload = UPLOAD_ONLY.has(integration.name);

  const tz = useMemo(() => {
    const name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date());
    const abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return { name, abbr };
  }, []);

  const scheduleLabel = useMemo(() => {
    const time = `${refreshHour}:${refreshMinute} ${refreshAmPm}`;
    if (frequency === "daily") return `Every day at ${time}`;
    if (frequency === "weekly") return `Every ${day.charAt(0).toUpperCase() + day.slice(1)} at ${time}`;
    return `${getOrdinal(parseInt(refreshMonthDay))} of every month at ${time}`;
  }, [frequency, day, refreshHour, refreshMinute, refreshAmPm, refreshMonthDay]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review &amp; Schedule</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Review your configuration and set a refresh schedule.</p>

      {/* ── Review Cards ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6">
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

        {/* Source */}
        {selectedSource && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
            <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Source</span>
            <span className="text-[var(--text-primary)] text-sm font-medium">{selectedSource}</span>
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
          <h3 className="text-[var(--text-primary)] text-base font-semibold">Refresh Schedule</h3>
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-5">
          {isUpload
            ? "Set how often you plan to re-upload updated data. We\u2019ll remind you when a refresh is due."
            : "Set how often we should pull new data from your source."}
        </p>

        {/* Frequency */}
        <div className="mb-5">
          <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Frequency</label>
          <div className="flex gap-3">
            {(["daily", "weekly", "monthly"] as RefreshFrequency[]).map((f) => (
              <button
                key={f}
                onClick={() => onChangeFrequency(f)}
                className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
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
          <div className="mb-5">
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Day of Week</label>
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

        {/* Monthly day picker */}
        {frequency === "monthly" && (
          <div className="mb-5">
            <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Day of Month</label>
            <select
              value={refreshMonthDay}
              onChange={(e) => onChangeMonthDay(e.target.value)}
              className="w-[100px] px-2.5 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none text-center cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              {MONTH_DAYS.map((d) => (<option key={d} value={d}>{getOrdinal(parseInt(d))}</option>))}
            </select>
          </div>
        )}

        {/* Time Picker */}
        <div className="mb-5">
          <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2.5">Time</label>
          <div className="flex items-center gap-2">
            <select value={refreshHour} onChange={(e) => onChangeHour(e.target.value)}
              className="w-[72px] px-2.5 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none text-center cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
            </select>
            <span className="text-[var(--text-muted)] text-lg font-light">:</span>
            <select value={refreshMinute} onChange={(e) => onChangeMinute(e.target.value)}
              className="w-[72px] px-2.5 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#027b8e] transition-colors appearance-none text-center cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              {MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <div className="flex rounded-lg border border-[var(--border-secondary)] overflow-hidden">
              <button onClick={() => onChangeAmPm("AM")} className={`px-3 py-2 text-xs font-medium transition-colors ${refreshAmPm === "AM" ? "bg-[#027b8e] text-white" : "bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>AM</button>
              <button onClick={() => onChangeAmPm("PM")} className={`px-3 py-2 text-xs font-medium transition-colors border-l border-[var(--border-secondary)] ${refreshAmPm === "PM" ? "bg-[#027b8e] text-white" : "bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>PM</button>
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

        {/* Schedule summary + first sync info */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-5">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#027b8e]/5 border-b border-[#027b8e]/10">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="8" r="6" stroke="#027b8e" strokeWidth="1.2" />
              <path d="M8 5v3.5l2.5 1.5" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#027b8e] text-sm font-medium">{scheduleLabel}</span>
            <span className="text-[#027b8e]/60 text-xs ml-auto">{tz.abbr}</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00bc7d] flex-shrink-0" />
              <span className="text-[var(--text-secondary)] text-xs">First sync starts immediately after connecting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)] flex-shrink-0" />
              <span className="text-[var(--text-dim)] text-xs">Subsequent syncs: {scheduleLabel} ({tz.abbr})</span>
            </div>
            {frequency === "monthly" && parseInt(refreshMonthDay) >= 29 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 flex-shrink-0" />
                <span className="text-[var(--text-dim)] text-[11px] italic">
                  {parseInt(refreshMonthDay) === 31
                    ? "For months with fewer than 31 days, the sync will run on the last day of the month."
                    : parseInt(refreshMonthDay) === 30
                    ? "In February, the sync will run on the last day of the month."
                    : "In February, the sync will run on the 28th (or 29th in leap years)."}
                </span>
              </div>
            )}
          </div>
        </div>

        {isUpload && (
          <div className="flex items-start gap-2 bg-[#fe9a00]/5 border border-[#fe9a00]/20 rounded-lg px-4 py-3 mb-5">
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
      </div>

      <button onClick={onComplete} className="w-full px-4 py-3 rounded-xl bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors">
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
  onChangeIntegrationType,
}: {
  integration: CatalogIntegration;
  onBack: () => void;
  onGoHome: () => void;
  onComplete: (name: string) => void;
  initialAlias?: string;
  onInviteUser?: (name: string) => void;
  /** Optional — when passed, Step 1 shows a "Change integration type" link */
  onChangeIntegrationType?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [aliasName, setAliasName] = useState(initialAlias);
  const [selectedSource, setSelectedSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [connected, setConnected] = useState(false);
  const [frequency, setFrequency] = useState<RefreshFrequency>("weekly");
  const [day, setDay] = useState<RefreshDay>("monday");
  const [refreshHour, setRefreshHour] = useState("9");
  const [refreshMinute, setRefreshMinute] = useState("00");
  const [refreshAmPm, setRefreshAmPm] = useState<"AM" | "PM">("AM");
  const [refreshMonthDay, setRefreshMonthDay] = useState("1");
  const [dataCategory, setDataCategory] = useState<MetricCategory[]>([]);
  const [sourceScopes, setSourceScopes] = useState<Record<string, AccountScope>>({});

  const currentStepName = STEPS[step - 1];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Top Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border-primary)] pb-0 -mx-4 px-4 mb-0">
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
          <span className="text-[var(--text-primary)] font-medium truncate">{aliasName || integration.name}</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-0.5">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            const canNavigate = isComplete && !isActive;
            return (
              <button
                key={label}
                onClick={() => canNavigate && setStep(stepNum)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${
                  canNavigate ? "cursor-pointer" : "cursor-default"
                } ${
                  isActive ? "text-[#027b8e]" : isComplete ? "text-[var(--text-muted)] hover:text-[#027b8e]" : "text-[var(--text-dim)]"
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
              </button>
            );
          })}
        </div>

        <div className="min-w-0 shrink-0 w-[100px] text-right">
          <span className="text-[var(--text-dim)] text-xs">Step {step} of {STEPS.length}</span>
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────── */}
      <div className="flex-1 py-8 px-4">
        {currentStepName === "Name & Connect" && (
          <StepNameAndConnect
            integration={integration}
            aliasName={aliasName}
            onChangeAlias={setAliasName}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
            fileName={fileName}
            onChangeFileName={setFileName}
            connected={connected}
            onChangeConnected={setConnected}
            onNext={() => setStep(step + 1)}
            onInviteUser={onInviteUser}
            onChangeIntegrationType={onChangeIntegrationType}
          />
        )}
        {currentStepName === "Tag Source" && (
          <StepTagSource
            integration={integration}
            selectedSource={selectedSource}
            aliasName={aliasName}
            fileName={fileName}
            scopes={sourceScopes}
            onScopesChange={setSourceScopes}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Data Type" && (
          <StepDataType
            value={dataCategory}
            onChange={setDataCategory}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Review" && (
          <StepReviewPreview
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
          />
        )}
        {currentStepName === "Schedule" && (
          <StepReviewAndSchedule
            integration={integration}
            aliasName={aliasName}
            selectedSource={selectedSource}
            frequency={frequency}
            day={day}
            refreshHour={refreshHour}
            refreshMinute={refreshMinute}
            refreshAmPm={refreshAmPm}
            refreshMonthDay={refreshMonthDay}
            onChangeFrequency={setFrequency}
            onChangeDay={setDay}
            onChangeHour={setRefreshHour}
            onChangeMinute={setRefreshMinute}
            onChangeAmPm={setRefreshAmPm}
            onChangeMonthDay={setRefreshMonthDay}
            onComplete={() => onComplete(aliasName)}
          />
        )}
      </div>
    </div>
  );
}
