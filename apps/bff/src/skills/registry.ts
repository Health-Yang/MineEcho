import type { AiApp } from "../ai-apps/store.js";
import type { CustomSkill, SkillsState } from "./state.js";

export type SkillRegistrySource = "trigger-index" | "custom" | "ai-app";

export interface SkillTriggerRegistryEntry {
  skillId: string;
  name: string;
  triggers: string[];
}

export interface SkillRegistryEntry {
  id: string;
  name: string;
  description: string;
  source: SkillRegistrySource;
  enabled: boolean;
  triggers: string[];
  category?: string;
  appType?: AiApp["type"];
}

export interface SkillRegistrySnapshot {
  entries: SkillRegistryEntry[];
  generatedAt: number;
}

export interface BuildSkillRegistryInput {
  triggerEntries?: SkillTriggerRegistryEntry[];
  customSkills?: CustomSkill[];
  aiApps?: AiApp[];
  state?: SkillsState;
  now?: number;
}

function normalizeText(value: string | undefined): string {
  return (value || "").trim();
}

function mergeTriggers(existing: string[], next: string[]): string[] {
  const seen = new Set(existing.map((item) => item.toLowerCase()));
  const merged = [...existing];
  for (const item of next) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }
  return merged;
}

function deriveTriggersFromText(...values: Array<string | undefined>): string[] {
  const triggers = new Set<string>();
  const text = values
    .filter(Boolean)
    .join(" ")
    .replace(/[，。！？、,;.!?\s]+/g, " ")
    .replace(/([a-zA-Z])([\u4e00-\u9fa5])/g, "$1 $2")
    .replace(/([\u4e00-\u9fa5])([a-zA-Z])/g, "$1 $2");

  for (const raw of text.split(/\s+/)) {
    const word = raw.trim();
    if (!word) continue;

    if (/[\u4e00-\u9fa5]/.test(word)) {
      if (word.length >= 2 && word.length <= 8) {
        triggers.add(word);
      }
      for (const size of [3, 2]) {
        for (let i = 0; i <= word.length - size; i++) {
          const ngram = word.slice(i, i + size);
          if (new RegExp(`^[\\u4e00-\\u9fa5]{${size}}$`).test(ngram)) {
            triggers.add(ngram);
          }
        }
      }
    } else if (/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,31}$/.test(word)) {
      triggers.add(word);
      if (/^[A-Z0-9_-]+$/.test(word)) {
        triggers.add(word.toLowerCase());
      }
    }
  }

  return Array.from(triggers).slice(0, 40);
}

export function buildSkillRegistry(input: BuildSkillRegistryInput): SkillRegistrySnapshot {
  const byId = new Map<string, SkillRegistryEntry>();
  const state = input.state || {};

  for (const triggerEntry of input.triggerEntries || []) {
    const id = normalizeText(triggerEntry.skillId);
    if (!id) continue;
    byId.set(id, {
      id,
      name: normalizeText(triggerEntry.name) || id,
      description: "",
      source: "trigger-index",
      enabled: state[id] !== false,
      triggers: mergeTriggers([], triggerEntry.triggers || []),
    });
  }

  for (const customSkill of input.customSkills || []) {
    const id = normalizeText(customSkill.id);
    if (!id) continue;
    const existing = byId.get(id);
    byId.set(id, {
      id,
      name: normalizeText(customSkill.name) || existing?.name || id,
      description: normalizeText(customSkill.description) || existing?.description || "",
      source: "custom",
      enabled: customSkill.enabled !== false && state[id] !== false,
      triggers: mergeTriggers(existing?.triggers || [], deriveTriggersFromText(customSkill.name, customSkill.description)),
      category: normalizeText(customSkill.category) || existing?.category,
    });
  }

  for (const app of input.aiApps || []) {
    const id = normalizeText(app.id);
    if (!id) continue;
    const existing = byId.get(id);
    byId.set(id, {
      id,
      name: normalizeText(app.name) || existing?.name || id,
      description: normalizeText(app.description) || existing?.description || "",
      source: "ai-app",
      enabled: app.enabled !== false && state[id] !== false,
      triggers: mergeTriggers(existing?.triggers || [], deriveTriggersFromText(app.name, app.description)),
      category: "AI 应用",
      appType: app.type,
    });
  }

  return {
    entries: Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)),
    generatedAt: input.now || Date.now(),
  };
}
