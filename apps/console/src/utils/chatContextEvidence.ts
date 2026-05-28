export interface ChatMemoryEvidence {
  type: "profile" | "recent" | "task" | "skill";
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

export interface ChatContextEvidence {
  memories: ChatMemoryEvidence[];
  knowledge: ChatKnowledgeEvidence[];
  skill: ChatSkillEvidence | null;
}

export function normalizeContextEvidence(value: unknown): ChatContextEvidence {
  const raw = value && typeof value === "object" ? value as any : {};

  const memories = Array.isArray(raw.memories)
    ? raw.memories
        .filter((item: any) => item && typeof item.preview === "string" && item.preview.trim())
        .slice(0, 6)
        .map((item: any) => ({
          type: item.type || "recent",
          label: String(item.label || "记忆"),
          preview: String(item.preview),
        }))
    : [];

  const knowledge = Array.isArray(raw.knowledge)
    ? raw.knowledge
        .filter((item: any) => item && typeof item.path === "string" && item.path.trim())
        .slice(0, 5)
        .map((item: any) => ({
          path: String(item.path),
          label: String(item.label || item.path),
        }))
    : [];

  const skill = raw.skill && typeof raw.skill === "object"
    ? {
        id: String(raw.skill.id || raw.skill.name || "unknown-skill"),
        name: String(raw.skill.name || raw.skill.id || "未知技能"),
        score: typeof raw.skill.score === "number" ? raw.skill.score : undefined,
      }
    : null;

  return { memories, knowledge, skill };
}
