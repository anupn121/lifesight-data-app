// Data Models data and types
// Used by DataModelsTab.tsx and CreateDataModelModal.tsx

export const KPI_CATEGORIES = [
  "Revenue",
  "Conversions",
  "Installs",
  "Orders",
  "Store Visits",
  "Registrations",
  "Reach",
  "Subscriptions",
  "Admissions",
] as const;

export type KPICategory = (typeof KPI_CATEGORIES)[number];

export interface KPIWithSource {
  category: KPICategory;
  sourceType: "Platform" | "Google Sheets" | "BigQuery" | "Snowflake";
  // For Platform source
  fieldName?: string;
  // For external sources (GS/BQ/SF)
  tableName?: string;
  columnName?: string;
}

export interface ControlVariableWithSource {
  name: string;
  type: "metric" | "custom";
  // For metric type — integration source
  sourceType?: "Platform" | "Google Sheets" | "BigQuery" | "Snowflake";
  fieldName?: string;
  source?: string; // integration name for Platform
  // For external sources
  tableName?: string;
  columnName?: string;
}

export const DIMENSION_CATEGORIES = {
  Geo: ["Country", "State/Region", "DMA", "City", "Zip Code"],
  Date: ["Daily", "Weekly", "Monthly"],
  Channel: ["Platform", "Tactic", "Campaign"],
  Device: ["Device Type", "OS"],
  Audience: ["Segment", "Demographics"],
} as const;

export type DimensionCategory = keyof typeof DIMENSION_CATEGORIES;

export interface ModelingDimension {
  category: DimensionCategory;
  granularity: string;
}

export interface DataModel {
  id: string;
  name: string;
  description: string;
  status: "Draft" | "Active" | "Archived";

  // KPIs - target/dependent variables with source mapping
  kpis: KPIWithSource[];

  // Spend variables grouped by tactic
  spendVariables: {
    tactic: string;
    metricFields: string[];
  }[];

  // Organic & Contextual variables
  controlVariables: ControlVariableWithSource[];

  // Modeling dimensions — common categories with granularity level
  modelingDimensions: ModelingDimension[];

  // Time granularity
  granularity: "Daily" | "Weekly" | "Monthly";

  // Usage tracking (mocked)
  usedIn: { type: "MMM" | "Geo Experiment"; name: string }[];

  createdAt: string;
  updatedAt: string;
}

export const sampleDataModels: DataModel[] = [
  {
    id: "dm-1",
    name: "US E-Commerce Revenue Model",
    description: "Revenue-focused model covering major paid channels for US e-commerce. Includes state-level geo breakdowns and weekly granularity for MMM analysis.",
    status: "Active",
    kpis: [
      { category: "Revenue", sourceType: "Platform", fieldName: "fb_attributed_revenue" },
      { category: "Conversions", sourceType: "Platform", fieldName: "fb_purchase" },
    ],
    spendVariables: [
      { tactic: "Meta MOF", metricFields: ["fb_spend"] },
      { tactic: "Google Shopping", metricFields: ["gads_spend"] },
      { tactic: "TikTok Awareness", metricFields: ["tt_spend"] },
    ],
    controlVariables: [
      { name: "Seasonal Index", type: "custom" },
      { name: "Promotion Flag", type: "custom" },
    ],
    modelingDimensions: [
      { category: "Geo", granularity: "State/Region" },
      { category: "Date", granularity: "Weekly" },
      { category: "Channel", granularity: "Tactic" },
    ],
    granularity: "Weekly",
    usedIn: [{ type: "MMM", name: "US Revenue MMM" }],
    createdAt: "2024-11-15T10:30:00Z",
    updatedAt: "2025-01-20T14:15:00Z",
  },
  {
    id: "dm-2",
    name: "Global Brand Awareness Model",
    description: "Brand awareness measurement across Meta and Instagram video channels. Country-level geo with monthly aggregation for geo experiment analysis.",
    status: "Active",
    kpis: [
      { category: "Reach", sourceType: "Platform", fieldName: "fb_impressions" },
      { category: "Conversions", sourceType: "Platform", fieldName: "fb_clicks" },
    ],
    spendVariables: [
      { tactic: "Meta", metricFields: ["fb_spend"] },
      { tactic: "Instagram Video", metricFields: ["fb_spend"] },
    ],
    controlVariables: [
      { name: "Weather Index", type: "custom" },
    ],
    modelingDimensions: [
      { category: "Geo", granularity: "Country" },
      { category: "Date", granularity: "Monthly" },
    ],
    granularity: "Monthly",
    usedIn: [{ type: "Geo Experiment", name: "EMEA Brand Lift Test" }],
    createdAt: "2024-12-01T09:00:00Z",
    updatedAt: "2025-02-05T11:30:00Z",
  },
  {
    id: "dm-3",
    name: "Lead Gen Performance Model",
    description: "Lead generation performance tracking across Google and Facebook retargeting campaigns. DMA-level geo with daily granularity for detailed analysis.",
    status: "Draft",
    kpis: [
      { category: "Registrations", sourceType: "Platform", fieldName: "fb_leads" },
      { category: "Registrations", sourceType: "Platform", fieldName: "fb_complete_registration" },
    ],
    spendVariables: [
      { tactic: "Google 2D", metricFields: ["gads_spend"] },
      { tactic: "Google 3D", metricFields: ["gads_spend"] },
      { tactic: "Facebook Retargeting", metricFields: ["fb_spend"] },
    ],
    controlVariables: [],
    modelingDimensions: [
      { category: "Geo", granularity: "DMA" },
      { category: "Date", granularity: "Daily" },
      { category: "Device", granularity: "Device Type" },
    ],
    granularity: "Daily",
    usedIn: [],
    createdAt: "2025-01-10T16:45:00Z",
    updatedAt: "2025-01-10T16:45:00Z",
  },
];
