"use client";

const MOCK_ROWS: string[][] = [
  ["2024-01-01", "Facebook", "Brand Q1", "$5,000", "250,000", "3,120"],
  ["2024-01-01", "Google", "Search Q1", "$3,000", "145,000", "2,450"],
  ["2024-01-01", "TikTok", "Video Awareness", "$2,000", "98,000", "1,620"],
  ["2024-01-02", "Facebook", "Brand Q1", "$4,800", "240,000", "2,980"],
  ["2024-01-02", "Google", "Search Q1", "$2,900", "142,000", "2,410"],
  ["2024-01-02", "TikTok", "Video Awareness", "$1,950", "96,000", "1,580"],
  ["2024-01-03", "Facebook", "Brand Q1", "$5,320", "251,000", "3,200"],
  ["2024-01-03", "Google", "Search Q1", "$3,210", "148,000", "2,520"],
];

const COLUMNS = ["date", "source", "campaign", "spend", "impressions", "clicks"];

export function DataPreviewTable() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-[var(--bg-card-inner)] border-b border-[var(--border-primary)]">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[var(--text-muted)] text-xs font-semibold whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border-subtle)] last:border-b-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2.5 text-[var(--text-secondary)] whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-[var(--bg-card-inner)] border-t border-[var(--border-primary)] text-[var(--text-dim)] text-xs">
        Showing 8 of ~1,200 rows
      </div>
    </div>
  );
}
