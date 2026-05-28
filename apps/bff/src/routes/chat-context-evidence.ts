import { basename } from "node:path";

export interface ChatMemoryEvidence {
  type: "profile" | "recent" | "task" | "skill" | "tree";
  label: string;
  preview: string;
}

export interface ChatKnowledgeEvidence {
  path: string;
  label: string;
}

export interface ChatSkillEvidence {
  id: string;
  name: string;
  score?: number;
}

export function buildMemoryEvidence(memoryContext: any): ChatMemoryEvidence[] {
  const evidence: ChatMemoryEvidence[] = [];

  if (memoryContext?.userProfile) {
    const profile = memoryContext.userProfile;
    const details = [
      profile.workStyle,
      Array.isArray(profile.technicalStack) && profile.technicalStack.length > 0
        ? `技术栈：${profile.technicalStack.slice(0, 4).join("、")}`
        : "",
      Array.isArray(profile.domainExpertise) && profile.domainExpertise.length > 0
        ? `领域：${profile.domainExpertise.slice(0, 4).join("、")}`
        : "",
    ].filter(Boolean);
    evidence.push({
      type: "profile",
      label: "用户画像",
      preview: details.join("；").slice(0, 140),
    });
  }

  for (const item of (memoryContext?.recentInteractions || []).slice(0, 3)) {
    evidence.push({
      type: "recent",
      label: "近期记忆",
      preview: String(item.content || "").slice(0, 140),
    });
  }

  for (const task of (memoryContext?.pendingTasks || []).slice(0, 2)) {
    evidence.push({
      type: "task",
      label: "待办任务",
      preview: `${task.title || ""}${task.priority ? `（${task.priority}）` : ""}`.slice(0, 140),
    });
  }

  for (const skill of (memoryContext?.skillPatterns || []).slice(0, 2)) {
    evidence.push({
      type: "skill",
      label: "常用技能",
      preview: `${skill.skillId || ""}${skill.usageCount ? `，使用 ${skill.usageCount} 次` : ""}`.slice(0, 140),
    });
  }

  for (const item of (memoryContext?.relevantTreeMemories || []).slice(0, 3)) {
    evidence.push({
      type: "tree",
      label: "相关旧记忆",
      preview: `${item.label ? `${item.label}：` : ""}${String(item.content || "")}`.slice(0, 140),
    });
  }

  return evidence.filter((item) => item.preview.trim().length > 0).slice(0, 6);
}

export function buildKnowledgeEvidence(results: Array<{ metadata?: any }>): ChatKnowledgeEvidence[] {
  const seen = new Set<string>();
  const evidence: ChatKnowledgeEvidence[] = [];

  for (const result of results) {
    const metadata = result.metadata || {};
    const path = String(metadata.filePath || metadata.path || "").trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    evidence.push({
      path,
      label: String(metadata.title || basename(path)).trim() || path,
    });
  }

  return evidence.slice(0, 5);
}

export function buildSkillEvidence(input: {
  skillId?: string | null;
  skillName?: string | null;
  score?: number;
}): ChatSkillEvidence | null {
  if (!input.skillId && !input.skillName) return null;
  return {
    id: input.skillId || input.skillName || "unknown-skill",
    name: input.skillName || input.skillId || "未知技能",
    score: input.score,
  };
}
