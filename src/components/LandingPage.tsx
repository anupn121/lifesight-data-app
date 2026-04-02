"use client";

import { type ProductMode, PRODUCT_MODE_LIST, PIPELINE_STEPS, type ProductModeConfig } from "./productMode";

interface LandingPageProps {
  onSelectMode: (mode: ProductMode) => void;
}

/* ─── Product badge pill ──────────────────────────────────────────────────── */
function ProductBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

/* ─── Pipeline step in the flow diagram ───────────────────────────────────── */
function PipelineStep({ label, description, active, isLast }: { label: string; description: string; active: boolean; isLast: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 min-w-[140px] ${
          active
            ? "border-[#027b8e] bg-[#027b8e]/8"
            : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] opacity-40"
        }`}
      >
        <span className={`text-[12px] font-semibold ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
          {label}
        </span>
        <span className={`text-[10px] mt-0.5 ${active ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)]"}`}>
          {description}
        </span>
      </div>
      {!isLast && (
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className={active ? "text-[#027b8e]" : "text-[var(--border-primary)] opacity-40"}>
          <path d="M0 6h16M13 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

/* ─── Mode card ───────────────────────────────────────────────────────────── */
function ModeCard({ config, onSelect }: { config: ProductModeConfig; onSelect: () => void }) {
  const visibleSet = new Set(config.visibleTabs);

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] transition-all duration-200 overflow-hidden">
      {/* Color accent top bar */}
      <div className="h-[3px] w-full" style={{ background: config.color }} />

      <div className="flex flex-col gap-4 p-5 flex-1">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[var(--text-primary)] text-[15px] font-semibold">{config.label}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {config.products.map((p) => (
              <ProductBadge key={p} label={p} color={config.color} />
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-[12px] leading-[1.6]">{config.description}</p>

        {/* Included tabs checklist */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <span className="text-[var(--text-muted)] text-[10px] font-medium uppercase tracking-wider">Included Tabs</span>
          {PIPELINE_STEPS.map((step) => {
            const included = visibleSet.has(step.tabId);
            return (
              <div key={step.tabId} className="flex items-center gap-2">
                {included ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill={config.color} fillOpacity="0.15" />
                    <path d="M4.5 7l1.8 1.8 3.2-3.6" stroke={config.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="var(--border-primary)" strokeWidth="1" />
                    <path d="M5 7h4" stroke="var(--text-dim)" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                )}
                <span className={`text-[12px] ${included ? "text-[var(--text-primary)]" : "text-[var(--text-dim)]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Select button */}
      <div className="px-5 pb-5">
        <button
          onClick={onSelect}
          className="w-full h-[34px] rounded-[6px] text-[12px] font-semibold transition-all duration-150 border"
          style={{
            background: `${config.color}12`,
            borderColor: `${config.color}30`,
            color: config.color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${config.color}22`;
            e.currentTarget.style.borderColor = `${config.color}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${config.color}12`;
            e.currentTarget.style.borderColor = `${config.color}30`;
          }}
        >
          Select
        </button>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ───────────────────────────────────────────────────── */
export default function LandingPage({ onSelectMode }: LandingPageProps) {
  return (
    <div className="max-w-[960px] mx-auto pb-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-[-0.5px]">
          Welcome to Lifesight Data
        </h1>
        <p className="text-[var(--text-secondary)] text-[14px] mt-2 max-w-[520px] mx-auto leading-[1.6]">
          Choose your measurement use case to get started. This determines which tools and configurations are available to you.
        </p>
      </div>

      {/* Pipeline flow diagram — shows all 4 steps */}
      <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((step, i) => (
          <PipelineStep
            key={step.tabId}
            label={step.label}
            description={step.description}
            active={true}
            isLast={i === PIPELINE_STEPS.length - 1}
          />
        ))}
      </div>

      {/* Mode cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {PRODUCT_MODE_LIST.map((config) => (
          <ModeCard
            key={config.id}
            config={config}
            onSelect={() => onSelectMode(config.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-[var(--text-dim)] text-[11px] mt-6">
        You can change your selection at any time from the page header.
      </p>
    </div>
  );
}
