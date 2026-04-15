import { type TabId } from "./TabBar";

export type ProductMode =
  | "mta_only"
  | "mta_mmm_experiments"
  | "mmm_experiments"
  | "mmm_only"
  | "experiments_only";

export interface ProductModeConfig {
  id: ProductMode;
  label: string;
  shortLabel: string;
  description: string;
  visibleTabs: TabId[];
  warningTabs: TabId[];
  warningMessage: string;
  color: string;
  products: string[];
}

export const PRODUCT_MODES: Record<ProductMode, ProductModeConfig> = {
  mta_only: {
    id: "mta_only",
    label: "Multi-Touch Attribution",
    shortLabel: "MTA Only",
    description: "Track and attribute conversions across touchpoints. Connect your ad platforms and analytics tools to understand the customer journey.",
    visibleTabs: ["integrations-monitoring"],
    warningTabs: [],
    warningMessage: "",
    color: "#2b7fff",
    products: ["MTA"],
  },
  mta_mmm_experiments: {
    id: "mta_mmm_experiments",
    label: "MTA + MMM + Experiments",
    shortLabel: "Full Suite",
    description: "Complete measurement stack combining attribution, media mix modeling, and experimentation for holistic marketing insights.",
    visibleTabs: ["integrations-monitoring", "metrics-dimensions", "tactic-mapper", "data-models"],
    warningTabs: ["metrics-dimensions", "data-models"],
    warningMessage: "This tab is used for MMM & Experiments data configuration. It does not affect your MTA setup.",
    color: "#027b8e",
    products: ["MTA", "MMM", "Experiments"],
  },
  mmm_experiments: {
    id: "mmm_experiments",
    label: "MMM + Experiments",
    shortLabel: "MMM + Experiments",
    description: "Combine media mix modeling with experimentation to measure channel effectiveness and validate marketing decisions.",
    visibleTabs: ["integrations-monitoring", "metrics-dimensions", "tactic-mapper", "data-models"],
    warningTabs: [],
    warningMessage: "",
    color: "#00bc7d",
    products: ["MMM", "Experiments"],
  },
  mmm_only: {
    id: "mmm_only",
    label: "Media Mix Modeling",
    shortLabel: "MMM Only",
    description: "Understand the impact of your marketing channels on business outcomes with statistical modeling of aggregated data.",
    visibleTabs: ["integrations-monitoring", "metrics-dimensions", "tactic-mapper", "data-models"],
    warningTabs: [],
    warningMessage: "",
    color: "#fe9a00",
    products: ["MMM"],
  },
  experiments_only: {
    id: "experiments_only",
    label: "Experiments",
    shortLabel: "Experiments Only",
    description: "Run incrementality tests and geo experiments to measure the true causal impact of your marketing spend.",
    visibleTabs: ["integrations-monitoring", "metrics-dimensions", "tactic-mapper", "data-models"],
    warningTabs: [],
    warningMessage: "",
    color: "#a855f7",
    products: ["Experiments"],
  },
};

export const PRODUCT_MODE_LIST: ProductModeConfig[] = [
  PRODUCT_MODES.mta_only,
  PRODUCT_MODES.mta_mmm_experiments,
  PRODUCT_MODES.mmm_experiments,
  PRODUCT_MODES.mmm_only,
  PRODUCT_MODES.experiments_only,
];

/** All four pipeline steps shown in the landing page flow diagram */
export const PIPELINE_STEPS: { tabId: TabId; label: string; description: string }[] = [
  { tabId: "integrations-monitoring", label: "Integrations", description: "Connect data sources" },
  { tabId: "metrics-dimensions", label: "Metrics & Dimensions", description: "Define & map fields" },
  { tabId: "tactic-mapper", label: "Taxonomy", description: "Organize marketing taxonomy" },
  { tabId: "data-models", label: "Data Models", description: "Configure output models" },
];
