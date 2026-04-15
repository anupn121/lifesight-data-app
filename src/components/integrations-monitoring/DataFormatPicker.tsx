"use client";

export type DataLayout = "long" | "wide";

const LONG_EXAMPLE: string[][] = [
  ["date", "source", "spend"],
  ["2024-01-01", "Facebook", "$5,000"],
  ["2024-01-01", "Google", "$3,000"],
  ["2024-01-01", "TikTok", "$2,000"],
  ["2024-01-02", "Facebook", "$4,800"],
];

const WIDE_EXAMPLE: string[][] = [
  ["date", "fb_spend", "google_spend", "tt_spend"],
  ["2024-01-01", "$5,000", "$3,000", "$2,000"],
  ["2024-01-02", "$4,800", "$2,900", "$1,950"],
  ["2024-01-03", "$5,320", "$3,210", "$2,180"],
];

export function DataFormatPicker({
  value,
  onChange,
}: {
  value: DataLayout | null;
  onChange: (v: DataLayout) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormatCard
        title="One row per channel, per day"
        description="Every row represents a single channel's daily performance. Common when you have many channels or campaigns and track them separately."
        example={LONG_EXAMPLE}
        bestFor="Best if you have many channels, or your data comes from a data warehouse"
        selected={value === "long"}
        onClick={() => onChange("long")}
      />
      <FormatCard
        title="One row per day, channels in columns"
        description="Each date has a single row with every channel's metrics spread across columns."
        example={WIDE_EXAMPLE}
        bestFor="Best if you have a small fixed set of channels, or your spreadsheet has channel-prefixed columns like fb_spend"
        selected={value === "wide"}
        onClick={() => onChange("wide")}
      />
    </div>
  );
}

function FormatCard({
  title,
  description,
  example,
  bestFor,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  example: string[][];
  bestFor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-[10px] border-2 transition-all flex flex-col ${
        selected
          ? "border-[#027b8e] bg-[#027b8e]/5"
          : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="text-[var(--text-primary)] text-sm font-semibold">{title}</div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-[#027b8e] flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="text-[var(--text-muted)] text-xs mb-4 leading-relaxed">{description}</div>

      <div className="bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-[6px] overflow-hidden mb-3">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-[var(--bg-badge)]">
              {example[0].map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left text-[var(--text-muted)] text-xs font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {example.slice(1).map((row, i) => (
              <tr key={i} className="border-t border-[var(--border-subtle)]">
                {row.map((cell, j) => (
                  <td key={j} className="px-2 py-1.5 text-[var(--text-secondary)] whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[var(--text-dim)] text-xs italic mt-auto">{bestFor}</div>
    </button>
  );
}
