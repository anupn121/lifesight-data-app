"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { CatalogIntegration } from "../monitoringData";
import type { MetricCategory } from "../fieldsData";
import { METRIC_CATEGORIES, initialFields } from "../fieldsData";
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

// ─── Step Components ───────────────────────────────────────────────────────

function StepAuthorize({
  integration,
  onNext,
  onInviteUser,
}: {
  integration: CatalogIntegration;
  onNext: () => void;
  onInviteUser?: (name: string) => void;
}) {
  const isGoogleSheets = integration.name === "Google Sheets";
  const [sheetUrl, setSheetUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"oauth" | "url">("oauth");

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: integration.color }}>
          <IntegrationIcon integration={integration} />
        </div>
      </div>
      <h2 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-2">
        Connect {integration.name}
      </h2>
      <p className="text-[var(--text-muted)] text-sm text-center mb-8">
        {isGoogleSheets
          ? "Connect your Google account or paste a sheet URL to get started"
          : `Authorize Lifesight to access your ${integration.name} data`}
      </p>

      {isGoogleSheets ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 p-1 bg-[var(--bg-card-inner)] rounded-lg border border-[var(--border-primary)]">
            <button
              onClick={() => setAuthMethod("oauth")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                authMethod === "oauth"
                  ? "bg-[#6941c6] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Connect Google Account
            </button>
            <button
              onClick={() => setAuthMethod("url")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                authMethod === "url"
                  ? "bg-[#6941c6] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Paste Sheet URL
            </button>
          </div>

          {authMethod === "oauth" ? (
            <button
              onClick={onNext}
              className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </svg>
              Connect Google Account
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
              />
              <button
                onClick={onNext}
                disabled={!sheetUrl.trim()}
                className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onNext}
          className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
          Authorize
        </button>
      )}

      {onInviteUser && (
        <button
          onClick={() => onInviteUser(integration.name)}
          className="w-full mt-4 text-center text-[#6941c6] text-sm hover:underline transition-colors"
        >
          Don&apos;t have access? Invite someone
        </button>
      )}
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
    `${integration.name} - Main Account`,
    `${integration.name} - Secondary`,
    `${integration.name} - Testing`,
  ];

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Select Accounts</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Choose which {integration.name} accounts to connect</p>
      <div className="flex flex-col gap-2 mb-6">
        {mockAccounts.map((account) => {
          const isSelected = selectedAccounts.includes(account);
          return (
            <button
              key={account}
              onClick={() => onToggleAccount(account)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left ${
                isSelected ? "border-[#6941c6] bg-[#6941c6]/5" : "border-[var(--border-secondary)] hover:border-[var(--border-secondary)]"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                  isSelected ? "bg-[#6941c6] border-[#6941c6] text-white" : "border-[var(--border-secondary)]"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[var(--text-primary)] text-sm">{account}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onNext}
        disabled={selectedAccounts.length === 0}
        className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Success / Done Step ──────────────────────────────────────────────────

function StepDone({
  integration,
  selectedAccounts,
  onComplete,
}: {
  integration: CatalogIntegration;
  selectedAccounts: string[];
  onComplete: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="w-20 h-20 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M12 20l5.5 5.5L28 14.5" stroke="#00bc7d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Successfully Connected!</h2>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        {integration.name} is now connected with {selectedAccounts.length} account{selectedAccounts.length !== 1 ? "s" : ""}.
      </p>
      <button
        onClick={onComplete}
        className="px-8 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
      >
        Done
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
                ? "bg-[#6941c6] border-[#6941c6]"
                : "border-[var(--border-secondary)] hover:border-[#6941c6]"
              : isAllChecked
              ? "bg-[#6941c6] border-[#6941c6]"
              : isPartial
              ? "bg-[#6941c6]/30 border-[#6941c6]"
              : "border-[var(--border-secondary)] hover:border-[#6941c6]"
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

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-6">
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
                    isSelected ? "bg-[#6941c6]/5" : "hover:bg-[var(--hover-item)]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "bg-[#6941c6] border-[#6941c6]" : "border-[var(--border-secondary)]"
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
          className="px-6 py-2.5 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StepChannelName({
  channelName,
  onChangeChannelName,
  onNext,
  isJspPreFilled,
}: {
  channelName: string;
  onChangeChannelName: (v: string) => void;
  onNext: () => void;
  isJspPreFilled?: boolean;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Name This Channel</h2>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Give this data source a recognizable name. This label identifies the integration across your monitoring dashboard.
      </p>

      <div className="mb-8">
        <label className="text-[var(--text-secondary)] text-sm font-medium block mb-2">Channel Name</label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => onChangeChannelName(e.target.value)}
          placeholder="e.g., SkyScanner, Kayak, Internal CRM"
          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
        />
        <p className="text-[var(--text-dim)] text-xs mt-2">
          Name this data source to identify it (e.g., SkyScanner, Kayak, Internal CRM)
        </p>
        {isJspPreFilled && (
          <p className="text-[#6941c6] text-xs mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.32 2.68L10 4.18l-2 1.95.47 2.75L6 7.7 3.53 8.88 4 6.13 2 4.18l2.68-.5L6 1z" fill="#6941c6" /></svg>
            Pre-filled from your setup plan
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!channelName.trim()}
        className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm transition-colors hover:border-[#6941c6] text-left min-w-[140px]"
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="text-[var(--text-primary)] truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-[#667085]">Select...</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-lg overflow-hidden">
          {(Object.entries(METRIC_CATEGORIES) as [MetricCategory, { label: string; color: string; description: string }][]).map(
            ([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-item)] ${
                  value === key ? "bg-[#6941c6]/5" : ""
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
  onChange,
  onDisplayNameChange,
}: {
  value: string;
  category: MetricCategory | "";
  onChange: (v: string, isNew: boolean) => void;
  onDisplayNameChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredFields = useMemo(() => {
    let fields = initialFields.filter((f) => f.kind === "metric");
    if (category) {
      fields = fields.filter((f) => f.metricCategory === category);
    }
    if (search) {
      const q = search.toLowerCase();
      fields = fields.filter(
        (f) => f.name.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q)
      );
    }
    return fields.slice(0, 15);
  }, [category, search]);

  return (
    <div className="relative" ref={ref}>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : value}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setSearch(value);
        }}
        placeholder="Search or type new..."
        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors min-w-[160px]"
      />

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
          {filteredFields.map((field) => (
            <button
              key={field.name}
              onClick={() => {
                onChange(field.name, false);
                onDisplayNameChange(field.displayName);
                setOpen(false);
                setSearch("");
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--hover-item)]"
            >
              <div className="min-w-0">
                <span className="text-[var(--text-primary)] text-sm block truncate">{field.name}</span>
                <span className="text-[var(--text-dim)] text-[10px] block truncate">{field.displayName}</span>
              </div>
              {field.metricCategory && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 ml-2"
                  style={{ backgroundColor: METRIC_CATEGORIES[field.metricCategory]?.color }}
                />
              )}
            </button>
          ))}

          {search.trim() && (
            <button
              onClick={() => {
                onChange(search.trim(), true);
                setOpen(false);
                setSearch("");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-item)] border-t border-[var(--border-primary)]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3v8M3 7h8" stroke="#6941c6" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[#6941c6] text-sm font-medium">Create &quot;{search.trim()}&quot;</span>
            </button>
          )}

          {!search.trim() && filteredFields.length === 0 && (
            <div className="px-3 py-4 text-center text-[var(--text-dim)] text-xs">
              No fields found{category ? ` in ${METRIC_CATEGORIES[category]?.label}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Column Mapping Step ───────────────────────────────────────────────────

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
  const allMapped = mappings.every((m) => m.category && m.targetKey && m.displayName);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Map Columns</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Map each detected column to a category and target field. Pick from existing fields or create new ones.
      </p>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden mb-6">
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
            {/* Source Column (read-only) */}
            <div className="flex items-center gap-2">
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
              onChange={(key, isNew) => onUpdateMapping(i, { targetKey: key, isNewKey: isNew })}
              onDisplayNameChange={(name) => onUpdateMapping(i, { displayName: name })}
            />

            {/* Display Name */}
            <input
              type="text"
              value={mapping.displayName}
              onChange={(e) => onUpdateMapping(i, { displayName: e.target.value })}
              placeholder="Display name..."
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card-inner)] text-sm text-[var(--text-primary)] placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!allMapped}
          className="px-6 py-2.5 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="w-20 h-20 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M12 20l5.5 5.5L28 14.5" stroke="#00bc7d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Successfully Connected!</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          <strong className="text-[var(--text-primary)]">{channelName}</strong> ({integration.name}) is now connected with{" "}
          {selectedTables.size} {integration.name === "BigQuery" ? "table" : "sheet"}{selectedTables.size !== 1 ? "s" : ""} and{" "}
          {mappings.length} mapped column{mappings.length !== 1 ? "s" : ""}.
        </p>
        <button
          onClick={onComplete}
          className="px-8 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">Review & Complete</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Review your configuration before connecting.</p>

      <div className="flex flex-col gap-4 mb-8">
        {/* Integration */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Integration</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: integration.color }}>
              <IntegrationIcon integration={integration} />
            </div>
            <span className="text-[var(--text-primary)] text-sm font-medium">{integration.name}</span>
          </div>
        </div>

        {/* Channel Name */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">Channel Name</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">{channelName}</span>
        </div>

        {/* Tables/Sheets */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
          <span className="text-[var(--text-dim)] text-xs font-semibold uppercase tracking-wider block mb-2">
            {integration.name === "BigQuery" ? "Selected Tables" : "Selected Sheets"}
          </span>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTables).map((id) => (
              <span
                key={id}
                className="px-2.5 py-1 rounded-full bg-[var(--bg-badge)] text-[var(--text-secondary)] text-xs font-medium"
              >
                {id}
              </span>
            ))}
          </div>
        </div>

        {/* Column Mappings */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
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
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6941c6]/10 text-[#6941c6] font-medium">New</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setDone(true)}
        className="w-full px-4 py-3 rounded-xl bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
      >
        Connect {channelName}
      </button>
    </div>
  );
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────

const DATA_SOURCE_STEPS = ["Authorize", "Select Data", "Channel Name", "Column Mapping", "Review"];
const STANDARD_STEPS = ["Authorize", "Select Accounts", "Done"];

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
  onComplete: (name: string) => void;
  initialAlias?: string;
  onInviteUser?: (name: string) => void;
}) {
  const isDataSource = DATA_SOURCE_INTEGRATIONS.has(integration.name);
  const steps = isDataSource ? DATA_SOURCE_STEPS : STANDARD_STEPS;

  const [step, setStep] = useState(1);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [channelName, setChannelName] = useState(initialAlias);
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

  const updateMapping = (index: number, update: Partial<ColumnMapping>) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...update } : m)));
  };

  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(account) ? prev.filter((a) => a !== account) : [...prev, account]
    );
  };

  const handleComplete = () => {
    onComplete(integration.name);
  };

  return (
    <div className="flex flex-col">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[var(--border-primary)] pb-0 -mx-4 px-4">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0 shrink-0">
          <button onClick={onGoHome} className="text-[var(--text-muted)] hover:text-[#6941c6] transition-colors">
            Integrations
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[#6941c6] transition-colors">
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
            return (
              <div key={label} className="relative px-4 py-3 flex items-center gap-2">
                <span
                  className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                    isComplete
                      ? "bg-[#00bc7d] text-white"
                      : isActive
                      ? "bg-[#6941c6] text-white"
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
                    isActive ? "text-[#6941c6]" : isComplete ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)]"
                  }`}
                >
                  {label}
                </span>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#6941c6] rounded-full" />}
              </div>
            );
          })}
        </div>

        {/* Right: step counter */}
        <div className="min-w-0 shrink-0 w-[180px] flex justify-end">
          {step < steps.length && (
            <span className="text-[var(--text-dim)] text-xs">Step {step} of {steps.length}</span>
          )}
        </div>
      </div>

      {/* Step content */}
      <div className="py-6">
        {isDataSource ? (
          <>
            {step === 1 && (
              <StepAuthorize integration={integration} onNext={() => setStep(2)} onInviteUser={onInviteUser} />
            )}
            {step === 2 && (
              <StepSelectTables
                integration={integration}
                selectedTables={selectedTables}
                onSelectTables={setSelectedTables}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <StepChannelName
                channelName={channelName}
                onChangeChannelName={setChannelName}
                onNext={() => setStep(4)}
                isJspPreFilled={!!initialAlias}
              />
            )}
            {step === 4 && (
              <StepColumnMapping
                integration={integration}
                mappings={mappings}
                onUpdateMapping={updateMapping}
                onNext={() => setStep(5)}
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
              <StepAuthorize integration={integration} onNext={() => setStep(2)} onInviteUser={onInviteUser} />
            )}
            {step === 2 && (
              <StepSelectAccounts
                integration={integration}
                selectedAccounts={selectedAccounts}
                onToggleAccount={toggleAccount}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <StepDone
                integration={integration}
                selectedAccounts={selectedAccounts}
                onComplete={handleComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
