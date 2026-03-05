"use client";

import { useState, useRef, useEffect } from "react";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FilterDropdown({
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-card)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors min-w-[140px] justify-between"
      >
        <span>{value}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg shadow-xl z-50 min-w-[180px] py-1">
          <button
            onClick={() => { onChange(`All ${label}`); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-item)] transition-colors ${value === `All ${label}` ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}`}
          >
            All {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-item)] transition-colors ${value === opt ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
