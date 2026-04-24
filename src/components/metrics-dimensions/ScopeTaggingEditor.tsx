"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  SCOPE TAGGING EDITOR
// ═══════════════════════════════════════════════════════════════════════════
//
//  Used in the wizards to tag accounts (native ad channels), sheets (file
//  integrations), or tables (data warehouses) with business scope:
//  Brand · Product · Country · Region.
//
//  Optimized for the "10+ items, grouped tagging" workflow the user described
//  ("3 accounts to GAP/US, 4 to Banana Republic/US, 3 to Old Navy/UK"):
//
//  • Multi-select checkboxes on each row
//  • Top bar: "Apply tags to N selected" → opens a bulk-apply popover
//  • Per-row inline Combobox dropdowns for targeted edits
//  • Live summary pill in each row ("GAP · US · California")
//
//  This is a TAGGING step — entirely optional. The parent wizard renders a
//  Skip button that bypasses it.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Combobox } from "./Combobox";
import {
  type AccountScope,
  type ScopeDimension,
  SCOPE_DIMENSIONS,
  mergeScope,
  hasAnyScope,
  formatScopeSummary,
} from "./scopeTypes";

export interface ScopeTaggingItem {
  id: string;
  name: string;
  subtitle?: string;
  /** Optional badge shown in the row header (e.g., platform account ID) */
  badge?: string;
}

interface ScopeTaggingEditorProps {
  /** What kind of thing is being tagged — shapes copy ("accounts", "sheets", "tables") */
  kind: "accounts" | "sheets" | "tables";
  items: ScopeTaggingItem[];
  value: Record<string, AccountScope>;
  onChange: (next: Record<string, AccountScope>) => void;
  /** Optional preset values to show in each dimension dropdown. Workspace-wide canonical suggestions. */
  suggestions?: Partial<Record<ScopeDimension, string[]>>;
}

// ─── Defaults: a small, sensible starter set for each dimension ────────────

const DEFAULT_SUGGESTIONS: Record<ScopeDimension, string[]> = {
  brand: ["GAP", "Banana Republic", "Old Navy", "Athleta"],
  product: ["Apparel", "Footwear", "Accessories"],
  country: ["US", "United Kingdom", "Canada", "Australia", "Germany"],
  region: ["US East", "US West", "APAC", "EMEA", "California", "New York", "London"],
};

// ─── Main component ────────────────────────────────────────────────────────

export function ScopeTaggingEditor({
  kind,
  items,
  value,
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
}: ScopeTaggingEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<AccountScope>({});

  // Merge user-provided suggestions with defaults
  const mergedSuggestions = useMemo(() => {
    const m: Record<ScopeDimension, string[]> = { ...DEFAULT_SUGGESTIONS };
    for (const d of SCOPE_DIMENSIONS) {
      if (suggestions?.[d.key]) {
        m[d.key] = Array.from(new Set([...(suggestions[d.key] ?? []), ...DEFAULT_SUGGESTIONS[d.key]]));
      }
    }
    return m;
  }, [suggestions]);

  const kindNoun = kind === "accounts" ? "account" : kind === "sheets" ? "sheet" : "table";
  const kindNounPlural = kind;

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const applyBulk = () => {
    if (!hasAnyScope(bulkDraft) || selected.size === 0) return;
    const next = { ...value };
    for (const id of Array.from(selected)) {
      next[id] = mergeScope(next[id], bulkDraft);
    }
    onChange(next);
    setBulkDraft({});
    setBulkOpen(false);
    setSelected(new Set());
  };

  const updateRow = (id: string, patch: Partial<AccountScope>) => {
    onChange({ ...value, [id]: { ...value[id], ...patch } });
  };

  const clearRow = (id: string) => {
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  const taggedCount = items.filter((i) => hasAnyScope(value[i.id])).length;

  return (
    <div className="rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
      {/* ─── Header: select-all + bulk actions ──────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
        <SelectCheckbox
          checked={selected.size === items.length && items.length > 0}
          indeterminate={selected.size > 0 && selected.size < items.length}
          onToggle={toggleSelectAll}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[var(--text-primary)] text-sm font-semibold">
            {taggedCount > 0
              ? `${taggedCount}/${items.length} ${kindNounPlural} tagged`
              : `Tag your ${kindNounPlural}`}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Assign Brand, Product, Country, and Region so metrics can be filtered and grouped downstream.
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setBulkOpen((v) => !v)}
            disabled={selected.size === 0}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-semibold transition-colors ${
              selected.size === 0
                ? "text-[var(--text-dim)] cursor-not-allowed"
                : "bg-[#027b8e] hover:bg-[#025e6d] text-white"
            }`}
          >
            Apply tags to {selected.size || 0} selected
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2.5 3.5L5 6L7.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {bulkOpen && selected.size > 0 && (
            <BulkPopover
              draft={bulkDraft}
              onChange={setBulkDraft}
              onApply={applyBulk}
              onClose={() => {
                setBulkOpen(false);
                setBulkDraft({});
              }}
              suggestions={mergedSuggestions}
              count={selected.size}
              kindNoun={kindNoun}
            />
          )}
        </div>
      </div>

      {/* ─── Column headers ───────────────────────────────────────────── */}
      <div className="grid grid-cols-[32px_minmax(0,2fr)_repeat(4,minmax(0,1fr))_32px] gap-3 px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)]">
        <div />
        <HeaderCell>{kindNoun}</HeaderCell>
        {SCOPE_DIMENSIONS.map((d) => (
          <HeaderCell key={d.key}>{d.label}</HeaderCell>
        ))}
        <div />
      </div>

      {/* ─── Rows ─────────────────────────────────────────────────────── */}
      <div className="max-h-[380px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
            No {kindNounPlural} selected yet.
          </div>
        ) : (
          items.map((item) => {
            const scope = value[item.id] || {};
            const isSelected = selected.has(item.id);
            return (
              <div
                key={item.id}
                className={`grid grid-cols-[32px_minmax(0,2fr)_repeat(4,minmax(0,1fr))_32px] gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 transition-colors ${
                  isSelected ? "bg-[#027b8e]/5" : "hover:bg-[var(--hover-bg)]"
                }`}
              >
                <div className="flex items-center">
                  <SelectCheckbox checked={isSelected} onToggle={() => toggleSelect(item.id)} />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] text-sm font-medium truncate">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="font-mono text-xs text-[var(--text-dim)] bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] px-1.5 py-[1px] rounded-[3px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  )}
                  {hasAnyScope(scope) && (
                    <div className="text-xs text-[#00bc7d] truncate mt-1">
                      {formatScopeSummary(scope)}
                    </div>
                  )}
                </div>
                {SCOPE_DIMENSIONS.map((d) => (
                  <Combobox
                    key={d.key}
                    value={scope[d.key] ?? ""}
                    onChange={(v) => updateRow(item.id, { [d.key]: v || undefined })}
                    options={mergedSuggestions[d.key].map((val) => ({ value: val, label: val }))}
                    placeholder={d.label}
                    allowCustom
                  />
                ))}
                <div className="flex items-center justify-center">
                  {hasAnyScope(scope) && (
                    <button
                      onClick={() => clearRow(item.id)}
                      title={`Clear tags from ${item.name}`}
                      className="w-6 h-6 rounded-[4px] flex items-center justify-center text-[var(--text-muted)] hover:text-[#ff2056] hover:bg-[#ff2056]/8 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Bulk-apply popover ────────────────────────────────────────────────────

function BulkPopover({
  draft,
  onChange,
  onApply,
  onClose,
  suggestions,
  count,
  kindNoun,
}: {
  draft: AccountScope;
  onChange: (v: AccountScope) => void;
  onApply: () => void;
  onClose: () => void;
  suggestions: Record<ScopeDimension, string[]>;
  count: number;
  kindNoun: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-[calc(100%+4px)] z-50 w-[380px] bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[10px] overflow-hidden"
        style={{ boxShadow: "var(--shadow-xl)" }}
      >
        <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-card-inner)]">
          <div className="text-[var(--text-primary)] text-sm font-semibold">
            Apply to {count} {count === 1 ? kindNoun : `${kindNoun}s`}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Leave a dimension blank to keep existing values.
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {SCOPE_DIMENSIONS.map((d) => (
            <div key={d.key}>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                {d.label}
              </label>
              <Combobox
                value={draft[d.key] ?? ""}
                onChange={(v) => onChange({ ...draft, [d.key]: v || undefined })}
                options={suggestions[d.key].map((val) => ({ value: val, label: val }))}
                placeholder={d.description}
                allowCustom
              />
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-card-inner)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 h-8 rounded-[6px] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={!hasAnyScope(draft)}
            className="px-4 h-8 rounded-[6px] text-xs font-semibold text-white bg-[#027b8e] hover:bg-[#025e6d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply tags
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
      {children}
    </div>
  );
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  onToggle,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? "bg-[#027b8e] border-[#027b8e]"
          : "border-[var(--border-secondary)] hover:border-[#027b8e]/60 bg-transparent"
      }`}
    >
      {checked && !indeterminate && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2 2 4-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && <span className="w-2 h-[1.5px] bg-white rounded-full" />}
    </button>
  );
}
