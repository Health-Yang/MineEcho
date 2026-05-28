import type { SkillRouteResult } from "./skillRoute";

export interface PreferredSkillPayload {
  skillId: string;
  skillName?: string | null;
}

export function buildPreferredSkillPayload(route: SkillRouteResult | null): PreferredSkillPayload | undefined {
  if (!route?.selectedSkillId) return undefined;

  return {
    skillId: route.selectedSkillId,
    skillName: route.selectedSkillName,
  };
}
