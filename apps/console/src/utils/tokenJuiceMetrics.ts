import { apiFetch } from "./api";

export interface TokenLessMetrics {
  totalRuns: number;
  totalRawChars: number;
  totalReducedChars: number;
  totalSavedChars: number;
  estimatedTokensSaved: number;
  averageRatio: number;
  recent: Array<{
    family: string;
    reducer: string;
    rawChars: number;
    reducedChars: number;
    ratio: number;
    timestamp: number;
  }>;
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

interface FetchTokenLessMetricsOptions {
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchTokenLessMetrics(
  options: FetchTokenLessMetricsOptions = {}
): Promise<TokenLessMetrics> {
  const fetcher = options.fetcher || apiFetch;
  const response = await fetcher("/api/metrics/tokenjuice");
  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "TokenLess 指标读取失败");
  }
  return result.data as TokenLessMetrics;
}
