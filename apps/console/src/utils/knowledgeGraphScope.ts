export type KnowledgeGraphScope = "focused" | "all";

export const KNOWLEDGE_GRAPH_SCOPE_STORAGE_KEY = "mineecho_knowledge_graph_scope";

export function parseKnowledgeGraphScope(value: unknown): KnowledgeGraphScope {
  return value === "all" ? "all" : "focused";
}

export function loadKnowledgeGraphScope(storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): KnowledgeGraphScope {
  try {
    return parseKnowledgeGraphScope(storage?.getItem(KNOWLEDGE_GRAPH_SCOPE_STORAGE_KEY));
  } catch {
    return "focused";
  }
}

export function saveKnowledgeGraphScope(
  scope: KnowledgeGraphScope,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(KNOWLEDGE_GRAPH_SCOPE_STORAGE_KEY, scope);
  } catch {
    // Ignore storage failures so graph controls still work in restricted browsers.
  }
}
