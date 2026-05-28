import { apiFetch } from "./api";

export type SkillRouteEvidenceType = "trigger" | "name" | "description" | "mode";

export interface SkillRouteEvidence {
  type: SkillRouteEvidenceType;
  value: string;
  weight: number;
}

export interface SkillRouteCandidate {
  skillId: string;
  skillName: string;
  source: "trigger-index" | "custom" | "ai-app";
  score: number;
  scoreComponents: {
    trigger: number;
    name: number;
    description: number;
    mode: number;
  };
  evidence: SkillRouteEvidence[];
}

export interface SkillRouteResult {
  query: string;
  selectedSkillId: string | null;
  selectedSkillName: string | null;
  candidates: SkillRouteCandidate[];
}

interface FetchSkillRouteOptions {
  mode?: string;
  limit?: number;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchSkillRoute(
  query: string,
  options: FetchSkillRouteOptions = {}
): Promise<SkillRouteResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const fetcher = options.fetcher || apiFetch;
  const response = await fetcher("/api/skills/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: trimmed,
      mode: options.mode,
      limit: options.limit ?? 3,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.route ?? null;
}
