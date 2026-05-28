import assert from "node:assert/strict";
import { KNOWLEDGE_GRAPH_REFRESH_EVENT, createKnowledgeGraphRefreshEvent } from "./knowledgeGraphEvents";

const event = createKnowledgeGraphRefreshEvent("memory-alignment");

assert.equal(KNOWLEDGE_GRAPH_REFRESH_EVENT, "mineecho:knowledge-graph-refresh");
assert.equal(event.type, KNOWLEDGE_GRAPH_REFRESH_EVENT);
assert.equal(event.detail.reason, "memory-alignment");

console.log("Knowledge graph event assertions passed");
