"use client";

import { useState } from "react";

export type OnboardingStep = "sync-success" | "review-data" | "data-confirmed" | "flag-demo" | "flag-submitted";

export default function PostSyncOnboarding({
  integrationName,
  onComplete,
}: {
  integrationName: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<OnboardingStep>("sync-success");

  // Sample mock data for review
  const sampleRows = [
    { date: "2026-03-03", impressions: "45,230", clicks: "1,204", spend: "$342.50", conversions: "87" },
    { date: "2026-03-02", impressions: "41,887", clicks: "1,098", spend: "$318.20", conversions: "74" },
    { date: "2026-03-01", impressions: "39,412", clicks: "1,156", spend: "$305.80", conversions: "81" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">

        {/* Step 1: Sync Successful */}
        {step === "sync-success" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M10 16l4 4 8-8" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Data synced successfully!</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              {integrationName} has been connected and your data is ready. Would you like to review the synced data?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onComplete}
                className="px-5 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep("review-data")}
                className="px-5 py-2 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
              >
                Review data
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review Data */}
        {step === "review-data" && (
          <div className="p-6">
            <h3 className="text-[var(--text-primary)] text-base font-semibold mb-1">Review synced data</h3>
            <p className="text-[var(--text-muted)] text-xs mb-4">Here&apos;s a preview of the data we pulled from {integrationName}. Does this look correct?</p>

            <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden mb-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--bg-primary)]">
                    <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Date</th>
                    <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Impressions</th>
                    <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Clicks</th>
                    <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Spend</th>
                    <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row) => (
                    <tr key={row.date} className="border-t border-[var(--border-primary)]">
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{row.date}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{row.impressions}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{row.clicks}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{row.spend}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{row.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[var(--text-primary)] text-sm font-medium mb-3">Does this data look correct?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("data-confirmed")}
                className="flex-1 px-4 py-2 rounded-lg bg-[#00bc7d] hover:bg-[#00a86e] text-white text-sm font-medium transition-colors"
              >
                Yes, looks good
              </button>
              <button
                onClick={() => setStep("flag-demo")}
                className="flex-1 px-4 py-2 rounded-lg border border-[#ff2056]/30 text-[#ff2056] text-sm font-medium hover:bg-[#ff2056]/5 transition-colors"
              >
                Something looks off
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Data confirmed — show kebab menu guide */}
        {step === "data-confirmed" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M10 16l4 4 8-8" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Great, you&apos;re all set!</h3>
            <p className="text-[var(--text-muted)] text-sm mb-5">
              If you notice data issues in the future, you can flag them anytime from the integration&apos;s menu.
            </p>

            {/* Kebab menu visual guide */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 mb-5 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-badge)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3.5" r="1" fill="var(--text-muted)" />
                    <circle cx="8" cy="8" r="1" fill="var(--text-muted)" />
                    <circle cx="8" cy="12.5" r="1" fill="var(--text-muted)" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-xs font-medium">Click the three-dot menu</p>
                  <p className="text-[var(--text-dim)] text-[10px]">Available on each integration in the monitoring view</p>
                </div>
              </div>
              <div className="ml-11 space-y-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[var(--text-secondary)] text-[11px]">View details</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff2056]/5 border border-[#ff2056]/20">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 3v4M6 9v0" stroke="#ff2056" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[#ff2056] text-[11px] font-medium">Report data issue</span>
                </div>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="px-6 py-2 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Got it, done
            </button>
          </div>
        )}

        {/* Step 3b: Flag issue */}
        {step === "flag-demo" && (
          <div className="p-6">
            <h3 className="text-[var(--text-primary)] text-base font-semibold mb-1">Report a data issue</h3>
            <p className="text-[var(--text-muted)] text-xs mb-4">Let us know what looks off and we&apos;ll investigate.</p>

            <textarea
              placeholder="Describe the issue (e.g., spend numbers seem too low, missing data for certain dates...)"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-secondary)] px-3 py-2 h-24 resize-none placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep("review-data")}
                className="px-4 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("flag-submitted")}
                className="flex-1 px-4 py-2 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
              >
                Submit report
              </button>
            </div>
          </div>
        )}

        {/* Step 3c: Flag submitted */}
        {step === "flag-submitted" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#2b7fff]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M10 16l4 4 8-8" stroke="#2b7fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Report submitted</h3>
            <p className="text-[var(--text-muted)] text-sm mb-2">
              Our team will look into this issue for {integrationName}.
            </p>
            <div className="bg-[#2b7fff]/5 border border-[#2b7fff]/20 rounded-lg px-4 py-3 mb-6 text-left">
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
                  <path d="M8 6v4" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="0.5" fill="#2b7fff" />
                </svg>
                <p className="text-[#2b7fff] text-xs leading-relaxed">
                  In the meanwhile, we&apos;ll continue fetching new data from {integrationName} so you don&apos;t miss anything while we investigate.
                </p>
              </div>
            </div>
            <button
              onClick={onComplete}
              className="px-6 py-2 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
