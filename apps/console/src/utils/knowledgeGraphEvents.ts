export const KNOWLEDGE_GRAPH_REFRESH_EVENT = "mineecho:knowledge-graph-refresh";

export interface KnowledgeGraphRefreshDetail {
  reason: "memory-alignment" | "manual" | "file-change";
}

export function createKnowledgeGraphRefreshEvent(reason: KnowledgeGraphRefreshDetail["reason"]): CustomEvent<KnowledgeGraphRefreshDetail> {
  return new CustomEvent<KnowledgeGraphRefreshDetail>(KNOWLEDGE_GRAPH_REFRESH_EVENT, {
    detail: { reason },
  });
}
