interface MetricRecord {
  count: number;
  totalMs: number;
  errors: number;
  samples: number[]; // for p50/p95
  lastError?: string;
}

const metrics = new Map<string, MetricRecord>();
const MAX_SAMPLES = 100;

export function recordMetric(name: string, durationMs: number, error?: string) {
  const existing = metrics.get(name) || { count: 0, totalMs: 0, errors: 0, samples: [] };
  existing.count++;
  existing.totalMs += durationMs;
  if (error) {
    existing.errors++;
    existing.lastError = error;
  }
  existing.samples.push(durationMs);
  if (existing.samples.length > MAX_SAMPLES) {
    existing.samples.shift();
  }
  metrics.set(name, existing);
}

export function getMetrics() {
  const result: Record<string, any> = {};
  for (const [name, rec] of metrics) {
    const sorted = [...rec.samples].sort((a, b) => a - b);
    result[name] = {
      count: rec.count,
      avgMs: rec.count > 0 ? Math.round(rec.totalMs / rec.count) : 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      errorRate: rec.count > 0 ? (rec.errors / rec.count).toFixed(4) : "0",
      lastError: rec.lastError,
    };
  }
  return result;
}

export function getMetric(name: string) {
  return metrics.get(name);
}
