import type { IntegrationStatus } from "../monitoringData";
import { STATUS_LABELS } from "../monitoringData";

export const statusConfig: Record<IntegrationStatus, { color: string; dotColor: string; bg: string; borderColor: string; borderLeftColor?: string }> = {
  NOT_CONNECTED: { color: "text-[#71717a]", dotColor: "bg-[#71717a]", bg: "", borderColor: "" },
  SETUP_INCOMPLETE: { color: "text-[#fe9a00]", dotColor: "bg-[#fe9a00]", bg: "bg-[#fe9a00]/5", borderColor: "border-[#fe9a00]/30", borderLeftColor: "#fe9a00" },
  SYNCING: { color: "text-[#a855f7]", dotColor: "bg-[#a855f7]", bg: "bg-[#a855f7]/5", borderColor: "border-[#a855f7]/30", borderLeftColor: "#a855f7" },
  CONNECTED: { color: "text-[#00bc7d]", dotColor: "bg-[#00bc7d]", bg: "", borderColor: "" },
  SYNC_ERROR: { color: "text-[#2b7fff]", dotColor: "bg-[#2b7fff]", bg: "bg-[#2b7fff]/5", borderColor: "border-[#2b7fff]/30", borderLeftColor: "#2b7fff" },
  ACTION_REQUIRED: { color: "text-[#ff2056]", dotColor: "bg-[#ff2056]", bg: "bg-[#ff2056]/5", borderColor: "border-[#ff2056]/30", borderLeftColor: "#ff2056" },
};

export const ATTENTION_STATUSES: IntegrationStatus[] = ["ACTION_REQUIRED", "SETUP_INCOMPLETE"];
export const SYNC_ERROR_STATUSES: IntegrationStatus[] = ["SYNC_ERROR"];

export { STATUS_LABELS };
