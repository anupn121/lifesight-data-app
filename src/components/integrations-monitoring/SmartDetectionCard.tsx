"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  SMART DETECTION CARD
// ═══════════════════════════════════════════════════════════════════════════
//
//  The simple 2-click review screen that replaces manual column mapping.
//  Shows a one-line summary of what was detected with an [Import] button.
//  If user clicks [Something's off] they get a small correction menu with
//  the option to [Show all columns] which expands to the detailed view.
//
//  For scenarios where no source column was detected, the user MUST pick
//  a channel before they can import — this is the only mandatory decision.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  DetectionResult,
  DataCategory,
  DetectedColumn,
  CATEGORY_META,
  KNOWN_PLATFORMS,
  getSourceMeta,
  formatMetadataLine,
} from "./smartDetection";

// ─── Props ─────────────────────────────────────────────────────────────────

export interface SmartDetectionCardProps {
  result: DetectionResult;
  /** Called when user confirms import. Passes any overrides the user set. */
  onImport: (overrides: { channel?: string; category?: DataCategory }) => void;
  /** Optional back handler to return to previous step */
  onBack?: () => void;
}

type ViewMode =
  | "summary"           // default: one-line summary + Import button
  | "channel_pick"      // mandatory channel picker (for single-source)
  | "somethings_off"    // 3 correction options
  | "wrong_channel"     // channel picker (correction path)
  | "wrong_type"        // category buttons (correction path)
  | "show_columns";     // detailed column table

// ─── Main Component ────────────────────────────────────────────────────────

export function SmartDetectionCard({ result, onImport, onBack }: SmartDetectionCardProps) {
  // If detection says we need the user to pick a channel, start there.
  const initialMode: ViewMode = result.requiresSourcePick ? "channel_pick" : "summary";
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [pickedChannel, setPickedChannel] = useState<string | undefined>(result.suggestedChannel);
  const [categoryOverride, setCategoryOverride] = useState<DataCategory | undefined>(undefined);

  const handleImport = () => {
    onImport({ channel: pickedChannel, category: categoryOverride });
  };

  // ─── View: Channel Pick (Mandatory) ──────────────────────────────────────
  if (mode === "channel_pick") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
            Which channel is this data for?
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            This looks like <strong className="text-[var(--text-primary)]">{describeData(result)}</strong>, but there&apos;s no channel column. Pick one to continue.
          </p>
          {result.suggestedChannel && (
            <p className="text-[#027b8e] text-xs mt-1.5">
              <span className="inline-block mr-1">★</span>
              We suggest <strong>{result.suggestedChannel}</strong> based on the name.
            </p>
          )}
        </div>

        <ChannelPicker
          value={pickedChannel}
          onChange={(v) => setPickedChannel(v)}
        />

        <div className="flex items-center justify-between mt-6">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
            >
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={() => setMode("summary")}
            disabled={!pickedChannel}
            className="px-5 py-2 rounded-lg bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ─── View: Show All Columns (expanded detail) ────────────────────────────
  if (mode === "show_columns") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-1">
              All {result.columns.length} columns
            </h2>
            <p className="text-[var(--text-muted)] text-sm">
              Review every column and its detected category. Click any row to change.
            </p>
          </div>
          <button
            onClick={() => setMode("summary")}
            className="text-[#027b8e] text-xs hover:underline"
          >
            ← Back to summary
          </button>
        </div>

        <ColumnsTable columns={result.columns} previewRows={result.previewRows} />

        <div className="flex items-center justify-between mt-5">
          {onBack ? (
            <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-medium">
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={handleImport}
            className="px-5 py-2 rounded-lg bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors"
          >
            Looks good — Import →
          </button>
        </div>
      </div>
    );
  }

  // ─── View: Something's Off (3 options) ────────────────────────────────────
  if (mode === "somethings_off") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">What&apos;s wrong?</h2>
          <button
            onClick={() => setMode("summary")}
            className="text-[#027b8e] text-xs hover:underline"
          >
            ← Back
          </button>
        </div>

        <div className="grid gap-3">
          <CorrectionButton
            icon="🎯"
            label="Wrong channel"
            description="The channel was mismatched or I want to change it"
            onClick={() => setMode("wrong_channel")}
          />
          <CorrectionButton
            icon="📊"
            label="Wrong data type"
            description="This isn't ad spend — it's revenue, organic, or something else"
            onClick={() => setMode("wrong_type")}
          />
          <CorrectionButton
            icon="🔍"
            label="Show all columns"
            description="Let me review every column and its detected category"
            onClick={() => setMode("show_columns")}
          />
        </div>
      </div>
    );
  }

  // ─── View: Wrong Channel Correction ──────────────────────────────────────
  if (mode === "wrong_channel") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">Which channel is it?</h2>
          <button
            onClick={() => setMode("somethings_off")}
            className="text-[#027b8e] text-xs hover:underline"
          >
            ← Back
          </button>
        </div>

        <ChannelPicker value={pickedChannel} onChange={(v) => setPickedChannel(v)} />

        <div className="flex justify-end mt-6">
          <button
            onClick={() => setMode("summary")}
            disabled={!pickedChannel}
            className="px-5 py-2 rounded-lg bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply →
          </button>
        </div>
      </div>
    );
  }

  // ─── View: Wrong Data Type Correction ────────────────────────────────────
  if (mode === "wrong_type") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">What kind of data is this?</h2>
          <button
            onClick={() => setMode("somethings_off")}
            className="text-[#027b8e] text-xs hover:underline"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["paid_marketing", "kpi", "organic", "contextual"] as DataCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = categoryOverride === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryOverride(cat);
                  setMode("summary");
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[#027b8e] bg-[#027b8e]/5"
                    : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    {meta.icon}
                  </div>
                  <span className="text-[var(--text-primary)] text-sm font-semibold">
                    {meta.label}
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                  {describeCategory(cat)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── View: Summary (Default / Happy Path) ────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00bc7d]/10 border border-[#00bc7d]/25 mb-5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="#00bc7d">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.354 5.354-4 4a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7 9.293l3.646-3.647a.5.5 0 0 1 .708.708z" />
          </svg>
          <span className="text-[#00bc7d] text-xs font-semibold">Ready to import</span>
        </div>

        <h2 className="text-[var(--text-primary)] text-2xl font-semibold mb-2 leading-tight">
          {pickedChannel && result.requiresSourcePick
            ? result.summary.replace(result.suggestedChannel || "this channel", pickedChannel)
            : result.summary}
        </h2>

        <p className="text-[var(--text-muted)] text-sm">
          {formatMetadataLine(result)}
        </p>

        {/* Small category summary (always visible, tiny, non-intrusive) */}
        {result.categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className="text-[var(--text-dim)] text-xs">Contains:</span>
            {result.categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                  style={{
                    backgroundColor: `${meta.color}18`,
                    color: meta.color,
                    border: `1px solid ${meta.color}33`,
                  }}
                >
                  {meta.icon} {meta.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Channel override indicator (when user corrected) */}
        {pickedChannel && !result.requiresSourcePick && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            Channel set to <strong className="text-[var(--text-primary)]">{pickedChannel}</strong>
          </div>
        )}
        {categoryOverride && (
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            Data type overridden to <strong className="text-[var(--text-primary)]">{CATEGORY_META[categoryOverride].label}</strong>
          </div>
        )}
      </div>

      {/* Primary actions */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={handleImport}
          className="px-8 py-3 rounded-lg bg-[#027b8e] hover:bg-[#02899e] text-white text-sm font-semibold transition-colors"
        >
          Import
        </button>
        <button
          onClick={() => setMode("somethings_off")}
          className="px-5 py-3 rounded-lg border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
        >
          Something&apos;s off →
        </button>
      </div>

      {/* Footer helper text */}
      {onBack && (
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="text-[var(--text-dim)] hover:text-[var(--text-muted)] text-xs transition-colors"
          >
            ← Choose a different source
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ChannelPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {KNOWN_PLATFORMS.map((platform) => {
        const meta = getSourceMeta(platform);
        const isSelected = value === platform;
        const textColor = meta.color === "#FFFC00" ? "#000" : "#fff";
        return (
          <button
            key={platform}
            onClick={() => onChange(platform)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-[#027b8e] bg-[#027b8e]/5"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] hover:bg-[var(--hover-item)]"
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: meta.color, color: textColor }}
            >
              {meta.letter}
            </div>
            <span className={`text-xs font-medium ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
              {platform}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CorrectionButton({
  icon,
  label,
  description,
  onClick,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[#027b8e] hover:bg-[#027b8e]/3 transition-all text-left"
    >
      <div className="w-11 h-11 rounded-lg bg-[var(--bg-card-inner)] flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[var(--text-primary)] text-sm font-semibold mb-0.5">{label}</div>
        <div className="text-[var(--text-muted)] text-xs">{description}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--text-dim)]">
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </button>
  );
}

function ColumnsTable({
  columns,
  previewRows,
}: {
  columns: DetectedColumn[];
  previewRows: Record<string, string | number>[];
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
              {columns.map((col) => {
                const meta = col.category ? CATEGORY_META[col.category] : null;
                const color = meta?.color || "#6B7280";
                return (
                  <th key={col.name} className="px-3 py-2.5 text-left whitespace-nowrap border-r border-[var(--border-primary)] last:border-r-0">
                    <div className="font-mono text-[var(--text-primary)] text-[11px] font-semibold mb-1.5">{col.name}</div>
                    {meta ? (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        {meta.icon} {columnRoleLabel(col.role)}
                      </span>
                    ) : (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        {columnRoleLabel(col.role)}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border-subtle)] last:border-b-0">
                {columns.map((col) => (
                  <td
                    key={col.name}
                    className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap font-mono border-r border-[var(--border-subtle)] last:border-r-0"
                  >
                    {row[col.name] !== undefined ? String(row[col.name]) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-[var(--bg-card-inner)] border-t border-[var(--border-primary)] flex items-center justify-between">
        <span className="text-[var(--text-dim)] text-[11px]">
          Showing {previewRows.length} rows · {columns.length} columns
        </span>
        <span className="text-[var(--text-dim)] text-[11px]">
          Stratified sample (one row per source group)
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function describeData(result: DetectionResult): string {
  // Used in the channel_pick screen header
  const typeLabel: Record<DataCategory, string> = {
    paid_marketing: "ad spend data",
    kpi: "KPI data",
    organic: "organic metrics",
    contextual: "contextual data",
  };
  return typeLabel[result.primaryCategory];
}

function describeCategory(cat: DataCategory): string {
  switch (cat) {
    case "paid_marketing":
      return "Ad spend, impressions, clicks — money you paid to acquire users";
    case "kpi":
      return "Revenue, conversions, orders — outcomes you want to improve";
    case "organic":
      return "Email opens, organic social, SEO — non-paid marketing activity";
    case "contextual":
      return "Weather, holidays, product launches — external factors";
  }
}

function columnRoleLabel(role: DetectedColumn["role"]): string {
  const labels: Record<DetectedColumn["role"], string> = {
    date: "Date",
    dimension: "Dimension",
    source: "Source",
    campaign: "Campaign",
    ad_group: "Ad Group",
    ad: "Ad",
    account: "Account",
    event_name: "Event",
    paid_metric: "Paid Metric",
    kpi_metric: "KPI",
    organic_metric: "Organic",
    contextual_continuous: "Contextual (cont.)",
    contextual_binary: "Contextual (binary)",
    ignored: "Ignored",
  };
  return labels[role];
}
