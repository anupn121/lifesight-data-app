"use client";

import { useState } from "react";
import type { Field } from "./fieldsData";
import type { DataModel } from "./dataModelsData";
import CreateDataModelModal from "./CreateDataModelModal";

// --- Badge helpers ---
const StatusBadge = ({ status }: { status: DataModel["status"] }) => {
  const styles = {
    Draft: "bg-[#fe9a00]/10 text-[#fbbf24] border-[#fe9a00]/20",
    Active: "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20",
    Archived: "bg-white/5 text-[#667085] border-white/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-[#00bc7d]" : status === "Draft" ? "bg-[#fbbf24]" : "bg-[#667085]"}`} />
      {status}
    </span>
  );
};

const GranularityBadge = ({ granularity }: { granularity: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[#9ca3af] border border-white/10">
    {granularity}
  </span>
);

const UsageBadge = ({ usage }: { usage: { type: "MMM" | "Geo Experiment"; name: string } }) => {
  const isMMM = usage.type === "MMM";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
      isMMM ? "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20" : "bg-[#2b7fff]/10 text-[#60a5fa] border-[#2b7fff]/20"
    }`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.67 8.33L3.75 5L5.42 6.67L8.33 1.67" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {usage.type}: {usage.name}
    </span>
  );
};

// --- Icons ---
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5.5 2.5H2.5C2.23478 2.5 1.98043 2.60536 1.79289 2.79289C1.60536 2.98043 1.5 3.23478 1.5 3.5V9.5C1.5 9.76522 1.60536 10.0196 1.79289 10.2071C1.98043 10.3946 2.23478 10.5 2.5 10.5H8.5C8.76522 10.5 9.01957 10.3946 9.20711 10.2071C9.39464 10.0196 9.5 9.76522 9.5 9.5V6.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.75 1.75C8.94891 1.55109 9.2187 1.43934 9.5 1.43934C9.7813 1.43934 10.0511 1.55109 10.25 1.75C10.4489 1.94891 10.5607 2.2187 10.5607 2.5C10.5607 2.7813 10.4489 3.05109 10.25 3.25L5.5 8L3.5 8.5L4 6.5L8.75 1.75Z" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="#9CA3AF" strokeWidth="1" />
    <path d="M8 4V2.5C8 1.94772 7.55228 1.5 7 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V7C1.5 7.55228 1.94772 8 2.5 8H4" stroke="#9CA3AF" strokeWidth="1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1.5 3H10.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 3V10C9.5 10.5523 9.05228 11 8.5 11H3.5C2.94772 11 2.5 10.5523 2.5 10V3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 3V2C4 1.44772 4.44772 1 5 1H7C7.55228 1 8 1.44772 8 2V3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DataModelsTabProps {
  fields: Field[];
  tactics: string[];
  dataModels: DataModel[];
  onDataModelsChange: (models: DataModel[]) => void;
}

export default function DataModelsTab({ fields, tactics, dataModels, onDataModelsChange }: DataModelsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModel, setEditModel] = useState<DataModel | null>(null);

  // Summary counts
  const totalModels = dataModels.length;
  const activeModels = dataModels.filter((m) => m.status === "Active").length;
  const mmmModels = dataModels.filter((m) => m.usedIn.some((u) => u.type === "MMM")).length;
  const geoModels = dataModels.filter((m) => m.usedIn.some((u) => u.type === "Geo Experiment")).length;

  // Resolve field names to display names
  const getFieldDisplayName = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    return field?.displayName || fieldName;
  };

  const handleSave = (model: DataModel) => {
    if (editModel) {
      onDataModelsChange(dataModels.map((m) => (m.id === model.id ? model : m)));
    } else {
      onDataModelsChange([...dataModels, model]);
    }
    setIsModalOpen(false);
    setEditModel(null);
  };

  const handleDuplicate = (model: DataModel) => {
    const duplicate: DataModel = {
      ...model,
      id: `dm-${Date.now()}`,
      name: `${model.name} (Copy)`,
      status: "Draft",
      usedIn: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onDataModelsChange([...dataModels, duplicate]);
  };

  const handleDelete = (id: string) => {
    onDataModelsChange(dataModels.filter((m) => m.id !== id));
  };

  const handleStatusChange = (id: string, status: DataModel["status"]) => {
    onDataModelsChange(
      dataModels.map((m) => (m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-semibold">Data Models</h2>
          <p className="text-[#9ca3af] text-sm">Configure reusable dataset definitions for MMM and Geo experiments</p>
        </div>
        <button
          onClick={() => { setEditModel(null); setIsModalOpen(true); }}
          className="bg-[#6941c6] hover:bg-[#5b34b5] text-white rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
        >
          <PlusIcon />
          Create Data Model
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#6941c6]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="#6941c6" strokeWidth="1.33" />
              <path d="M5 8H11M8 5V11" stroke="#6941c6" strokeWidth="1.33" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-white text-lg font-semibold leading-tight">{totalModels}</p>
            <p className="text-[#71717a] text-xs">Total Models</p>
          </div>
        </div>
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00bc7d]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.33 4L6 11.33 2.67 8" stroke="#00bc7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-white text-lg font-semibold leading-tight">{activeModels}</p>
            <p className="text-[#71717a] text-xs">Active</p>
          </div>
        </div>
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2b7fff]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 13.33H2V2.67" stroke="#2b7fff" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.67 4L8 8.67L5.33 6L2 9.33" stroke="#2b7fff" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-white text-lg font-semibold leading-tight">{mmmModels}</p>
            <p className="text-[#71717a] text-xs">Used in MMM</p>
          </div>
        </div>
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fe9a00]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.33" stroke="#fe9a00" strokeWidth="1.33" />
              <path d="M5.33 8H10.67" stroke="#fe9a00" strokeWidth="1.33" strokeLinecap="round" />
              <path d="M8 5.33V10.67" stroke="#fe9a00" strokeWidth="1.33" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-white text-lg font-semibold leading-tight">{geoModels}</p>
            <p className="text-[#71717a] text-xs">Used in Experiments</p>
          </div>
        </div>
      </div>

      {/* Models List */}
      {dataModels.length === 0 ? (
        /* Empty State */
        <div className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#6941c6]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6941c6" strokeWidth="1.5" />
              <path d="M8 12H16M12 8V16" stroke="#6941c6" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-white text-sm font-semibold mb-1">No Data Models Yet</h3>
          <p className="text-[#667085] text-xs mb-4 max-w-xs mx-auto">
            Create your first data model to define KPIs, spend variables, and dimensions for MMM or Geo experiments.
          </p>
          <button
            onClick={() => { setEditModel(null); setIsModalOpen(true); }}
            className="bg-[#6941c6] hover:bg-[#5b34b5] text-white rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
          >
            <PlusIcon />
            Create Data Model
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dataModels.map((model) => (
            <div
              key={model.id}
              className="bg-[#0f0f10] border border-[#1f1f21] rounded-xl p-5 hover:border-[#333] transition-colors group"
            >
              {/* Row 1: Name + Status + Actions */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-white text-sm font-semibold">{model.name}</h3>
                  <StatusBadge status={model.status} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Status toggle */}
                  <select
                    value={model.status}
                    onChange={(e) => handleStatusChange(model.id, e.target.value as DataModel["status"])}
                    className="bg-[#1f1f21] border border-[#333] rounded text-[10px] text-[#9ca3af] px-1.5 py-1 focus:outline-none appearance-none mr-1"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <button
                    onClick={() => { setEditModel(model); setIsModalOpen(true); }}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDuplicate(model)}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                    title="Duplicate"
                  >
                    <DuplicateIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Row 2: Description */}
              <p className="text-[#667085] text-xs mb-3">{model.description}</p>

              {/* Row 3: KPIs + Spend + Dimensions */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {/* KPI pills */}
                {model.kpis.map((kpi, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#6941c6]/10 text-[#a78bfa] border border-[#6941c6]/20"
                  >
                    {kpi.category}
                    {kpi.fieldName && <span className="text-[#667085]">({getFieldDisplayName(kpi.fieldName)})</span>}
                  </span>
                ))}
                {/* Spend count */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#00bc7d]/10 text-[#00bc7d] border border-[#00bc7d]/20">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1V7M2.5 2.5H5C5.27614 2.5 5.5 2.72386 5.5 3V3C5.5 3.27614 5.27614 3.5 5 3.5H3C2.72386 3.5 2.5 3.72386 2.5 4V4C2.5 4.27614 2.72386 4.5 3 4.5H5.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" /></svg>
                  {model.spendVariables.length} tactic{model.spendVariables.length !== 1 ? "s" : ""}
                </span>
                {/* Dimension summary */}
                {model.modelingDimensions.length > 0 && (
                  <span className="text-[10px] text-[#475467]">
                    {model.modelingDimensions.map((d) => `${d.category}: ${d.granularity}`).join(", ")}
                  </span>
                )}
              </div>

              {/* Row 4: Date range + Granularity + Usage */}
              <div className="flex items-center gap-2 flex-wrap">
                <GranularityBadge granularity={model.granularity} />
                {model.usedIn.map((usage, i) => (
                  <UsageBadge key={i} usage={usage} />
                ))}
                {model.usedIn.length === 0 && (
                  <span className="text-[10px] text-[#475467] italic">Not used in any model</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateDataModelModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditModel(null); }}
        onSave={handleSave}
        editModel={editModel}
        fields={fields}
        tactics={tactics}
      />
    </div>
  );
}
