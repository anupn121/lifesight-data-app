"use client";

import type { MetricCategory } from "../fieldsData";

interface Card {
  id: MetricCategory;
  title: string;
  description: string;
  examples: string[];
  accent: string;
  icon: string;
}

const CATEGORY_CARDS: Card[] = [
  {
    id: "kpi",
    title: "KPIs",
    description: "The outcomes you track — what matters to your business",
    examples: ["Revenue", "Orders", "Conversions", "Signups", "Store visits"],
    accent: "#00bc7d",
    icon: "💵",
  },
  {
    id: "paid_marketing",
    title: "Paid Marketing",
    description: "Ad spend and performance from your paid channels",
    examples: ["Facebook spend", "Google impressions", "TikTok clicks", "CPC", "CPM"],
    accent: "#2b7fff",
    icon: "💰",
  },
  {
    id: "organic",
    title: "Organic & Owned",
    description: "Non-paid marketing — email, SEO, organic social",
    examples: ["Email opens", "Instagram organic", "SEO clicks", "Newsletter signups"],
    accent: "#fe9a00",
    icon: "🌱",
  },
  {
    id: "contextual",
    title: "External Factors",
    description: "Things outside your control that affect performance",
    examples: ["Weather", "Holidays", "Product launches", "Fuel prices", "Competitor activity"],
    accent: "#a855f7",
    icon: "🌡",
  },
];

export function DataCategoryPicker({
  value,
  onChange,
}: {
  value: MetricCategory[];
  onChange: (v: MetricCategory[]) => void;
}) {
  const toggle = (id: MetricCategory) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      {CATEGORY_CARDS.map((card) => {
        const selected = value.includes(card.id);
        return (
          <button
            key={card.id}
            onClick={() => toggle(card.id)}
            className={`relative text-left p-5 rounded-[10px] border-2 transition-all ${
              selected
                ? "border-[#027b8e] bg-[#027b8e]/5"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)]"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
              >
                {card.icon}
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="text-[var(--text-primary)] text-sm font-semibold">
                  {card.title}
                </div>
                <div className="text-[var(--text-muted)] text-xs mt-1 leading-relaxed">
                  {card.description}
                </div>
              </div>
              {selected && (
                <div className="ml-auto w-5 h-5 rounded-full bg-[#027b8e] flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {card.examples.map((ex) => (
                <span
                  key={ex}
                  className="px-2 py-[3px] rounded-[4px] bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-xs"
                >
                  {ex}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
