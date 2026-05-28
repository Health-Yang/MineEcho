import assert from "node:assert/strict";
import { getKnowledgeGraphPerformanceMode } from "./knowledgeGraphPerformance";

assert.deepEqual(getKnowledgeGraphPerformanceMode({ nodes: 25, edges: 40 }), {
  large: false,
  dense: false,
  hideLabelsOnMove: false,
  softenEdgesOnMove: false,
  renderBudget: {
    labelVisibility: "always",
    edgeOpacityOnMove: 0.5,
    layoutQuality: "full",
    maxRenderedNodes: 500,
  },
});

assert.equal(getKnowledgeGraphPerformanceMode({ nodes: 90, edges: 80 }).large, true);
assert.equal(getKnowledgeGraphPerformanceMode({ nodes: 40, edges: 180 }).dense, true);

const heavy = getKnowledgeGraphPerformanceMode({ nodes: 120, edges: 220 });
assert.equal(heavy.hideLabelsOnMove, true);
assert.equal(heavy.softenEdgesOnMove, true);
assert.deepEqual(heavy.renderBudget, {
  labelVisibility: "interaction-hidden",
  edgeOpacityOnMove: 0.08,
  layoutQuality: "balanced",
  maxRenderedNodes: 420,
});

const veryHeavy = getKnowledgeGraphPerformanceMode({ nodes: 900, edges: 2400 });
assert.deepEqual(veryHeavy.renderBudget, {
  labelVisibility: "interaction-hidden",
  edgeOpacityOnMove: 0.05,
  layoutQuality: "fast",
  maxRenderedNodes: 320,
});

console.log("Knowledge graph performance assertions passed");
