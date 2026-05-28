import assert from "node:assert/strict";
import { buildGraphNeighborhood } from "./graph-neighborhood.js";
import type { KnowledgeGraph } from "./graph.js";

const graph: KnowledgeGraph = {
  nodes: [
    { id: "kb:hci", label: "深信服 HCI", type: "entity", summary: "超融合产品", importance: 80 },
    { id: "memalign:user:mem-1:kb:hci", label: "记忆: 深信服 HCI", type: "insight", summary: "用户做过 HCI 部署", importance: 90 },
    { id: "wiki/network", label: "网络规划", type: "topic", summary: "交换机与网段规划", importance: 70 },
    { id: "tag:infra", label: "infra", type: "tag", importance: 20 },
  ],
  edges: [
    { source: "memalign:user:mem-1:kb:hci", target: "kb:hci", relation: "supports", strength: 5 },
    { source: "kb:hci", target: "wiki/network", relation: "references", strength: 2 },
    { source: "tag:infra", target: "wiki/network", relation: "tagged", strength: 1 },
  ],
  communities: [
    { id: "community-1", label: "HCI", nodes: ["kb:hci", "memalign:user:mem-1:kb:hci", "wiki/network"] },
  ],
};

const neighborhood = buildGraphNeighborhood(graph, "kb:hci", { limit: 10 });

assert.equal(neighborhood.center.id, "kb:hci");
assert.equal(neighborhood.nodes.length, 3);
assert.equal(neighborhood.edges.length, 2);
assert.equal(neighborhood.summary.totalNeighbors, 2);
assert.equal(neighborhood.summary.incoming, 1);
assert.equal(neighborhood.summary.outgoing, 1);
assert.equal(neighborhood.summary.memoryLinks, 1);
assert(neighborhood.explanations.some((item) => item.includes("记忆支持")));

const limited = buildGraphNeighborhood(graph, "kb:hci", { limit: 1 });
assert.equal(limited.nodes.length, 2);
assert.equal(limited.edges.length, 1);

assert.throws(() => buildGraphNeighborhood(graph, "missing"), /Node not found/);

console.log("Knowledge graph neighborhood assertions passed");
