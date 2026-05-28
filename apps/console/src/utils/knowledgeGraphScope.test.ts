import assert from "node:assert/strict";
import {
  KNOWLEDGE_GRAPH_SCOPE_STORAGE_KEY,
  loadKnowledgeGraphScope,
  parseKnowledgeGraphScope,
  saveKnowledgeGraphScope,
} from "./knowledgeGraphScope";

assert.equal(parseKnowledgeGraphScope("all"), "all");
assert.equal(parseKnowledgeGraphScope("focused"), "focused");
assert.equal(parseKnowledgeGraphScope("invalid"), "focused");
assert.equal(parseKnowledgeGraphScope(null), "focused");

const saved = new Map<string, string>();
const storage = {
  getItem: (key: string) => saved.get(key) ?? null,
  setItem: (key: string, value: string) => saved.set(key, value),
};

assert.equal(loadKnowledgeGraphScope(storage), "focused");
saveKnowledgeGraphScope("all", storage);
assert.equal(saved.get(KNOWLEDGE_GRAPH_SCOPE_STORAGE_KEY), "all");
assert.equal(loadKnowledgeGraphScope(storage), "all");

console.log("Knowledge graph scope assertions passed");
