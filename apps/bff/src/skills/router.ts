import type { SkillRegistryEntry, SkillRegistrySnapshot } from "./registry.js";

export interface SkillRouteEvidence {
  type: "trigger" | "name" | "description" | "mode";
  value: string;
  weight: number;
}

export interface SkillRouteCandidate {
  skillId: string;
  skillName: string;
  source: SkillRegistryEntry["source"];
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

export interface SkillRouteOptions {
  limit?: number;
  mode?: string;
}

const MIN_SCORE = 0.35;

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function tokenize(value: string): string[] {
  const normalized = normalize(value);
  const tokens = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  const cjkRuns = normalized.match(/[\p{Script=Han}]{2,}/gu) || [];
  for (const run of cjkRuns) {
    for (let i = 0; i < run.length - 1; i++) {
      tokens.push(run.slice(i, i + 2));
    }
  }

  return [...new Set(tokens)];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function scoreTrigger(query: string, entry: SkillRegistryEntry, evidence: SkillRouteEvidence[]): number {
  let best = 0;
  for (const trigger of entry.triggers) {
    const normalizedTrigger = normalize(trigger);
    if (!normalizedTrigger) continue;

    let score = 0;
    if (query === normalizedTrigger) score = 1;
    else if (query.startsWith(normalizedTrigger)) score = 0.9;
    else if (query.includes(normalizedTrigger)) score = 0.75 + Math.min(normalizedTrigger.length / 20, 0.15);

    if (score > best) {
      best = clampScore(score);
      evidence.push({ type: "trigger", value: trigger, weight: best });
    }
  }
  return best;
}

function scoreName(query: string, entry: SkillRegistryEntry, evidence: SkillRouteEvidence[]): number {
  const name = normalize(entry.name);
  if (!name) return 0;
  if (query.includes(name)) {
    evidence.push({ type: "name", value: entry.name, weight: 0.65 });
    return 0.65;
  }
  return 0;
}

function scoreDescription(queryTokens: string[], entry: SkillRegistryEntry, evidence: SkillRouteEvidence[]): number {
  const description = normalize(`${entry.description} ${entry.category || ""}`);
  if (!description || queryTokens.length === 0) return 0;

  const matched = queryTokens.filter((token) => description.includes(token));
  if (matched.length === 0) return 0;

  const score = clampScore(Math.min(0.6, matched.length * 0.18));
  evidence.push({ type: "description", value: matched.slice(0, 5).join(", "), weight: score });
  return score;
}

function scoreMode(mode: string | undefined, entry: SkillRegistryEntry, evidence: SkillRouteEvidence[]): number {
  if (!mode) return 0;
  if (mode === "auto" && entry.enabled) {
    evidence.push({ type: "mode", value: "auto", weight: 0.05 });
    return 0.05;
  }
  return 0;
}

export function routeSkillQuery(
  query: string,
  registry: SkillRegistrySnapshot,
  options: SkillRouteOptions = {}
): SkillRouteResult {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return { query, selectedSkillId: null, selectedSkillName: null, candidates: [] };
  }

  const queryTokens = tokenize(query);
  const candidates: SkillRouteCandidate[] = [];

  for (const entry of registry.entries) {
    if (!entry.enabled) continue;

    const evidence: SkillRouteEvidence[] = [];
    const scoreComponents = {
      trigger: scoreTrigger(normalizedQuery, entry, evidence),
      name: scoreName(normalizedQuery, entry, evidence),
      description: scoreDescription(queryTokens, entry, evidence),
      mode: scoreMode(options.mode, entry, evidence),
    };

    const score = clampScore(
      Math.max(
        scoreComponents.trigger * 0.9,
        scoreComponents.name * 0.8,
        scoreComponents.description * 0.75
      ) + scoreComponents.mode
    );

    if (score < MIN_SCORE) continue;

    candidates.push({
      skillId: entry.id,
      skillName: entry.name,
      source: entry.source,
      score,
      scoreComponents,
      evidence: evidence.sort((a, b) => b.weight - a.weight).slice(0, 5),
    });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.skillName.localeCompare(b.skillName);
  });

  const limited = candidates.slice(0, options.limit || 3);
  const selected = limited[0];
  return {
    query,
    selectedSkillId: selected?.skillId || null,
    selectedSkillName: selected?.skillName || null,
    candidates: limited,
  };
}
