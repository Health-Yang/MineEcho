import { apiFetch } from "./api";

export type SkillHealthCheckStatus = "pass" | "warn" | "fail";

export interface SkillHealthRouteEvidence {
  type: string;
  value: string;
  weight?: number;
}

export interface SkillHealthCheck {
  status: SkillHealthCheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface SkillHealthReport {
  skillId: string;
  name: string;
  enabled: boolean;
  source: string;
  checks: {
    metadata: SkillHealthCheck;
    triggers: SkillHealthCheck;
    executable: SkillHealthCheck;
    routing: SkillHealthCheck;
  };
  triggerCount: number;
  routeScore?: number;
  routeEvidence?: SkillHealthRouteEvidence[];
}

export interface SkillHealthSummary {
  status: SkillHealthCheckStatus;
  label: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  totalCount: number;
}

interface FetchSkillHealthOptions {
  query?: string;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export function summarizeSkillHealth(report: SkillHealthReport): SkillHealthSummary {
  const checks = Object.values(report.checks);
  const passCount = checks.filter((item) => item.status === "pass").length;
  const warnCount = checks.filter((item) => item.status === "warn").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const status: SkillHealthCheckStatus = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";

  return {
    status,
    label: status === "pass" ? "健康" : status === "warn" ? "需关注" : "异常",
    passCount,
    warnCount,
    failCount,
    totalCount: checks.length,
  };
}

export async function fetchSkillHealth(
  skillId: string,
  options: FetchSkillHealthOptions = {}
): Promise<SkillHealthReport> {
  const fetcher = options.fetcher || apiFetch;
  const params = new URLSearchParams();
  if (options.query) params.set("query", options.query);

  const queryString = params.toString();
  const url = `/api/skills/${encodeURIComponent(skillId)}/health${queryString ? `?${queryString}` : ""}`;
  const response = await fetcher(url);
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.code !== 0) {
    throw new Error(result?.message || `Skill health request failed (${response.status})`);
  }

  if (!result?.data) {
    throw new Error("Skill health response missing data");
  }

  return result.data as SkillHealthReport;
}
