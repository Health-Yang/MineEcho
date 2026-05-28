import type { SkillRouteEvidence } from "./router.js";
import { routeSkillQuery } from "./router.js";
import type { SkillRegistryEntry } from "./registry.js";

export type SkillHealthStatus = "pass" | "warn" | "fail";

export interface SkillHealthCheck {
  status: SkillHealthStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface SkillHealthReport {
  skillId: string;
  name: string;
  enabled: boolean;
  source: SkillRegistryEntry["source"];
  checks: {
    metadata: SkillHealthCheck;
    triggers: SkillHealthCheck;
    executable: SkillHealthCheck;
    routing: SkillHealthCheck;
  };
  triggerCount: number;
  routeScore?: number;
  routeEvidence?: SkillRouteEvidence[];
}

export interface BuildSkillHealthReportInput {
  entry: SkillRegistryEntry;
  extensionSkillRootPath?: string;
  skillMarkdownPath?: string;
  executablePath?: string;
  routeQuery?: string;
}

export interface SkillHealthSourceInfo {
  id: string;
  name: string;
  description?: string;
  source?: string;
  enabled?: boolean;
  triggers?: string[];
  category?: string;
}

function deriveHealthTriggers(...values: Array<string | undefined>): string[] {
  const triggers = new Set<string>();
  for (const value of values) {
    const text = (value || "").trim();
    if (!text) continue;
    if (text.length <= 32) triggers.add(text);
    const normalized = text
      .replace(/[，。！？、,;.!?\s]+/g, " ")
      .replace(/([a-zA-Z])([\u4e00-\u9fa5])/g, "$1 $2")
      .replace(/([\u4e00-\u9fa5])([a-zA-Z])/g, "$1 $2");
    for (const raw of normalized.split(/\s+/)) {
      const word = raw.trim();
      if (!word) continue;
      if (/[\u4e00-\u9fa5]/.test(word) && word.length >= 2 && word.length <= 8) triggers.add(word);
      else if (/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,31}$/.test(word)) triggers.add(word);
    }
  }
  return Array.from(triggers).slice(0, 40);
}

export function buildSkillHealthEntryFromInfo(info: SkillHealthSourceInfo): SkillRegistryEntry {
  const id = info.id.trim();
  const name = info.name.trim() || id;
  const description = (info.description || "").trim();
  const source: SkillRegistryEntry["source"] = info.source === "ai-app"
    ? "ai-app"
    : info.source === "custom" || info.source === "mineecho-extension"
      ? "custom"
      : "trigger-index";
  return {
    id,
    name,
    description,
    source,
    enabled: info.enabled !== false,
    triggers: info.triggers?.length ? info.triggers : deriveHealthTriggers(name, description),
    category: info.category,
  };
}

function buildMetadataCheck(entry: SkillRegistryEntry, skillMarkdownPath?: string): SkillHealthCheck {
  const missing: string[] = [];
  if (!entry.id.trim()) missing.push("id");
  if (!entry.name.trim()) missing.push("name");
  if (!entry.source) missing.push("source");

  if (missing.length > 0) {
    return {
      status: "fail",
      message: `Skill metadata is missing: ${missing.join(", ")}`,
      details: { missing },
    };
  }

  return {
    status: entry.description.trim() ? "pass" : "warn",
    message: entry.description.trim()
      ? "Skill metadata is complete enough for display."
      : "Skill metadata is missing a description.",
    details: {
      hasDescription: Boolean(entry.description.trim()),
      skillMarkdownPath,
    },
  };
}

function buildTriggersCheck(entry: SkillRegistryEntry): SkillHealthCheck {
  if (entry.triggers.length === 0) {
    return {
      status: "warn",
      message: "No triggers are registered; routing can only rely on name or description.",
      details: { triggers: [] },
    };
  }

  return {
    status: "pass",
    message: `${entry.triggers.length} trigger(s) are registered.`,
    details: { triggers: entry.triggers },
  };
}

function buildExecutableCheck(input: BuildSkillHealthReportInput): SkillHealthCheck {
  if (input.executablePath) {
    return {
      status: "pass",
      message: "Executable entrypoint was found.",
      details: {
        extensionSkillRootPath: input.extensionSkillRootPath,
        executablePath: input.executablePath,
      },
    };
  }

  return {
    status: "warn",
    message: "No scripts/call.js executable was found for this skill.",
    details: {
      extensionSkillRootPath: input.extensionSkillRootPath,
      expected: input.extensionSkillRootPath ? `${input.extensionSkillRootPath}/scripts/call.js` : undefined,
    },
  };
}

function buildRoutingCheck(
  entry: SkillRegistryEntry,
  routeQuery: string | undefined
): { check: SkillHealthCheck; routeScore?: number; routeEvidence?: SkillRouteEvidence[] } {
  if (!entry.enabled) {
    return {
      check: {
        status: "fail",
        message: "Skill is disabled and will not be selected by automatic routing.",
      },
    };
  }

  const query = routeQuery?.trim();
  if (!query) {
    return {
      check: {
        status: "warn",
        message: "No route query was provided; routing match was not evaluated.",
      },
    };
  }

  const route = routeSkillQuery(query, { entries: [entry], generatedAt: Date.now() }, { limit: 1, mode: "auto" });
  const candidate = route.candidates.find((item) => item.skillId === entry.id);
  if (!candidate || route.selectedSkillId !== entry.id) {
    return {
      check: {
        status: "fail",
        message: "Route query did not select this skill.",
        details: { query, selectedSkillId: route.selectedSkillId },
      },
    };
  }

  return {
    check: {
      status: "pass",
      message: "Route query selects this skill.",
      details: { query, selectedSkillId: route.selectedSkillId },
    },
    routeScore: candidate.score,
    routeEvidence: candidate.evidence,
  };
}

export function buildSkillHealthReport(input: BuildSkillHealthReportInput): SkillHealthReport {
  const { entry } = input;
  const routing = buildRoutingCheck(entry, input.routeQuery);

  return {
    skillId: entry.id,
    name: entry.name,
    enabled: entry.enabled,
    source: entry.source,
    checks: {
      metadata: buildMetadataCheck(entry, input.skillMarkdownPath),
      triggers: buildTriggersCheck(entry),
      executable: buildExecutableCheck(input),
      routing: routing.check,
    },
    triggerCount: entry.triggers.length,
    routeScore: routing.routeScore,
    routeEvidence: routing.routeEvidence,
  };
}
