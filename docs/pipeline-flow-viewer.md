# Data Pipeline Flow Viewer (v2)

Interactive engineering documentation tool that shows how data from multiple sources flows through the Lifesight pipeline. Multi-select source picker drives a 5-stage visualization with mock data preview and click-to-highlight lineage.

> **v1 still available** at `pipeline-flow-viewer-v1.html` — the single-scenario predecessor with COMBO scenario.

## Purpose

Engineers need to answer questions like:

- For a realistic production setup with **Facebook Ads (native) + a Google Sheet (long format paid) + a BigQuery table (long format KPI) + a wide-format MMM sheet**, what does the full pipeline look like?
- Which sources go into `adspends_mat_view` vs which stay standalone?
- What does a wide-format scenario actually look like as raw data, and how do the column names get transformed in the M&D step?
- What does the downstream Data Model look like when you mix multiple source types?

The v2 viewer answers all of these by letting you check any combination of sources from a multi-select picker and seeing the full lineage update live.

## How to open

```bash
open docs/pipeline-flow-viewer.html
```

That's it — no build step, no server, no dependencies.

## The 5-Stage Pipeline

```
┌──────────┐  ┌───────────┐  ┌─────────────────┐  ┌──────────┐  ┌───────────┐
│ Stage 1  │  │ Stage 2   │  │ Stage 3         │  │ Stage 4  │  │ Stage 5   │
│ Source   │→ │ Raw Dump  │→ │ M&D + Staged    │→ │ Storage  │→ │ Data      │
│          │  │           │  │ (+Tactic Mapper)│  │          │  │ Model     │
└──────────┘  └───────────┘  └─────────────────┘  └──────────┘  └───────────┘
                                                       │
                                              ┌────────┴────────┐
                                              ↓                 ↓
                                    Long → adspends_mat_view   Wide → standalone
                                          (joined with         (NOT joined,
                                           ad_insights +        Data Model
                                           ga4_insights)        picks directly)
```

### Stage 1: Source

Each picked source renders as a card with:
- **Source type badge**: `NATIVE` (teal) / `LONG` (orange) / `WIDE` (purple)
- **Integration icon + name** + a label like "via API" or "marketing.email_engagement"
- **Original column schema** with category tags
- **Show sample data ▾** button that expands to show 25 mock data rows inline. First click shows 8 rows; click "View all 25" to see the rest. Edge cases (NULLs, holiday spikes, missing values) are highlighted with an orange left border and ⚠ icon.

### Stage 2: Raw Dump

Shows the raw landing table for each source — e.g., `raw_native_facebook`, `raw_sheet_q4_paid_data`, `raw_bq_marketing_google_ads_daily`. This is where the data lives immediately after sync, before any transformation.

### Stage 3: M&D + Staged

Two parts in one card:
- **M&D transforms** — the column rename / classify operations (e.g., `cost → spend`, `campaign_name → campaign`)
- **Staged table** — the resulting transformed table (e.g., `staged_pm1_q4_paid_data`) with its final column schema as colored pills
- **Tactic Mapper note** (when applicable) — annotated as "Tactic Mapper adds tactic_name column" for sources with campaigns

### Stage 4: Storage

Two distinct storage destinations:
- **adspends_mat_view** (green-tinted card) — the unified mat_view that joins ad_insights, ga4_insights, and all long-format staged tables. Lists which selected sources feed into it.
- **Standalone tables** (purple-tinted cards) — wide-format staged tables that DO NOT join the mat_view. They stay standalone and are queried directly by the Data Model.

### Stage 5: Data Model

The final variables available to MMM/Experiment models, grouped by section:
- Spend Variables
- KPIs
- Organic Variables
- Control Variables
- Modeling Dimensions

Each variable is sourced from either the mat_view or a standalone table.

## The 15 Selectable Sources

### Native Integrations (3) — fixed schema, lands in `ad_insights`

| ID | Name | Format | Category | Notes |
|----|------|--------|----------|-------|
| `facebook` | Facebook Ads | Long | Paid | Native API sync, supports tactic mapping |
| `google` | Google Ads | Long | Paid | Native API sync, supports tactic mapping |
| `tiktok` | TikTok Ads | Long | Paid | Native API sync, supports tactic mapping |

### Long Format Custom (9) — joins into `adspends_mat_view`

| ID | Source | Description |
|----|--------|-------------|
| `PM1` | Google Sheets | Multi-source paid data with explicit `source` column |
| `PM4` | CSV Upload | Single source, no source column (filename-derived) |
| `PM5` | BigQuery | Granular ad hierarchy (account → campaign → adgroup → ad) |
| `PM6` | BigQuery | Granular multi-source with hierarchy |
| `K1` | Google Sheets | Event format KPI (`date, event_name, value`) |
| `K3` | CSV Upload | Daily aggregated KPI |
| `K4` | BigQuery | Daily KPI per source |
| `OC1` | Google Sheets | Mixed organic + contextual variables |
| `OC2` | CSV Upload | Single contextual variable (fuel price) |

### Wide Format Custom (3) — STAYS standalone

| ID | Source | Description |
|----|--------|-------------|
| `PM2` | Google Sheets | Channel-prefixed columns (`fb_spend, google_spend, ...`) |
| `PM3` | Google Sheets | Wide mixed (paid + KPI + organic + contextual in one sheet) |
| `K2` | Google Sheets | Event + per-source value columns (`value_amazon, value_dtc`) |

## Why Long ≠ Wide for Storage

- **Long format** has `date + (optional dimensions) + metric columns` — it's row-per-(date, source) shape that matches `ad_insights` natively. A simple UNION ALL is enough to join it into the mat_view.
- **Wide format** has channel/source encoded as **column prefixes** (`fb_spend`, `google_spend`, `tt_spend`). To join into the mat_view, you'd have to **unpivot** it — which is fragile, lossy if some channels have metrics others don't, and means the user's column structure is destroyed. Better to leave it standalone and let Data Models query it directly when needed.

This is the architectural reason why wide-format scenarios bypass the mat_view layer entirely and feed Data Model directly via standalone tables.

## Key UX Behaviors

### Multi-select picker

- 3 groups: Native / Long Format / Wide Format
- Each group has its own **All** and **None** buttons
- Header has **Select all** (everything) and **Clear all** (nothing)
- Default selection: 5 sources mixing all 3 types (Facebook + PM1 + PM3 + K3 + OC1)
- Picker is collapsible — you can hide it once you've made your selection

### Mock data tables

- Each source has 25 rows of mock data with **edge cases at fixed indices**
- Edge cases: NULL values, holiday spikes (×2 normal), missing rows, mixed types
- First click on "Show sample data" expands an 8-row preview
- "View all 25 rows" expands to the full dataset (scrollable)
- Edge case rows have an orange left border and ⚠ icon

### Click-to-highlight

- Click any node (column, raw table, transform, staged column, storage table, data model variable)
- BFS through the edge graph highlights its **full connected path** through all 5 stages
- All other nodes/edges fade to ~6% opacity
- Click the same node again or click an empty area to reset
- "Reset highlight" button in the header also clears

### Tooltips

- Hover any clickable element for a tooltip with details (column tag, table description, source provenance, etc.)

## Mock Data Edge Cases by Scenario

| Scenario | Notable edge cases |
|----------|---------------------|
| `facebook` | NULL spend on row 9 (failed sync), Jan 6 spike (×2 normal) |
| `google` | Jan 6 spike across both campaigns |
| `tiktok` | Jan 6 spike on awareness + conversion |
| `PM1` | OOH rows have NULL for `impressions`/`clicks` (impressions-only medium), Reddit row 12 entirely NULL |
| `PM2` | Jan 6 spike, NULL fb_spend on Jan 15 |
| `PM3` | Holiday week (Jan 15-17) with `product_launch=1` and ×2.5 normal values |
| `PM4` | Row 16 entirely NULL (sync gap) |
| `PM5` | NULL row at index 8, Jan 6 spike |
| `PM6` | Multi-source with NULL Facebook on Jan 5, weekend spike |
| `K1` | NULL `add_to_cart` value, weekend spike on Jan 6 |
| `K2` | NULL Amazon value on Jan 9 (sync issue) |
| `K3` | NULL row at index 15, Jan 6 spike |
| `K4` | NULL DTC values on Jan 9 |
| `OC1` | All sources NULL on Jan 5 (sync gap), holiday=1 on Jan 1 + Jan 6 |
| `OC2` | Fuel price spike Jan 15-17 (geopolitical event simulated) |

## Try it

```bash
open docs/pipeline-flow-viewer.html
```

**Suggested exploration flow:**
1. Default opens with 5 sources selected (Facebook + PM1 + PM3 + K3 + OC1)
2. Click "Show sample data" on Facebook Ads → see 8 mock rows. Click "View all 25" → see all rows including the row 6 spike and row 9 NULL
3. Click `fb_spend` in PM3 (wide format) → highlight its path through the pipeline. Notice it goes to `staged_pm3_mmm_master` (standalone), NOT `adspends_mat_view`
4. Click `spend` in Facebook Ads (native) → notice it routes to `adspends_mat_view` via the `ad_insights (Facebook partition)` staged table
5. Click `Select all` to see all 15 sources at once — visually shows the full architecture
6. Click `Clear all` then check just `facebook` + `PM1` + `PM2` to see how 1 native + 1 long + 1 wide source behave differently in storage
7. Click `adspends_mat_view` in Stage 4 → highlights every source feeding into it (everything except the wide-format scenarios)

## File Structure

```
docs/
├── pipeline-flow-viewer.html        # v2 (current) — multi-select, 5 stages, mock data
├── pipeline-flow-viewer-v1.html     # v1 (legacy) — single-scenario, 4 stages, COMBO preset
└── pipeline-flow-viewer.md          # this README
```

## How to add a new source

1. Open `pipeline-flow-viewer.html`
2. Find the `SOURCES` object
3. Add a new entry following this shape:

```javascript
SOURCES = {
  // ... existing
  MY_NEW: {
    id: 'MY_NEW',
    type: 'long',  // 'native' | 'long' | 'wide'
    name: 'MY_NEW — short description',
    integration: 'Google Sheets',
    label: 'my_data.gsheet',
    format: 'long',
    primaryCategory: 'paid',  // 'paid' | 'kpi' | 'organic' | 'contextual'
    columns: [
      { name: 'date',  tag: 'dim' },
      { name: 'spend', tag: 'paid' },
      // ...
    ],
    rawTable: 'raw_sheet_my_data',
    rawDescription: 'Description of what this source contains.',
    mdTransforms: [
      { from: 'spend', to: 'spend', cat: 'paid' },
    ],
    stagedTable: 'staged_my_new_my_data',
    stagedColumns: [
      { name: 'date', cat: 'dim' },
      { name: 'spend', cat: 'paid' },
    ],
    hasTacticMapper: false,
    storageTarget: 'matview',  // 'matview' | 'standalone'
    storageNote: 'How this source flows into storage.',
    dataModel: [
      { label: 'Spend Variables', tag: 'paid', vars: ['Variable Name'] },
    ],
    mockData: [
      ['2024-01-01', 1000],
      // ... 24 more rows
    ],
    edgeCaseRows: [10, 15],  // 0-indexed positions of edge case rows
  },
};
```

4. Add the source ID to the appropriate group in `SOURCE_GROUPS`:

```javascript
SOURCE_GROUPS = [
  // ...
  {
    type: 'long',  // matches your new source type
    sources: ['PM1', 'PM4', /* ... */, 'MY_NEW'],
  },
];
```

5. Reload the file in your browser. The new source appears in the picker and renders through all 5 stages.

## Why a standalone HTML file?

- **Zero build step** — open the file, it works
- **Shareable** — single file, send via Slack/email/PR
- **No dependency drift** — won't break with framework upgrades
- **Lives in `docs/`** — versioned alongside code but outside the Next.js build
- **Matches existing pattern** — same approach as `src/import-wizard-v2.html`

## Related Documentation

- [smart_source_detection_algorithm.md](../smart_source_detection_algorithm.md) — Full pipeline design including the 12 scenarios and their routing logic
- [`src/components/integrations-monitoring/smartDetection.ts`](../src/components/integrations-monitoring/smartDetection.ts) — Source of truth for scenario definitions
- [`src/components/metrics-dimensions/useFieldData.ts`](../src/components/metrics-dimensions/useFieldData.ts) — Hierarchical grouping logic
- [`src/components/FlowView.tsx`](../src/components/FlowView.tsx) — In-app field-level flow viewer (different concept)
