import assert from "node:assert/strict";
import { normalizeMemoryTimeline } from "./memoryTimeline";

const timeline = normalizeMemoryTimeline({
  nodes: [
    {
      id: "group-l0",
      level: "L0",
      title: "L0 原始记忆",
      summary: "实时写入",
      content: "group",
      source: "memory-tree",
      sourceType: "level-group",
      tags: ["l0"],
      createdAt: 1770000000000,
      updatedAt: 1770000000000,
      children: [
        {
          id: "l0-hci",
          level: "L0",
          title: "HCI 部署",
          summary: "用户讨论 HCI 部署",
          content: "用户讨论 HCI 部署",
          source: "session-a",
          sourceType: "interaction",
          tags: ["conversation"],
          createdAt: 1770000000000,
          updatedAt: 1770000000000,
          tokenCount: 20,
        },
        {
          id: "l0-meeting",
          level: "L0",
          title: "HCI 评审会议",
          summary: "会议讨论了 HCI 节点规划",
          content: "会议讨论了 HCI 节点规划",
          source: "meeting-a",
          sourceType: "meeting",
          tags: ["meeting"],
          createdAt: 1770000010000,
          updatedAt: 1770000010000,
          tokenCount: 18,
        },
      ],
    },
  ],
  stats: {
    totalMemories: 1,
    lastUpdated: 1770000000000,
    totalTokens: 20,
    levels: { l0: 1, l1: 0, l2: 0, l3: 0 },
  },
});

assert.equal(timeline.nodes.length, 1);
assert.equal(timeline.nodes[0].children?.[0].title, "HCI 部署");
assert.equal(timeline.nodes[0].children?.[0].sourceLabel, "对话记忆");
assert.equal(timeline.nodes[0].children?.[1].sourceLabel, "会议记忆");
assert.equal(timeline.stats.totalMemories, 1);
assert.equal(timeline.stats.levels.l0, 1);

const empty = normalizeMemoryTimeline(null);
assert.equal(empty.nodes.length, 0);
assert.equal(empty.stats.totalMemories, 0);

console.log("Memory timeline UI assertions passed");
