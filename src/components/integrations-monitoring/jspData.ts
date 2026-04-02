// ─── JSP (Joint Success Plan) Data Layer ────────────────────────────────────
// When a client onboards, their JSP (created as a Google Sheet) maps out which
// integrations, files, and data sources they need. This module provides the
// mock data and helpers for the JSP-driven onboarding flow.

export type JspIntegrationType = "native" | "file" | "warehouse";
export type JspStatus = "pending" | "connected" | "in_progress";

export interface JspIntegration {
  id: string;
  integrationName: string; // Display name — for native this maps to CatalogIntegration.name
  type: JspIntegrationType;
  alias?: string;
  source?: string; // Known source tool name for file/warehouse (e.g., "Google Sheets", "BigQuery"). If absent, user picks.
  dataCategory?: string;
  assignedUserEmail?: string;
  assignedUserName?: string;
  priority: "high" | "medium" | "low";
  notes?: string;
  status: JspStatus;
}

export interface JspPlan {
  clientName: string;
  createdDate: string;
  integrations: JspIntegration[];
}

const MOCK_JSP_PLAN: JspPlan = {
  clientName: "Acme Commerce",
  createdDate: "2026-03-10",
  integrations: [
    // ── Native integrations ─────────────────────────────────────────────
    {
      id: "jsp-1",
      integrationName: "Facebook Ads",
      type: "native",
      dataCategory: "paid_marketing",
      priority: "high",
      notes: "Primary paid social channel — connect all ad accounts",
      status: "pending",
    },
    {
      id: "jsp-2",
      integrationName: "Google Ads",
      type: "native",
      dataCategory: "paid_marketing",
      priority: "high",
      notes: "Search + Shopping campaigns",
      status: "pending",
    },
    {
      id: "jsp-3",
      integrationName: "TikTok Ads",
      type: "native",
      dataCategory: "paid_marketing",
      priority: "medium",
      notes: "New channel — pilot campaigns only",
      status: "pending",
    },
    {
      id: "jsp-4",
      integrationName: "Shopify",
      type: "native",
      dataCategory: "kpi",
      priority: "high",
      notes: "Main e-commerce storefront",
      status: "connected",
    },
    {
      id: "jsp-5",
      integrationName: "Klaviyo",
      type: "native",
      dataCategory: "organic",
      priority: "medium",
      assignedUserEmail: "sarah@acmecommerce.com",
      assignedUserName: "Sarah Chen",
      notes: "Email marketing — Sarah manages this",
      status: "pending",
    },
    // ── File integrations (source known) ────────────────────────────────
    {
      id: "jsp-6",
      integrationName: "Campaign Performance Q4",
      type: "file",
      source: "Google Sheets",
      dataCategory: "paid_marketing",
      priority: "high",
      notes: "Aggregated campaign data from offline channels",
      status: "pending",
    },
    {
      id: "jsp-7",
      integrationName: "Instagram Organic Data",
      type: "file",
      source: "Import CSV",
      dataCategory: "organic",
      priority: "medium",
      notes: "Monthly export from Instagram Insights",
      status: "pending",
    },
    // ── File integrations (source unknown) ──────────────────────────────
    {
      id: "jsp-8",
      integrationName: "Monthly Revenue Summary",
      type: "file",
      // source intentionally omitted — user will choose how to bring this in
      priority: "low",
      notes: "Finance team's monthly report",
      assignedUserEmail: "mike@acmecommerce.com",
      assignedUserName: "Mike Torres",
      status: "pending",
    },
    {
      id: "jsp-11",
      integrationName: "Offline Campaign Spend",
      type: "file",
      // source unknown — could be CSV, Google Sheets, or Excel
      dataCategory: "paid_marketing",
      priority: "medium",
      notes: "Weekly offline marketing spend data",
      status: "pending",
    },
    // ── Warehouse integrations (source known) ───────────────────────────
    {
      id: "jsp-9",
      integrationName: "Ecommerce Revenue Table",
      type: "warehouse",
      source: "BigQuery",
      dataCategory: "kpi",
      priority: "high",
      notes: "Production data warehouse — revenue + orders tables",
      status: "pending",
    },
    // ── Warehouse integrations (source unknown) ─────────────────────────
    {
      id: "jsp-10",
      integrationName: "Attribution Data",
      type: "warehouse",
      // source unknown — could be Snowflake, BigQuery, etc.
      priority: "low",
      assignedUserEmail: "sarah@acmecommerce.com",
      assignedUserName: "Sarah Chen",
      notes: "Data engineering team manages access",
      status: "pending",
    },
  ],
};

const DEMO_JSP_PLAN: JspPlan = {
  clientName: "Demo Workspace",
  createdDate: "2026-03-25",
  integrations: [
    { id: "demo-jsp-1", integrationName: "Facebook Ads", type: "native", dataCategory: "paid_marketing", priority: "high", notes: "Primary paid social channel", status: "pending" },
    { id: "demo-jsp-2", integrationName: "Google Ads", type: "native", dataCategory: "paid_marketing", priority: "high", notes: "Search + Shopping campaigns", status: "pending" },
    { id: "demo-jsp-3", integrationName: "Shopify", type: "native", dataCategory: "kpi", priority: "high", notes: "Main e-commerce storefront", status: "pending" },
    { id: "demo-jsp-4", integrationName: "Blogs", type: "file", source: "Google Sheets", alias: "Blogs", dataCategory: "contextual", priority: "medium", notes: "Blog performance data via Google Sheets", status: "pending" },
    { id: "demo-jsp-5", integrationName: "Events", type: "file", source: "Google Sheets", alias: "Events", dataCategory: "organic", priority: "medium", notes: "Event performance data via Google Sheets", status: "pending" },
  ],
};

export function getJspPlan(isDemoMode?: boolean): JspPlan {
  return isDemoMode ? DEMO_JSP_PLAN : MOCK_JSP_PLAN;
}

export function getPendingJspIntegrations(plan: JspPlan): JspIntegration[] {
  return plan.integrations.filter((j) => j.status !== "connected");
}

export function getJspEntryForIntegration(name: string, plan: JspPlan): JspIntegration | undefined {
  return plan.integrations.find((j) => j.integrationName === name && j.status !== "connected");
}

// ─── Workspace Members ──────────────────────────────────────────────────────
export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
}

const MOCK_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id: "wm-1", name: "Sarah Chen", email: "sarah@acmecommerce.com", role: "Admin", avatarInitials: "SC" },
  { id: "wm-2", name: "Mike Torres", email: "mike@acmecommerce.com", role: "Editor", avatarInitials: "MT" },
  { id: "wm-3", name: "Priya Sharma", email: "priya@acmecommerce.com", role: "Admin", avatarInitials: "PS" },
  { id: "wm-4", name: "Alex Kim", email: "alex@acmecommerce.com", role: "Viewer", avatarInitials: "AK" },
  { id: "wm-5", name: "Jordan Lee", email: "jordan@acmecommerce.com", role: "Editor", avatarInitials: "JL" },
];

export function getWorkspaceMembers(): WorkspaceMember[] {
  return MOCK_WORKSPACE_MEMBERS;
}
