# Data Module Architecture: DWH Integration & Unified Data Layer

## Confirmed Constraints
- **Backend**: BigQuery (per-tenant datasets)
- **Sync model**: Batch sync (scheduled pull)
- **Schema flexibility**: Fully flexible
- **Multi-table**: One DWH connection can source multiple tables
- **Direction**: Option 2 (Two-Tier) — refined below to address category and multi-source issues

---

## Current State

```
Native Integrations → ad_insights → ┐
Google Sheets (custom_costs) → ad_insights → ├─→ adspends_mat_view
GA4 → ga4_insights → ┘

Google Sheets (mmm) → MMM model input (day × channel aggregated)
Google Sheets (experiments) → Experiment input
Google Sheets (custom) → General purpose

Per-channel: ad_budgets, creative_insights
```

---

## Two Key Problems with Original Two-Tier

### Problem 1: Categories ≠ Tiers

The original Two-Tier model used **granularity** (ad-level vs aggregated) as the primary axis. But granularity is only meaningful for **Paid Marketing** data. The real primary axis is **data category**:

```
                        Granularity
                 Ad/Campaign     Channel/Day      Day-only
                 level           level            aggregate
Category         
─────────────────────────────────────────────────────────────
KPI              per-order       per-channel      daily total
(revenue,        revenue         revenue          revenue
 conversions)    ✅ possible     ✅ possible      ✅ possible

Paid Marketing   per-ad spend    per-tactic       (not useful
(spend, imps,    ✅ MOST COMMON  spend             without
 clicks)                         ✅ from sheets    channel)

Organic          (doesn't        ig_organic_imps  newsletter
(email, social,   exist at       seo_clicks       opens
 SEO)             ad level)      ✅ ALWAYS THIS   ✅ ALWAYS

Contextual       (doesn't        (doesn't         weather,
(weather, fuel,   exist)          exist)           fuel_price,
 product launch)                                   product_launch
                                                   ✅ ALWAYS THIS
```

**Conclusion**: Category should be the primary routing key, with granularity as a sub-choice only for Paid Marketing and KPI.

### Problem 2: Multi-Source in One Table

A single DWH table or Google Sheet can contain rows for MULTIPLE sources:

```
date       | source    | campaign        | spend  | impressions
2024-01-01 | Facebook  | Brand Campaign  | 1000   | 50000
2024-01-01 | Google    | Search Campaign | 800    | 30000
2024-01-01 | TikTok    | Video Campaign  | 500    | 20000
```

This is exactly how `custom_costs` works today. The `source` column is user-provided and can contain arbitrary source names.

**Questions this raises**:
- If a user brings Facebook spend via DWH AND has native Facebook integration, how do we handle overlap?
- Does the `source` column value need to match the native integration name exactly?
- Should we support source aliasing (user writes "FB" but we map it to "Facebook")?

---

## Revised Architecture: Category-First with Granularity Awareness

### Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     USER FLOW: ADDING DWH DATA                       │
│                                                                      │
│  Step 1: Connect to warehouse (BigQuery/Snowflake/Redshift)          │
│  Step 2: Select table(s)                                             │
│  Step 3: FOR EACH TABLE, classify:                                   │
│                                                                      │
│    "What category of data is this?"                                  │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐      │
│    │ ○ Paid Marketing                                         │      │
│    │   Ad spend, impressions, clicks, CPC, CPM                │      │
│    │   → "At what level?"                                     │      │
│    │     ○ Campaign/Ad level (rows per campaign per day)      │      │
│    │     ○ Channel/Tactic level (rows per channel per day)    │      │
│    │                                                          │      │
│    │ ○ KPI / Revenue                                          │      │
│    │   Revenue, conversions, orders, store visits              │      │
│    │   → "At what level?"                                     │      │
│    │     ○ Transaction level (per order/event)                │      │
│    │     ○ Daily aggregate (total per day)                    │      │
│    │                                                          │      │
│    │ ○ Organic                                                │      │
│    │   Email opens, organic social impressions, SEO clicks    │      │
│    │   Always channel × day level                             │      │
│    │                                                          │      │
│    │ ○ Contextual                                             │      │
│    │   Weather, fuel prices, product launches, holidays       │      │
│    │   Always day level (possibly with geo dimension)         │      │
│    └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Step 4: Map columns to canonical schema for chosen category         │
│  Step 5: Configure source field (if multi-source)                    │
│  Step 6: Set sync schedule                                           │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow by Category

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PAID MARKETING                                    │
│                                                                     │
│  ┌─ Granular (ad/campaign level) ─────────────────────────────────┐ │
│  │                                                                 │ │
│  │  Native APIs ──────→ ad_insights                                │ │
│  │  Sheets (custom_costs) → ad_insights                            │ │
│  │  DWH (ad-level) ────→ ad_insights                               │ │
│  │  CSV (ad-level) ────→ ad_insights                               │ │
│  │                                                                 │ │
│  │  Schema: date, source, campaign_name, ad_name?,                 │ │
│  │          spend, impressions, clicks, conversions?, ...          │ │
│  │                                                                 │ │
│  │  Multi-source: source column can have N different sources       │ │
│  │  → Each source value becomes a row in ad_insights               │ │
│  │                                                                 │ │
│  │  OUTPUT: → adspends_mat_view                                    │ │
│  │          → auto-aggregate by tactic → mmm_spend_view            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ Aggregated (channel/tactic level) ────────────────────────────┐ │
│  │                                                                 │ │
│  │  Sheets (mmm spend) → paid_agg_input                            │ │
│  │  DWH (agg spend) ──→ paid_agg_input                             │ │
│  │                                                                 │ │
│  │  Schema: date, channel, tactic?, spend, impressions?, clicks?   │ │
│  │                                                                 │ │
│  │  Used when user does NOT have ad-level data for a channel       │ │
│  │  (e.g., TV, Radio, Print, OOH — no digital ad platform)        │ │
│  │                                                                 │ │
│  │  OUTPUT: → mmm_spend_view (unified with auto-aggregated Tier 1) │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ mmm_spend_view (UNIFIED) ─────────────────────────────────────┐ │
│  │  = auto_aggregated(ad_insights by tactic)                       │ │
│  │    UNION ALL                                                    │ │
│  │    paid_agg_input                                               │ │
│  │                                                                 │ │
│  │  This is the complete paid marketing picture for MMM            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    KPI DATA                                          │
│                                                                     │
│  Shopify orders ──────→ kpi_data                                    │
│  GA4 conversions ─────→ kpi_data                                    │
│  Sheets (kpi) ────────→ kpi_data                                    │
│  DWH (kpi) ──────────→ kpi_data                                    │
│                                                                     │
│  Schema: date, kpi_name, kpi_value, source?,                        │
│          geo_dimension?, channel_dimension?                          │
│                                                                     │
│  Examples:                                                          │
│    date=2024-01-01, kpi_name=revenue, kpi_value=50000               │
│    date=2024-01-01, kpi_name=orders, kpi_value=320                  │
│    date=2024-01-01, kpi_name=conversions, kpi_value=150, geo=US-CA  │
│                                                                     │
│  OUTPUT: → MMM dependent variable                                   │
│          → Experiment outcome variable                              │
│          → KPI dashboards                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ORGANIC DATA                                      │
│                                                                     │
│  Always aggregated: channel × day                                   │
│                                                                     │
│  HubSpot/Klaviyo ────→ organic_data (via native connectors)         │
│  Sheets (organic) ───→ organic_data                                 │
│  DWH (organic) ──────→ organic_data                                 │
│                                                                     │
│  Schema: date, channel, metric_name, metric_value                   │
│                                                                     │
│  Examples:                                                          │
│    date=2024-01-01, channel=Instagram, metric=organic_impressions,  │
│      value=125000                                                   │
│    date=2024-01-01, channel=Email, metric=email_opens, value=4500   │
│    date=2024-01-01, channel=SEO, metric=organic_clicks, value=8200  │
│                                                                     │
│  OUTPUT: → MMM independent variable (non-paid marketing activity)   │
│          → Organic performance reporting                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXTUAL DATA                                   │
│                                                                     │
│  Always aggregated: day level (optionally with geo)                 │
│                                                                     │
│  Sheets (contextual) → contextual_data                              │
│  DWH (contextual) ───→ contextual_data                              │
│  (No native connectors — always user-provided)                      │
│                                                                     │
│  Schema: date, variable_name, variable_value, variable_type,        │
│          geo_dimension?                                             │
│                                                                     │
│  Examples:                                                          │
│    date=2024-01-01, variable=product_launch, value=1, type=Binary   │
│    date=2024-01-01, variable=fuel_price, value=3.49, type=Continuous│
│    date=2024-01-01, variable=avg_temperature, value=72,             │
│      type=Continuous, geo=US-CA                                     │
│    date=2024-01-01, variable=is_holiday, value=0, type=Binary       │
│                                                                     │
│  OUTPUT: → MMM control variable                                     │
│          → Experiment contextual factor                             │
└─────────────────────────────────────────────────────────────────────┘
```

### How It All Comes Together for MMM

```
MMM Model Input = JOIN by date (+ optional geo) of:

┌───────────────────────────────────────────────────────────────┐
│ date       │ tactic     │ spend  │ impressions │ (from mmm_  │
│            │            │        │             │  spend_view) │
├────────────┼────────────┼────────┼─────────────┤             │
│ 2024-01-01 │ Meta MOF   │ 5000   │ 250000      │             │
│ 2024-01-01 │ Google SEM │ 3000   │ 120000      │             │
│ 2024-01-01 │ TV         │ 15000  │ NULL        │ ← from      │
│            │            │        │             │   paid_agg   │
└───────────────────────────────────────────────────────────────┘
  +
┌───────────────────────────────────────────────────────────────┐
│ date       │ kpi_name   │ kpi_value │ (from kpi_data)         │
├────────────┼────────────┼───────────┤                         │
│ 2024-01-01 │ revenue    │ 50000     │                         │
│ 2024-01-01 │ orders     │ 320       │                         │
└───────────────────────────────────────────────────────────────┘
  +
┌───────────────────────────────────────────────────────────────┐
│ date       │ channel    │ metric              │ value │(from  │
│            │            │                     │       │organic│
├────────────┼────────────┼─────────────────────┼───────┤_data) │
│ 2024-01-01 │ Instagram  │ organic_impressions │ 125K  │       │
│ 2024-01-01 │ Email      │ email_opens         │ 4500  │       │
└───────────────────────────────────────────────────────────────┘
  +
┌───────────────────────────────────────────────────────────────┐
│ date       │ variable       │ value │ type    │(from          │
│            │                │       │         │contextual_data│
├────────────┼────────────────┼───────┼─────────┤)              │
│ 2024-01-01 │ product_launch │ 1     │ Binary  │               │
│ 2024-01-01 │ fuel_price     │ 3.49  │ Contin. │               │
└───────────────────────────────────────────────────────────────┘

= COMPLETE MMM INPUT DATASET
```

### Legacy Compatibility: How Current Sheets Types Map

| Current Sheets Type | New Category | New Granularity | Target Table |
|---------------------|-------------|-----------------|--------------|
| `custom_costs` | Paid Marketing | Campaign/Ad level | ad_insights |
| `mmm` (spend data) | Paid Marketing | Channel/Tactic level | paid_agg_input |
| `mmm` (mixed spend+kpi) | Split: Paid Marketing + KPI | Channel + Daily | paid_agg_input + kpi_data |
| `experiments` | Paid Marketing + KPI | Channel + Daily | experiment_input (special) |
| `custom` (organic metrics) | Organic | Channel × Day | organic_data |
| `custom` (contextual vars) | Contextual | Day | contextual_data |
| `custom` (other) | Depends on content | Varies | appropriate table |

**Key change**: The current `mmm` sheet type often mixes spend data AND KPI data in the same row (`date | channel | spend | revenue`). In the new system, this could be:
- Option A: Keep allowing mixed sheets, split during ingestion (spend → paid_agg, revenue → kpi_data)
- Option B: Ask users to provide separate sources for spend vs KPI
- **Recommendation**: Option A — split during ingestion, since this is the most natural format for users

---

## Handling Multi-Source Data

### The Problem

A single data source (Google Sheet or DWH table) can contain rows for multiple sources:

```
date       | source    | campaign   | spend
2024-01-01 | Facebook  | Brand      | 1000
2024-01-01 | Google    | Search     | 800
2024-01-01 | CustomCh  | TV Spot    | 5000
```

### Design

**Step A: Source Column Mapping**

During column mapping, user identifies which column is the `source` field:
```
┌──────────────────────────────────────────────────┐
│ Column Mapping (Paid Marketing - Campaign Level) │
│                                                  │
│ Your Column    →    Lifesight Field              │
│ date           →    date            (required)   │
│ source ★       →    source          (required)   │
│ campaign       →    campaign_name   (required)   │
│ spend          →    spend           (required)   │
│ impressions    →    impressions     (optional)   │
│                                                  │
│ ★ Source column detected. Found 3 unique values: │
│   Facebook, Google, CustomCh                     │
│                                                  │
│ Source value mapping (optional):                  │
│   Facebook  → Facebook Ads  (auto-matched)       │
│   Google    → Google Ads    (auto-matched)        │
│   CustomCh  → [user enters: "TV"]                │
└──────────────────────────────────────────────────┘
```

**Step B: Source-level behavior**

```
For each source value in the data:

1. UNIQUE SOURCE (no native integration exists, e.g., "TV"):
   → Insert into ad_insights as-is
   → Becomes a new source in adspends_mat_view
   → Available for tactic mapping

2. OVERLAPPING SOURCE (native integration also exists, e.g., "Facebook"):
   → User chooses dedup strategy per source:
   
   ┌──────────────────────────────────────────────────────┐
   │ "Facebook" also has a native integration.             │
   │ How should we handle overlap?                         │
   │                                                      │
   │ ○ DWH overrides native (use DWH data for this source)│
   │ ○ Native takes priority (DWH fills gaps only)        │
   │ ○ Keep both (mark with _source_type for reference)   │
   │ ○ Skip this source (don't import Facebook rows)      │
   └──────────────────────────────────────────────────────┘
```

**Step C: In ad_insights table**

```sql
-- ad_insights gets additional tracking columns:
ALTER TABLE ad_insights ADD COLUMN _source_type STRING;  -- 'native' | 'sheets' | 'dwh'
ALTER TABLE ad_insights ADD COLUMN _integration_id STRING;
ALTER TABLE ad_insights ADD COLUMN _priority INT64 DEFAULT 0; -- for dedup

-- adspends_mat_view uses priority for dedup:
CREATE VIEW adspends_mat_view AS
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY date, source, campaign_name, COALESCE(ad_name, '')
      ORDER BY _priority DESC, _synced_at DESC
    ) AS rn
  FROM ad_insights_union  -- includes native + sheets + dwh
)
SELECT * FROM ranked WHERE rn = 1;
```

---

## BigQuery Implementation Detail

### Dataset Layout (per tenant)

```
BigQuery Project: lifesight-prod
│
├── Dataset: tenant_{id}_raw
│   ├── native_facebook              ← raw API data
│   ├── native_google_ads            ← raw API data
│   ├── native_shopify               ← raw API data
│   ├── native_ga4                   ← raw API data
│   ├── sheets_{integration_id}      ← raw sheet data
│   ├── dwh_{integration_id}_001     ← raw DWH table 1 (original schema)
│   ├── dwh_{integration_id}_002     ← raw DWH table 2 (original schema)
│   └── ...
│
├── Dataset: tenant_{id}_data
│   ├── ad_insights                  ← canonical (existing, modified)
│   ├── ga4_insights                 ← canonical (existing)
│   ├── paid_agg_input               ← NEW: aggregated paid marketing
│   ├── kpi_data                     ← NEW: KPI/revenue data
│   ├── organic_data                 ← NEW: organic metrics
│   ├── contextual_data              ← NEW: contextual variables
│   ├── experiment_input             ← NEW: experiment-specific data
│   ├── ad_budgets                   ← existing
│   ├── creative_insights            ← existing
│   └── tactic_mappings              ← campaign → tactic assignments
│
├── Dataset: tenant_{id}_views
│   ├── adspends_mat_view            ← MODIFIED: includes DWH sources
│   ├── mmm_spend_view               ← NEW: auto-agg + paid_agg_input
│   ├── mmm_unified_view             ← NEW: spend + kpi + organic + contextual
│   └── experiment_unified_view      ← NEW: experiment-ready dataset
│
└── Dataset: tenant_{id}_meta
    ├── integration_registry         ← integration configs
    ├── column_mappings              ← per-integration column maps
    ├── sync_log                     ← sync history
    └── source_aliases               ← source name normalization
```

### Core Tables

```sql
-- ═══════════════════════════════════════════════
-- INTEGRATION REGISTRY (metadata)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_meta.integration_registry` (
  id STRING NOT NULL,                    -- UUID
  name STRING NOT NULL,                  -- user-given alias
  connector_type STRING NOT NULL,        -- 'native' | 'sheets' | 'csv' | 'bigquery' | 'snowflake' | 'redshift' | 'databricks'
  connection_id STRING,                  -- FK to dwh_connections (for warehouse types)
  data_category STRING NOT NULL,         -- 'paid_marketing' | 'kpi' | 'organic' | 'contextual'
  granularity STRING,                    -- 'ad_level' | 'campaign_level' | 'channel_level' | 'daily_aggregate' | 'transaction_level'
  source_ref STRING,                     -- fully qualified source (table name, sheet URL, etc.)
  raw_table STRING,                      -- landing table in _raw dataset
  target_table STRING,                   -- canonical table in _data dataset
  column_mappings JSON,                  -- column mapping configuration
  source_column STRING,                  -- which column contains the source identifier (for multi-source)
  source_aliases JSON,                   -- {"FB": "Facebook Ads", "G": "Google Ads"}
  dedup_strategy STRING DEFAULT 'append',-- 'override_native' | 'native_priority' | 'keep_both' | 'skip_overlap'
  dedup_keys ARRAY<STRING>,             -- columns for dedup
  sync_schedule STRING,                  -- cron expression
  sync_status STRING DEFAULT 'pending',  -- 'pending' | 'syncing' | 'success' | 'error'
  last_sync_at TIMESTAMP,
  last_sync_rows INT64,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- DWH CONNECTIONS (shared across integrations)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_meta.dwh_connections` (
  id STRING NOT NULL,
  name STRING NOT NULL,                  -- "Our Snowflake" or "Marketing BigQuery"
  connector_type STRING NOT NULL,        -- 'bigquery' | 'snowflake' | 'redshift' | 'databricks'
  connection_config JSON,                -- encrypted credentials, host, project, etc.
  status STRING DEFAULT 'active',        -- 'active' | 'inactive' | 'error'
  last_tested_at TIMESTAMP,
  created_at TIMESTAMP
);
-- One connection → many integrations (one per table)


-- ═══════════════════════════════════════════════
-- PAID MARKETING: ad_insights (MODIFIED existing)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_data.ad_insights` (
  date DATE NOT NULL,
  source STRING NOT NULL,                -- 'Facebook Ads', 'Google Ads', 'TV', etc.
  account_id STRING,
  campaign_id STRING,
  campaign_name STRING,
  adset_id STRING,
  adset_name STRING,
  ad_id STRING,
  ad_name STRING,
  spend FLOAT64,
  impressions INT64,
  clicks INT64,
  conversions FLOAT64,
  revenue FLOAT64,
  currency STRING DEFAULT 'USD',
  -- NEW columns for multi-source tracking:
  _source_type STRING NOT NULL,          -- 'native' | 'sheets' | 'dwh'
  _integration_id STRING NOT NULL,
  _priority INT64 DEFAULT 0,            -- higher = takes precedence in dedup
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY source, _source_type;


-- ═══════════════════════════════════════════════
-- PAID MARKETING: aggregated input (NEW)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_data.paid_agg_input` (
  date DATE NOT NULL,
  channel STRING NOT NULL,               -- 'TV', 'Radio', 'Print', 'Facebook Ads', etc.
  tactic STRING,                         -- optional finer grouping
  spend FLOAT64,
  impressions INT64,
  clicks INT64,
  -- For channels like TV/Radio that don't have digital metrics:
  grps FLOAT64,                          -- Gross Rating Points
  reach FLOAT64,
  -- Tracking:
  _source_type STRING NOT NULL,
  _integration_id STRING NOT NULL,
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY channel;


-- ═══════════════════════════════════════════════
-- KPI DATA (NEW)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_data.kpi_data` (
  date DATE NOT NULL,
  kpi_name STRING NOT NULL,              -- 'revenue', 'orders', 'conversions', etc.
  kpi_value FLOAT64 NOT NULL,
  kpi_type STRING,                       -- KpiSubtype: Revenue, Conversions, Orders...
  source STRING,                         -- where this KPI came from (Shopify, GA4, etc.)
  -- Optional dimensions for geo experiments:
  geo_dimension STRING,                  -- country, state, DMA, etc.
  channel_dimension STRING,              -- if KPI can be attributed to a channel
  -- Tracking:
  _source_type STRING NOT NULL,
  _integration_id STRING NOT NULL,
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY kpi_name;


-- ═══════════════════════════════════════════════
-- ORGANIC DATA (NEW)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_data.organic_data` (
  date DATE NOT NULL,
  channel STRING NOT NULL,               -- 'Instagram', 'Email', 'SEO', 'YouTube Organic', etc.
  metric_name STRING NOT NULL,           -- 'organic_impressions', 'email_opens', 'seo_clicks'
  metric_value FLOAT64 NOT NULL,
  -- Tracking:
  _source_type STRING NOT NULL,
  _integration_id STRING NOT NULL,
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY channel;


-- ═══════════════════════════════════════════════
-- CONTEXTUAL DATA (NEW)
-- ═══════════════════════════════════════════════

CREATE TABLE `tenant_{id}_data.contextual_data` (
  date DATE NOT NULL,
  variable_name STRING NOT NULL,         -- 'product_launch', 'fuel_price', 'temperature'
  variable_value FLOAT64 NOT NULL,
  variable_type STRING NOT NULL,         -- 'Binary' | 'Continuous' | 'Categorical'
  -- Optional geo dimension for geo-aware models:
  geo_dimension STRING,
  -- Tracking:
  _source_type STRING NOT NULL,
  _integration_id STRING NOT NULL,
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY variable_name;


-- ═══════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════

-- adspends_mat_view: MODIFIED to include DWH sources + dedup
CREATE MATERIALIZED VIEW `tenant_{id}_views.adspends_mat_view` AS
WITH all_spend AS (
  SELECT date, source, campaign_name, ad_name, spend, impressions, clicks,
         _source_type, _integration_id, _priority
  FROM `tenant_{id}_data.ad_insights`
),
deduped AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY date, source, campaign_name, COALESCE(ad_name, '')
    ORDER BY _priority DESC
  ) AS rn
  FROM all_spend
)
SELECT * EXCEPT(rn, _priority) FROM deduped WHERE rn = 1;


-- mmm_spend_view: UNION of auto-aggregated ad_insights + paid_agg_input
CREATE VIEW `tenant_{id}_views.mmm_spend_view` AS
-- Auto-aggregated from ad_insights (via tactic mapper)
SELECT
  a.date,
  COALESCE(t.tactic, a.source) AS channel,
  SUM(a.spend) AS spend,
  SUM(a.impressions) AS impressions,
  SUM(a.clicks) AS clicks,
  'auto_aggregated' AS _origin
FROM `tenant_{id}_data.ad_insights` a
LEFT JOIN `tenant_{id}_data.tactic_mappings` t
  ON a.source = t.source AND a.campaign_name = t.campaign_name
GROUP BY a.date, channel
UNION ALL
-- Direct aggregated input
SELECT
  date, channel,
  spend, impressions, clicks,
  'direct_input' AS _origin
FROM `tenant_{id}_data.paid_agg_input`;


-- mmm_unified_view: Complete MMM dataset
-- (This is the final view that MMM engine consumes)
CREATE VIEW `tenant_{id}_views.mmm_unified_view` AS
SELECT
  s.date,
  s.channel,
  s.spend,
  s.impressions,
  s.clicks,
  -- KPI (joined by date)
  k.kpi_name,
  k.kpi_value,
  -- Organic (joined by date + channel where applicable)
  o.metric_name AS organic_metric,
  o.metric_value AS organic_value,
  -- Contextual (joined by date)
  c.variable_name AS contextual_var,
  c.variable_value AS contextual_value,
  c.variable_type AS contextual_type
FROM `tenant_{id}_views.mmm_spend_view` s
LEFT JOIN `tenant_{id}_data.kpi_data` k ON s.date = k.date
LEFT JOIN `tenant_{id}_data.organic_data` o ON s.date = o.date AND s.channel = o.channel
LEFT JOIN `tenant_{id}_data.contextual_data` c ON s.date = c.date;
-- Note: This is a simplified join — actual MMM input construction
-- would be driven by the Data Model configuration
```

### Batch Sync Pipeline

```
┌────────────────────────────────────────────────────────────────────┐
│ SYNC PIPELINE (per integration, runs on schedule)                  │
│                                                                    │
│ For DWH integrations:                                              │
│                                                                    │
│ 1. READ sync state from integration_registry                       │
│    → last_sync_at, sync_cursor                                     │
│                                                                    │
│ 2. CONNECT to source warehouse                                     │
│    → Use connection_config from dwh_connections                     │
│    → BigQuery: service account / authorized view                    │
│    → Snowflake: key-pair auth / OAuth                               │
│    → Redshift: IAM or password                                      │
│                                                                    │
│ 3. EXTRACT data (incremental)                                      │
│    → SELECT * FROM source_table                                     │
│      WHERE {date_column} >= {last_sync_date - lookback_days}        │
│    → For BigQuery→BigQuery: use CREATE TABLE AS SELECT              │
│      (most efficient, no data transfer cost if same region)         │
│    → For external DWH: batch fetch → write to raw table             │
│                                                                    │
│ 4. LAND in raw table                                               │
│    → tenant_{id}_raw.dwh_{integration_id}                           │
│    → Original schema preserved                                      │
│    → Add _synced_at, _sync_batch_id columns                         │
│                                                                    │
│ 5. TRANSFORM using column_mappings                                  │
│    → Apply column renames                                           │
│    → Apply type casts                                               │
│    → Apply source aliases (if configured)                           │
│    → Validate required fields                                       │
│                                                                    │
│ 6. ROUTE to target table based on data_category + granularity       │
│    → paid_marketing + ad_level → ad_insights                        │
│    → paid_marketing + channel_level → paid_agg_input                │
│    → kpi → kpi_data                                                 │
│    → organic → organic_data                                         │
│    → contextual → contextual_data                                   │
│                                                                    │
│ 7. DEDUP based on dedup_strategy                                    │
│    → MERGE INTO target USING transformed                            │
│      ON dedup_keys MATCH → UPDATE, NOT MATCH → INSERT               │
│                                                                    │
│ 8. REFRESH materialized views                                       │
│    → Trigger adspends_mat_view refresh                              │
│    → Trigger mmm_spend_view refresh (if applicable)                 │
│                                                                    │
│ 9. UPDATE sync state                                                │
│    → last_sync_at = NOW()                                           │
│    → last_sync_rows = count                                         │
│    → sync_status = 'success' | 'error'                              │
│    → Emit monitoring event                                          │
└────────────────────────────────────────────────────────────────────┘

For Google Sheets integrations:
  Same pipeline, but Step 2-3 use Sheets API instead of DWH connector.
  Everything from Step 4 onward is identical.

For CSV/File integrations:
  Same pipeline, but Step 2-3 read from GCS/S3 upload.
  Everything from Step 4 onward is identical.
```

---

## Handling the Mixed MMM Sheet Case

Current MMM sheets often have mixed data in one row:
```
date       | channel  | spend | impressions | revenue | orders
2024-01-01 | Facebook | 5000  | 250000      | 12000   | 45
2024-01-01 | TV       | 15000 | NULL        | NULL    | NULL
```

This contains BOTH paid marketing (spend, impressions) AND KPI (revenue, orders).

### Solution: Column-Level Category Override

During column mapping, each column gets a category tag:

```
┌──────────────────────────────────────────────────────────────┐
│ Column Mapping for MMM Sheet                                  │
│                                                              │
│ Base category: Paid Marketing (channel/tactic level)         │
│                                                              │
│ Column         →  Lifesight Field     →  Category            │
│ date           →  date                →  (system)            │
│ channel        →  channel             →  (system)            │
│ spend          →  spend               →  Paid Marketing  ✓   │
│ impressions    →  impressions         →  Paid Marketing  ✓   │
│ revenue        →  kpi_value (Revenue) →  KPI ★ override      │
│ orders         →  kpi_value (Orders)  →  KPI ★ override      │
│                                                              │
│ ★ These columns will be split into kpi_data table            │
│   during ingestion (date + channel + kpi values)             │
└──────────────────────────────────────────────────────────────┘
```

During sync, the pipeline splits the row:
```
One source row:
  date=2024-01-01, channel=Facebook, spend=5000, impressions=250000, revenue=12000, orders=45

Becomes:
  → paid_agg_input: date=2024-01-01, channel=Facebook, spend=5000, impressions=250000
  → kpi_data: date=2024-01-01, kpi_name=revenue, kpi_value=12000, channel=Facebook
  → kpi_data: date=2024-01-01, kpi_name=orders, kpi_value=45, channel=Facebook
```

---

## Data Model Integration

The Data Model (used by MMM/Experiments) references data from all 4 categories:

```typescript
interface DataModel {
  id: string;
  name: string;
  
  // KPI — from kpi_data
  kpis: {
    kpi_name: string;        // e.g., "revenue"
    source_integration: string;  // which integration provides this
  }[];
  
  // Spend — from mmm_spend_view
  spendVariables: {
    tactic: string;          // from tactic mapper or paid_agg_input channel
    // metrics come from the view automatically
  }[];
  
  // Organic — from organic_data
  organicVariables: {
    channel: string;
    metric_name: string;
    source_integration: string;
  }[];
  
  // Contextual — from contextual_data  
  controlVariables: {
    variable_name: string;
    variable_type: "Binary" | "Continuous" | "Categorical";
    source_integration: string;
  }[];
  
  // Dimensions
  modelingDimensions: { category: string; granularity: string }[];
  granularity: "Daily" | "Weekly" | "Monthly";
}
```

---

## Summary of Changes

### New Tables
| Table | Purpose | Fed by |
|-------|---------|--------|
| `paid_agg_input` | Aggregated paid marketing (TV, Radio, etc.) | Sheets, DWH |
| `kpi_data` | KPI/revenue data (dependent vars for MMM) | Shopify, GA4, Sheets, DWH |
| `organic_data` | Organic marketing metrics | HubSpot, Klaviyo, Sheets, DWH |
| `contextual_data` | External contextual variables | Sheets, DWH |
| `integration_registry` | Integration metadata & mappings | System |
| `dwh_connections` | DWH connection credentials | System |
| `tactic_mappings` | Campaign → tactic assignments | Tactic Mapper |

### Modified Tables
| Table | Change |
|-------|--------|
| `ad_insights` | Add `_source_type`, `_integration_id`, `_priority` columns |

### New Views
| View | Purpose |
|------|---------|
| `mmm_spend_view` | Unified paid marketing spend (auto-agg + direct) |
| `mmm_unified_view` | Complete MMM input (spend + KPI + organic + contextual) |

### Modified Views
| View | Change |
|------|--------|
| `adspends_mat_view` | Add dedup logic for multi-source overlap |

### New Services
| Service | Purpose |
|---------|---------|
| DWH Connector | Connect to BigQuery/Snowflake/Redshift/Databricks |
| Sync Scheduler | Trigger batch syncs on cron schedule |
| Column Mapper | Apply column mappings + category routing |
| Source Aliaser | Normalize source names across integrations |

---

## Experiments Architecture

### Why Experiments Aren't a 5th Category

Experiments (geo incrementality tests) need the **same 4 categories of data** but with additional dimensions:

```
MMM data model:     date × channel → spend, KPI, organic, contextual
Experiment model:   date × channel × geo_unit × test_group → spend, KPI, organic, contextual
                                     ^^^^^^^^   ^^^^^^^^^^
                                     extra dimensions unique to experiments
```

Experiments are a **use case** that consumes data from all 4 categories, not a separate data category.

### Dual-Path Experiment Data

**Path 1: Pre-prepared flat files** (user brings everything in one table)

```
User provides (via Sheets/DWH/CSV):
  date       | geo    | group     | channel  | spend | revenue
  2024-01-01 | US-CA  | treatment | Facebook | 5000  | 12000
  2024-01-01 | US-CA  | treatment | Google   | 3000  | 8000
  2024-01-01 | US-TX  | control   | Facebook | 0     | 6000
  2024-01-01 | US-TX  | control   | Google   | 0     | 4200
```

This is ingested as a **special experiment integration**:
- `data_category = 'experiment_prepared'`
- Lands in `experiment_input` table (dedicated)
- Column mapping identifies: date, geo_unit, test_group, channel, spend metrics, KPI metrics
- Row-splitting still applies (spend → experiment_spend, revenue → experiment_kpi)

```sql
CREATE TABLE `tenant_{id}_data.experiment_input` (
  experiment_id STRING NOT NULL,         -- which experiment this belongs to
  date DATE NOT NULL,
  geo_unit STRING NOT NULL,              -- 'US-CA', 'US-TX', 'DMA-501', etc.
  test_group STRING NOT NULL,            -- 'control' | 'treatment' | 'treatment_2' etc.
  channel STRING,                        -- optional: if experiment tests specific channels
  spend FLOAT64,
  impressions INT64,
  clicks INT64,
  kpi_name STRING,
  kpi_value FLOAT64,
  -- Tracking:
  _source_type STRING NOT NULL,
  _integration_id STRING NOT NULL,
  _synced_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY experiment_id, test_group;
```

**Path 2: Assembled from existing data** (system pulls geo-level data)

```
Experiment configuration:
  {
    "experiment_id": "geo_exp_001",
    "name": "Facebook Holdout Test - West Coast",
    "test_period": {"start": "2024-01-15", "end": "2024-02-15"},
    "pre_period": {"start": "2023-12-15", "end": "2024-01-14"},
    "geo_assignments": {
      "treatment": ["US-CA", "US-OR", "US-WA"],
      "control": ["US-NV", "US-AZ", "US-UT"]
    },
    "channels_under_test": ["Facebook Ads"],
    "kpi": {"name": "revenue", "source_integration": "shopify_native"},
    "spend_sources": ["native_facebook", "native_google"]
  }
```

The system assembles the experiment dataset:

```
1. Pull geo-level spend from ad_insights (if available with geo breakdown)
   → Filter by experiment channels, date range, geo units
   
2. Pull geo-level KPI from kpi_data (if available with geo_dimension)
   → Filter by date range, geo units
   
3. Apply test_group assignment based on experiment config
   → Join geo_unit → test_group mapping

4. Materialize into experiment_input table
   → Same schema as Path 1, but assembled by the system
```

### Experiment Metadata Table

```sql
CREATE TABLE `tenant_{id}_meta.experiments` (
  id STRING NOT NULL,
  name STRING NOT NULL,
  status STRING DEFAULT 'draft',         -- 'draft' | 'active' | 'completed' | 'archived'
  data_source_mode STRING NOT NULL,      -- 'prepared' | 'assembled'
  
  -- For 'prepared' mode:
  source_integration_id STRING,          -- FK to integration_registry
  
  -- For 'assembled' mode:
  test_period_start DATE,
  test_period_end DATE,
  pre_period_start DATE,
  pre_period_end DATE,
  geo_assignments JSON,                  -- {"treatment": ["CA", "OR"], "control": ["NV", "AZ"]}
  channels_under_test ARRAY<STRING>,
  kpi_config JSON,                       -- {"name": "revenue", "source": "shopify"}
  spend_source_integrations ARRAY<STRING>,
  
  -- Results:
  data_model_id STRING,                  -- FK to data models
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### How Experiments Use the 4 Categories

```
Experiment needs:                     Source:
─────────────────────────────────     ──────────────────────────────
Spend per geo per day                 ad_insights (with geo filter)
                                      + paid_agg_input (if no geo, use national proxy)

KPI per geo per day                   kpi_data (with geo_dimension)
                                      + GA4 with geo breakdown
                                      + Shopify with shipping geo

Organic per geo per day (optional)    organic_data (with geo if available)

Contextual per geo per day (optional) contextual_data (with geo_dimension)
```

This means **geo_dimension is the key field** that enables experiment assembly. Tables that already have `geo_dimension` columns (kpi_data, contextual_data) can be sliced for experiments. Tables without geo (most organic_data, some kpi_data) would need national-level proxies.

---

## Ad Budgets & Creative Insights

### Ad Budgets

Ad budgets capture **campaign budget settings from ad platforms** — the configured daily/lifetime budget for each campaign. This is pulled from native integrations (Facebook Campaign Budget, Google Ads Budget, etc.).

```
Current: ad_budgets populated by native API syncs only
  - Facebook: campaign daily_budget, lifetime_budget
  - Google: campaign budget, budget_type
  - etc.

DWH integration: NOT directly applicable
  - Budget data comes from the ad platforms, not from customer warehouses
  - A DWH might have HISTORICAL budget snapshots, but the authoritative source is the platform API

Decision: ad_budgets remains native-only for now.
  - If a customer needs historical budget data from DWH, it would be a separate
    "budget_history" integration with its own schema
  - This is a low-priority extension, not part of the core DWH pipeline
```

### Creative Insights

Creative insights capture **ad creative performance data** — creative-level metrics like per-image/video performance, creative attributes, A/B test results.

```
Current: creative_insights populated by native API syncs
  - Facebook: ad_creative_id, image_url, headline, body, performance metrics
  - Google: asset groups, creative details
  - etc.

DWH integration: COULD be relevant
  - Customers may have creative tagging/classification data in their DWH
  - Example: creative_id → category (brand/performance), theme, format
  - This enriches native creative insights with business-level annotations

Decision: creative_insights enrichment is a future extension.
  - Core structure remains native-sourced
  - DWH can add creative metadata/tags via a JOIN table:

    CREATE TABLE `tenant_{id}_data.creative_annotations` (
      creative_id STRING,
      source STRING,                    -- 'Facebook Ads', 'Google Ads'
      annotation_key STRING,            -- 'category', 'theme', 'format'
      annotation_value STRING,          -- 'brand', 'summer_2024', 'video'
      _integration_id STRING,
      _synced_at TIMESTAMP
    );

  - This joins to creative_insights on creative_id + source
  - Low priority — not part of initial DWH pipeline
```

---

## Schema Drift Detection

### The Problem

When a customer's DWH table schema changes (column added, removed, renamed, or type changed), the column mappings stored in `integration_registry` may break.

### Detection Strategy

```
┌────────────────────────────────────────────────────────────────────┐
│ SCHEMA DRIFT DETECTION (runs before each sync)                     │
│                                                                    │
│ 1. INTROSPECT current source table schema                          │
│    → BigQuery: INFORMATION_SCHEMA.COLUMNS                          │
│    → Snowflake: SHOW COLUMNS IN TABLE                              │
│    → Redshift: SVV_COLUMNS                                         │
│                                                                    │
│ 2. COMPARE with stored schema (from last successful sync)          │
│    → Stored in integration_registry.last_known_schema (JSON)       │
│                                                                    │
│ 3. CLASSIFY changes:                                               │
│                                                                    │
│    SAFE (auto-handle):                                             │
│    ├── New column added → ignore (not mapped, no impact)           │
│    └── Column type widened → auto-cast (INT → FLOAT, etc.)         │
│                                                                    │
│    WARNING (sync but alert):                                       │
│    ├── Mapped column type changed → attempt cast, warn if lossy    │
│    └── New column matches a common pattern → suggest mapping       │
│                                                                    │
│    BREAKING (pause sync, require user action):                     │
│    ├── Mapped column removed → can't sync without remapping        │
│    ├── Mapped column renamed → likely removed+added, needs remap   │
│    └── Required column missing → schema violation                  │
│                                                                    │
│ 4. ACTION based on classification:                                 │
│    → SAFE: continue sync, update last_known_schema                 │
│    → WARNING: continue sync, emit alert, update monitoring         │
│    → BREAKING: set sync_status='schema_drift', pause sync,         │
│      notify user via monitoring dashboard + email                  │
└────────────────────────────────────────────────────────────────────┘
```

### Schema Version Tracking

```sql
-- Add to integration_registry:
ALTER TABLE integration_registry ADD COLUMN last_known_schema JSON;
ALTER TABLE integration_registry ADD COLUMN schema_drift_status STRING;
-- 'none' | 'warning' | 'breaking'

-- Schema change log:
CREATE TABLE `tenant_{id}_meta.schema_change_log` (
  id STRING,
  integration_id STRING,
  detected_at TIMESTAMP,
  change_type STRING,                    -- 'column_added' | 'column_removed' | 'type_changed' | 'column_renamed'
  column_name STRING,
  old_value STRING,                      -- old type or 'exists'
  new_value STRING,                      -- new type or 'missing'
  severity STRING,                       -- 'safe' | 'warning' | 'breaking'
  resolved_at TIMESTAMP,
  resolved_by STRING                     -- 'auto' | 'user'
);
```

### UI Integration

The monitoring dashboard (IntegrationsMonitoringTab) already has sync health indicators. Schema drift adds a new alert type:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ Schema Change Detected                                │
│                                                          │
│ BigQuery: marketing.campaign_performance                 │
│                                                          │
│ Column "total_cost" was renamed to "media_cost"          │
│ This column was mapped to: spend                         │
│                                                          │
│ [Remap Column]  [Pause Integration]  [Dismiss]           │
└──────────────────────────────────────────────────────────┘
```

---

## Backfill Strategy

### The Problem

When a new DWH integration is added, how far back should the initial sync go? This affects:
- First sync duration and cost
- Whether historical data is available for MMM (typically needs 2-3 years)
- BigQuery query/storage costs

### Strategy

```
┌────────────────────────────────────────────────────────────────────┐
│ BACKFILL CONFIGURATION (set during integration setup)              │
│                                                                    │
│ "How much historical data should we import?"                       │
│                                                                    │
│ ○ Last 30 days (Quick start — good for testing)                    │
│ ○ Last 6 months                                                    │
│ ○ Last 1 year                                                      │
│ ○ Last 2 years (Recommended for MMM)                               │
│ ○ Last 3 years                                                     │
│ ○ All available data                                               │
│ ○ Custom date range: [____] to [____]                              │
│                                                                    │
│ Smart defaults based on data_category:                             │
│   Paid Marketing → Last 2 years (MMM needs history)                │
│   KPI → Last 2 years (match paid marketing history)                │
│   Organic → Last 1 year                                            │
│   Contextual → Last 2 years (control variables need history)       │
│   Experiment → Custom (just the experiment period)                 │
└────────────────────────────────────────────────────────────────────┘
```

### Backfill Execution

```
┌────────────────────────────────────────────────────────────────────┐
│ BACKFILL PIPELINE                                                  │
│                                                                    │
│ Different from regular sync — optimized for large historical loads  │
│                                                                    │
│ 1. ESTIMATE data volume                                            │
│    → SELECT COUNT(*), MIN(date), MAX(date) FROM source_table       │
│      WHERE date >= backfill_start                                   │
│    → Show user: "~2.3M rows, covering 2022-01-01 to 2024-12-31"   │
│    → Estimated BigQuery cost: ~$X.XX                                │
│                                                                    │
│ 2. CHUNK by date range                                             │
│    → Split into monthly chunks for large datasets                   │
│    → Each chunk: SELECT * WHERE date BETWEEN chunk_start            │
│      AND chunk_end                                                  │
│    → Enables progress tracking and resumability                     │
│                                                                    │
│ 3. EXECUTE chunks sequentially                                      │
│    → For each chunk: extract → raw landing → transform → target    │
│    → Update backfill_progress: "14 of 24 months complete"           │
│    → If a chunk fails: retry that chunk, don't restart              │
│                                                                    │
│ 4. FINALIZE                                                        │
│    → Verify row counts match source                                 │
│    → Set sync cursor to latest date                                 │
│    → Switch to regular incremental sync schedule                    │
│    → Refresh materialized views                                     │
│                                                                    │
│ BigQuery optimization for BigQuery→BigQuery:                        │
│    → Use CTAS (CREATE TABLE AS SELECT) instead of extract+load      │
│    → No data egress cost (same-region)                              │
│    → Can partition destination by date during creation              │
└────────────────────────────────────────────────────────────────────┘
```

### Backfill Metadata

```sql
ALTER TABLE integration_registry ADD COLUMN backfill_config JSON;
-- {
--   "mode": "date_range",
--   "start_date": "2022-01-01",
--   "end_date": null,  // null = up to now
--   "chunk_size_days": 30,
--   "status": "in_progress",  // 'pending' | 'in_progress' | 'completed' | 'failed'
--   "chunks_total": 24,
--   "chunks_completed": 14,
--   "total_rows_imported": 1847293,
--   "started_at": "2024-12-01T10:00:00Z",
--   "completed_at": null
-- }
```

---

## Source Aliasing

### The Problem

Users might write source names differently than what native integrations use:
- "FB" vs "Facebook" vs "Facebook Ads" vs "Meta Ads"
- "GAds" vs "Google" vs "Google Ads"
- "TT" vs "TikTok" vs "TikTok Ads"

### Solution: Source Alias Registry

```sql
-- System-level default aliases (ships with Lifesight)
CREATE TABLE `lifesight_meta.source_aliases_default` (
  canonical_name STRING NOT NULL,        -- 'Facebook Ads'
  alias STRING NOT NULL,                 -- 'FB', 'Facebook', 'Meta', 'Meta Ads', etc.
  PRIMARY KEY (alias)
);

-- Tenant-level custom aliases (user-configurable)
CREATE TABLE `tenant_{id}_meta.source_aliases_custom` (
  canonical_name STRING NOT NULL,
  alias STRING NOT NULL,
  integration_id STRING,                 -- optional: scoped to one integration
  created_at TIMESTAMP
);
```

### Alias Resolution Flow

```
During column mapping (Step 5 of user flow):

1. User identifies source column
2. System reads unique values from that column
3. For each value:
   a. Check exact match against known integration names → auto-map
   b. Check against source_aliases_default → suggest match
   c. Check against tenant custom aliases → suggest match
   d. If no match → prompt user: "What does 'FB' refer to?"
      → User selects from known integrations or creates new source name
      → Save as custom alias for future syncs
```

### Conflict Resolution

When a DWH source has the same canonical source name as a native integration:

```
Integration Registry knows:
  - integration_001: native Facebook Ads (source='Facebook Ads')
  - integration_002: DWH table with source column containing 'Facebook Ads'

Conflict detected during column mapping:
  "This data includes 'Facebook Ads' rows, but you also have a native
   Facebook Ads integration. For overlapping date ranges:"
   
  ○ DWH overrides native (_priority: dwh=10, native=5)
    → Use when DWH has cleaned/corrected data
  ○ Native takes priority (_priority: native=10, dwh=5)
    → Use when DWH is supplementary
  ○ Keep both with labels (_priority: both=5, distinguish by _source_type)
    → Use when you want to compare
  ○ DWH fills gaps only (insert only where native has no data)
    → Use when DWH covers dates/campaigns native doesn't
```

---

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONNECTORS                                        │
│                                                                             │
│  Native APIs    Google Sheets    CSV/S3/GCS    BigQuery    Snowflake    etc. │
└──────┬────────────────┬──────────────┬─────────────┬──────────┬─────────────┘
       │                │              │             │          │
       │                │              │             │          │
       ▼                ▼              ▼             ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                                      │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │ Schema Drift     │  │ Sync Pipeline                                    │  │
│  │ Detection        │  │  1. Connect → 2. Extract → 3. Raw Land         │  │
│  └────────┬────────┘  │  4. Transform (column mapping) → 5. Validate    │  │
│           │           │  6. Route by category → 7. Dedup → 8. Load      │  │
│           │           └──────────────────────────────────────────────────┘  │
│           │                                                                 │
│           ▼           ┌──────────────────────────────────────────────────┐  │
│   ┌──────────────┐    │ Source Aliasing                                   │  │
│   │ Alert /      │    │  Normalize source names across integrations      │  │
│   │ Pause sync   │    └──────────────────────────────────────────────────┘  │
│   └──────────────┘                                                         │
└────────────────────────────────────────────────────────────────┬────────────┘
                                                                 │
                              CATEGORY ROUTING                   │
                 ┌───────────────┬───────────────┬──────────────┬┘
                 ▼               ▼               ▼              ▼
┌────────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  PAID MARKETING    │ │  KPI         │ │  ORGANIC     │ │  CONTEXTUAL      │
│                    │ │              │ │              │ │                  │
│  ad_insights       │ │  kpi_data    │ │  organic_data│ │  contextual_data │
│  (ad/campaign lvl) │ │  (daily or   │ │  (channel ×  │ │  (daily, maybe   │
│        +           │ │   geo-level) │ │   daily)     │ │   geo-level)     │
│  paid_agg_input    │ │              │ │              │ │                  │
│  (channel/tactic)  │ │              │ │              │ │                  │
└────────┬───────────┘ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
         │                    │                │                   │
         ▼                    │                │                   │
  adspends_mat_view           │                │                   │
  (unified ad spends)         │                │                   │
         │                    │                │                   │
         ▼                    ▼                ▼                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                    ANALYTICAL VIEWS                                  │
  │                                                                      │
  │  mmm_spend_view:     auto-agg(ad_insights) UNION paid_agg_input      │
  │  mmm_unified_view:   spend + kpi + organic + contextual by date      │
  │  experiment_view:    spend + kpi + organic + contextual by date×geo  │
  └──────────────┬───────────────────────────────────┬──────────────────┘
                 │                                   │
                 ▼                                   ▼
          ┌──────────────┐                  ┌──────────────────┐
          │  MMM Engine  │                  │  Experiment      │
          │              │                  │  Engine          │
          │  Data Model  │                  │  Experiment      │
          │  config      │                  │  config          │
          │  drives JOIN │                  │  (geo, groups,   │
          │  logic       │                  │   periods)       │
          └──────────────┘                  └──────────────────┘
```

---

## Complete Table Inventory

### Data Tables (tenant_{id}_data)

| Table | Category | Granularity | Fed by | Feeds into |
|-------|----------|-------------|--------|------------|
| `ad_insights` | Paid Marketing | Ad/Campaign × Day | Native, Sheets(custom_costs), DWH | adspends_mat_view, mmm_spend_view (auto-agg) |
| `paid_agg_input` | Paid Marketing | Channel/Tactic × Day | Sheets(mmm), DWH | mmm_spend_view |
| `kpi_data` | KPI | Day (optionally × geo, × channel) | Shopify, GA4, Sheets, DWH | MMM (dependent var), Experiments |
| `organic_data` | Organic | Channel × Day | HubSpot, Klaviyo, Sheets, DWH | MMM (independent var) |
| `contextual_data` | Contextual | Day (optionally × geo) | Sheets, DWH | MMM (control var), Experiments |
| `experiment_input` | Experiment (prepared) | Geo × Day | Sheets, DWH | Experiment Engine |
| `ad_budgets` | Paid Marketing (config) | Campaign | Native APIs only | Budget reporting |
| `creative_insights` | Paid Marketing (creative) | Ad creative | Native APIs only | Creative reporting |
| `tactic_mappings` | System | Campaign → Tactic | Tactic Mapper UI | mmm_spend_view |

### View Tables (tenant_{id}_views)

| View | Type | Sources | Consumer |
|------|------|---------|----------|
| `adspends_mat_view` | Materialized | ad_insights (deduped) | Dashboards, Attribution |
| `mmm_spend_view` | View | auto-agg(ad_insights) + paid_agg_input | MMM Engine |
| `mmm_unified_view` | View | mmm_spend_view + kpi + organic + contextual | MMM Engine |
| `experiment_unified_view` | View | experiment_input OR assembled from 4 categories with geo | Experiment Engine |

### Metadata Tables (tenant_{id}_meta)

| Table | Purpose |
|-------|---------|
| `integration_registry` | All integration configs, column mappings, sync state |
| `dwh_connections` | DWH credentials and connection configs |
| `experiments` | Experiment definitions and configurations |
| `source_aliases_custom` | Tenant-specific source name aliases |
| `schema_change_log` | Schema drift history and resolution |

### Raw Tables (tenant_{id}_raw)

| Pattern | Purpose |
|---------|---------|
| `native_{source}` | Raw API data per native source |
| `sheets_{integration_id}` | Raw sheet/CSV data |
| `dwh_{integration_id}` | Raw DWH table copy (original schema) |

---

## Implementation Priority

### Phase 1: Core Pipeline (Foundation)
1. `integration_registry` + `dwh_connections` tables
2. BigQuery connector (same-project and cross-project)
3. Column mapping engine with category routing
4. Batch sync pipeline (extract → raw → transform → target)
5. Modified `ad_insights` with `_source_type`, `_integration_id`, `_priority`
6. Modified `adspends_mat_view` with dedup logic

### Phase 2: All 4 Categories
1. `paid_agg_input` table + `mmm_spend_view` (auto-aggregation)
2. `kpi_data` table
3. `organic_data` table
4. `contextual_data` table
5. `mmm_unified_view` (joins all 4)
6. Mixed-sheet row splitting (column-level category override)

### Phase 3: Multi-Source & Operational
1. Source aliasing (default + custom aliases)
2. Multi-source dedup with priority
3. Schema drift detection
4. Backfill pipeline with chunking + progress
5. Monitoring dashboard integration (sync health, drift alerts)

### Phase 4: Experiments & Extensions
1. `experiment_input` table
2. Experiment metadata + configuration
3. Assembled experiment path (geo-level data from existing categories)
4. `experiment_unified_view`
5. Snowflake, Redshift, Databricks connectors

### Phase 5: Enrichments
1. `creative_annotations` (DWH-sourced creative metadata)
2. Budget history from DWH (if needed)
3. Cross-category data quality monitoring
4. Schema version management

---
---

# Part 2: UX Design — Smart Import Wizard + End-to-End Flow

## Design Prototypes

Interactive HTML prototypes created:
- `src/import-wizard-prototype.html` — v1: basic scenarios (simple CSV, multi-source, mixed MMM)
- `src/import-wizard-v2.html` — v2: all format scenarios + end-to-end flow (wide format, single source, event KPI, mixed wide, Import→Metrics→TacticMapper)

## Core UX Principle: Detect, Don't Ask

Instead of forms where users describe their data, the system ANALYZES the data and presents what it found. The user confirms or clicks to correct. This eliminates the need for users to understand terms like "granularity", "data category", or "schema".

---

## Schema Detection: How It Works When Data Isn't In Our System Yet

### The Core Problem

For CSV uploads, we have the entire file in browser memory — detection is trivial.
But for Google Sheets and DWH, we DON'T have the data yet. We only have credentials
and a table/sheet reference. And even if we fetch a "preview" of 10 rows from a
2,000-row multi-source table, we might only see 1 of 3 sources (rows are often
sorted by source, so first 10 rows = all Facebook, missing Google and TikTok).

### Solution: Three-Layer Query-Based Detection

Detection uses **targeted queries**, not naive "first 10 rows". Each layer gets
more data but always sees the FULL picture via aggregation, not sampling.

```
LAYER 1 — SCHEMA METADATA (instant, zero data scan)
  What: Column names + data types only
  How:
    BigQuery:    INFORMATION_SCHEMA.COLUMNS
    Snowflake:   DESCRIBE TABLE / SHOW COLUMNS
    Redshift:    SVV_COLUMNS / pg_catalog
    Sheets:      First row (header) via Sheets API metadata endpoint
    CSV:         Parse header row from uploaded file in browser
  
  Detects:
    ✓ Date column (name + type pattern)
    ✓ Wide vs Long format (column name prefix patterns like fb_spend, google_spend)
    ✓ Category per column (name-based: spend→paid, revenue→kpi)
    ✓ Granularity indicators (campaign_id present? ad_id? channel only?)
    ✓ Data types (STRING, FLOAT64, INT64, DATE, BOOL)
  
  Cost: FREE (metadata only, no data scanned)
  Speed: < 500ms


LAYER 2 — AGGREGATION QUERIES (cheap, scans data, returns few rows)
  What: Distinct values, distributions, ranges — NOT raw rows
  How: Run 3-5 targeted SQL queries IN PARALLEL after Layer 1:
  
  Query 1 — Source distribution (if source column detected in Layer 1):
    SELECT {source_col}, COUNT(*) as row_count
    FROM {table}
    GROUP BY {source_col}
    ORDER BY row_count DESC
    
    → Returns: {Facebook: 1200, Google: 890, TikTok: 520, TV: 237}
    → Finds ALL sources, even if they start on row 801

  Query 2 — Date range + row count:
    SELECT COUNT(*) as total_rows,
           MIN({date_col}) as earliest,
           MAX({date_col}) as latest,
           COUNT(DISTINCT {date_col}) as unique_dates
    FROM {table}

  Query 3 — Dimension cardinality:
    SELECT COUNT(DISTINCT {campaign_col}) as campaigns,
           COUNT(DISTINCT {account_col}) as accounts
    FROM {table}

  Query 4 — Numeric column ranges (binary vs continuous detection):
    SELECT '{col_name}' as col,
           MIN({col_name}), MAX({col_name}),
           COUNT(DISTINCT {col_name}) as distinct_vals
    FROM {table}
    -- For columns where category is uncertain
    
    → {product_launch: min=0, max=1, distinct=2} → BINARY contextual
    → {temperature: min=32, max=105, distinct=74} → CONTINUOUS contextual

  Query 5 — Sparse metric detection (which sources have which metrics):
    SELECT {source_col},
           COUNTIF({metric1} IS NOT NULL) as has_metric1,
           COUNTIF({metric2} IS NOT NULL) as has_metric2
    FROM {table}
    GROUP BY {source_col}
    
    → {Facebook: {cpc: 1200, grps: 0}, TV: {cpc: 0, grps: 237}}

  Cost: LOW (BigQuery: typically < $0.01; scans data but returns few rows)
  Speed: 1-3 seconds (all queries run in parallel)

  For Google Sheets: fetch ALL rows (sheets are typically < 50K rows),
  compute distributions in-memory. No SQL needed.

  For CSV: already have full data in browser. Compute in JS.


LAYER 3 — STRATIFIED SAMPLE (for preview display ONLY, detection doesn't use this)
  What: A few representative rows from EACH source/group
  How:
    For DWH:
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (
          PARTITION BY {source_col}
          ORDER BY {date_col} DESC
        ) as rn FROM {table}
      ) WHERE rn <= 3
      ORDER BY {source_col}, {date_col}
    
    → Gets 3 most recent rows PER SOURCE
    → Guarantees all sources appear in the preview table
    
    For CSV/Sheets: group rows by source value, take 3 per group in memory

  Cost: LOW
  Speed: 1-2 seconds
  Purpose: ONLY for the preview table the user sees. Detection does NOT use this.
```

### What the User Sees

```
After user selects table/sheet, show loading (2-4 sec total):

┌──────────────────────────────────────────────────────────┐
│  Analyzing your data...                                  │
│  ✓ Connected · ✓ Reading schema · ◎ Scanning data...     │
└──────────────────────────────────────────────────────────┘

Then show FULL detection result:

┌──────────────────────────────────────────────────────────┐
│  📊 Ad Spend Data — Campaign Level                       │
│                                                          │
│  2,847 rows · 8 columns · 365 days                       │
│  Jan 1, 2024 → Dec 31, 2024                              │
│                                                          │
│  4 sources found:                                        │
│  Facebook  ████████████████████  1,200 rows (42%)        │
│  Google    ██████████████         890 rows (31%)         │
│  TikTok    ████████               520 rows (18%)         │
│  TV        ████                   237 rows  (8%)         │
│                                                          │
│  47 campaigns · 3 accounts                               │
│                                                          │
│  Sparse metrics:                                         │
│  CPC available for Facebook, Google, TikTok (not TV)     │
│  GRPs available for TV only                              │
│                                                          │
│  Columns: [date] [source] [campaign] [💰spend]           │
│  [👁impressions] [🖱clicks] [💵revenue↗KPI] [🌡temp↗CTX] │
└──────────────────────────────────────────────────────────┘

Below: stratified preview table (3 rows per source, 12 total)
```

### Why This Is Better Than "Preview 10 Rows"

```
10-ROW PREVIEW:
  Shows rows 1-10 → all Facebook (data sorted by source)
  User thinks: "single-source Facebook data"
  WRONG — misses Google (row 801+) and TikTok (row 1501+)

QUERY-BASED DETECTION:
  GROUP BY source → finds ALL 4 sources instantly
  Distribution bars → user sees 42% Facebook, 31% Google, etc.
  Stratified sample → preview shows rows from EACH source
  Sparse metric query → knows CPC exists for FB but not TV
  CORRECT — complete picture via aggregation, not luck
```

### Is Pre-Import Detection Even Required?

```
Alternative: skip detection, import everything, classify after.

SKIP DETECTION:
  ✗ User doesn't know WHERE data will go until after import
  ✗ Wrong table selected → wasted import time
  ✗ Missing date column → caught only after import fails
  ✗ No category routing during import → needs post-import reclassification
  ✗ Bad UX: "we imported your data but don't know what it is"

PRE-IMPORT DETECTION:
  ✓ User sees exactly where data goes BEFORE committing
  ✓ Catches errors early (wrong table, missing date, unexpected schema)
  ✓ Routes to correct target tables during import
  ✓ Auto-propagates to Metrics & Dimensions and Tactic Mapper
  ✓ Builds trust: system understands the data
  ✗ Costs 2-4 seconds and a few cheap queries

VERDICT: Pre-import detection IS worth it.
```

---

## UI Flow: The Simplest Possible Experience

### Design Principle

**Every check you show is a chance for the user to get confused and make an error.**
The system should do ALL the thinking. The user should make ZERO decisions on the happy path.

Detection happens silently in the background. The user sees a result, not a process.

### The Flow: 2 Clicks for 80% of Users

```
STEP 1: GET THE DATA
  CSV: drag & drop
  Sheets: paste URL → pick sheet tab
  DWH: pick connection → browse → pick table

        ↓ (system runs detection silently, 2-4 sec)

STEP 2: ONE-LINE CONFIRMATION
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ✓ Ready to import                                       │
  │                                                          │
  │  Ad spend data from Facebook, Google, and TikTok         │
  │  842 rows · Campaign level · Jan – Dec 2024              │
  │                                                          │
  │       [Import]              [Something's off →]          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
  
  80% of users: click [Import] → DONE. Everything auto-mapped.
  20% of users: click [Something's off] → expands to detail view.
```

That's it. Upload → confirm → done. Two actions.

### What the One-Line Summary Shows

The summary is ONE plain-English sentence generated from detection:

```
Detection result → Summary sentence
─────────────────────────────────────────────────────────
Paid + single source + campaign level
  → "Facebook Ads campaign data with spend and impressions"

Paid + multi source + campaign level
  → "Ad spend data from Facebook, Google, and TikTok"

Paid + wide format + channel level
  → "Channel-level spend data for 3 channels (Facebook, Google, TV)"

KPI + event format
  → "KPI data: revenue, orders, and signups"

KPI + single value
  → "Daily revenue data"

Mixed (paid + kpi + organic + contextual)
  → "Marketing data with spend, revenue, organic, and contextual metrics"

Single source, no source column
  → "Spend data — which channel is this for? [icon picker]"
    (this is the ONE case where user MUST make a choice)
```

Below the sentence: a small metadata line (row count, date range, granularity).
NO column mapping table. NO category tags. NO distribution bars.

### The Only Mandatory User Decision

There is exactly ONE scenario where the user MUST answer a question before import:

**No source column detected + paid marketing data:**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Spend data detected — which channel is this for?        │
│                                                          │
│  [FB icon]  [Google icon]  [TikTok icon]  [LinkedIn]     │
│  Facebook   Google Ads     TikTok Ads     LinkedIn       │
│                                                          │
│  [Snap icon]  [Pinterest]  [TV icon]   [+ Other]         │
│  Snapchat     Pinterest    TV          Type name...      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

One tap on an icon. No typing. No dropdowns.
If filename contains "facebook" or "fb" → pre-highlight Facebook icon.

### What "Something's Off" Expands To

If the user clicks "Something's off", show the MINIMUM needed to fix:

```
┌──────────────────────────────────────────────────────────┐
│  What needs fixing?                                      │
│                                                          │
│  [Wrong channel]  [Wrong data type]  [Show all columns]  │
│                                                          │
└──────────────────────────────────────────────────────────┘

"Wrong channel" → source picker (icon grid, same as above)
"Wrong data type" → 4 big buttons:
   [💰 Ad Spend]  [💵 Revenue/KPI]  [🌱 Organic]  [🌡 External data]
"Show all columns" → ONLY NOW show the detailed column table
```

Progressive disclosure: simple fixes first, detailed view only on demand.
Most "something's off" cases are just "wrong channel" — one extra click to fix.

### What the User NEVER Sees (Unless They Ask)

These are all handled automatically and hidden:

- Column-to-category mapping → auto from column names
- Wide format detection + unpivot → auto, invisible
- Source alias matching (FB → Facebook Ads) → auto
- Multi-source dedup strategy → default to "fill gaps"
- Binary vs continuous detection → auto from value range
- Sparse metrics → auto, NULLs stored silently
- Row splitting (mixed sheet) → auto during import
- Granularity detection → auto from column presence
- Target table routing → auto from category + granularity

### What If Auto-Detection Gets a Column Wrong?

If the system maps "revenue" to Paid Marketing instead of KPI:
- It doesn't matter at import time — data is still imported
- The user corrects it in Metrics & Dimensions tab (where column categories live)
- OR: the system's column-name heuristics are good enough that this rarely happens

We DON'T show the column mapping during import to "prevent" mis-classification.
That creates more errors (user confusion) than it prevents (auto-detection errors).

**Trust the auto-detection. Let post-import correction handle the rare errors.**

### Flow Comparison

```
COMPLEX FLOW (previous design):        SIMPLE FLOW (new design):
─────────────────────────────          ──────────────────────────
1. Upload                              1. Upload
2. See detection summary card          2. "Ad spend from 3 channels.
3. Review column category tags            842 rows. Jan-Dec 2024."
4. Check source distribution bars         [Import] [Something's off]
5. Review sparse metric warnings       3. Click [Import]
6. Confirm source matching             4. Done.
7. Review unpivot preview
8. Set schedule
9. Confirm

9 screens/interactions                 2-3 interactions
~5-10 minutes                          ~30 seconds
High chance of user error              Near-zero chance of error
```

### Edge Cases That Add Steps

| Scenario | Extra step | What user sees |
|----------|-----------|----------------|
| No source column | +1 click | Channel icon picker |
| Completely unrecognizable column | +1 click per column | "What is 'xyz123'?" → 4-option picker |
| No date column found | Blocking | "We need a date column. Which one has dates?" → dropdown |
| Empty file / no rows | Blocking | "This file appears to be empty." |
| Overlap with native source | None (auto: fill gaps) | Shown in monitoring dashboard later, not during import |

---

## Format Detection Algorithm (Runs Silently — User Doesn't See This)

### Step 1: Identify DATE column
- Match column name: `date`, `day`, `report_date`, `dt`, `period`
- Match data type: DATE, TIMESTAMP
- **Always required** — reject data without a date column

### Step 2: Detect data SHAPE (Long vs Wide vs Single-Source)

```
WIDE FORMAT detection:
  Look for column names with repeating prefixes + metric suffixes:
    fb_spend, fb_impressions, fb_clicks → prefix "fb_" with metrics
    google_spend, google_impressions → prefix "google_"
  
  Heuristic: split column names by "_" or camelCase. If 2+ prefixes
  each appear on 2+ columns with metric-like suffixes → WIDE FORMAT.

LONG FORMAT detection:
  Look for a column with:
    - STRING type
    - Few unique values (< 50)
    - Name matches: source, platform, channel, network, medium
  If found → LONG FORMAT (that column is the source/channel)

SINGLE SOURCE detection:
  If neither wide prefix pattern nor source column found,
  AND columns are metric-like (spend, impressions, clicks) → SINGLE SOURCE
  System must ask user: "Which channel is this for?"

EVENT FORMAT detection:
  If there's a STRING column with names like event_name, metric_name, kpi_name
  AND a numeric value column → EVENT FORMAT (long/pivoted KPI data)
```

### Step 3: Detect data CATEGORY per column

```
Column name pattern matching (case-insensitive):

PAID MARKETING metrics:
  spend|cost|media_spend|ad_spend|amount_spent → Spend
  impressions|imps|views → Impressions
  clicks|link_clicks → Clicks
  cpc|cost_per_click → CPC
  cpm|cost_per_mille → CPM
  ctr|click_through_rate → CTR
  conversions|conv → Conversions (could also be KPI)
  grps|gross_rating_points → GRPs (TV/Radio)
  reach → Reach

KPI metrics:
  revenue|sales|total_revenue|gmv → Revenue
  orders|transactions|purchases → Orders
  signups|registrations → Registrations
  installs|app_installs → Installs
  subscribers|subscriptions → Subscriptions
  store_visits → Store Visits

ORGANIC metrics:
  organic_*|org_* → Organic (detect suffix: impressions, clicks, etc.)
  email_opens|email_clicks|email_sends → Email organic
  seo_clicks|seo_impressions → SEO organic
  
CONTEXTUAL variables:
  temperature|weather|temp → Contextual (continuous)
  product_launch|promo|holiday|event → Contextual (binary if 0/1 values)
  fuel_price|gas_price|unemployment → Contextual (continuous)
  Binary detection: if all values are 0 or 1 → mark as Binary type
  Continuous detection: if numeric with range > 2 distinct values → Continuous

DIMENSIONS:
  campaign_id|campaign_name|campaign → Campaign dimension
  ad_id|ad_name|creative_id → Ad dimension
  adgroup_id|ad_group|ad_set → Adgroup dimension
  account_id|account_name → Account dimension
  country|region|state|city|dma|geo → Geo dimension
  device|os|browser → Device dimension
```

### Step 4: Detect GRANULARITY

```
Based on which dimension columns exist:

Has ad_id or ad_name → AD LEVEL
Has creative_id → CREATIVE LEVEL
Has adgroup_id or ad_set_name → ADGROUP LEVEL
Has campaign_id or campaign_name → CAMPAIGN LEVEL
Has account_id (no campaign) → ACCOUNT LEVEL
Has channel/source (no campaign) → CHANNEL LEVEL (aggregated)
Only date + metrics → DAILY AGGREGATE

For KPI event format:
Has order_id or transaction_id → TRANSACTION LEVEL
Has event_name → EVENT LEVEL
Only date + KPI columns → DAILY AGGREGATE
```

---

## All 12 Format Scenarios — How the Wizard Handles Each

### Paid Marketing Scenarios

| # | Format | Shape | Detection | Wizard Flow |
|---|--------|-------|-----------|-------------|
| PM1 | `date, channel, spend, imps, clicks` | Long, multi-source | Detect source col + paid metrics | Review → Sources → Import |
| PM2 | `date, fb_spend, fb_imps, google_spend...` | Wide | Detect prefix pattern | Review (with unpivot preview) → Import |
| PM3 | `date, fb_spend..., revenue, organic_imps, temperature...` | Wide + mixed | Detect prefixes + standalone categories | Review (grouped by category) → Import |
| PM4 | `date, spend, imps, clicks` | Single source | No source col detected | Review → Source picker → Import |
| PM5 | `date, account_id, campaign_id, ad_group_id, ad_id, spend...` | Long, single source, granular | Detect hierarchy cols | Review → Source picker → Import |
| PM6 | `date, source, account_id, campaign_id, ad_group_id, ad_id, spend...` | Long, multi-source, granular | Detect source col + hierarchy | Review → Sources → Import |

### KPI Scenarios

| # | Format | Shape | Detection | Wizard Flow |
|---|--------|-------|-----------|-------------|
| K1 | `date, event_name, value` | Event format | Detect event_name STRING col + value NUM | Review (show events found) → Import |
| K2 | `date, source, event_name, val_src1, val_src2` | Event + multi-val | Detect source col + event col + multi value cols | Review → Sources → Import |
| K3 | `date, revenue, orders` | Wide KPI | Detect KPI column names | Review → Import |
| K4 | `date, source, revenue, orders` | Long KPI + source | Detect source col + KPI cols | Review → Sources → Import |

### Organic + Contextual Scenarios

| # | Format | Shape | Detection | Wizard Flow |
|---|--------|-------|-----------|-------------|
| OC1 | `date, source, org_imps, is_holiday, temperature` | Mixed org + ctx | Detect source col + mixed categories | Review (grouped by category) → Sources → Import |
| OC2 | `date, value` | Single metric | Single value col, no source | Review → Source/Name picker → Import |

---

## Wizard Flow for Each Shape

### LONG FORMAT (source as row)
```
Step 1: Upload/Connect
Step 2: Smart Detection
  - Show: "We found {N} sources in your data: {list}"
  - Show: column category tags (color-coded in preview)
  - Show: "Each row is one {granularity} per day"
  - Show: routing summary (where data goes)
Step 3: Source Matching (if multi-source)
  - Auto-match source values to known platforms
  - Flag overlaps with native integrations
  - User confirms or edits
Step 4: Schedule & Import
```

### WIDE FORMAT (channels as column prefixes)
```
Step 1: Upload/Connect
Step 2: Smart Detection
  - Show: "We detected channel-prefixed columns"
  - Show: extracted channels with their metrics (prefix → channel name)
  - Show: before/after unpivot preview
  - Show: standalone columns (KPI, organic, contextual) grouped by category
  - Show: routing summary
Step 3: Schedule & Import
```

### SINGLE SOURCE (no source column)
```
Step 1: Upload/Connect
Step 2: Smart Detection
  - Show: column categories
  - Show: "This data has no source column"
  - Show: visual source picker (platform icons)
  - Auto-suggest from filename if possible
  - Show: routing summary
Step 3: Schedule & Import
```

### EVENT FORMAT (event_name + value)
```
Step 1: Upload/Connect
Step 2: Smart Detection
  - Show: "Event-level data detected"
  - Show: unique events found with auto-classification (Revenue, Orders, etc.)
  - Show: KPI subtype for each event
  - Show: routing summary
Step 3: Schedule & Import
```

---

## End-to-End Auto-Propagation

### Import → Metrics & Dimensions (auto-populate)

When data is imported, fields are AUTO-REGISTERED in the Metrics & Dimensions system:

```
For each column in the imported data:
  1. Create a Field entry:
     - name: column_name
     - displayName: auto-generated (title case, replace underscores)
     - source: resolved source name (from source matching)
     - sourceKey: integration platform key
     - kind: "metric" or "dimension" (from detection)
     - dataType: detected type (FLOAT64, INT64, STRING, DATE)
     - metricCategory: detected category (paid_marketing, kpi, organic, contextual)
     - status: "Mapped" (auto)
     - transformation: auto-assigned (SUM for spend/count metrics, AVG for rate metrics)
     - stream: derived from integration name
     - tables: target table(s) in BigQuery

  2. For WIDE format unpivoted data:
     - Create one Field per (channel, metric) pair
     - e.g., fb_spend → Field(name=spend, source=Facebook Ads, category=paid_marketing)
     - e.g., google_spend → Field(name=spend, source=Google Ads, category=paid_marketing)

  3. For EVENT format:
     - Create one Field per unique event_name
     - e.g., purchase → Field(name=purchase, kind=metric, category=kpi, kpiSubtype=Revenue)

  4. Show "Recently Added" banner in Metrics & Dimensions tab:
     - "+{N} new fields added from '{import name}' (just now)"
     - New fields highlighted with "New" badge and "Auto" mapped badge
```

### Import → Tactic Mapper (auto-populate)

When GRANULAR data (campaign-level or below) is imported:

```
For each unique (source, campaign_name) in the imported data:
  1. Add to campaign list in Tactic Mapper
  2. Auto-suggest tactic based on:
     a. Existing mapping rules (pattern matching on campaign name)
     b. Source-based defaults (Facebook → "Meta", Google → "Google SEM")
     c. Campaign name keywords:
        - Contains "brand" → Brand tactic
        - Contains "retarget" or "remarket" → Retargeting tactic
        - Contains "search" or "sem" → SEM tactic
        - Contains "shop" or "dpa" → Shopping tactic
        - Contains "video" or "youtube" → Video tactic
        - Contains "display" → Display tactic
  3. Show suggestion confidence:
     - Rule-matched → "Auto-suggested (rule: name contains 'brand')"
     - No match → "Assign tactic..." button

For AGGREGATED data (channel-level):
  - Channels ARE the tactics — no mapping needed
  - The channel name from paid_agg_input is used directly in mmm_spend_view
  - Show in Tactic Mapper as "Direct channels (no mapping needed)"
```

### Touchpoint Reduction

```
BEFORE (manual flow):                    AFTER (smart import):
─────────────────────                    ─────────────────────
1. Upload file                           1. Upload file
2. Select data type (form)               2. Review auto-detection → "Looks Good"
3. Map each column manually              3. (auto)
4. Set category for each metric          4. (auto)
5. Go to Metrics tab                     5. (auto-propagated)
6. Register each field manually          6. (auto-propagated)
7. Set source for each field             7. (auto-propagated)
8. Set transformation for each field     8. (auto-propagated)
9. Go to Tactic Mapper                   9. Confirm tactic suggestions (1 click)
10. Find imported campaigns              10. (auto-populated)
11. Assign tactic for each campaign      11. (auto-suggested)

Result: 11 manual steps → 3 steps (upload, review, confirm)
        ~15 min → ~2 min for any number of columns
```

---

## Sparse Metrics Handling

When a multi-source table has metrics that only exist for some sources:

```
Example: Facebook has CPC but TV doesn't
  date | source   | spend  | impressions | cpc
  1/1  | Facebook | 5,000  | 250,000     | $2.40
  1/1  | TV       | 15,000 | NULL        | NULL

Handling:
  - NULLs are stored as-is in the target table
  - In the preview, show dashes (—) for missing values
  - No special user action needed
  - In Metrics & Dimensions, CPC will show as available for Facebook but not TV
  - In MMM, models handle NULLs appropriately (zero-imputation or exclusion)
```

---

## Files to Modify for UX Implementation

### Merge FileIntegrationWizard + DataSourceWizard into Unified Wizard

Current split:
- `src/components/integrations-monitoring/FileIntegrationWizard.tsx` — files only, NO column mapping
- `src/components/integrations-monitoring/DataSourceWizard.tsx` — DWH only, has column mapping

Target: Single `SmartImportWizard.tsx` that handles ALL source types with:
- Format detection engine (new)
- Category detection from column names (extends existing `classifyColumn()` in `fieldsData.ts`)
- Wide format unpivot detection (new)
- Source matching with alias resolution (new)
- Auto-propagation to field catalog (new)
- Auto-propagation to tactic mapper (new)

### Key Files

| File | Change |
|------|--------|
| `src/components/integrations-monitoring/DataSourceWizard.tsx` | Refactor into unified SmartImportWizard |
| `src/components/integrations-monitoring/FileIntegrationWizard.tsx` | Merge into unified wizard |
| `src/components/fieldsData.ts` | Extend `classifyColumn()` to detect category + auto-register fields |
| `src/components/MapperTab.tsx` | Add auto-populate from import + tactic suggestion logic |
| `src/components/integrations-monitoring/AddIntegrationPage.tsx` | Route all types to unified wizard |
| `src/components/integrations-monitoring/IntegrationsMonitoringTab.tsx` | Show import status + field propagation |
| `src/app/page.tsx` | Wire unified wizard + auto-propagation state flow |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `SmartImportWizard.tsx` | Unified wizard for all source types |
| `FormatDetector.ts` | Format detection engine (long/wide/single/event) |
| `CategoryDetector.ts` | Column → category classification with confidence |
| `SourceMatcher.ts` | Source alias matching + conflict detection |
| `UnpivotPreview.tsx` | Before/after visualization for wide format |
| `SourcePicker.tsx` | Visual platform picker for single-source data |
| `RoutingSummary.tsx` | "Where this data goes" visualization |
