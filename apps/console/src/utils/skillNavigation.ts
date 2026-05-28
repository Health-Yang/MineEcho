export function buildSkillFocusPath(skillId: string): string {
  return `/skills?focusSkill=${encodeURIComponent(skillId)}`;
}
