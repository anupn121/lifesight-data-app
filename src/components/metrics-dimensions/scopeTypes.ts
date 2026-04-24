// ═══════════════════════════════════════════════════════════════════════════
//  ACCOUNT SCOPE TYPES
// ═══════════════════════════════════════════════════════════════════════════
//
//  Pre-defined tag dimensions for scoping an account (native ad channels) or
//  a sheet/table (file integrations, data warehouses) to business concepts:
//
//  • Brand   — e.g., "GAP", "Banana Republic", "Old Navy"
//  • Product — e.g., "Apparel", "Footwear"
//  • Country — ISO-like name or free text, e.g., "US", "United Kingdom"
//  • Region  — state ("California") OR regional block ("US East", "APAC")
//
//  Future: this will become extensible — `customTags: Record<string, string>`
//  — but for MVP we keep it as a fixed-4-dimension struct so the filter bar
//  and breakdown chips can assume a known set of pills.
// ═══════════════════════════════════════════════════════════════════════════

export type ScopeDimension = "brand" | "product" | "country" | "region";

export interface AccountScope {
  brand?: string;
  product?: string;
  country?: string;
  region?: string;
}

export const SCOPE_DIMENSIONS: {
  key: ScopeDimension;
  label: string;
  pluralLabel: string;
  description: string;
  /** Color used for the filter pill and breakdown chips */
  accent: string;
  iconPath: string;
}[] = [
  {
    key: "brand",
    label: "Brand",
    pluralLabel: "Brands",
    description: "e.g., GAP, Banana Republic, Old Navy",
    accent: "#a78bfa",
    iconPath: "M3 3h10v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3z M6 10v3M10 10v3",
  },
  {
    key: "product",
    label: "Product",
    pluralLabel: "Products",
    description: "e.g., Apparel, Footwear",
    accent: "#00bc7d",
    iconPath: "M2 6l6-3 6 3-6 3-6-3z M2 6v5l6 3 6-3V6 M8 9v5",
  },
  {
    key: "country",
    label: "Country",
    pluralLabel: "Countries",
    description: "e.g., US, United Kingdom, Australia",
    accent: "#2b7fff",
    iconPath: "M8 14s-5-3.5-5-8a5 5 0 0 1 10 0c0 4.5-5 8-5 8z M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    key: "region",
    label: "Region",
    pluralLabel: "Regions",
    description: "State or regional block, e.g., California, US East",
    accent: "#fe9a00",
    iconPath: "M1.5 4h13v8h-13z M1.5 7.5h13 M5.5 4v8 M10 4v8",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** True if the scope has ANY dimension set — useful for "is this tagged at all" checks */
export function hasAnyScope(s?: AccountScope): boolean {
  if (!s) return false;
  return !!(s.brand || s.product || s.country || s.region);
}

/** True if every required dimension is set — useful for "fully tagged" */
export function hasAllScopeDimensions(s?: AccountScope, dims: ScopeDimension[] = ["brand", "country"]): boolean {
  if (!s) return false;
  return dims.every((d) => !!s[d]);
}

/**
 * True if the field's scope matches the active filter. Each dimension in the
 * filter is a Set<string> of accepted values. An empty Set means "any value".
 */
export function scopeMatchesFilter(
  scope: AccountScope | undefined,
  filter: ScopeFilter,
): boolean {
  for (const d of SCOPE_DIMENSIONS) {
    const accepted = filter[d.key];
    if (!accepted || accepted.size === 0) continue;
    const value = scope?.[d.key];
    if (!value) return false; // untagged fails a specific filter
    if (!accepted.has(value)) return false;
  }
  return true;
}

/**
 * Filter state: one Set per dimension. Empty/missing Set = "any value".
 */
export type ScopeFilter = Partial<Record<ScopeDimension, Set<string>>>;

export const EMPTY_SCOPE_FILTER: ScopeFilter = {};

export function countActiveFilters(filter: ScopeFilter): number {
  let n = 0;
  for (const d of SCOPE_DIMENSIONS) {
    const s = filter[d.key];
    if (s && s.size > 0) n++;
  }
  return n;
}

/**
 * Collect the distinct values that appear across a set of scoped items, per
 * dimension. Used to populate the filter bar's options.
 */
export function collectScopeValues(
  scopes: (AccountScope | undefined)[],
): Record<ScopeDimension, string[]> {
  const out: Record<ScopeDimension, Set<string>> = {
    brand: new Set(),
    product: new Set(),
    country: new Set(),
    region: new Set(),
  };
  for (const s of scopes) {
    if (!s) continue;
    for (const d of SCOPE_DIMENSIONS) {
      const v = s[d.key];
      if (v) out[d.key].add(v);
    }
  }
  return {
    brand: Array.from(out.brand).sort(),
    product: Array.from(out.product).sort(),
    country: Array.from(out.country).sort(),
    region: Array.from(out.region).sort(),
  };
}

/**
 * Short, human-readable summary of a scope — used in the tagging editor
 * preview ("GAP · US · California") and the IntegrationGroup breakdown.
 */
export function formatScopeSummary(s?: AccountScope): string {
  if (!s) return "";
  const parts: string[] = [];
  if (s.brand) parts.push(s.brand);
  if (s.product) parts.push(s.product);
  if (s.country) parts.push(s.country);
  if (s.region) parts.push(s.region);
  return parts.join(" · ");
}

/**
 * Merge scopes — used when the user bulk-applies a partial tag set to
 * multiple accounts (e.g., set Brand only, leaving existing Country alone).
 * Only dimensions present in `incoming` overwrite.
 */
export function mergeScope(existing: AccountScope | undefined, incoming: AccountScope): AccountScope {
  return {
    brand: incoming.brand ?? existing?.brand,
    product: incoming.product ?? existing?.product,
    country: incoming.country ?? existing?.country,
    region: incoming.region ?? existing?.region,
  };
}
