"use client";

import { useState, useEffect, useRef } from "react";
import type { CatalogIntegration } from "../monitoringData";
import { IntegrationIcon } from "./icons";

export function InfoTooltip({ integration }: { integration: CatalogIntegration }) {
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

  const docsSlug = integration.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors flex-shrink-0"
        title="Integration info"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="4.5" r="0.75" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-[var(--dropdown-bg)] border border-[var(--border-secondary)] rounded-[6px] shadow-[var(--shadow-popover)] backdrop-blur-sm z-50 p-4">
          <p className="text-[var(--text-primary)] text-xs font-semibold mb-1">{integration.name}</p>
          <p className="text-[var(--text-muted)] text-[11px] leading-relaxed mb-3">{integration.description}</p>
          <a
            href={`https://docs.lifesight.io/integrations/${docsSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#027b8e] text-[11px] font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View documentation
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1h6v6M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

export function IntegrationCard({ integration, onConnect, showPartnerBadge, descriptionOverride, onDelegate, isInSetupPlan }: { integration: CatalogIntegration; onConnect: () => void; showPartnerBadge?: boolean; descriptionOverride?: string; onDelegate?: () => void; isInSetupPlan?: boolean }) {
  return (
    <div
      onClick={onConnect}
      className={`bg-[var(--bg-card)] border rounded-[8px] px-4 py-4 flex items-start gap-3 hover:border-[var(--border-secondary)] cursor-pointer transition-all duration-150 relative ${isInSetupPlan ? "border-[var(--border-primary)] ring-1 ring-[#027b8e]/15" : "border-[var(--border-primary)]"}`}
    >
      {isInSetupPlan && (
        <span className="absolute top-2 right-2 text-[10px] font-medium text-[#027b8e] bg-[#027b8e]/8 px-2 py-[3px] rounded-[4px]">In your setup plan</span>
      )}
      <IntegrationIcon integration={integration} />
      <div className="min-w-0 pt-0.5 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-primary)] text-sm font-medium">{integration.name}</span>
          {showPartnerBadge && (
            <span className="px-2 py-[3px] rounded-[4px] bg-[#2b7fff]/10 text-[#2b7fff] text-[10.5px] font-medium border border-[#2b7fff]/20">
              Partner
            </span>
          )}
          <InfoTooltip integration={integration} />
        </div>
        <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{descriptionOverride || integration.description}</p>
        {onDelegate && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onConnect(); }}
              className="px-3 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
            >
              Connect
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelegate(); }}
              className="px-3 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[var(--text-secondary)] text-[12px] font-medium hover:bg-[var(--hover-item)] transition-colors"
            >
              Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
