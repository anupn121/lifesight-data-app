"use client";

import { useState } from "react";
import type { CatalogIntegration } from "../monitoringData";
import { IntegrationIcon } from "./icons";

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
}

export function SupportModal({
  open,
  name,
  success,
  onClose,
  onSubmit,
}: {
  open: boolean;
  name: string;
  success: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--text-primary)] text-lg font-semibold">
            {success ? "Support Request Submitted" : "Report Data Issue"}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 16l4 4 8-8" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p className="text-[var(--text-primary)] text-sm font-medium mb-1">Request submitted successfully</p>
            <p className="text-[var(--text-muted)] text-xs">Our team will investigate the data issue for {name}.</p>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              This will raise an internal support request for <strong className="text-[var(--text-primary)]">{name}</strong>. Our team will investigate the data quality issue.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors">
                Cancel
              </button>
              <button onClick={onSubmit} className="px-4 py-2 rounded-lg bg-[#ff2056] hover:bg-[#e01b4c] text-white text-sm font-medium transition-colors">
                Raise Support Request
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function RequestedModal({
  open,
  integration,
  onClose,
}: {
  open: boolean;
  integration: CatalogIntegration | null;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {integration && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <IntegrationIcon integration={integration} />
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">{integration.name}</h3>
            {integration.requestedDate && (
              <p className="text-[var(--text-dim)] text-xs mb-2">
                Requested on {new Date(integration.requestedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
              Our team is currently working on this integration. We&apos;ll notify you as soon as it&apos;s ready.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function OAuthModal({
  open,
  integration,
  step,
  selectedAccounts,
  onClose,
  onNextStep,
  onToggleAccount,
  onComplete,
}: {
  open: boolean;
  integration: CatalogIntegration | null;
  step: number;
  selectedAccounts: string[];
  onClose: () => void;
  onNextStep: () => void;
  onToggleAccount: (account: string) => void;
  onComplete: () => void;
}) {
  const mockAccounts = ["Account 1 - Main", "Account 2 - Secondary", "Account 3 - Testing"];
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        {integration && step === 1 && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <IntegrationIcon integration={integration} />
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Connect {integration.name}</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">Authorize Lifesight to access your {integration.name} data</p>
            <button
              onClick={onNextStep}
              className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Authorize
            </button>
          </div>
        )}
        {integration && step === 2 && (
          <div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-1">Select Accounts</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">Choose which accounts to connect</p>
            <div className="flex flex-col gap-2 mb-6">
              {mockAccounts.map((account) => {
                const isSelected = selectedAccounts.includes(account);
                return (
                  <button
                    key={account}
                    onClick={() => onToggleAccount(account)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${isSelected ? "border-[#6941c6] bg-[#6941c6]/5" : "border-[var(--border-secondary)] hover:border-[var(--border-secondary)]"}`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSelected ? "bg-[#6941c6] border-[#6941c6] text-white" : "border-[var(--border-secondary)]"}`}>
                      {isSelected && "\u2713"}
                    </span>
                    <span className="text-[var(--text-primary)] text-sm">{account}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={onNextStep}
              disabled={selectedAccounts.length === 0}
              className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
        {integration && step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 16l4 4 8-8" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Successfully Connected!</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">{integration.name} is now connected with {selectedAccounts.length} account(s).</p>
            <button
              onClick={onComplete}
              className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function RequestFormModal({
  open,
  name,
  details,
  onClose,
  onChangeName,
  onChangeDetails,
  onSubmit,
}: {
  open: boolean;
  name: string;
  details: string;
  onClose: () => void;
  onChangeName: (v: string) => void;
  onChangeDetails: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--text-primary)] text-lg font-semibold">Request Integration</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[var(--text-secondary)] text-sm font-medium block mb-1.5">Integration Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="e.g. Mixpanel"
              className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
            />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-sm font-medium block mb-1.5">Details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => onChangeDetails(e.target.value)}
              placeholder="Tell us about your use case..."
              rows={3}
              className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors resize-none"
            />
          </div>
          <button
            onClick={onSubmit}
            className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InviteUserModal({
  open,
  integrationName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  integrationName: string;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setEmail("");
    setMessage("");
    setSent(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!email) return;
    onSubmit(email, message);
    setSent(true);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--text-primary)] text-lg font-semibold">
            {sent ? "Invite Sent" : "Invite a teammate"}
          </h3>
          <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#00bc7d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 16l4 4 8-8" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p className="text-[var(--text-primary)] text-sm font-medium mb-1">Invite sent to {email}</p>
            <p className="text-[var(--text-muted)] text-xs mb-6">They&apos;ll receive an email with instructions to connect {integrationName}.</p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-muted)] text-sm mb-5">
              Send an invite to someone who has access to <strong className="text-[var(--text-primary)]">{integrationName}</strong>.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[var(--text-secondary)] text-sm font-medium block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-sm font-medium block mb-1.5">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey, can you connect this integration?"
                  rows={3}
                  className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] px-3 py-2 placeholder-[#667085] focus:outline-none focus:border-[#6941c6] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={handleClose} className="px-4 py-2 rounded-lg border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!email}
                  className="px-4 py-2 rounded-lg bg-[#6941c6] hover:bg-[#7c5bd2] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
