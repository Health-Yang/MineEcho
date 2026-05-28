import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

export interface TokenJuiceMetricInput {
  family: string;
  reducer?: string;
  rawChars: number;
  reducedChars: number;
  ratio: number;
  timestamp?: number;
}

interface TokenJuiceMetricRecord extends Required<TokenJuiceMetricInput> {}

export interface TokenJuiceMetricsSnapshot {
  totalRuns: number;
  totalRawChars: number;
  totalReducedChars: number;
  totalSavedChars: number;
  estimatedTokensSaved: number;
  averageRatio: number;
  recent: TokenJuiceMetricRecord[];
  byFamily: Array<{
    family: string;
    runs: number;
    rawChars: number;
    reducedChars: number;
    savedChars: number;
    averageRatio: number;
  }>;
  byReducer: Array<{
    reducer: string;
    runs: number;
    rawChars: number;
    reducedChars: number;
    savedChars: number;
    averageRatio: number;
  }>;
}

const MAX_RECENT_RECORDS = 200;
const CHARS_PER_TOKEN_ESTIMATE = 4;
const DEFAULT_METRICS_FILE = join(getMineEchoHome(), "tokenjuice-metrics.json");
let records: TokenJuiceMetricRecord[] = [];
let persistenceFilePath: string | null = DEFAULT_METRICS_FILE;
let persistenceLoaded = false;

function cleanNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeRecord(input: Partial<TokenJuiceMetricInput>): TokenJuiceMetricRecord {
  const rawChars = cleanNumber(input.rawChars ?? 0);
  const reducedChars = cleanNumber(input.reducedChars ?? 0);
  return {
    family: input.family || "unknown",
    reducer: input.reducer || "unknown",
    rawChars,
    reducedChars,
    ratio: Number.isFinite(input.ratio) ? input.ratio as number : rawChars > 0 ? reducedChars / rawChars : 1,
    timestamp: Number.isFinite(input.timestamp) ? input.timestamp as number : Date.now(),
  };
}

function trimRecords(): void {
  if (records.length > MAX_RECENT_RECORDS) {
    records = records.slice(-MAX_RECENT_RECORDS);
  }
}

function persistTokenJuiceMetrics(): void {
  if (!persistenceFilePath) return;
  try {
    mkdirSync(dirname(persistenceFilePath), { recursive: true });
    writeFileSync(
      persistenceFilePath,
      JSON.stringify({ version: 1, records }, null, 2),
      "utf8"
    );
  } catch {
    // Metrics must never break the primary TokenJuice flow.
  }
}

export function configureTokenJuiceMetricsPersistence(options: { filePath: string | null }): void {
  persistenceFilePath = options.filePath;
  persistenceLoaded = false;
}

export function loadTokenJuiceMetrics(): void {
  if (!persistenceFilePath || persistenceLoaded) return;
  persistenceLoaded = true;
  try {
    if (!existsSync(persistenceFilePath)) return;
    const raw = readFileSync(persistenceFilePath, "utf8");
    const parsed = JSON.parse(raw) as { records?: Array<Partial<TokenJuiceMetricInput>> };
    records = Array.isArray(parsed.records) ? parsed.records.map(normalizeRecord) : [];
    trimRecords();
  } catch {
    records = [];
  }
}

export function recordTokenJuiceMetric(input: TokenJuiceMetricInput): void {
  loadTokenJuiceMetrics();
  records.push(normalizeRecord(input));
  trimRecords();
  persistTokenJuiceMetrics();
}

function summarizeBy(key: "family" | "reducer") {
  const grouped = new Map<string, { runs: number; rawChars: number; reducedChars: number }>();
  for (const record of records) {
    const groupKey = record[key];
    const current = grouped.get(groupKey) || { runs: 0, rawChars: 0, reducedChars: 0 };
    current.runs += 1;
    current.rawChars += record.rawChars;
    current.reducedChars += record.reducedChars;
    grouped.set(groupKey, current);
  }

  return [...grouped.entries()]
    .map(([name, item]) => ({
      [key]: name,
      runs: item.runs,
      rawChars: item.rawChars,
      reducedChars: item.reducedChars,
      savedChars: Math.max(0, item.rawChars - item.reducedChars),
      averageRatio: item.rawChars > 0 ? item.reducedChars / item.rawChars : 1,
    }))
    .sort((a, b) => b.savedChars - a.savedChars || b.runs - a.runs);
}

export function getTokenJuiceMetrics(): TokenJuiceMetricsSnapshot {
  loadTokenJuiceMetrics();
  const totalRawChars = records.reduce((sum, record) => sum + record.rawChars, 0);
  const totalReducedChars = records.reduce((sum, record) => sum + record.reducedChars, 0);
  const totalSavedChars = Math.max(0, totalRawChars - totalReducedChars);

  return {
    totalRuns: records.length,
    totalRawChars,
    totalReducedChars,
    totalSavedChars,
    estimatedTokensSaved: Math.round(totalSavedChars / CHARS_PER_TOKEN_ESTIMATE),
    averageRatio: totalRawChars > 0 ? totalReducedChars / totalRawChars : 1,
    recent: records.slice(-20).reverse(),
    byFamily: summarizeBy("family") as TokenJuiceMetricsSnapshot["byFamily"],
    byReducer: summarizeBy("reducer") as TokenJuiceMetricsSnapshot["byReducer"],
  };
}

export function clearTokenJuiceMetrics(options: { persist?: boolean } = {}): void {
  records = [];
  if (options.persist !== false) {
    persistTokenJuiceMetrics();
  } else {
    persistenceLoaded = false;
  }
}
