import type { AiApp } from "./store.js";

export function findEnabledAiAppForSkill(apps: AiApp[], skillId: string | undefined): AiApp | null {
  const id = skillId?.trim();
  if (!id) return null;
  return apps.find((app) => app.id === id && app.enabled !== false) || null;
}
