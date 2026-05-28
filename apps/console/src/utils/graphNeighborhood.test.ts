import assert from "node:assert/strict";
import { fetchGraphNeighborhood } from "./graphNeighborhood";

const calls: Array<{ url: string; init?: RequestInit }> = [];
const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => ({
      code: 0,
      message: "success",
      data: {
        center: { id: "kb:hci", label: "深信服 HCI", type: "entity" },
        nodes: [
          { id: "kb:hci", label: "深信服 HCI", type: "entity" },
          { id: "memalign:user:mem-1:kb:hci", label: "记忆: 深信服 HCI", type: "insight" },
        ],
        edges: [
          { source: "memalign:user:mem-1:kb:hci", target: "kb:hci", relation: "supports", strength: 5 },
        ],
        explanations: ["记忆支持: 记忆: 深信服 HCI 指向该节点"],
        summary: {
          totalNeighbors: 1,
          incoming: 1,
          outgoing: 0,
          memoryLinks: 1,
          topRelation: "supports",
        },
      },
    }),
  } as Response;
};

const result = await fetchGraphNeighborhood({ nodeId: "kb:hci", limit: 8, fetcher });

assert.equal(result.center.id, "kb:hci");
assert.equal(result.summary.memoryLinks, 1);
assert.equal(calls[0].url, "/api/knowledge-base/graph-neighborhood?nodeId=kb%3Ahci&limit=8");

console.log("Graph neighborhood API assertions passed");
