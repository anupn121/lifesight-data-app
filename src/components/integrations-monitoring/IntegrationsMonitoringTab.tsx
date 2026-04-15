"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { IntegrationStatus, AccountStatus, Account, Integration, CatalogIntegration, DataCategory } from "../monitoringData";
import { allIntegrations, DATA_CATEGORY_LABELS } from "../monitoringData";
import { type Field, type DataTypeKey, getDemoFieldsForIntegration, getDemoTacticsForIntegration } from "../fieldsData";
import { ATTENTION_STATUSES, SYNC_ERROR_STATUSES } from "./statusConfig";
import { catalogIntegrations } from "./catalogData";
import { IntegrationIconSmall, IntegrationIcon } from "./icons";
import IntegrationRow, { IntegrationTableHeader } from "./IntegrationRow";
import DetailView from "./DetailView";
import CatalogView from "./CatalogView";
import DataSourceWizard from "./DataSourceWizard";
import FileIntegrationWizard from "./FileIntegrationWizard";
import AddIntegrationPage from "./AddIntegrationPage";
import JspCardMenu from "./JspCardMenu";
import { SupportModal, RequestedModal, InviteUserModal, RequestIntegrationModal } from "./modals";
import { IntegrationCard } from "./IntegrationCard";
import { getJspPlan, getWorkspaceMembers, type JspIntegration } from "./jspData";
import PostSyncOnboarding from "./PostSyncOnboarding";

const FILE_INTEGRATION_NAMES = new Set(["CSV", "Google Sheets", "Amazon S3", "Google Cloud Storage", "SFTP", "Excel Upload"]);

const FILE_VIA_LABELS: Record<string, string> = {
  "Google Sheets": "Google Sheets",
  "CSV": "CSV",
  "Amazon S3": "Amazon S3",
  "Google Cloud Storage": "Google Cloud Storage",
  "SFTP": "SFTP",
  "Excel Upload": "Excel",
};

function createFileIntegration(aliasName: string, sourceName: string, catalogEntry?: CatalogIntegration): Integration {
  const viaLabel = FILE_VIA_LABELS[sourceName] || sourceName;
  const displayName = `${aliasName} (via ${viaLabel})`;
  const color = catalogEntry?.color || "#71717a";
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return {
    name: displayName,
    icon: catalogEntry?.icon || sourceName.slice(0, 2),
    color,
    connectionType: "Source",
    category: "Custom",
    status: "SYNCING",
    subtitle: `Syncing via ${viaLabel}`,
    refreshFrequency: "Daily",
    connectedDate: today,
    estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    timezone: "UTC",
    syncHealthDetail: ["Synced", "Synced", "Synced", "Synced", "Synced", "Synced", "Synced"],
    metricsDateRange: today,
    overviewMetrics: [
      { label: "Source", value: viaLabel },
      { label: "Status", value: "Healthy" },
      { label: "Frequency", value: "Daily" },
      { label: "Last Update", value: "Just now" },
    ],
    earliestDate: today,
    latestDate: today,
    reliableThrough: today,
    accounts: [
      { name: aliasName, status: "CONNECTED", lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Rows: "—", Frequency: "Daily", "Last Update": "Just now" } },
    ],
    accountColumns: ["Rows", "Frequency", "Last Update"],
    syncHealthDays: ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy"],
  };
}

export type IntMonView = "main" | "catalog" | "detail" | "data-wizard" | "custom-source-picker";

export default function IntegrationsMonitoringTab({
  view,
  onViewChange,
  onConnectionChange,
  isDemoMode,
  onFieldsCreated,
  onTacticsCreated,
}: {
  view: IntMonView;
  onViewChange: (v: IntMonView) => void;
  onConnectionChange?: (hasConnected: boolean) => void;
  isDemoMode?: boolean;
  onFieldsCreated?: (fields: Field[]) => void;
  onTacticsCreated?: (tactics: string[]) => void;
}) {
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [openKebabName, setOpenKebabName] = useState<string | null>(null);
  const [mainSearch, setMainSearch] = useState("");
  const [dataCategoryFilter, setDataCategoryFilter] = useState<DataCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [needsAttentionExpanded, setNeedsAttentionExpanded] = useState(true);
  const [syncErrorsExpanded, setSyncErrorsExpanded] = useState(true);
  const [connectedExpanded, setConnectedExpanded] = useState(true);
  const [requestedExpanded, setRequestedExpanded] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [emptyStateMode, setEmptyStateMode] = useState<"normal" | "jsp-empty" | "all-done" | "no-jsp">("normal");
  const [postSyncIntegration, setPostSyncIntegration] = useState<string | null>(null);
  const [dynamicIntegrations, setDynamicIntegrations] = useState<Integration[]>([]);

  // JSP state — reactive to demo mode
  const jspPlan = useMemo(() => getJspPlan(isDemoMode), [isDemoMode]);
  const [connectedJspIds, setConnectedJspIds] = useState<Set<string>>(new Set());
  const [wizardJspAlias, setWizardJspAlias] = useState("");
  const [wizardJspId, setWizardJspId] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; integrationName: string }>({ open: false, integrationName: "" });
  const [requestModal, setRequestModal] = useState<{ open: boolean; integrationName: string }>({ open: false, integrationName: "" });
  const workspaceMembers = getWorkspaceMembers();
  /* JSP entry currently in the custom source picker view. Replaces the old
     modal-based data source choice flow. */
  const [customSourcePickerJsp, setCustomSourcePickerJsp] = useState<JspIntegration | null>(null);
  /* JSP entries the user has dismissed from the "Finish Your Setup" section */
  const [ignoredJspIds, setIgnoredJspIds] = useState<Set<string>>(new Set());
  /* JSP entry pending ignore confirmation (shows modal) */
  const [ignoreConfirmJsp, setIgnoreConfirmJsp] = useState<JspIntegration | null>(null);
  const [setupExpanded, setSetupExpanded] = useState(true);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [showDismissWarning, setShowDismissWarning] = useState(false);
  const [showRecommended, setShowRecommended] = useState(true);

  // Toast state
  const [toast, setToast] = useState<{ message: string; subtitle: string; visible: boolean }>({ message: "", subtitle: "", visible: false });
  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 5000);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  // Recommended integrations (shown when no JSP setup)
  const RECOMMENDED_NAMES = ["Facebook Ads", "Google Ads", "Google Sheets", "Amazon S3"];
  const recommendedIntegrations = catalogIntegrations.filter((c) => RECOMMENDED_NAMES.includes(c.name));

  // Derived JSP data
  const pendingJsp = jspPlan.integrations.filter((j) => j.status !== "connected" && !connectedJspIds.has(j.id) && !ignoredJspIds.has(j.id));
  const allJspConnected = jspPlan.integrations.length > 0 && pendingJsp.length === 0;
  const mainSearchLower = mainSearch.toLowerCase();
  const filteredPendingJsp = mainSearch
    ? pendingJsp.filter((j) => j.integrationName.toLowerCase().includes(mainSearchLower) || (j.source && j.source.toLowerCase().includes(mainSearchLower)) || (j.dataCategory && j.dataCategory.toLowerCase().includes(mainSearchLower)))
    : pendingJsp;
  const nativeJsp = filteredPendingJsp.filter((j) => j.type === "native");
  const fileJsp = filteredPendingJsp.filter((j) => j.type === "file");
  const warehouseJsp = filteredPendingJsp.filter((j) => j.type === "warehouse");
  const totalJsp = jspPlan.integrations.length;
  const connectedJspCount = jspPlan.integrations.filter((j) => j.status === "connected" || connectedJspIds.has(j.id)).length;
  const jspIntegrationNames = new Set(jspPlan.integrations.map((j) => j.integrationName));

  // Modal states
  const [supportModal, setSupportModal] = useState<{ open: boolean; name: string; success: boolean }>({ open: false, name: "", success: false });
  const [requestedModal, setRequestedModal] = useState<{ open: boolean; integration: CatalogIntegration | null }>({ open: false, integration: null });

  // Data source wizard state
  const [wizardIntegration, setWizardIntegration] = useState<CatalogIntegration | null>(null);
  const [savedWarehouseCreds, setSavedWarehouseCreds] = useState<Record<string, Record<string, string>>>({});

  const toggleRow = (name: string) => {
    setExpandedRows((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getEffectiveStatus = useCallback((name: string, defaultStatus: IntegrationStatus): IntegrationStatus => {
    return integrationStatuses[name] ?? defaultStatus;
  }, [integrationStatuses]);

  // Combine static + dynamic integrations; in demo mode, override all default statuses to NOT_CONNECTED
  // and replace campaign-level accounts with clean account-level entries
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const DEMO_ACCOUNTS: Record<string, { subtitle: string; accounts: Account[]; accountColumns: string[] }> = {
    "Meta Ads": {
      subtitle: "2 accounts · Last sync just now",
      accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
      accounts: [
        { name: "Acme US Account", status: "CONNECTED" as AccountStatus, lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Spend: "$18.4K", Impressions: "1.2M", Clicks: "48K", "Attrib. Rev": "$92K" } },
        { name: "Acme EU Account", status: "CONNECTED" as AccountStatus, lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Spend: "$12.1K", Impressions: "850K", Clicks: "31K", "Attrib. Rev": "$67K" } },
      ],
    },
    "Google Ads": {
      subtitle: "2 accounts · Last sync just now",
      accountColumns: ["Spend", "Impressions", "Clicks", "Attrib. Rev"],
      accounts: [
        { name: "Acme Search Account", status: "CONNECTED" as AccountStatus, lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Spend: "$22.1K", Impressions: "2.8M", Clicks: "142K", "Attrib. Rev": "$380K" } },
        { name: "Acme Shopping Account", status: "CONNECTED" as AccountStatus, lastRefreshed: `${today}, 12:00 PM`, dataUntil: today, metrics: { Spend: "$18.5K", Impressions: "2.1M", Clicks: "98K", "Attrib. Rev": "$295K" } },
      ],
    },
  };
  const baseIntegrations = isDemoMode
    ? allIntegrations.map((i) => {
        const demoOverride = DEMO_ACCOUNTS[i.name];
        return demoOverride
          ? { ...i, status: "NOT_CONNECTED" as IntegrationStatus, ...demoOverride }
          : { ...i, status: "NOT_CONNECTED" as IntegrationStatus };
      })
    : allIntegrations;
  const allCombinedIntegrations = [...baseIntegrations, ...dynamicIntegrations];

  // Derive lists
  const connectedMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return status === "CONNECTED" || status === "SYNCING";
  });

  // Report connection state to parent
  useEffect(() => {
    onConnectionChange?.(connectedMonitoring.length > 0);
  }, [connectedMonitoring.length, onConnectionChange]);

  // Reset internal state when demo mode toggles
  useEffect(() => {
    setConnectedJspIds(new Set());
    setDynamicIntegrations([]);
    setIntegrationStatuses({});
    setSetupDismissed(false);
  }, [isDemoMode]);

  const issuesMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return ATTENTION_STATUSES.includes(status);
  });

  const syncErrorMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return SYNC_ERROR_STATUSES.includes(status);
  });

  const requestedIntegrations = catalogIntegrations.filter((i) => i.isRequested);

  // Search + data category + status filter
  const filterBySearch = (integration: Integration) => {
    if (dataCategoryFilter && integration.dataCategory !== dataCategoryFilter) return false;
    if (statusFilter !== "all") {
      const effectiveStatus = getEffectiveStatus(integration.name, integration.status);
      if (statusFilter === "healthy" && effectiveStatus !== "CONNECTED" && effectiveStatus !== "SYNCING") return false;
      if (statusFilter === "attention" && !ATTENTION_STATUSES.includes(effectiveStatus)) return false;
      if (statusFilter === "error" && !SYNC_ERROR_STATUSES.includes(effectiveStatus)) return false;
    }
    if (!mainSearch) return true;
    const q = mainSearch.toLowerCase();
    return (
      integration.name.toLowerCase().includes(q) ||
      integration.category.toLowerCase().includes(q) ||
      integration.accounts.some((a) => a.name.toLowerCase().includes(q))
    );
  };

  const invitedMonitoring = allCombinedIntegrations.filter((i) => {
    const status = getEffectiveStatus(i.name, i.status);
    return status === "INVITED";
  });

  const filteredConnected = connectedMonitoring.filter(filterBySearch);
  const filteredIssues = issuesMonitoring.filter(filterBySearch);
  const filteredSyncErrors = syncErrorMonitoring.filter(filterBySearch);
  const filteredInvited = invitedMonitoring.filter(filterBySearch);

  const handleViewDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    onViewChange("detail");
  };

  const handleConnect = (name: string) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [name]: "CONNECTED",
    }));
    if (isDemoMode) {
      // Facebook Ads ↔ Meta Ads name mismatch: allIntegrations uses "Meta Ads"
      // Only set Meta Ads status — don't create a dynamic entry (it already exists in base)
      if (name === "Facebook Ads") {
        setIntegrationStatuses((prev) => ({ ...prev, "Meta Ads": "CONNECTED" }));
      } else if (name === "Google Ads") {
        // Google Ads exists in allIntegrations — just set status, no dynamic entry needed
      } else {
        // Create monitoring entry for integrations not in allIntegrations (e.g. Shopify)
        const existsInBase = allIntegrations.some((i) => i.name === name);
        if (!existsInBase) {
          const cat = catalogIntegrations.find((c) => c.name === name);
          if (cat) {
            const entry = createFileIntegration(name, name, cat);
            setDynamicIntegrations((prev) => [...prev, entry]);
            setIntegrationStatuses((prev) => ({ ...prev, [entry.name]: "CONNECTED" }));
          }
        }
      }
      const demoFields = getDemoFieldsForIntegration(name);
      if (demoFields.length > 0) onFieldsCreated?.(demoFields);
      const demoTactics = getDemoTacticsForIntegration(name);
      if (demoTactics.length > 0) onTacticsCreated?.(demoTactics);
    }
  };

  const handleStartWizard = (integration: CatalogIntegration) => {
    setWizardIntegration(integration);
    onViewChange("data-wizard");
  };

  const handleSimulateSyncComplete = (name: string) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [name]: "CONNECTED",
    }));
    setPostSyncIntegration(name);
    if (isDemoMode) {
      const demoFields = getDemoFieldsForIntegration(name);
      if (demoFields.length > 0) onFieldsCreated?.(demoFields);
      const demoTactics = getDemoTacticsForIntegration(name);
      if (demoTactics.length > 0) onTacticsCreated?.(demoTactics);
    }
  };

  const handleFileIntegrationComplete = useCallback((aliasName: string, sourceName: string) => {
    const cat = catalogIntegrations.find((c) => c.name === sourceName);
    const newIntegration = createFileIntegration(aliasName, sourceName, cat);
    setDynamicIntegrations((prev) => [...prev, newIntegration]);
    setIntegrationStatuses((prev) => ({ ...prev, [newIntegration.name]: "SYNCING" }));

    if (isDemoMode) {
      // Check for pre-built demo fields first (e.g., Blogs, Events have demo entries)
      const demoFields = getDemoFieldsForIntegration(aliasName) || getDemoFieldsForIntegration(sourceName);
      if (demoFields.length > 0) {
        onFieldsCreated?.(demoFields);
      } else {
        // No pre-built fields — inject unmapped placeholders from mock sample columns
        const sampleCols = ["date", "channel", "spend", "impressions", "clicks", "conversions", "revenue"];
        const sourceColor = cat?.color || "#71717a";
        const unmappedFields: Field[] = sampleCols.map((col) => {
          const isMetric = !["date", "channel", "country", "region", "campaign", "source"].includes(col);
          return {
            name: `${aliasName.toLowerCase().replace(/\s+/g, "_")}_${col}`,
            displayName: col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            columnName: col,
            kind: isMetric ? "metric" : "dimension",
            source: aliasName,
            sourceColor,
            sourceKey: `uploaded.${col}`,
            dataType: (isMetric ? (col.includes("spend") || col.includes("revenue") ? "CURRENCY" : "INT64") : col.includes("date") ? "DATE" : "STRING") as DataTypeKey,
            transformation: isMetric ? "SUM" : "NONE",
            status: "Unmapped" as const,
            description: "",
          } as Field;
        });
        if (unmappedFields.length > 0) onFieldsCreated?.(unmappedFields);
      }
      const demoTactics = getDemoTacticsForIntegration(aliasName) || getDemoTacticsForIntegration(sourceName);
      if (demoTactics.length > 0) onTacticsCreated?.(demoTactics);
    }
  }, [isDemoMode, onFieldsCreated, onTacticsCreated]);

  // Helper: launch wizard for a JSP entry.
  // New flow (see plan dazzling-snuggling-pearl.md):
  //  - Native → wizard directly for that integration (unchanged)
  //  - Non-native → wizard directly for the best-guess source. The wizard's
  //    Step 1 exposes a "Change integration type" link that re-opens the
  //    custom source picker if the user wants to switch.
  //    Best-guess logic:
  //      • jspEntry.source if set (e.g., "Google Sheets" from JSP metadata)
  //      • else "BigQuery" for warehouse type
  //      • else "Google Sheets" for file type
  const handleStartJspWizard = (jspEntry: JspIntegration) => {
    setWizardJspId(jspEntry.id);

    if (jspEntry.type === "native") {
      const catalogEntry = catalogIntegrations.find((c) => c.name === jspEntry.integrationName);
      if (!catalogEntry) return;
      setWizardJspAlias(jspEntry.alias || "");
      handleStartWizard(catalogEntry);
      return;
    }

    // Non-native: wizard-first flow
    setWizardJspAlias(jspEntry.integrationName);
    const guessedSource =
      jspEntry.source ||
      (jspEntry.type === "warehouse" ? "BigQuery" : "Google Sheets");
    const catalogEntry = catalogIntegrations.find((c) => c.name === guessedSource);
    if (!catalogEntry) return;
    // Keep JSP context alive so "Change integration type" can reopen picker
    setCustomSourcePickerJsp(jspEntry);
    handleStartWizard(catalogEntry);
  };

  // Called from a JSP card's kebab menu "Change Integration Type" item.
  // Skips the wizard entirely and opens the picker so the user can switch
  // source before entering the wizard.
  const handleChangeJspIntegrationType = (jspEntry: JspIntegration) => {
    setWizardJspId(jspEntry.id);
    setWizardJspAlias(jspEntry.integrationName);
    setCustomSourcePickerJsp(jspEntry);
    onViewChange("custom-source-picker");
  };

  // Called when the user clicks the kebab menu "Ignore" item. Shows the
  // ignore confirmation modal — nothing is actually ignored until confirmed.
  const handleIgnoreJsp = (jspEntry: JspIntegration) => {
    setIgnoreConfirmJsp(jspEntry);
  };

  // Called when the user confirms ignore from the modal.
  const confirmIgnoreJsp = () => {
    if (!ignoreConfirmJsp) return;
    setIgnoredJspIds((prev) => new Set(prev).add(ignoreConfirmJsp.id));
    setIgnoreConfirmJsp(null);
  };

  // Called when the user picks a source from the custom source picker.
  // Kicks off the appropriate wizard for the chosen source, carrying over
  // the JSP alias so the wizard's first step is pre-filled. We intentionally
  // KEEP customSourcePickerJsp set so the wizard still shows the "Change
  // integration type" link (user can change multiple times). The state is
  // cleared on wizard complete/back/home.
  const handleCustomSourceSelected = (source: CatalogIntegration) => {
    handleStartWizard(source);
  };

  // Helper: delegate a JSP entry (open request/invite modal)
  const handleDelegateJsp = (jspEntry: JspIntegration) => {
    setRequestModal({ open: true, integrationName: jspEntry.integrationName });
  };

  // ─── DATA SOURCE WIZARD ──────────────────────────────────────────────────
  if (view === "data-wizard" && wizardIntegration) {
    const isFileIntegration = FILE_INTEGRATION_NAMES.has(wizardIntegration.name);
    const commonProps = {
      integration: wizardIntegration,
      onBack: () => { setWizardIntegration(null); setWizardJspAlias(""); setWizardJspId(null); setCustomSourcePickerJsp(null); onViewChange("catalog"); },
      onGoHome: () => { setWizardIntegration(null); setWizardJspAlias(""); setWizardJspId(null); setCustomSourcePickerJsp(null); onViewChange("main"); },
      onInviteUser: (name: string) => setRequestModal({ open: true, integrationName: name }),
    };
    // Show the "Change integration type" link in Step 1 only when we're in a
    // non-native JSP flow (customSourcePickerJsp is set). Clicking the link
    // closes the wizard and opens the picker — we preserve customSourcePickerJsp
    // and wizardJspAlias so the picker has context and can re-open a new wizard.
    const changeTypeHandler = customSourcePickerJsp
      ? () => {
          setWizardIntegration(null);
          onViewChange("custom-source-picker");
        }
      : undefined;
    if (isFileIntegration) {
      return (
        <>
          <FileIntegrationWizard
            {...commonProps}
            initialAlias={wizardJspAlias}
            onChangeIntegrationType={changeTypeHandler}
            onComplete={(aliasName: string) => {
              handleFileIntegrationComplete(aliasName, wizardIntegration.name);
              if (wizardJspId) setConnectedJspIds((prev) => new Set(prev).add(wizardJspId));
              setWizardIntegration(null);
              setWizardJspAlias("");
              setWizardJspId(null);
              setCustomSourcePickerJsp(null);
              onViewChange("main");
              setToast({ message: `${aliasName} via ${wizardIntegration.name} connected successfully`, subtitle: "Data sync will take 24-48 hours. An email will be sent when successful.", visible: true });
            }}
          />
          <RequestIntegrationModal
            open={requestModal.open}
            integrationName={requestModal.integrationName}
            workspaceMembers={workspaceMembers}
            onClose={() => setRequestModal({ open: false, integrationName: "" })}
            onRequestMember={() => {}}
            onInviteNew={() => {}}
          />
        </>
      );
    }
    return (
      <>
        <DataSourceWizard
          {...commonProps}
          initialAlias={wizardJspAlias}
          onChangeIntegrationType={changeTypeHandler}
          savedCredentials={wizardIntegration ? savedWarehouseCreds[wizardIntegration.name] : undefined}
          onSaveCredentials={(values) => { if (wizardIntegration) setSavedWarehouseCreds((prev) => ({ ...prev, [wizardIntegration.name]: values })); }}
          onComplete={(name: string, dataCategories?: DataCategory[]) => {
            const displayName = wizardJspAlias || name;
            const isWarehouse = wizardIntegration && ["BigQuery", "Snowflake", "Amazon Redshift", "Databricks"].includes(wizardIntegration.name);
            const isNative = wizardIntegration && !isWarehouse && !["Google Sheets"].includes(wizardIntegration.name);

            // For native integrations (Facebook Ads etc.), use the standard handleConnect
            if (isNative) {
              handleConnect(name);
            }

            if (isDemoMode) {
              // Try pre-built demo fields first
              const aliasFields = getDemoFieldsForIntegration(displayName) || getDemoFieldsForIntegration(name);
              if (aliasFields.length > 0) {
                onFieldsCreated?.(aliasFields);
              } else if (isWarehouse) {
                // DWH: inject unmapped placeholder fields
                const warehouseColor = wizardIntegration?.color || "#4285F4";
                const sampleCols = [
                  { col: "date", kind: "dimension" as const, type: "DATE" as DataTypeKey },
                  { col: "campaign_id", kind: "dimension" as const, type: "STRING" as DataTypeKey },
                  { col: "spend", kind: "metric" as const, type: "CURRENCY" as DataTypeKey },
                  { col: "impressions", kind: "metric" as const, type: "INT64" as DataTypeKey },
                  { col: "clicks", kind: "metric" as const, type: "INT64" as DataTypeKey },
                  { col: "conversions", kind: "metric" as const, type: "FLOAT64" as DataTypeKey },
                  { col: "revenue", kind: "metric" as const, type: "CURRENCY" as DataTypeKey },
                ];
                const unmappedFields: Field[] = sampleCols.map((c) => ({
                  name: `${displayName.toLowerCase().replace(/\s+/g, "_")}_${c.col}`,
                  displayName: c.col.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
                  columnName: c.col,
                  kind: c.kind,
                  source: `${displayName} (${wizardIntegration!.name})`,
                  sourceColor: warehouseColor,
                  sourceKey: `${wizardIntegration!.name.toLowerCase().replace(/\s+/g, "_")}.${c.col}`,
                  dataType: c.type,
                  transformation: c.kind === "metric" ? "SUM" : "NONE",
                  status: "Unmapped" as const,
                  description: "",
                } as Field));
                onFieldsCreated?.(unmappedFields);
              }

              // Create monitoring entry for DWH and Google Sheets (native handled by handleConnect)
              if (!isNative) {
                const newEntry = createFileIntegration(displayName, wizardIntegration?.name || name, wizardIntegration);
                if (dataCategories && dataCategories.length > 0) {
                  (newEntry as Integration & { dataCategory?: DataCategory }).dataCategory = dataCategories[0];
                }
                setDynamicIntegrations((prev) => [...prev, newEntry]);
                setIntegrationStatuses((prev) => ({ ...prev, [newEntry.name]: "CONNECTED" }));
              }
            }
            if (wizardJspId) setConnectedJspIds((prev) => new Set(prev).add(wizardJspId));
            setWizardIntegration(null);
            setWizardJspAlias("");
            setWizardJspId(null);
            setCustomSourcePickerJsp(null);
            onViewChange("main");
            const catLabels = dataCategories?.map((c) => DATA_CATEGORY_LABELS[c]?.label).join(", ");
            setToast({ message: `${displayName} connected successfully`, subtitle: catLabels ? `Categorized as: ${catLabels}` : "Data sync will take 24-48 hours.", visible: true });
          }}
        />
        <RequestIntegrationModal
          open={requestModal.open}
          integrationName={requestModal.integrationName}
          workspaceMembers={workspaceMembers}
          onClose={() => setRequestModal({ open: false, integrationName: "" })}
          onRequestMember={() => {}}
          onInviteNew={() => {}}
        />
      </>
    );
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail" && selectedIntegration) {
    const cat = catalogIntegrations.find((c) => c.name === selectedIntegration.name);
    return (
      <DetailView
        integration={selectedIntegration}
        catalogEntry={cat}
        onBack={() => onViewChange("main")}
      />
    );
  }

  // ─── CATALOG VIEW ─────────────────────────────────────────────────────────
  if (view === "catalog") {
    return (
      <CatalogView
        onBack={() => onViewChange("main")}
        getEffectiveStatus={getEffectiveStatus}
        onStartWizard={handleStartWizard}
        jspIntegrationNames={jspIntegrationNames}
      />
    );
  }

  // ─── CUSTOM SOURCE PICKER VIEW ──────────────────────────────────────────
  // Shown when the user clicks Connect on a non-native JSP entry. Renders
  // the full Add Integrations page in custom-source mode: Native tab is
  // disabled, Files & Warehouses are selectable. When user picks a source,
  // we jump to the appropriate wizard with the JSP alias pre-filled.
  if (view === "custom-source-picker" && customSourcePickerJsp) {
    return (
      <AddIntegrationPage
        customSourceMode={{
          alias: customSourcePickerJsp.alias || customSourcePickerJsp.integrationName,
          onBack: () => {
            setCustomSourcePickerJsp(null);
            setWizardJspId(null);
            setWizardJspAlias("");
            onViewChange("main");
          },
          onSourceSelected: handleCustomSourceSelected,
        }}
      />
    );
  }

  // ─── SHARED JSP SETUP SECTION ─────────────────────────────────────────────
  // Renders the "Your Integration Setup" section identically in both
  // empty state and connected state. Accepts `collapsible` to control
  // whether the section can be collapsed/dismissed.

  const progressPct = totalJsp > 0 ? Math.round((connectedJspCount / totalJsp) * 100) : 0;
  const remainingJsp = totalJsp - connectedJspCount;

  const renderJspSetupContent = () => (
    <>
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--text-muted)] text-sm">Setup progress for {jspPlan.clientName}</p>
            <span className="text-[var(--text-muted)] text-xs">{progressPct}%</span>
          </div>
          <div className="w-full bg-[var(--bg-card-inner)] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "#00bc7d"
                  : "linear-gradient(90deg, #027b8e, #a855f7)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Native Integrations sub-section */}
      {nativeJsp.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">

            <span className="text-[var(--text-primary)] text-sm font-semibold">Native Integrations</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{nativeJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {nativeJsp.map((jsp) => {
              const cat = catalogIntegrations.find((c) => c.name === jsp.integrationName);
              if (!cat) return null;
              return (
                <IntegrationCard
                  key={jsp.id}
                  integration={cat}
                  onConnect={() => handleStartJspWizard(jsp)}
                  showPartnerBadge={cat.isPartner}
                  descriptionOverride={`Connect ${jsp.integrationName} to use this integration with Lifesight.`}
                  onDelegate={() => handleDelegateJsp(jsp)}
                  rightSlot={
                    <JspCardMenu
                      integrationType={jsp.type}
                      onIgnore={() => handleIgnoreJsp(jsp)}
                    />
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Files & Spreadsheets sub-section */}
      {fileJsp.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">

            <span className="text-[var(--text-primary)] text-sm font-semibold">Files &amp; Spreadsheets</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{fileJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {fileJsp.map((jsp) => {
              const sourceName = jsp.source;
              const cat = sourceName ? catalogIntegrations.find((c) => c.name === sourceName) : null;
              const desc = sourceName
                ? `Connect ${jsp.integrationName} using ${sourceName} to use this integration with Lifesight.`
                : `Connect ${jsp.integrationName} to use this integration with Lifesight.`;
              const cardMenu = (
                <JspCardMenu
                  integrationType={jsp.type}
                  onIgnore={() => handleIgnoreJsp(jsp)}
                  onChangeIntegrationType={() => handleChangeJspIntegrationType(jsp)}
                />
              );
              if (cat) {
                return (
                  <IntegrationCard
                    key={jsp.id}
                    integration={cat}
                    nameOverride={jsp.integrationName}
                    onConnect={() => handleStartJspWizard(jsp)}
                    descriptionOverride={desc}
                    onDelegate={() => handleDelegateJsp(jsp)}
                    rightSlot={cardMenu}
                  />
                );
              }
              // Unknown source — render custom fallback card with inline kebab
              return (
                <div
                  key={jsp.id}
                  onClick={() => handleStartJspWizard(jsp)}
                  className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-5 flex items-start gap-3 hover:border-[#027b8e]/40 cursor-pointer transition-colors relative"
                >
                  <div className="absolute top-2 right-2 z-10">{cardMenu}</div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#2b7fff]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#2b7fff" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                      <path d="M12 3v4h4" stroke="#2b7fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5 flex-1">
                    <span className="text-[var(--text-primary)] text-sm font-medium block pr-8">{jsp.integrationName}</span>
                    <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartJspWizard(jsp); }}
                        className="px-3 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
                      >
                        Connect
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelegateJsp(jsp); }}
                        className="px-3 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[var(--text-secondary)] text-[12px] font-medium hover:bg-[var(--hover-item)] transition-colors"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Warehouses sub-section */}
      {warehouseJsp.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">

            <span className="text-[var(--text-primary)] text-sm font-semibold">Data Warehouses</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{warehouseJsp.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {warehouseJsp.map((jsp) => {
              const sourceName = jsp.source;
              const cat = sourceName ? catalogIntegrations.find((c) => c.name === sourceName) : null;
              const desc = sourceName
                ? `Connect ${jsp.integrationName} using ${sourceName} to use this integration with Lifesight.`
                : `Connect ${jsp.integrationName} to use this integration with Lifesight.`;
              const cardMenu = (
                <JspCardMenu
                  integrationType={jsp.type}
                  onIgnore={() => handleIgnoreJsp(jsp)}
                  onChangeIntegrationType={() => handleChangeJspIntegrationType(jsp)}
                />
              );
              if (cat) {
                return (
                  <IntegrationCard
                    key={jsp.id}
                    integration={cat}
                    nameOverride={jsp.integrationName}
                    onConnect={() => handleStartJspWizard(jsp)}
                    descriptionOverride={desc}
                    onDelegate={() => handleDelegateJsp(jsp)}
                    rightSlot={cardMenu}
                  />
                );
              }
              // Unknown source — render custom fallback card with inline kebab
              return (
                <div
                  key={jsp.id}
                  onClick={() => handleStartJspWizard(jsp)}
                  className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-5 py-5 flex items-start gap-3 hover:border-[#027b8e]/40 cursor-pointer transition-colors relative"
                >
                  <div className="absolute top-2 right-2 z-10">{cardMenu}</div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#027b8e]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="#027b8e" strokeWidth="1.5" fill="none" />
                      <path d="M3 5v10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" stroke="#027b8e" strokeWidth="1.5" fill="none" />
                      <path d="M3 10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5" stroke="#027b8e" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5 flex-1">
                    <span className="text-[var(--text-primary)] text-sm font-medium block pr-8">{jsp.integrationName}</span>
                    <p className="text-[var(--text-dim)] text-xs mt-1 leading-relaxed">{desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartJspWizard(jsp); }}
                        className="px-3 h-[28px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[12px] font-medium transition-colors"
                      >
                        Connect
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelegateJsp(jsp); }}
                        className="px-3 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[var(--text-secondary)] text-[12px] font-medium hover:bg-[var(--hover-item)] transition-colors"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  // ─── MAIN VIEW ────────────────────────────────────────────────────────────

  // Cycle function for empty state mode toggle
  const cycleEmptyState = () => {
    const modes: typeof emptyStateMode[] = ["normal", "jsp-empty", "all-done", "no-jsp"];
    const idx = modes.indexOf(emptyStateMode);
    setEmptyStateMode(modes[(idx + 1) % modes.length]);
  };
  const emptyModeLabel = { normal: "Normal", "jsp-empty": "JSP Empty", "all-done": "All Done", "no-jsp": "No JSP" }[emptyStateMode];

  // JSP-driven empty state
  if (emptyStateMode === "jsp-empty") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
              <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" value={mainSearch} onChange={(e) => setMainSearch(e.target.value)} placeholder="Search" className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <button onClick={cycleEmptyState} className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto">{emptyModeLabel}</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-[var(--text-primary)] text-lg font-semibold">Finish Integration Setup</h2>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">Connect the integrations you have access to, or invite a teammate to help.</p>
            </div>
          </div>
          {renderJspSetupContent()}
        </div>
      </div>
    );
  }

  // All integrations connected state
  if (emptyStateMode === "all-done") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
              <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" value={mainSearch} onChange={(e) => setMainSearch(e.target.value)} placeholder="Search" className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <button onClick={cycleEmptyState} className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto">{emptyModeLabel}</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#00bc7d]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14l5.5 5.5L21 9" stroke="#00bc7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-1">All Integrations Connected</h2>
          <p className="text-[var(--text-muted)] text-sm mb-2">{totalJsp} integration{totalJsp !== 1 ? "s" : ""} from your setup plan are connected and syncing.</p>
          <button onClick={() => onViewChange("catalog")} className="mt-3 px-4 h-[32px] rounded-[6px] border border-[#027b8e]/30 text-[#027b8e] text-[12px] font-medium hover:bg-[#027b8e]/5 transition-colors">
            Add More Integrations
          </button>
        </div>
        {recommendedIntegrations.length > 0 && (
          <div>
            <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-3">Recommended Integrations</h3>
            <div className="grid grid-cols-4 gap-3">
              {recommendedIntegrations.map((cat) => (
                <button key={cat.name} onClick={() => handleStartWizard(cat)} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3 flex items-center gap-3 hover:border-[var(--border-secondary)] transition-colors text-left">
                  <IntegrationIcon integration={cat} />
                  <div className="min-w-0">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{cat.name}</span>
                    <span className="text-[var(--text-dim)] text-xs">{cat.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // No JSP setup available — clean empty state
  if (emptyStateMode === "no-jsp") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
              <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" value={mainSearch} onChange={(e) => setMainSearch(e.target.value)} placeholder="Search" className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors" />
          </div>
          <button onClick={cycleEmptyState} className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto">{emptyModeLabel}</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#027b8e]/10 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 6v20M6 16h20" stroke="#027b8e" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="16" r="12" stroke="#027b8e" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
          </div>
          <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-1">No Integrations Set Up Yet</h2>
          <p className="text-[var(--text-muted)] text-sm mb-5 max-w-md mx-auto">Get started by connecting your data sources. Lifesight supports 50+ integrations across advertising, analytics, CRM, and more.</p>
          <button onClick={() => onViewChange("catalog")} className="px-6 h-[36px] rounded-[6px] bg-[#027b8e] hover:bg-[#02899e] text-white text-[13px] font-medium transition-colors">
            Add Integration
          </button>
        </div>
        {recommendedIntegrations.length > 0 && (
          <div>
            <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-3">Popular Integrations</h3>
            <div className="grid grid-cols-4 gap-3">
              {recommendedIntegrations.map((cat) => (
                <button key={cat.name} onClick={() => handleStartWizard(cat)} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] px-4 py-3 flex items-center gap-3 hover:border-[var(--border-secondary)] transition-colors text-left">
                  <IntegrationIcon integration={cat} />
                  <div className="min-w-0">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{cat.name}</span>
                    <span className="text-[var(--text-dim)] text-xs">{cat.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar + data category filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-label)]">
            <circle cx="7.33" cy="7.33" r="5.33" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={mainSearch}
            onChange={(e) => setMainSearch(e.target.value)}
            placeholder="Search"
            className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] pl-9 pr-3 py-2 w-full placeholder-[var(--text-label)] focus:outline-none focus:border-[#027b8e] transition-colors"
          />
        </div>
        <select
          value={dataCategoryFilter ?? "all"}
          onChange={(e) => setDataCategoryFilter(e.target.value === "all" ? null : e.target.value as DataCategory)}
          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none focus:border-[#027b8e] transition-colors min-w-[160px] appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="all">All Categories</option>
          {(Object.entries(DATA_CATEGORY_LABELS) as [DataCategory, { label: string; color: string }][]).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-[6px] text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none focus:border-[#027b8e] transition-colors min-w-[160px] appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="all">All Statuses</option>
          <option value="healthy">Active</option>
          <option value="attention">Action Required</option>
          <option value="error">Sync Error</option>
        </select>
        <button
          onClick={cycleEmptyState}
          className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors ml-auto"
        >
          {emptyModeLabel}
        </button>
      </div>

      {/* ── Dismissed setup banner ──────────────────────────────────────── */}
      {setupDismissed && pendingJsp.length > 0 && (
        <button
          onClick={() => { setSetupDismissed(false); setSetupExpanded(true); }}
          className="w-full flex items-center gap-3 px-5 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] hover:bg-[var(--hover-bg)] transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-[6px] bg-[#027b8e]/10 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v5l3 3" stroke="#027b8e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="6" stroke="#027b8e" strokeWidth="1.2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[var(--text-primary)] text-sm font-medium">{pendingJsp.length} integration{pendingJsp.length !== 1 ? "s" : ""} still pending</span>
            <span className="text-[var(--text-dim)] text-xs ml-2">Click to resume setup</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-dim)] flex-shrink-0">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── Your Integration Setup (collapsible + dismissible) ────────── */}
      {pendingJsp.length > 0 && !setupDismissed && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          {/* Collapsible header */}
          <div className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none" onClick={() => setSetupExpanded(!setupExpanded)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${setupExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <h2 className="text-[var(--text-primary)] text-lg font-semibold">Finish Integration Setup</h2>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{remainingJsp} integration{remainingJsp !== 1 ? "s" : ""} still need{remainingJsp === 1 ? "s" : ""} your attention</p>
            </div>
            <span className="text-[var(--text-muted)] text-sm mr-2">{connectedJspCount} / {totalJsp} connected</span>
            {/* Dismiss button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDismissWarning(true); }}
              className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--hover-item)]"
              title="Dismiss setup section"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          {/* Expandable content */}
          {setupExpanded && (
            <div className="px-6 pb-6">
              {renderJspSetupContent()}
            </div>
          )}
        </div>
      )}

      {/* ── All Integrations Connected ────────────────────────────────── */}
      {allJspConnected && (
        <button
          onClick={() => setEmptyStateMode("jsp-empty")}
          className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-dashed border-[var(--border-secondary)] rounded px-2 py-0.5 transition-colors"
        >
          All integrations connected · Show setup
        </button>
      )}

      {/* ── Recommended Integrations (shown when no JSP setup) ─────── */}
      {pendingJsp.length === 0 && !allJspConnected && showRecommended && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold">Recommended Integrations</h3>
              <p className="text-[var(--text-dim)] text-xs mt-0.5">Get started by connecting popular data sources</p>
            </div>
            <button
              onClick={() => setShowRecommended(false)}
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors p-1 rounded-md hover:bg-[var(--hover-item)]"
              title="Dismiss recommendations"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="border-t border-[var(--border-primary)] px-5 py-4 grid grid-cols-4 gap-3">
            {recommendedIntegrations.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleStartWizard(cat)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-[8px] border border-[var(--border-primary)] hover:border-[#027b8e]/40 hover:bg-[#027b8e]/5 transition-all group"
              >
                <IntegrationIcon integration={cat} />
                <span className="text-[var(--text-primary)] text-xs font-medium group-hover:text-[#027b8e] transition-colors">{cat.name}</span>
                <span className="px-2 py-[3px] rounded-[4px] bg-[#027b8e]/10 text-[#027b8e] text-[10px] font-medium">Connect</span>
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--border-primary)] px-5 py-3 flex justify-center">
            <button
              onClick={() => onViewChange("catalog")}
              className="text-[#027b8e] text-xs font-medium hover:underline"
            >
              View all integrations
            </button>
          </div>
        </div>
      )}

      {/* ── Show Recommendations toggle (when dismissed) ──────────── */}
      {pendingJsp.length === 0 && !allJspConnected && !showRecommended && (
        <button
          onClick={() => setShowRecommended(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-[8px] hover:border-[#027b8e]/40 hover:bg-[#027b8e]/5 transition-all text-[var(--text-dim)] hover:text-[#027b8e] text-xs"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Show recommended integrations
        </button>
      )}

      {/* ── Action Required Section ───────────────────────────────────────── */}
      {filteredIssues.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <button
            onClick={() => setNeedsAttentionExpanded(!needsAttentionExpanded)}
            className="flex items-center gap-2 w-full px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${needsAttentionExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Action Required</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{filteredIssues.length}</span>
          </button>
          {needsAttentionExpanded && (
            <div className="border-t border-[var(--border-primary)]">
              <IntegrationTableHeader />
              {filteredIssues.map((integration) => {
                const cat = catalogIntegrations.find((c) => c.name === integration.name);
                const status = getEffectiveStatus(integration.name, integration.status);
                return (
                  <IntegrationRow
                    key={integration.name}
                    integration={integration}
                    catalogEntry={cat}
                    effectiveStatus={status}
                    isExpanded={expandedRows[integration.name] ?? false}
                    openKebab={openKebabName === integration.name}
                    onToggleExpand={() => toggleRow(integration.name)}
                    onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                    onViewDetails={() => handleViewDetails(integration)}
                    onReportIssue={() => {
                      setOpenKebabName(null);
                      setSupportModal({ open: true, name: integration.name, success: false });
                    }}
                    onReconnect={status === "ACTION_REQUIRED" && cat ? () => handleStartWizard(cat) : undefined}
                    onCompleteSetup={status === "SETUP_INCOMPLETE" && cat ? () => handleStartWizard(cat) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Invited Section ──────────────────────────────────────────────── */}
      {filteredInvited.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <div className="flex items-center gap-2 w-full px-5 py-3.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#a855f7]">
              <path d="M8 1L8 3M8 13L8 15M1 8L3 8M13 8L15 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Invited</span>
            <span className="bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{filteredInvited.length}</span>
          </div>
          <div className="border-t border-[var(--border-primary)]">
            {filteredInvited.map((integration) => {
              const cat = catalogIntegrations.find((c) => c.name === integration.name);
              return (
                <div
                  key={integration.name}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--hover-bg)] transition-colors"
                >
                  {cat ? (
                    <IntegrationIcon integration={cat} />
                  ) : (
                    <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}18` }}>
                      <span className="text-[8px] font-bold" style={{ color: integration.color }}>{integration.icon}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--text-primary)] text-sm font-medium block">{integration.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">
                      Invited by <strong className="text-[var(--text-secondary)]">{integration.invitedBy}</strong>
                      {integration.invitedAt && <> · {new Date(integration.invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#a855f7]/30 text-[10px] font-semibold uppercase tracking-wide text-[#a855f7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                    Invited
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Healthy Integrations ──────────────────────────────────────────── */}
      {filteredConnected.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <button
            onClick={() => setConnectedExpanded(!connectedExpanded)}
            className="flex items-center gap-2 w-full px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${connectedExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Active</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{filteredConnected.length}</span>
          </button>
          {connectedExpanded && (
          <div className="border-t border-[var(--border-primary)]">
            <IntegrationTableHeader />
            {filteredConnected.map((integration) => {
              const cat = catalogIntegrations.find((c) => c.name === integration.name);
              const effectiveStatus = getEffectiveStatus(integration.name, integration.status);
              return (
                <IntegrationRow
                  key={integration.name}
                  integration={integration}
                  catalogEntry={cat}
                  effectiveStatus={effectiveStatus}
                  isExpanded={expandedRows[integration.name] ?? false}
                  openKebab={openKebabName === integration.name}
                  onToggleExpand={() => toggleRow(integration.name)}
                  onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                  onViewDetails={() => handleViewDetails(integration)}
                  onReportIssue={() => {
                    setOpenKebabName(null);
                    setSupportModal({ open: true, name: integration.name, success: false });
                  }}
                  onSimulateSyncComplete={effectiveStatus === "SYNCING" ? () => handleSimulateSyncComplete(integration.name) : undefined}
                />
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ── Sync Errors Section ────────────────────────────────────────────── */}
      {filteredSyncErrors.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <button
            onClick={() => setSyncErrorsExpanded(!syncErrorsExpanded)}
            className="flex items-center gap-2 w-full px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${syncErrorsExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Sync Errors</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{filteredSyncErrors.length}</span>
          </button>
          {syncErrorsExpanded && (
            <div className="border-t border-[var(--border-primary)]">
              <div className="flex items-start gap-2 bg-[#2b7fff]/5 px-5 py-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6" stroke="#2b7fff" strokeWidth="1.2" />
                  <path d="M8 5.5v3" stroke="#2b7fff" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.75" fill="#2b7fff" />
                </svg>
                <p className="text-[#2b7fff] text-xs leading-relaxed">
                  These sync issues are on our end — no action needed from you. Our team is actively working on a fix and we&apos;ll notify you once resolved.
                </p>
              </div>
              <IntegrationTableHeader />
              {filteredSyncErrors.map((integration) => {
                const cat = catalogIntegrations.find((c) => c.name === integration.name);
                return (
                  <IntegrationRow
                    key={integration.name}
                    integration={integration}
                    catalogEntry={cat}
                    effectiveStatus={getEffectiveStatus(integration.name, integration.status)}
                    isExpanded={expandedRows[integration.name] ?? false}
                    openKebab={openKebabName === integration.name}
                    onToggleExpand={() => toggleRow(integration.name)}
                    onToggleKebab={() => setOpenKebabName(openKebabName === integration.name ? null : integration.name)}
                    onViewDetails={() => handleViewDetails(integration)}
                    onReportIssue={() => {
                      setOpenKebabName(null);
                      setSupportModal({ open: true, name: integration.name, success: false });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Requested Integrations (hidden in demo mode) ─────────────────── */}
      {requestedIntegrations.length > 0 && !isDemoMode && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[8px] overflow-hidden">
          <button
            onClick={() => setRequestedExpanded(!requestedExpanded)}
            className="flex items-center gap-2 w-full px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 flex-shrink-0 ${requestedExpanded ? "rotate-90" : ""}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[var(--text-primary)] text-sm font-semibold">Requested Integrations</span>
            <span className="bg-[var(--bg-badge)] text-[var(--text-muted)] text-[10px] font-semibold px-2 py-[3px] rounded-[4px]">{requestedIntegrations.length}</span>
          </button>
          {requestedExpanded && (
          <div className="grid grid-cols-4 gap-3 p-5 border-t border-[var(--border-primary)]">
            {requestedIntegrations.map((integration) => (
              <button
                key={integration.name}
                onClick={() => setRequestedModal({ open: true, integration })}
                className="bg-[var(--bg-card-inner)] border border-[var(--border-primary)] rounded-[8px] px-5 py-4 flex items-center gap-3 hover:border-[#a855f7]/40 transition-colors text-left"
              >
                <IntegrationIconSmall integration={integration} />
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium block">{integration.name}</span>
                  {integration.requestedDate && (
                    <span className="text-[var(--text-dim)] text-[10px] mt-0.5 block">
                      Requested {new Date(integration.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <span className="px-2 py-[3px] rounded-[4px] bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-semibold border border-[#a855f7]/20 flex-shrink-0">
                  Requested
                </span>
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <SupportModal
        open={supportModal.open}
        name={supportModal.name}
        success={supportModal.success}
        onClose={() => setSupportModal({ open: false, name: "", success: false })}
        onSubmit={() => setSupportModal((prev) => ({ ...prev, success: true }))}
      />

      <RequestedModal
        open={requestedModal.open}
        integration={requestedModal.integration}
        onClose={() => setRequestedModal({ open: false, integration: null })}
      />

      <InviteUserModal
        open={inviteModal.open}
        integrationName={inviteModal.integrationName}
        onClose={() => setInviteModal({ open: false, integrationName: "" })}
        onSubmit={() => {}}
      />

      <RequestIntegrationModal
        open={requestModal.open}
        integrationName={requestModal.integrationName}
        workspaceMembers={workspaceMembers}
        onClose={() => setRequestModal({ open: false, integrationName: "" })}
        onRequestMember={() => {}}
        onInviteNew={() => {}}
      />

      {/* ── Dismiss Setup Warning Modal ─────────────────────────────────── */}
      {showDismissWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDismissWarning(false)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[12px] max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#fe9a00]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L1 18h18L10 2z" stroke="#fe9a00" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  <path d="M10 8v4" stroke="#fe9a00" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="14.5" r="0.75" fill="#fe9a00" />
                </svg>
              </div>
              <h3 className="text-[var(--text-primary)] text-base font-semibold">Hide Integration Setup?</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-5 leading-relaxed">
              You still have {pendingJsp.length} pending integration{pendingJsp.length !== 1 ? "s" : ""}. You can bring this section back anytime from the toolbar above.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDismissWarning(false)}
                className="px-4 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setSetupDismissed(true); setShowDismissWarning(false); }}
                className="px-4 h-[28px] rounded-[6px] bg-[#fe9a00] hover:bg-[#e58c00] text-white text-[12px] font-medium transition-colors"
              >
                Hide Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ignore JSP Confirmation Modal ──────────────────────────────────── */}
      {ignoreConfirmJsp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIgnoreConfirmJsp(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[12px] max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[8px] bg-[var(--bg-badge)] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <path d="M5 5l10 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-[var(--text-primary)] text-base font-semibold">Ignore &ldquo;{ignoreConfirmJsp.integrationName}&rdquo;?</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-5 leading-relaxed">
              This integration won&apos;t be shown in your setup section anymore. You can still add it later from the Add Integration page.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIgnoreConfirmJsp(null)}
                className="px-4 h-[28px] rounded-[6px] border border-[var(--border-secondary)] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--hover-item)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmIgnoreJsp}
                className="px-4 h-[28px] rounded-[6px] bg-[var(--bg-badge)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-item)] text-[12px] font-medium transition-colors"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-Sync Onboarding ──────────────────────────────────────────── */}
      {postSyncIntegration && (
        <PostSyncOnboarding
          integrationName={postSyncIntegration}
          onComplete={() => setPostSyncIntegration(null)}
          onNavigateToDetail={() => {
            const integration = allCombinedIntegrations.find((i) => i.name === postSyncIntegration);
            if (integration) {
              setSelectedIntegration(integration);
              onViewChange("detail");
            }
          }}
        />
      )}

      {/* ── Toast Notification ──────────────────────────────────────────── */}
      <div
        className="fixed top-6 right-6 z-50 transition-all duration-300 ease-out"
        style={{ transform: toast.visible ? "translateX(0)" : "translateX(120%)", opacity: toast.visible ? 1 : 0, pointerEvents: toast.visible ? "auto" : "none" }}
      >
        <div className="flex items-start gap-3 px-5 py-4 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-primary)] max-w-[345px]">
          <div className="w-6 h-6 rounded-full bg-[#00bc7d]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="#00bc7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[var(--text-primary)] text-sm font-medium block">{toast.message}</span>
            {toast.subtitle && <span className="text-[var(--text-muted)] text-xs mt-1 block">{toast.subtitle}</span>}
          </div>
          <button onClick={() => setToast((t) => ({ ...t, visible: false }))} className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
