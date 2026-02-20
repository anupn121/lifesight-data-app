"use client";

import { useState } from "react";
import Pagination from "./Pagination";
import CreateMappingRuleModal from "./CreateMappingRuleModal";
import type { Field } from "./fieldsData";

const sources = [
  { name: "Shopify", color: "#95BF47" },
  { name: "Meta Ads", color: "#1877F2" },
  { name: "Tiktok", color: "#EE1D52" },
  { name: "Google Ads", color: "#34A853" },
  { name: "Amazon Marketing", color: "#FF9900" },
  { name: "Snapchat", color: "#FFFC00" },
  { name: "Pinterest Ads", color: "#E60023" },
  { name: "LinkedIn Ads", color: "#0A66C2" },
  { name: "Twitter Ads", color: "#1DA1F2" },
  { name: "YouTube Ads", color: "#FF0000" },
];

const campaigns = [
  { id: "(not set)", name: "(referral)", source: "1921681...", tactic: "" },
  { id: "(not set)", name: "(referral)", source: "1921681...", tactic: "" },
  { id: "(not set)", name: "(referral)", source: "1linkcou...", tactic: "" },
  { id: "(not set)", name: "ATS Euromaster Launch Email 06.03.2...", source: "Airtime...", tactic: "" },
  { id: "(not set)", name: "ebooking", source: "BWmail...", tactic: "" },
  { id: "(not set)", name: "banden", source: "BWmail...", tactic: "" },
  { id: "(not set)", name: "wisselafspraak_bandeninopslag", source: "BWmail3...", tactic: "" },
  { id: "(not set)", name: "wisselafspraak_bandeninopslag\"", source: "BWmail3...", tactic: "" },
  { id: "(not set)", name: "banden", source: "BWmailV...", tactic: "" },
  { id: "(not set)", name: "geenbanden", source: "BWmailV...", tactic: "" },
];

const existingRules = [
  { name: "2D Rules", conditions: "When campaign_name contains 2D and origin is platform", tactic: "Google 2D" },
  { name: "Google Shopping Rules", conditions: "When campaign_name contains shopping and origin is platform", tactic: "Google Shopping" },
  { name: "3D Rules", conditions: "When campaign_name contains 3D and origin is platform", tactic: "Google 3D" },
  { name: "Google Shopping", conditions: "When campaign_name contains 2D and campaign_name contains Shopping and origin is platform", tactic: "Google Shopping" },
  { name: "1D Rules", conditions: "When campaign_name contains 1D and origin is platform", tactic: "Google 1D" },
];

function RuleHighlight({ text }: { text: string }) {
  // Highlight field names and values in rule text
  const parts = text.split(/(campaign_name|origin|platform|shopping|Shopping|2D|3D|1D|contains|is)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (["campaign_name", "origin", "platform"].includes(part)) {
          return <span key={i} className="text-[#6941c6] cursor-pointer hover:underline">{part}</span>;
        }
        if (["shopping", "Shopping", "2D", "3D", "1D"].includes(part)) {
          return <span key={i} className="text-[#6941c6] cursor-pointer hover:underline">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface MapperTabProps {
  fields: Field[];
  tactics: string[];
  onTacticsChange: (tactics: string[]) => void;
}

export default function MapperTab({ fields, tactics, onTacticsChange }: MapperTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-semibold">Tactic Mapper</h2>
          <p className="text-[#9ca3af] text-sm">Assign campaigns to high-level marketing tactics using mapped metrics & dimensions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#6941c6] hover:bg-[#5b34b5] text-white rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Rule
          </button>
        </div>
      </div>

      {/* Campaigns Table — Mapper */}
      <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1f1f21]">
          <h3 className="text-[#fcfcfd] text-base">Mapper</h3>
          <div className="flex items-center gap-2">
            <button className="bg-white/5 border border-[#333] rounded-md flex items-center gap-2 px-3 py-1.5 text-[#d1d5dc] text-xs hover:bg-white/10 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12.25 2.33333H1.75L5.83333 7.15333V10.5L8.16667 11.6667V7.15333L12.25 2.33333Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filter
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white/5 border border-[#333] rounded-md flex items-center gap-2 px-3 py-1.5 text-[#d1d5dc] text-xs hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.75 4.66667H12.25M4.08333 7H9.91667M5.83333 9.33333H8.16667" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rules
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[50px_1fr_1.5fr_1fr_120px] border-b border-[#eaecf0]/10">
          <div className="px-4 py-3 flex items-center">
            <input type="checkbox" className="w-4 h-4 rounded border-[#475467] bg-transparent accent-[#6941c6]" />
          </div>
          <div className="px-6 py-3"><span className="text-[#475467] text-xs font-medium">Campaign ID</span></div>
          <div className="px-6 py-3"><span className="text-[#475467] text-xs font-medium">Campaign Name</span></div>
          <div className="px-6 py-3"><span className="text-[#475467] text-xs font-medium">Source</span></div>
          <div className="px-6 py-3"><span className="text-[#475467] text-xs font-medium">Tactic</span></div>
        </div>

        {/* Table Rows */}
        {campaigns.map((campaign, idx) => (
          <div key={idx} className="grid grid-cols-[50px_1fr_1.5fr_1fr_120px] border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <div className="px-4 py-2 flex items-center">
              <input type="checkbox" className="w-4 h-4 rounded border-[#475467] bg-transparent accent-[#6941c6]" />
            </div>
            <div className="px-6 py-2 flex items-center">
              <span className="text-[#667085] text-xs">{campaign.id}</span>
            </div>
            <div className="px-6 py-2 flex items-center">
              <span className="text-[#fcfcfd] text-xs truncate">{campaign.name}</span>
            </div>
            <div className="px-6 py-2 flex items-center">
              <span className="text-[#fcfcfd] text-xs truncate">{campaign.source}</span>
            </div>
            <div className="px-6 py-2 flex items-center">
              {campaign.tactic ? (
                <span className="text-[#00bc7d] text-xs">{campaign.tactic}</span>
              ) : (
                <span className="text-[#475467] text-xs italic">(not set)</span>
              )}
            </div>
          </div>
        ))}

        <Pagination currentPage={1} totalItems={13303} itemsPerPage={12} />
      </div>

      {/* Existing Rules */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#fcfcfd] text-base">Mapping Rules</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-[#6941c6] hover:text-[#5b34b5] font-medium transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3.5V10.5M3.5 7H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Add New Rules
          </button>
        </div>

        {existingRules.map((rule, idx) => (
          <div key={idx} className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4 hover:border-[#333] transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-white text-sm font-medium">{rule.name}</p>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 text-[#667085] hover:text-white transition-colors" title="Edit">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5.5 2.5H2.5C2.23 2.5 1.98 2.61 1.79 2.79C1.61 2.98 1.5 3.23 1.5 3.5V9.5C1.5 9.77 1.61 10.02 1.79 10.21C1.98 10.39 2.23 10.5 2.5 10.5H8.5C8.77 10.5 9.02 10.39 9.21 10.21C9.39 10.02 9.5 9.77 9.5 9.5V6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.75 1.75C8.95 1.55 9.22 1.44 9.5 1.44C9.78 1.44 10.05 1.55 10.25 1.75C10.45 1.95 10.56 2.22 10.56 2.5C10.56 2.78 10.45 3.05 10.25 3.25L5.5 8L3.5 8.5L4 6.5L8.75 1.75Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 text-[#667085] hover:text-[#ff2056] transition-colors" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3H10.5M4 3V2C4 1.72 4.11 1.47 4.29 1.29C4.47 1.11 4.72 1 5 1H7C7.28 1 7.53 1.11 7.71 1.29C7.89 1.47 8 1.72 8 2V3M9.5 3V10C9.5 10.28 9.39 10.53 9.21 10.71C9.03 10.89 8.78 11 8.5 11H3.5C3.22 11 2.97 10.89 2.79 10.71C2.61 10.53 2.5 10.28 2.5 10V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
            <p className="text-[#9ca3af] text-xs leading-relaxed">
              <RuleHighlight text={rule.conditions} />
              {" set Tactic to "}
              <span className="text-[#6941c6] cursor-pointer hover:underline">{rule.tactic}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      <CreateMappingRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableTactics={tactics}
        onTacticCreated={(tactic) => onTacticsChange([...tactics, tactic])}
      />
    </div>
  );
}
