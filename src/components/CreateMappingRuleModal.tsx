"use client";

import { useState } from "react";

type ModalTab = "ai" | "manual";

interface CreateMappingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTactics: string[];
  onTacticCreated?: (tactic: string) => void;
}

// --- Condition fields available (from Metrics & Dimensions) ---
const conditionFields = [
  "Campaign Name",
  "Objective",
  "Source",
  "Origin",
  "Account Name",
  "Account ID",
  "Platform",
  "Ad Set Name",
  "Country",
  "Funnel Stage",
];

const operators = [
  "is",
  "is not",
  "contains",
  "does not contain",
  "starts with",
  "ends with",
];

const quantifiers = ["All of these", "Any of these"];

// tacticOptions removed — now passed via props

// --- Existing rules ---
const existingRules = [
  { name: "2D Rules", conditions: "When campaign_name contains 2D and origin is platform", tactic: "Google 2D" },
  { name: "Google Shopping Rules", conditions: "When campaign_name contains shopping and origin is platform", tactic: "Google Shopping" },
  { name: "3D Rules", conditions: "When campaign_name contains 3D and origin is platform", tactic: "Google 3D" },
  { name: "1D Rules", conditions: "When campaign_name contains 1D and origin is platform", tactic: "Google 1D" },
];

interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

// --- Dropdown component ---
function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  color,
  searchable,
  onCreateNew,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
  color?: "purple" | "default";
  searchable?: boolean;
  onCreateNew?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = searchable && search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const canCreate = searchable && onCreateNew && search.trim() && !options.some((o) => o.toLowerCase() === search.toLowerCase());

  const borderColor = color === "purple" ? "border-[#6941c6]" : "border-[var(--border-secondary)]";
  const textColor = color === "purple" ? "text-[#6941c6]" : value ? "text-[var(--text-primary)]" : "text-[var(--text-label)]";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`bg-[var(--bg-badge)] border ${borderColor} rounded-md px-3 py-1.5 text-xs ${textColor} flex items-center gap-2 min-w-[120px] justify-between hover:border-[var(--border-secondary)] transition-colors`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-md shadow-xl z-50 min-w-[180px] max-h-[220px] overflow-hidden flex flex-col">
            {searchable && (
              <div className="p-2 border-b border-[var(--border-secondary)]">
                <div className="relative">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2">
                    <path d="M5.5 9.5C7.71 9.5 9.5 7.71 9.5 5.5C9.5 3.29 7.71 1.5 5.5 1.5C3.29 1.5 1.5 3.29 1.5 5.5C1.5 7.71 3.29 9.5 5.5 9.5Z" stroke="#667085" strokeWidth="0.8" strokeLinecap="round"/>
                    <path d="M10.5 10.5L8.33 8.33" stroke="#667085" strokeWidth="0.8" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search or Create"
                    className="bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded text-xs text-[var(--text-secondary)] pl-7 pr-2 py-1.5 w-full placeholder-[#667085] focus:outline-none focus:border-[#6941c6]"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="overflow-y-auto">
              {canCreate && (
                <button
                  onClick={() => {
                    onCreateNew(search.trim());
                    onChange(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#00bc7d] hover:bg-[#00bc7d]/10 transition-colors border-b border-[var(--border-secondary)]"
                >
                  + Create &quot;{search.trim()}&quot;
                </button>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--hover-item)] transition-colors ${opt === value ? "text-[#6941c6] bg-[#6941c6]/5" : "text-[var(--text-secondary)]"}`}
                >
                  {opt}
                </button>
              ))}
              {filtered.length === 0 && !canCreate && (
                <p className="px-3 py-2 text-xs text-[var(--text-label)]">No results</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Manual Builder ---
function ManualBuilder({ availableTactics, onTacticCreated }: { availableTactics: string[]; onTacticCreated?: (tactic: string) => void }) {
  const [ruleName, setRuleName] = useState("");
  const [quantifier, setQuantifier] = useState("All of these");
  const [conditions, setConditions] = useState<ConditionRow[]>([
    { field: "", operator: "", value: "" },
  ]);
  const [tactic, setTactic] = useState("");

  const updateCondition = (idx: number, key: keyof ConditionRow, val: string) => {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: "", operator: "", value: "" }]);
  };

  const removeCondition = (idx: number) => {
    if (conditions.length > 1) {
      setConditions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Rule Name */}
      <div>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="Enter Rule Name"
          className="bg-transparent border-b border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[#475467] w-full pb-2 focus:outline-none focus:border-[#6941c6] transition-colors"
        />
      </div>

      {/* Condition Builder */}
      <div className="flex flex-col gap-3">
        {/* Quantifier */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span>When</span>
          <Dropdown value={quantifier} options={quantifiers} onChange={setQuantifier} placeholder="Select" color="purple" />
          <span>occur</span>
        </div>

        {/* Condition Rows */}
        {conditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Dropdown
              value={cond.field}
              options={conditionFields}
              onChange={(v) => updateCondition(idx, "field", v)}
              placeholder="Select"
            />
            <Dropdown
              value={cond.operator}
              options={operators}
              onChange={(v) => updateCondition(idx, "operator", v)}
              placeholder="select"
              color="purple"
            />
            <Dropdown
              value={cond.value}
              options={["2D", "3D", "1D", "shopping", "MOF", "BOF", "TOF", "retargeting", "awareness", "video", "leads"]}
              onChange={(v) => updateCondition(idx, "value", v)}
              placeholder="Select"
            />
            {/* Add / Remove */}
            <button
              onClick={addCondition}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--hover-item)] text-[var(--text-label)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              title="Add condition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3.5V10.5M3.5 7H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            {conditions.length > 1 && (
              <button
                onClick={() => removeCondition(idx)}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--hover-item)] text-[var(--text-label)] hover:text-[#ff2056] transition-colors flex-shrink-0"
                title="Remove condition"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Set Tactic */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">Set tactic to</span>
        <Dropdown
          value={tactic}
          options={availableTactics}
          onChange={setTactic}
          placeholder="Select"
          searchable
          onCreateNew={onTacticCreated}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button className="flex-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors">
          Clear all
        </button>
        <button className="flex-1 bg-[#6941c6] hover:bg-[#5b34b5] rounded-lg py-2.5 text-sm text-white font-medium transition-colors">
          Apply
        </button>
      </div>

      {/* Existing Rules */}
      <div className="border-t border-[var(--border-primary)] pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Existing Rules</span>
          <button className="text-xs text-[#6941c6] hover:text-[#5b34b5] font-medium transition-colors">+ Add New Rules</button>
        </div>
        {existingRules.map((rule) => (
          <div key={rule.name} className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-3 hover:border-[var(--border-secondary)] transition-colors">
            <p className="text-[var(--text-primary)] text-xs font-medium mb-1">{rule.name}</p>
            <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
              {rule.conditions.split(/(campaign_name|origin|platform|shopping|2D|3D|1D)/).map((part, i) => {
                if (["campaign_name", "origin", "platform"].includes(part)) {
                  return <span key={i} className="text-[#6941c6] cursor-pointer hover:underline">{part}</span>;
                }
                if (["shopping", "2D", "3D", "1D"].includes(part)) {
                  return <span key={i} className="text-[#6941c6] cursor-pointer hover:underline">{part}</span>;
                }
                return <span key={i}>{part}</span>;
              })}
              {" set Tactic to "}
              <span className="text-[#6941c6] cursor-pointer hover:underline">{rule.tactic}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- AI Builder ---
function AIBuilder({ availableTactics }: { availableTactics: string[] }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<typeof existingRules | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedRules([
        { name: "Meta MOF Rule", conditions: "When campaign_name contains MOF and origin is platform", tactic: "Meta MOF" },
        { name: "Meta BOF Rule", conditions: "When campaign_name contains BOF and origin is platform and objective is conversions", tactic: "Meta" },
        { name: "Google Shopping Rule", conditions: "When campaign_name contains shopping and origin is platform", tactic: "Google Shopping" },
      ]);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* AI Prompt */}
      <div>
        <label className="text-xs text-[var(--text-muted)] mb-2 block">Describe your mapping rules in plain language</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Map all campaigns with '2D' in the name from Google to 'Google 2D' tactic. Map campaigns containing 'shopping' to 'Google Shopping'..."
          rows={4}
          className="bg-[var(--bg-card-inner)] border border-[var(--border-secondary)] rounded-lg text-xs text-[var(--text-secondary)] p-3 w-full placeholder-[#475467] focus:outline-none focus:border-[#6941c6] transition-colors resize-none"
        />
      </div>

      {/* Available Context */}
      <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-3">
        <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold mb-2">Available fields from Metrics & Dimensions</p>
        <div className="flex flex-wrap gap-1.5">
          {conditionFields.map((f) => (
            <span key={f} className="bg-[#6941c6]/10 text-[#a78bfa] border border-[#6941c6]/20 text-[10px] px-2 py-0.5 rounded font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Available Tactics */}
      <div className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-lg p-3">
        <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold mb-2">Available tactics</p>
        <div className="flex flex-wrap gap-1.5">
          {availableTactics.map((t) => (
            <span key={t} className="bg-[#00bc7d]/10 text-[#00bc7d] border border-[#00bc7d]/20 text-[10px] px-2 py-0.5 rounded font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || generating}
        className="bg-[#6941c6] hover:bg-[#5b34b5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            Generating rules...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.33 8.67V12.67C13.33 13.02 13.19 13.36 12.94 13.61C12.69 13.86 12.35 14 12 14H3.33C2.98 14 2.64 13.86 2.39 13.61C2.14 13.36 2 13.02 2 12.67V4C2 3.65 2.14 3.31 2.39 3.06C2.64 2.81 2.98 2.67 3.33 2.67H7.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 1.33L14.67 1.33V6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.67 9.33L14.67 1.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Generate Rules
          </>
        )}
      </button>

      {/* Generated Rules Preview */}
      {generatedRules && (
        <div className="border-t border-[var(--border-primary)] pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Generated Rules Preview</span>
            <span className="text-[10px] text-[#00bc7d] bg-[#00bc7d]/10 px-2 py-0.5 rounded-full">{generatedRules.length} rules</span>
          </div>
          {generatedRules.map((rule, idx) => (
            <div key={idx} className="bg-[var(--bg-card-inner)] border border-[#00bc7d]/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[var(--text-primary)] text-xs font-medium">{rule.name}</p>
                <button className="text-[var(--text-label)] hover:text-[#ff2056] transition-colors" title="Remove rule">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                </button>
              </div>
              <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                {rule.conditions} set Tactic to <span className="text-[#6941c6]">{rule.tactic}</span>
              </p>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button className="flex-1 bg-[var(--bg-badge)] border border-[var(--border-secondary)] rounded-lg py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors">
              Regenerate
            </button>
            <button className="flex-1 bg-[#00bc7d] hover:bg-[#00a86b] rounded-lg py-2.5 text-sm text-white font-medium transition-colors">
              Apply All Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Modal ---
export default function CreateMappingRuleModal({ isOpen, onClose, availableTactics, onTacticCreated }: CreateMappingRuleModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("ai");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-[620px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-[var(--text-primary)] text-lg font-semibold">Create Mapping Rules</h2>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Create rules to automatically map all existing and future campaigns to tactics.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-label)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 bg-[var(--bg-badge)] rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                activeTab === "ai"
                  ? "bg-[#6941c6] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.67 7.58V11.08C11.67 11.39 11.55 11.69 11.33 11.91C11.11 12.13 10.81 12.25 10.5 12.25H2.92C2.61 12.25 2.31 12.13 2.09 11.91C1.87 11.69 1.75 11.39 1.75 11.08V3.5C1.75 3.19 1.87 2.89 2.09 2.67C2.31 2.46 2.61 2.33 2.92 2.33H6.42" stroke="currentColor" strokeWidth="1.17" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.75 1.17L12.83 1.17V5.25" stroke="currentColor" strokeWidth="1.17" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.83 8.17L12.83 1.17" stroke="currentColor" strokeWidth="1.17" strokeLinecap="round" strokeLinejoin="round"/></svg>
              AI Builder
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                activeTab === "manual"
                  ? "bg-[#6941c6] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.17V12.83M1.17 7H12.83" stroke="currentColor" strokeWidth="1.17" strokeLinecap="round"/></svg>
              Manual Builder
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "ai" ? <AIBuilder availableTactics={availableTactics} /> : <ManualBuilder availableTactics={availableTactics} onTacticCreated={onTacticCreated} />}
        </div>
      </div>
    </div>
  );
}
