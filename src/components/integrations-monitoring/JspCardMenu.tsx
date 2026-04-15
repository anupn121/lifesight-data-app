"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  JSP CARD MENU
// ═══════════════════════════════════════════════════════════════════════════
//
//  Small kebab menu rendered in the top-right of JSP cards in the
//  "Finish Your Integration Setup" section. Exposes two actions:
//    - Ignore              (all JSP types — native, file, warehouse)
//    - Change Integration  (file/warehouse only — native is platform-fixed)
//
//  Pattern mirrors the existing KebabMenu.tsx (click-outside handling,
//  absolute positioning, menu item styling). See the approved plan at
//  .claude/plans/dazzling-snuggling-pearl.md for context.
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState } from "react";
import type { JspIntegrationType } from "./jspData";

interface JspCardMenuProps {
  integrationType: JspIntegrationType;
  onIgnore: () => void;
  onChangeIntegrationType?: () => void;
}

export default function JspCardMenu({
  integrationType,
  onIgnore,
  onChangeIntegrationType,
}: JspCardMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showChangeType = integrationType !== "native" && !!onChangeIntegrationType;

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label="Card options"
        className="p-1 rounded-[4px] hover:bg-[var(--hover-item)] transition-colors text-[var(--text-muted)]"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="8" cy="13" r="1.4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-50 min-w-[200px] py-1">
          {showChangeType && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onChangeIntegrationType!();
              }}
              className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)]">
                <path d="M2 4l2-2 2 2M4 2v6M12 10l-2 2-2-2M10 12V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Change integration type
            </button>
          )}
          {showChangeType && <div className="border-t border-[var(--border-subtle)] my-1" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onIgnore();
            }}
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)]">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Ignore
          </button>
        </div>
      )}
    </div>
  );
}
