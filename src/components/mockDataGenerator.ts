// Mock data generator with seeded PRNG and statistical helpers
// Used by DataPreviewModal and EDAModal

import type { DataModel } from "./dataModelsData";
import type { Field } from "./fieldsData";

// --- Seeded PRNG (Mulberry32) ---
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// --- Dimension value pools ---
const STATES = ["CA", "TX", "NY", "FL", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA"];
const COUNTRIES = ["US", "UK", "DE", "FR", "CA", "AU", "JP", "BR", "IN", "MX", "IT", "ES", "NL", "KR"];
const DMAS = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin"];
const TACTICS = ["Awareness", "Consideration", "Conversion", "Retargeting", "Brand", "Performance"];
const DEVICES = ["Desktop", "Mobile", "Tablet"];
const PLATFORMS = ["Facebook", "Google", "TikTok", "Snapchat", "Instagram"];
const SEGMENTS = ["High Value", "New Users", "Returning", "Lapsed", "VIP"];
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Diego"];

function getDimensionPool(category: string, granularity: string): string[] {
  if (category === "Geo") {
    if (granularity === "State/Region") return STATES;
    if (granularity === "Country") return COUNTRIES;
    if (granularity === "DMA") return DMAS;
    if (granularity === "City") return CITIES;
    return STATES;
  }
  if (category === "Channel") {
    if (granularity === "Tactic") return TACTICS;
    if (granularity === "Platform") return PLATFORMS;
    return TACTICS;
  }
  if (category === "Device") return DEVICES;
  if (category === "Audience") return SEGMENTS;
  return ["A", "B", "C"];
}

// --- Numeric range configs by KPI category ---
function getNumericRange(category: string): [number, number] {
  switch (category) {
    case "Revenue": return [5000, 50000];
    case "Conversions": return [50, 500];
    case "Installs": return [100, 2000];
    case "Orders": return [20, 300];
    case "Store Visits": return [10, 150];
    case "Registrations": return [30, 400];
    case "Reach": return [10000, 500000];
    case "Subscriptions": return [5, 100];
    case "Admissions": return [10, 200];
    default: return [100, 10000];
  }
}

// --- Date generation ---
function generateDates(granularity: "Daily" | "Weekly" | "Monthly", count: number): string[] {
  const dates: string[] = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    if (granularity === "Daily") d.setDate(start.getDate() + i);
    else if (granularity === "Weekly") d.setDate(start.getDate() + i * 7);
    else d.setMonth(start.getMonth() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export interface MockDataset {
  columns: string[];
  columnTypes: Record<string, "date" | "string" | "currency" | "integer" | "decimal">;
  rows: (string | number | null)[][];
}

export function generateMockDataset(
  model: DataModel,
  fields: Field[],
  rowCount?: number
): MockDataset {
  const rng = mulberry32(hashString(model.id));

  const count =
    rowCount ??
    (model.granularity === "Weekly" ? 52 : model.granularity === "Daily" ? 90 : 24);

  // Build columns
  const columns: string[] = ["Date"];
  const columnTypes: Record<string, "date" | "string" | "currency" | "integer" | "decimal"> = {
    Date: "date",
  };

  // Dimension columns (skip Date dimensions)
  const dimColumns: { name: string; pool: string[] }[] = [];
  for (const dim of model.modelingDimensions) {
    if (dim.category === "Date") continue;
    const colName = `${dim.category} (${dim.granularity})`;
    columns.push(colName);
    columnTypes[colName] = "string";
    dimColumns.push({ name: colName, pool: getDimensionPool(dim.category, dim.granularity) });
  }

  // KPI columns
  const kpiColumns: { name: string; range: [number, number]; isCurrency: boolean }[] = [];
  for (const kpi of model.kpis) {
    const field = kpi.fieldName ? fields.find((f) => f.name === kpi.fieldName) : null;
    const displayName = field?.displayName || kpi.category;
    const colName = `${kpi.category} (${displayName})`;
    const range = getNumericRange(kpi.category);
    const isCurrency = kpi.category === "Revenue";
    columns.push(colName);
    columnTypes[colName] = isCurrency ? "currency" : "integer";
    kpiColumns.push({ name: colName, range, isCurrency });
  }

  // Spend columns
  const spendColumns: { name: string }[] = [];
  for (const sv of model.spendVariables) {
    const colName = `Spend: ${sv.tactic}`;
    columns.push(colName);
    columnTypes[colName] = "currency";
    spendColumns.push({ name: colName });
  }

  // Control variable columns
  for (const cv of model.controlVariables) {
    columns.push(cv.name);
    columnTypes[cv.name] = "decimal";
  }

  // Generate dates
  const dates = generateDates(model.granularity, count);

  // Generate rows
  const rows: (string | number | null)[][] = [];
  for (let i = 0; i < count; i++) {
    const row: (string | number | null)[] = [dates[i]];

    // Dimensions: cycle through pools
    for (const dim of dimColumns) {
      row.push(dim.pool[i % dim.pool.length]);
    }

    // KPIs
    for (const kpi of kpiColumns) {
      if (rng() < 0.05) {
        row.push(null);
      } else {
        const [min, max] = kpi.range;
        const val = min + rng() * (max - min);
        // Add some trend + seasonality
        const trend = 1 + (i / count) * 0.2;
        const seasonal = 1 + 0.15 * Math.sin((2 * Math.PI * i) / (count / 4));
        const adjusted = val * trend * seasonal;
        row.push(kpi.isCurrency ? Math.round(adjusted * 100) / 100 : Math.round(adjusted));
      }
    }

    // Spend
    for (const _sp of spendColumns) {
      if (rng() < 0.05) {
        row.push(null);
      } else {
        const base = 500 + rng() * 9500;
        const trend = 1 + (i / count) * 0.1;
        const seasonal = 1 + 0.1 * Math.sin((2 * Math.PI * i) / (count / 4));
        row.push(Math.round(base * trend * seasonal * 100) / 100);
      }
    }

    // Control variables
    for (const _cv of model.controlVariables) {
      if (rng() < 0.05) {
        row.push(null);
      } else {
        row.push(Math.round(rng() * 100) / 100);
      }
    }

    rows.push(row);
  }

  return { columns, columnTypes, rows };
}

// --- Statistical helpers ---

export function computeStats(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  const n = nums.length;
  if (n === 0) return { count: 0, missing: values.length, mean: 0, std: 0, min: 0, q1: 0, median: 0, q3: 0, max: 0, skewness: 0, kurtosis: 0 };

  const sorted = [...nums].sort((a, b) => a - b);
  const mean = nums.reduce((s, v) => s + v, 0) / n;
  const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const percentile = (p: number) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  let skewness = 0;
  let kurtosis = 0;
  if (std > 0) {
    skewness = nums.reduce((s, v) => s + ((v - mean) / std) ** 3, 0) / n;
    kurtosis = nums.reduce((s, v) => s + ((v - mean) / std) ** 4, 0) / n - 3;
  }

  return {
    count: n,
    missing: values.length - n,
    mean,
    std,
    min: sorted[0],
    q1: percentile(25),
    median: percentile(50),
    q3: percentile(75),
    max: sorted[n - 1],
    skewness,
    kurtosis,
  };
}

export function computeCorrelation(a: (number | null)[], b: (number | null)[]): number {
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== null && b[i] !== null) pairs.push([a[i]!, b[i]!]);
  }
  if (pairs.length < 3) return 0;

  const n = pairs.length;
  const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
  const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;
  let cov = 0, varA = 0, varB = 0;
  for (const [x, y] of pairs) {
    cov += (x - meanA) * (y - meanB);
    varA += (x - meanA) ** 2;
    varB += (y - meanB) ** 2;
  }
  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? 0 : cov / denom;
}

export function computeVIF(dataset: MockDataset, spendColumnIndices: number[]): number[] {
  if (spendColumnIndices.length < 2) return spendColumnIndices.map(() => 1);

  const vifs: number[] = [];
  for (let k = 0; k < spendColumnIndices.length; k++) {
    const yIdx = spendColumnIndices[k];
    const xIdxs = spendColumnIndices.filter((_, i) => i !== k);

    // Get valid rows (no nulls)
    const yVals: number[] = [];
    const xMatrix: number[][] = [];
    for (const row of dataset.rows) {
      const yVal = row[yIdx];
      if (yVal === null) continue;
      const xVals: number[] = [];
      let skip = false;
      for (const xi of xIdxs) {
        if (row[xi] === null) { skip = true; break; }
        xVals.push(row[xi] as number);
      }
      if (skip) continue;
      yVals.push(yVal as number);
      xMatrix.push(xVals);
    }

    if (yVals.length < xIdxs.length + 2) {
      vifs.push(1);
      continue;
    }

    // Simplified R² via multiple correlation
    const meanY = yVals.reduce((s, v) => s + v, 0) / yVals.length;
    const ssTotal = yVals.reduce((s, v) => s + (v - meanY) ** 2, 0);

    // Simple regression approximation using sum of squared correlations
    let rSquaredSum = 0;
    for (const xi of xIdxs) {
      const xCol = dataset.rows.map((r) => r[xi] as number | null);
      const yCol = dataset.rows.map((r) => r[yIdx] as number | null);
      const r = computeCorrelation(xCol, yCol);
      rSquaredSum += r * r;
    }
    const r2 = Math.min(rSquaredSum / xIdxs.length, 0.99);

    if (ssTotal === 0 || r2 >= 1) {
      vifs.push(999);
    } else {
      vifs.push(1 / (1 - r2));
    }
  }

  return vifs;
}

export function computeAutocorrelation(values: (number | null)[], maxLag: number = 14): number[] {
  const nums = values.filter((v): v is number => v !== null);
  const n = nums.length;
  if (n < maxLag + 1) return Array(maxLag + 1).fill(0);

  const mean = nums.reduce((s, v) => s + v, 0) / n;
  const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  if (variance === 0) return Array(maxLag + 1).fill(0);

  const acf: number[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (nums[i] - mean) * (nums[i + lag] - mean);
    }
    acf.push(sum / (n * variance));
  }
  return acf;
}

export function computeADF(values: (number | null)[]): { statistic: number; pValue: number; isStationary: boolean } {
  const nums = values.filter((v): v is number => v !== null);
  const n = nums.length;
  if (n < 10) return { statistic: 0, pValue: 1, isStationary: false };

  // Compute first differences: Δy_t = y_t - y_{t-1}
  const dy: number[] = [];
  const yLag: number[] = [];
  for (let i = 1; i < n; i++) {
    dy.push(nums[i] - nums[i - 1]);
    yLag.push(nums[i - 1]);
  }

  const m = dy.length;
  const meanDy = dy.reduce((s, v) => s + v, 0) / m;
  const meanYLag = yLag.reduce((s, v) => s + v, 0) / m;

  // Regress Δy on y_{t-1}
  let cov = 0, varYLag = 0;
  for (let i = 0; i < m; i++) {
    cov += (yLag[i] - meanYLag) * (dy[i] - meanDy);
    varYLag += (yLag[i] - meanYLag) ** 2;
  }

  if (varYLag === 0) return { statistic: 0, pValue: 1, isStationary: false };

  const beta = cov / varYLag;

  // Compute residual standard error
  const intercept = meanDy - beta * meanYLag;
  let sse = 0;
  for (let i = 0; i < m; i++) {
    const predicted = intercept + beta * yLag[i];
    sse += (dy[i] - predicted) ** 2;
  }
  const se = Math.sqrt(sse / (m - 2));
  const seBeta = se / Math.sqrt(varYLag);

  const tStat = seBeta === 0 ? 0 : beta / seBeta;

  // Approximate p-value using critical values
  // 5% critical value ≈ -2.86 for n>50
  const isStationary = tStat < -2.86;
  const pValue = isStationary ? 0.01 : tStat < -1.95 ? 0.05 : tStat < -1.61 ? 0.1 : 0.5;

  return { statistic: tStat, pValue, isStationary };
}

// Helper to extract a numeric column from dataset
export function getNumericColumn(dataset: MockDataset, colIndex: number): (number | null)[] {
  return dataset.rows.map((row) => {
    const v = row[colIndex];
    return typeof v === "number" ? v : null;
  });
}

// --- New statistical helpers for AI-based EDA ---

export function computeMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    const slice = values.slice(start, end);
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return result;
}

export function computeSeasonalDecomposition(values: number[], period: number): { trend: number[]; seasonal: number[]; residual: number[] } {
  const n = values.length;
  // Trend: centered moving average
  const trend = computeMovingAverage(values, Math.min(period, n));
  // Seasonal: average deviation from trend by position in cycle
  const seasonal: number[] = new Array(n).fill(0);
  const seasonalAvg: number[] = new Array(period).fill(0);
  const seasonalCount: number[] = new Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    const pos = i % period;
    seasonalAvg[pos] += values[i] - trend[i];
    seasonalCount[pos]++;
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = seasonalCount[i] > 0 ? seasonalAvg[i] / seasonalCount[i] : 0;
  }
  for (let i = 0; i < n; i++) {
    seasonal[i] = seasonalAvg[i % period];
  }
  // Residual
  const residual = values.map((v, i) => v - trend[i] - seasonal[i]);
  return { trend, seasonal, residual };
}

export function computePartialAutocorrelation(values: (number | null)[], maxLag: number = 14): number[] {
  const nums = values.filter((v): v is number => v !== null);
  const n = nums.length;
  if (n < maxLag + 1) return Array(maxLag + 1).fill(0);

  const acf = computeAutocorrelation(values, maxLag);
  const pacf: number[] = [1]; // lag 0

  // Durbin-Levinson recursion
  const phi: number[][] = [];
  for (let k = 1; k <= maxLag; k++) {
    phi[k] = new Array(k + 1).fill(0);
    if (k === 1) {
      phi[1][1] = acf[1];
    } else {
      let num = acf[k];
      let den = 1;
      for (let j = 1; j < k; j++) {
        num -= phi[k - 1][j] * acf[k - j];
        den -= phi[k - 1][j] * acf[j];
      }
      phi[k][k] = den !== 0 ? num / den : 0;
      for (let j = 1; j < k; j++) {
        phi[k][j] = phi[k - 1][j] - phi[k][k] * phi[k - 1][k - j];
      }
    }
    pacf.push(phi[k][k]);
  }
  return pacf;
}

export function detectChangePoints(values: number[], threshold: number = 2): number[] {
  const n = values.length;
  if (n < 10) return [];

  // CUSUM-based change point detection
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  if (std === 0) return [];

  const cusum: number[] = [0];
  for (let i = 0; i < n; i++) {
    cusum.push(cusum[i] + (values[i] - mean));
  }

  const changePoints: number[] = [];
  const windowSize = Math.max(5, Math.floor(n / 10));

  for (let i = windowSize; i < n - windowSize; i++) {
    const leftMean = values.slice(i - windowSize, i).reduce((s, v) => s + v, 0) / windowSize;
    const rightMean = values.slice(i, i + windowSize).reduce((s, v) => s + v, 0) / windowSize;
    const diff = Math.abs(rightMean - leftMean) / std;
    if (diff > threshold) {
      // Only add if not too close to a previous change point
      if (changePoints.length === 0 || i - changePoints[changePoints.length - 1] > windowSize) {
        changePoints.push(i);
      }
    }
  }
  return changePoints;
}

export function computeRollingZScore(values: number[], window: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window);
    const slice = values.slice(start, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length);
    result.push(std > 0 ? (values[i] - mean) / std : 0);
  }
  return result;
}

export function computePCA(dataMatrix: number[][], nComponents: number = 2): { eigenvalues: number[]; projections: number[][] } {
  const n = dataMatrix.length;
  const p = dataMatrix[0]?.length ?? 0;
  if (n < 2 || p < 2) return { eigenvalues: [], projections: [] };

  // Center the data
  const means = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) means[j] += dataMatrix[i][j];
    means[j] /= n;
  }
  const centered = dataMatrix.map(row => row.map((v, j) => v - means[j]));

  // Compute covariance matrix
  const cov: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += centered[k][i] * centered[k][j];
      cov[i][j] = cov[j][i] = s / (n - 1);
    }
  }

  // Power iteration for eigenvalues
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  const mat = cov.map(row => [...row]);

  for (let comp = 0; comp < Math.min(nComponents, p); comp++) {
    let vec: number[] = new Array(p).fill(0).map((_, i) => i === comp ? 1 : 0.1);
    let eigenvalue = 0;

    for (let iter = 0; iter < 100; iter++) {
      // Matrix-vector multiply
      const newVec = new Array(p).fill(0);
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) newVec[i] += mat[i][j] * vec[j];
      }
      // Normalize
      const norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
      if (norm === 0) break;
      eigenvalue = norm;
      vec = newVec.map(v => v / norm);
    }

    eigenvalues.push(eigenvalue);
    eigenvectors.push(vec);

    // Deflate matrix
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        mat[i][j] -= eigenvalue * vec[i] * vec[j];
      }
    }
  }

  // Project data onto principal components
  const projections = centered.map(row =>
    eigenvectors.map(ev => ev.reduce((s, v, j) => s + v * row[j], 0))
  );

  return { eigenvalues, projections };
}

export function computeKMeans(dataMatrix: number[][], k: number = 3, maxIter: number = 50): { assignments: number[]; centroids: number[][] } {
  const n = dataMatrix.length;
  const p = dataMatrix[0]?.length ?? 0;
  if (n < k || p === 0) return { assignments: Array(n).fill(0), centroids: [] };

  // Initialize centroids using evenly spaced indices
  const step = Math.floor(n / k);
  let centroids = Array.from({ length: k }, (_, i) => [...dataMatrix[Math.min(i * step, n - 1)]]);

  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newAssignments = dataMatrix.map(row => {
      let minDist = Infinity;
      let bestK = 0;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (let j = 0; j < p; j++) dist += (row[j] - centroids[c][j]) ** 2;
        if (dist < minDist) { minDist = dist; bestK = c; }
      }
      return bestK;
    });

    // Check convergence
    if (newAssignments.every((a, i) => a === assignments[i])) break;
    assignments = newAssignments;

    // Update centroids
    const counts = new Array(k).fill(0);
    const sums = Array.from({ length: k }, () => new Array(p).fill(0));
    for (let i = 0; i < n; i++) {
      counts[assignments[i]]++;
      for (let j = 0; j < p; j++) sums[assignments[i]][j] += dataMatrix[i][j];
    }
    centroids = sums.map((s, c) => s.map(v => counts[c] > 0 ? v / counts[c] : 0));
  }

  return { assignments, centroids };
}

export function computeSaturationCurve(spend: number[], kpi: number[]): { a: number; b: number; r2: number } {
  // Fits y = a * (1 - exp(-b * x)) using iterative least squares
  const n = spend.length;
  if (n < 3) return { a: 0, b: 0, r2: 0 };

  const maxY = Math.max(...kpi);
  const maxX = Math.max(...spend);
  if (maxX === 0 || maxY === 0) return { a: 0, b: 0, r2: 0 };

  let a = maxY * 1.2;
  let b = 2 / maxX;

  // Grid search for best b
  let bestR2 = -Infinity;
  let bestA = a;
  let bestB = b;

  for (let bi = 0.1; bi <= 10; bi += 0.3) {
    const bTest = bi / maxX;
    // Given b, solve for a via least squares
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const f = 1 - Math.exp(-bTest * spend[i]);
      num += kpi[i] * f;
      den += f * f;
    }
    const aTest = den > 0 ? num / den : maxY;

    // Compute R²
    const meanY = kpi.reduce((s, v) => s + v, 0) / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      const pred = aTest * (1 - Math.exp(-bTest * spend[i]));
      ssRes += (kpi[i] - pred) ** 2;
      ssTot += (kpi[i] - meanY) ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    if (r2 > bestR2) { bestR2 = r2; bestA = aTest; bestB = bTest; }
  }

  return { a: bestA, b: bestB, r2: Math.max(0, bestR2) };
}

export function computeAdstockDecay(values: (number | null)[], maxLag: number = 10): { decayRate: number; halfLife: number } {
  const acf = computeAutocorrelation(values, maxLag);
  // Find decay rate from ACF
  let bestDecay = 0.5;
  if (acf.length > 2 && acf[1] > 0) {
    bestDecay = Math.min(0.99, Math.max(0.01, acf[1]));
  }
  const halfLife = bestDecay > 0 && bestDecay < 1 ? -Math.log(2) / Math.log(bestDecay) : 1;
  return { decayRate: bestDecay, halfLife: Math.max(0.5, halfLife) };
}

export function computeFeatureImportance(dataset: MockDataset, targetColIndex: number): { name: string; importance: number }[] {
  const targetVals = getNumericColumn(dataset, targetColIndex);
  const results: { name: string; importance: number }[] = [];

  dataset.columns.forEach((col, ci) => {
    if (ci === targetColIndex) return;
    const type = dataset.columnTypes[col];
    if (type === "date" || type === "string") return;
    const vals = getNumericColumn(dataset, ci);
    const r = Math.abs(computeCorrelation(vals, targetVals));
    results.push({ name: col, importance: r });
  });

  results.sort((a, b) => b.importance - a.importance);
  // Normalize to sum to 1
  const total = results.reduce((s, r) => s + r.importance, 0);
  if (total > 0) {
    for (const r of results) r.importance /= total;
  }
  return results;
}

// Linear regression helper for scatter plots
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let cov = 0, varX = 0, varY = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - meanX) * (y[i] - meanY);
    varX += (x[i] - meanX) ** 2;
    varY += (y[i] - meanY) ** 2;
  }

  const slope = varX === 0 ? 0 : cov / varX;
  const intercept = meanY - slope * meanX;
  const r2 = varX === 0 || varY === 0 ? 0 : (cov * cov) / (varX * varY);

  return { slope, intercept, r2 };
}
