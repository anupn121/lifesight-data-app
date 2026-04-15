# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Build static export (output to `out/`)
- `npm run lint` — Run Next.js ESLint
- No test framework is configured

## Architecture

Next.js 14 app with static export (`output: 'export'`) deployed to GitHub Pages at `/lifesight-data-app`. All UI is client-side rendered — every interactive component uses `"use client"`.

**Stack:** React 18, TypeScript (strict), Tailwind CSS 3, PostCSS/Autoprefixer. Path alias `@/*` maps to `./src/*`.

### App Structure

`src/app/page.tsx` renders `DataPage`, a single-page app with tab-based navigation:

```
DataPage
├── Sidebar — icon nav
├── TopNav — workspace selector, theme toggle
├── TabBar — tab switcher
└── Tab content (one active at a time):
    ├── MonitoringTab — integration status monitoring
    ├── IntegrationsTab — integration catalog with filtering
    ├── MetricsDimensionsTab — field management tables
    ├── MapperTab — tactic mapper
    └── DataModelsTab — data model CRUD
```

### Data Layer

All data is mock/static — no API calls or backend. Core data files in `src/components/`:

- `fieldsData.ts` — Field/metric/dimension types and definitions (Field, MetricCategory, DataTypeKey, KpiSubtype interfaces)
- `monitoringData.ts` — Integration types and ~80+ pre-configured integrations (IntegrationStatus enum, Integration interface)
- `dataModelsData.ts` — Data model structures with KPIs and control variables
- `mockDataGenerator.ts` — Synthetic data generation for previews

### Theme System

Dark/light mode via `ThemeContext.tsx` with localStorage persistence. Theming uses ~40 CSS custom properties (e.g., `--bg-primary`, `--text-primary`, `--border-primary`) defined in `src/app/globals.css`. Components reference these variables, not hardcoded colors.

### EDA System

`src/components/eda/` contains 30+ specialized analysis panel components (data quality, univariate stats, correlation, time series, anomaly detection, marketing AI). These are rendered by `EDAView.tsx` which manages panel selection and layout.

### Key Conventions

- State management: React hooks only (useState, useContext, useCallback, useMemo). No external state library.
- Props flow down from page.tsx to tab components (prop drilling). Theme is the only context.
- Inline SVG icons throughout — no icon library.
- Status colors: green `#00bc7d` (connected), red `#ff2056` (error), orange `#fe9a00` (warning), purple `#a855f7` (syncing).
- Category colors: KPI `#00bc7d`, Paid Marketing `#2b7fff`, Organic `#fe9a00`, Contextual `#6941c6`, Halo `#EE1D52`.

### Don'ts

- **Never use tiny font sizes** (`text-[10px]`, `text-[11px]`) for user-facing content like table names, column names, key labels, or any data the user needs to read. These sizes are only acceptable for uppercase tracking-wider labels (e.g., section headers like "DATA SOURCE"). Body text, code, and data values should be `text-xs` (12px) minimum, preferably `text-sm` (14px).
- **Keep font sizes consistent within a card/section.** Don't mix `text-[10px]` data with `text-sm` headings in the same visual block — it looks unbalanced.

### Large Files

Several tab components are very large (MetricsDimensionsTab ~84KB, MonitoringTab ~43KB, DataModelsTab ~21KB). These contain complex table UIs with inline editing, sorting, filtering, and pagination. Read specific line ranges when working with these files.
