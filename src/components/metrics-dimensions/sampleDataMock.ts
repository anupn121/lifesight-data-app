import type { Field, DataTypeKey } from "../fieldsData";

// ─── Deterministic hash ───────────────────────────────────────────────────
// Small 32-bit FNV-1a so the same field always generates the same sample
// values across renders — users can compare samples side-by-side without
// numbers jittering every time the component re-mounts.

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ─── Currency formatter ────────────────────────────────────────────────────

const currencySymbols: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", INR: "₹", BRL: "R$",
};

function formatCurrency(n: number, code = "USD"): string {
  const sym = currencySymbols[code] || "$";
  return `${sym}${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatFloat(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

// ─── Value archetypes ──────────────────────────────────────────────────────
// Each archetype produces 5 plausible sample strings given a seed.

type Archetype = (rng: () => number, currency?: string) => string[];

const archetypes: Record<string, Archetype> = {
  spend: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(200 + rng() * 4800, c)),
  revenue: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(1200 + rng() * 18000, c)),
  aov: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(40 + rng() * 160, c)),
  ltv: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(150 + rng() * 600, c)),
  currencyGeneric: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(50 + rng() * 2500, c)),

  impressions: (rng) => Array.from({ length: 5 }, () => formatInt(15000 + rng() * 120000)),
  clicks: (rng) => Array.from({ length: 5 }, () => formatInt(200 + rng() * 4500)),
  conversions: (rng) => Array.from({ length: 5 }, () => formatInt(5 + rng() * 120)),
  orders: (rng) => Array.from({ length: 5 }, () => formatInt(8 + rng() * 280)),
  sessions: (rng) => Array.from({ length: 5 }, () => formatInt(800 + rng() * 12000)),
  pageviews: (rng) => Array.from({ length: 5 }, () => formatInt(1500 + rng() * 25000)),
  emailOpens: (rng) => Array.from({ length: 5 }, () => formatInt(40 + rng() * 1200)),
  newCustomers: (rng) => Array.from({ length: 5 }, () => formatInt(3 + rng() * 90)),
  signups: (rng) => Array.from({ length: 5 }, () => formatInt(10 + rng() * 300)),
  intGeneric: (rng) => Array.from({ length: 5 }, () => formatInt(20 + rng() * 5000)),

  cpc: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(0.2 + rng() * 4.8, c)),
  cpm: (rng, c) => Array.from({ length: 5 }, () => formatCurrency(2 + rng() * 28, c)),

  ctr: (rng) => Array.from({ length: 5 }, () => `${(0.5 + rng() * 7.5).toFixed(2)}%`),
  rate: (rng) => Array.from({ length: 5 }, () => `${(rng() * 12).toFixed(2)}%`),
  ratio: (rng) => Array.from({ length: 5 }, () => formatFloat(0.5 + rng() * 4.5, 2)),
  floatGeneric: (rng) => Array.from({ length: 5 }, () => formatFloat(rng() * 10, 3)),

  date: (rng) => {
    const start = new Date(2026, 2, 14).getTime();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(start + i * 86400000);
      return d.toISOString().slice(0, 10);
    });
  },

  campaignName: (rng) => {
    const pool = [
      "Summer Sale 2026",
      "Retargeting - High Intent",
      "Prospecting Q2",
      "Brand Awareness - US",
      "Holiday Promo",
      "Back to School",
      "Launch - New Collection",
      "Lookalike - Purchasers",
    ];
    return pickN(pool, rng, 5);
  },
  adsetName: (rng) => {
    const pool = [
      "Interest - Fashion",
      "Broad - 25-45",
      "Custom - Cart Abandoners",
      "Geo - California",
      "Geo - New York",
      "Lookalike 1%",
    ];
    return pickN(pool, rng, 5);
  },
  channelName: (rng) => pickN(["Facebook", "Google", "TikTok", "Snapchat", "Pinterest", "Email"], rng, 5),
  sourceName: (rng) => pickN(["Direct", "Organic Search", "Referral", "Paid Social", "Email", "Organic Social"], rng, 5),
  country: (rng) => pickN(["United States", "Canada", "United Kingdom", "Australia", "Germany", "France"], rng, 5),
  deviceName: (rng) => pickN(["Desktop", "Mobile - iOS", "Mobile - Android", "Tablet"], rng, 5),
  stringGeneric: (rng) => pickN(["Active", "Paused", "Draft", "Completed", "Running"], rng, 5),

  jsonGeneric: () => [
    `{ "id": 1834, "status": "ok" }`,
    `{ "id": 2091, "status": "ok" }`,
    `{ "id": 2478, "status": "retry" }`,
    `{ "id": 3117, "status": "ok" }`,
    `{ "id": 3502, "status": "ok" }`,
  ],
};

function pickN(pool: string[], rng: () => number, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(pool[Math.floor(rng() * pool.length)]);
  }
  return out;
}

// ─── Archetype selection ───────────────────────────────────────────────────

function pickArchetype(field: Field): keyof typeof archetypes {
  const key = (field.sourceKey || field.columnName || "").toLowerCase();
  const dt: DataTypeKey = field.dataType;

  // Specific patterns (ordered most specific first)
  if (/cpc/.test(key)) return "cpc";
  if (/cpm/.test(key)) return "cpm";
  if (/ctr/.test(key)) return "ctr";
  if (/rate|ratio/.test(key) && (dt === "FLOAT64" || dt === "NUMERIC")) return "rate";
  if (/spend|cost/.test(key)) return "spend";
  if (/revenue|sales|gmv/.test(key)) return "revenue";
  if (/aov/.test(key)) return "aov";
  if (/ltv/.test(key)) return "ltv";
  if (/impression/.test(key)) return "impressions";
  if (/click/.test(key)) return "clicks";
  if (/conversion/.test(key)) return "conversions";
  if (/order|purchase|transaction/.test(key)) return "orders";
  if (/session|visit/.test(key)) return "sessions";
  if (/pageview|page_view/.test(key)) return "pageviews";
  if (/email.*open|open.*email/.test(key)) return "emailOpens";
  if (/new_customer|new-customer|newcustomer/.test(key)) return "newCustomers";
  if (/signup|sign_up|registration/.test(key)) return "signups";

  if (/campaign.*name|campaign_name/.test(key)) return "campaignName";
  if (/adset|ad_set|adgroup|ad_group/.test(key)) return "adsetName";
  if (/channel/.test(key)) return "channelName";
  if (/source/.test(key) && dt === "STRING") return "sourceName";
  if (/country|region|geo/.test(key)) return "country";
  if (/device|platform/.test(key)) return "deviceName";

  // Fall back by type
  if (dt === "CURRENCY") return "currencyGeneric";
  if (dt === "DATE") return "date";
  if (dt === "INT64" || dt === "NUMERIC" || dt === "BIGNUMERIC") return "intGeneric";
  if (dt === "FLOAT64") return "floatGeneric";
  if (dt === "JSON") return "jsonGeneric";
  return "stringGeneric";
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getSampleValues(field: Field, n = 5): string[] {
  const seed = hash32(`${field.source}::${field.sourceKey || field.columnName || field.name}`);
  const rng = seededRandom(seed);
  const archetype = pickArchetype(field);
  const currency = field.currencyConfig?.code;
  const values = archetypes[archetype](rng, currency);
  return values.slice(0, n);
}

/**
 * True when we believe the source + column combination would resolve against
 * a real integration. In the mock world this is a proxy for "column exists in
 * source" — so we can show the `✓ Column exists` validation badge.
 */
export function canValidateSample(field: Field): boolean {
  return !!field.source && !!(field.sourceKey || field.columnName);
}

/**
 * Given a column name → sample value map (built from the workspace), evaluate
 * a safe subset of SQL-ish formulas against 5 synthetic rows and return the
 * resulting column of 5 values. Used by the derived-metric preview pane.
 *
 * Supports: + - * / , parentheses, numbers, column names, NULLIF, ROUND,
 * ABS, LEAST, GREATEST, CASE WHEN … THEN … ELSE … END, comparison ops.
 * Anything else → returns an error string.
 */
export function evaluateFormulaOverSamples(
  formula: string,
  sampleRowsByColumn: Record<string, number[]>,
  rowCount = 5,
): string[] {
  const out: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    try {
      const v = evalExpr(formula, (name) => {
        const col = sampleRowsByColumn[name];
        return col ? col[row] ?? 0 : 0;
      });
      out.push(
        typeof v === "number"
          ? Number.isInteger(v) && Math.abs(v) > 1000
            ? formatInt(v)
            : v.toFixed(2)
          : String(v),
      );
    } catch {
      out.push("—");
    }
  }
  return out;
}

// ─── Tiny safe expression evaluator ────────────────────────────────────────
// Not a full SQL engine — just enough to render a plausible preview of the
// formulas our derived-metric builder produces. No user-supplied raw SQL runs
// through here; only formulas built from COMBINE_PRESETS and the guided
// builder, all of which emit a known subset.

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" }
  | { t: "kw"; v: string };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(") { toks.push({ t: "lp" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rp" }); i++; continue; }
    if (c === ",") { toks.push({ t: "comma" }); i++; continue; }
    if ("+-*/".includes(c)) { toks.push({ t: "op", v: c }); i++; continue; }
    if (c === ">" || c === "<" || c === "=" || c === "!") {
      let op = c;
      if (src[i + 1] === "=") { op += "="; i++; }
      toks.push({ t: "op", v: op });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      toks.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      const up = word.toUpperCase();
      if (["NULLIF", "ROUND", "ABS", "LEAST", "GREATEST", "CASE", "WHEN", "THEN", "ELSE", "END"].includes(up)) {
        toks.push({ t: "kw", v: up });
      } else {
        toks.push({ t: "id", v: word });
      }
      i = j;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") j++;
      toks.push({ t: "id", v: src.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    // Unknown char — skip to avoid crashing
    i++;
  }
  return toks;
}

function evalExpr(formula: string, lookup: (name: string) => number): number {
  const toks = tokenize(formula);
  let pos = 0;

  const peek = () => toks[pos];
  const take = () => toks[pos++];

  function parsePrimary(): number {
    const t = take();
    if (!t) throw new Error("EOF");
    if (t.t === "num") return t.v;
    if (t.t === "lp") {
      const v = parseCompare();
      const rp = take();
      if (!rp || rp.t !== "rp") throw new Error("expected )");
      return v;
    }
    if (t.t === "kw") {
      if (t.v === "CASE") return parseCase();
      if (t.v === "NULLIF") return parseFnArgs2((a, b) => (a === b ? 0 : a), true);
      if (t.v === "ROUND") return parseFnArgs2((a, b) => {
        const pow = Math.pow(10, Math.round(b));
        return Math.round(a * pow) / pow;
      });
      if (t.v === "ABS") return parseFnArgs1(Math.abs);
      if (t.v === "LEAST") return parseFnArgs2(Math.min);
      if (t.v === "GREATEST") return parseFnArgs2(Math.max);
      throw new Error("unknown kw " + t.v);
    }
    if (t.t === "id") {
      const v = lookup(t.v);
      return isNaN(v) ? 0 : v;
    }
    if (t.t === "op" && (t.v === "-" || t.v === "+")) {
      const next = parsePrimary();
      return t.v === "-" ? -next : next;
    }
    throw new Error("unexpected token");
  }

  function parseFnArgs1(fn: (a: number) => number): number {
    const lp = take();
    if (!lp || lp.t !== "lp") throw new Error("expected (");
    const a = parseCompare();
    const rp = take();
    if (!rp || rp.t !== "rp") throw new Error("expected )");
    return fn(a);
  }

  function parseFnArgs2(fn: (a: number, b: number) => number, nullifMode = false): number {
    const lp = take();
    if (!lp || lp.t !== "lp") throw new Error("expected (");
    const a = parseCompare();
    const comma = take();
    if (!comma || comma.t !== "comma") throw new Error("expected ,");
    const b = parseCompare();
    const rp = take();
    if (!rp || rp.t !== "rp") throw new Error("expected )");
    if (nullifMode && a === b) return NaN; // treat like NULL → downstream divide by NaN → NaN
    return fn(a, b);
  }

  function parseCase(): number {
    // CASE WHEN <cmp> THEN <expr> ELSE <expr> END
    const when = take();
    if (!when || when.t !== "kw" || when.v !== "WHEN") throw new Error("expected WHEN");
    const cond = parseCompare();
    const then = take();
    if (!then || then.t !== "kw" || then.v !== "THEN") throw new Error("expected THEN");
    const a = parseCompare();
    const els = take();
    if (!els || els.t !== "kw" || els.v !== "ELSE") throw new Error("expected ELSE");
    const b = parseCompare();
    const end = take();
    if (!end || end.t !== "kw" || end.v !== "END") throw new Error("expected END");
    return cond ? a : b;
  }

  function parseMul(): number {
    let a = parsePrimary();
    while (true) {
      const t = peek();
      if (!t || t.t !== "op" || (t.v !== "*" && t.v !== "/")) break;
      take();
      const b = parsePrimary();
      if (t.v === "*") a = a * b;
      else a = b === 0 || isNaN(b) ? 0 : a / b;
    }
    return a;
  }

  function parseAdd(): number {
    let a = parseMul();
    while (true) {
      const t = peek();
      if (!t || t.t !== "op" || (t.v !== "+" && t.v !== "-")) break;
      take();
      const b = parseMul();
      a = t.v === "+" ? a + b : a - b;
    }
    return a;
  }

  function parseCompare(): number {
    const a = parseAdd();
    const t = peek();
    if (!t || t.t !== "op" || !["=", "!=", ">", "<", ">=", "<="].includes(t.v)) return a;
    take();
    const b = parseAdd();
    switch (t.v) {
      case "=": return a === b ? 1 : 0;
      case "!=": return a !== b ? 1 : 0;
      case ">": return a > b ? 1 : 0;
      case "<": return a < b ? 1 : 0;
      case ">=": return a >= b ? 1 : 0;
      case "<=": return a <= b ? 1 : 0;
    }
    return 0;
  }

  return parseCompare();
}

/**
 * Build a column→row map from a list of fields so the evaluator can reference
 * any column by name. Numeric archetypes produce actual numbers; strings are
 * converted to 0 (they can't sensibly participate in math).
 */
export function buildSampleRowMap(fields: Field[], rowCount = 5): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const f of fields) {
    if (!f.columnName) continue;
    const samples = getSampleValues(f, rowCount);
    out[f.columnName] = samples.map((s) => {
      // Strip formatting to get a number
      const cleaned = s.replace(/[^0-9.\-]/g, "");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    });
  }
  return out;
}
