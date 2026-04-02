"use client";

import { type DataTypeKey, DATA_TYPES, SOURCE_STREAM_TABLES } from "../fieldsData";

const DataTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    CURRENCY: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    FLOAT64: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    NUMERIC: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    INT64: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    STRING: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    DATE: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    BIGNUMERIC: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    JSON: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    Currency: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    Percentage: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    Ratio: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Number: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    String: "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20",
    Enum: "bg-[#027b8e]/10 text-[#a78bfa] border-[#027b8e]/20",
    Date: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
  };
  // Marketer-friendly display names
  const friendlyNames: Record<string, string> = {
    CURRENCY: "Currency",
    FLOAT64: "Decimal",
    NUMERIC: "Number",
    INT64: "Number",
    STRING: "Text",
    DATE: "Date",
    BIGNUMERIC: "Number",
    JSON: "Object",
  };
  const display = friendlyNames[type] || DATA_TYPES[type as DataTypeKey]?.display || type;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colors[type] || "bg-[var(--hover-item)] text-[var(--text-muted)] border-[var(--border-subtle)]"}`}
    >
      {display}
    </span>
  );
};

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className="absolute left-3 top-1/2 -translate-y-1/2"
  >
    <path
      d="M6.41667 11.0833C8.994 11.0833 11.0833 8.994 11.0833 6.41667C11.0833 3.83934 8.994 1.75 6.41667 1.75C3.83934 1.75 1.75 3.83934 1.75 6.41667C1.75 8.994 3.83934 11.0833 6.41667 11.0833Z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.25 12.25L9.71252 9.71252"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SummaryCell({ label, count, sources }: { label: string; count: number; sources: string[] }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 border-l-2 border-[var(--border-subtle)] first:border-l-0">
      <span className="text-[var(--text-primary)] text-[13px] font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        {sources.length > 0 ? (
          <>
            <span className="text-[#00bc7d] text-[11px] font-medium">{count} integrations</span>
            <div className="flex -space-x-1.5">
              {sources.slice(0, 5).map((s) => {
                const srcInfo = Object.entries(SOURCE_STREAM_TABLES).find(([k]) => k === s);
                const color = srcInfo ? srcInfo[1].color : "#9CA3AF";
                return (
                  <span
                    key={s}
                    className="w-4 h-4 rounded-full border-[1.5px] border-[var(--bg-card)] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color }}
                    title={s}
                  >
                    <span className="text-[6px] text-white font-bold">{s[0]}</span>
                  </span>
                );
              })}
              {sources.length > 5 && (
                <span className="w-4 h-4 rounded-full bg-[var(--bg-badge)] border-[1.5px] border-[var(--bg-card)] flex items-center justify-center text-[6px] text-[var(--text-label)] font-bold">
                  +{sources.length - 5}
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="text-[var(--text-label)] text-[11px]">Not mapped</span>
        )}
      </div>
    </div>
  );
}

export { DataTypeBadge, SearchIcon, SummaryCell };
