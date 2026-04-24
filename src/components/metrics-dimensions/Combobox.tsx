"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  COMBOBOX
// ═══════════════════════════════════════════════════════════════════════════
//
//  A clean, design-system-aligned dropdown that replaces the native
//  <select appearance-none>. Works in two modes:
//
//  • allowCustom = true  → combobox: input is always editable; typing filters
//    options AND updates the underlying value; clicking an option overwrites.
//    Good for display names, source columns, column names.
//
//  • allowCustom = false → select: input acts as a search filter; typing does
//    NOT change value; only clicking an option commits. Good for data types,
//    integrations, currencies.
//
//  Styling matches the form-input grammar used elsewhere in the modal
//  (bg-card-inner, rounded-[6px], focus:border-[#027b8e], focus:ring-1).
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useMemo } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  /** Colored dot rendered on the left of the option */
  accent?: string;
  /** Custom leading icon (overrides accent) */
  leading?: React.ReactNode;
  /** Custom trailing element (e.g., type badge) */
  trailing?: React.ReactNode;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** When true, typing updates value; when false, typing only filters. */
  allowCustom?: boolean;
  monospace?: boolean;
  error?: boolean;
  disabled?: boolean;
  /** Optional footer hint under the dropdown (e.g., "Type to search") */
  footer?: React.ReactNode;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowCustom = false,
  monospace = false,
  error = false,
  disabled = false,
  footer,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Filter options by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const hasCustomOption =
    allowCustom &&
    query.trim() &&
    !options.some((o) => o.value === query || o.label === query);

  const selected = options.find((o) => o.value === value);

  const inputClass = `w-full bg-[var(--bg-card-inner)] border rounded-[6px] text-sm text-[var(--text-primary)] px-3 py-2.5 placeholder-[var(--text-dim)] focus:outline-none transition-all ${
    monospace ? "font-mono" : ""
  } ${
    error
      ? "border-[#ff2056] focus:border-[#ff2056] focus:ring-1 focus:ring-[#ff2056]/30"
      : open
      ? "border-[#027b8e] ring-1 ring-[#027b8e]/30"
      : "border-[var(--border-secondary)] hover:border-[var(--border-secondary)]/80"
  } ${selected?.accent ? "pl-8" : ""} pr-9 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const displayValue = open ? query : selected?.label ?? value;

  return (
    <div ref={wrapRef} className="relative">
      {/* Leading color dot */}
      {!open && selected?.accent && (
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none z-10"
          style={{ backgroundColor: selected.accent, boxShadow: `0 0 0 3px ${selected.accent}20` }}
        />
      )}

      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          if (allowCustom) onChange(e.target.value);
        }}
        onFocus={() => !disabled && setOpen(true)}
        onClick={() => !disabled && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={!allowCustom && !open}
        className={inputClass}
      />

      {/* Trailing chevron */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={`absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none transition-transform ${
          open ? "rotate-180" : ""
        }`}
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[8px] overflow-hidden"
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <div className="max-h-[280px] overflow-y-auto py-1">
            {filtered.length === 0 && !hasCustomOption && (
              <div className="px-3 py-2.5 text-xs text-[var(--text-muted)]">No results</div>
            )}
            {filtered.map((o) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#027b8e]/10 text-[#027b8e]"
                      : "hover:bg-[var(--hover-item)]"
                  }`}
                >
                  {/* Leading: icon or color dot */}
                  {o.leading ? (
                    <span className="flex-shrink-0">{o.leading}</span>
                  ) : o.accent ? (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: o.accent }}
                    />
                  ) : null}
                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm truncate ${monospace ? "font-mono" : ""} ${
                        isSelected ? "text-[#027b8e] font-medium" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {o.label}
                    </div>
                    {o.description && (
                      <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {o.description}
                      </div>
                    )}
                  </div>
                  {/* Trailing badge */}
                  {o.trailing && <span className="flex-shrink-0">{o.trailing}</span>}
                  {/* Check */}
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="flex-shrink-0 text-[#027b8e]"
                    >
                      <path
                        d="M2.5 6.5l2.5 2.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
            {hasCustomOption && (
              <button
                onClick={() => handleSelect(query)}
                className="w-full text-left px-3 py-2 hover:bg-[var(--hover-item)] transition-colors border-t border-[var(--border-primary)] flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)]">
                  <path
                    d="M6 2v8M2 6h8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs text-[var(--text-muted)]">Use </span>
                <span
                  className={`text-xs text-[var(--text-primary)] ${
                    monospace ? "font-mono" : ""
                  } truncate`}
                >
                  &quot;{query}&quot;
                </span>
              </button>
            )}
          </div>
          {footer && (
            <div className="border-t border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-dim)] bg-[var(--bg-card-inner)]">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
