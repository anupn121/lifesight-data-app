"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  EXPRESSION EDITOR
// ═══════════════════════════════════════════════════════════════════════════
//
//  A single, flexible formula editor that replaces the old 3-mode
//  (Basic Math / Combine / Ratio or Conditional) derived-metric builder.
//  Users can write arbitrary nested expressions like:
//
//      ((revenue - cost) / revenue) * 100
//
//  • Monospace textarea with a purple accent (matches the formula grammar
//    used throughout the app)
//  • Floating operator palette — click to insert at cursor
//  • Column chips — click to insert at cursor (backed by the workspace's
//    existing column names)
//  • Live paren-balance and unknown-identifier validation
//
//  The safe evaluator in `sampleDataMock.ts` already supports arbitrary
//  expressions with the operators listed in the palette, so users can write
//  any combination they want.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useRef, useState } from "react";
import { extractReferencedColumns } from "./StatusBadge";

// ─── Operator palette ─────────────────────────────────────────────────────

interface PaletteItem {
  label: string;
  insert: string;
  title?: string;
  /** Cursor offset from the end of the inserted text (negative = back from end) */
  caretOffset?: number;
}

const CORE_OPS: PaletteItem[] = [
  { label: "+", insert: " + ", title: "Add" },
  { label: "−", insert: " - ", title: "Subtract" },
  { label: "×", insert: " * ", title: "Multiply" },
  { label: "÷", insert: " / ", title: "Divide (safe)" },
  { label: "( )", insert: "()", title: "Group", caretOffset: -1 },
];

const FUNCTIONS: PaletteItem[] = [
  { label: "round", insert: "ROUND(, 2)", title: "Round to decimals", caretOffset: -4 },
  { label: "abs", insert: "ABS()", title: "Absolute value", caretOffset: -1 },
  { label: "min", insert: "LEAST(, )", title: "Minimum of two values", caretOffset: -3 },
  { label: "max", insert: "GREATEST(, )", title: "Maximum of two values", caretOffset: -3 },
  { label: "if", insert: "CASE WHEN  THEN  ELSE  END", title: "If / then / else", caretOffset: -22 },
];

// ─── Props ────────────────────────────────────────────────────────────────

interface ExpressionEditorProps {
  value: string;
  onChange: (v: string) => void;
  /** Column names available in the workspace — shown as click-to-insert chips */
  columnOptions: string[];
  /** Optional: highlight referenced columns that don't exist yet */
  strictColumns?: boolean;
}

export function ExpressionEditor({
  value,
  onChange,
  columnOptions,
  strictColumns = false,
}: ExpressionEditorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [filter, setFilter] = useState("");

  // Ensure the textarea has something sensible to focus even on first render
  const safeValue = value ?? "";

  const filteredColumns = useMemo(() => {
    if (!filter.trim()) return columnOptions;
    const q = filter.toLowerCase();
    return columnOptions.filter((c) => c.toLowerCase().includes(q));
  }, [columnOptions, filter]);

  const referenced = useMemo(() => extractReferencedColumns(safeValue), [safeValue]);
  const available = useMemo(() => new Set(columnOptions), [columnOptions]);
  const missingRefs = useMemo(
    () => referenced.filter((r) => !available.has(r)),
    [referenced, available],
  );

  // Insert text at the textarea's current caret position
  const insertAt = (text: string, caretOffsetFromEnd = 0) => {
    const el = inputRef.current;
    if (!el) {
      onChange(safeValue + text);
      return;
    }
    const start = el.selectionStart ?? safeValue.length;
    const end = el.selectionEnd ?? safeValue.length;
    const next = safeValue.slice(0, start) + text + safeValue.slice(end);
    onChange(next);
    const caret = start + text.length + caretOffsetFromEnd;
    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      node.focus();
      node.selectionStart = caret;
      node.selectionEnd = caret;
    });
  };

  const balanceIssue = useMemo(() => {
    const open = (safeValue.match(/\(/g) || []).length;
    const close = (safeValue.match(/\)/g) || []).length;
    if (open !== close) return `Unbalanced parentheses (${open} open, ${close} close)`;
    return null;
  }, [safeValue]);

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Expression textarea ─────────────────────────────────────── */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., ((revenue - cost) / revenue) * 100"
          rows={2}
          spellCheck={false}
          className={`w-full bg-[var(--bg-card-inner)] border rounded-[8px] text-sm font-mono text-[#a78bfa] px-3 py-3 resize-none focus:outline-none focus:ring-1 transition-all placeholder-[var(--text-dim)] ${
            balanceIssue || (strictColumns && missingRefs.length > 0)
              ? "border-[#ff2056] focus:border-[#ff2056] focus:ring-[#ff2056]/30"
              : "border-[var(--border-secondary)] focus:border-[#a78bfa] focus:ring-[#a78bfa]/30"
          }`}
        />
        {safeValue && (
          <button
            onClick={() => {
              onChange("");
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-[4px] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-item)] transition-colors"
            title="Clear"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── Validation line ─────────────────────────────────────────── */}
      {(balanceIssue || (strictColumns && missingRefs.length > 0)) && (
        <div className="flex items-center gap-1.5 text-xs text-[#ff2056]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5v2.5M6 8v0.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {balanceIssue || `Unknown column${missingRefs.length === 1 ? "" : "s"}: ${missingRefs.slice(0, 3).join(", ")}${missingRefs.length > 3 ? "…" : ""}`}
        </div>
      )}

      {/* ─── Operator palette ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {CORE_OPS.map((op) => (
          <PaletteButton key={op.label} item={op} onInsert={insertAt} tone="blue" />
        ))}
        <Divider />
        {FUNCTIONS.map((fn) => (
          <PaletteButton key={fn.label} item={fn} onInsert={insertAt} tone="purple" />
        ))}
      </div>

      {/* ─── Column chips ─────────────────────────────────────────────── */}
      <div className="rounded-[8px] border border-[var(--border-primary)] bg-[var(--bg-card-inner)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--border-primary)] flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">
            Columns
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Click to insert
          </span>
          <div className="flex-1" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="w-[140px] text-xs px-2 py-1 rounded-[4px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
          />
        </div>
        <div className="px-3 py-3 max-h-[140px] overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-1">
              {columnOptions.length === 0
                ? "No columns available yet — add a mapped field first."
                : "No columns match that filter."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredColumns.map((col) => {
                const used = referenced.includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => insertAt(col)}
                    className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] border text-xs font-mono transition-colors ${
                      used
                        ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#a78bfa]/40 hover:text-[#a78bfa]"
                    }`}
                    title={`Insert "${col}"`}
                  >
                    {used && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {col}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Palette button ────────────────────────────────────────────────────────

function PaletteButton({
  item,
  onInsert,
  tone,
}: {
  item: PaletteItem;
  onInsert: (text: string, caretOffsetFromEnd?: number) => void;
  tone: "blue" | "purple";
}) {
  const accent = tone === "blue" ? "#2b7fff" : "#a78bfa";
  return (
    <button
      onClick={() => onInsert(item.insert, item.caretOffset)}
      title={item.title || item.label}
      className="inline-flex items-center justify-center min-w-[36px] h-[32px] px-2.5 rounded-[6px] border text-sm font-mono font-semibold transition-all"
      style={{
        color: accent,
        borderColor: `${accent}30`,
        backgroundColor: `${accent}08`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}60`;
        e.currentTarget.style.backgroundColor = `${accent}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${accent}30`;
        e.currentTarget.style.backgroundColor = `${accent}08`;
      }}
    >
      {item.label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-[var(--border-primary)] mx-1 self-center" />;
}
