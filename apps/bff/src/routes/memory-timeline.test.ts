import assert from "node:assert/strict";
import { buildMemoryTimelineResponse } from "./memory-timeline.js";
import type { L0Chunk, MemoryItem } from "../memory/memory-tree/types.js";

const chunks: L0Chunk[] = [
  {
    id: "l0-hci",
    userId: "u1",
    source: "conversation",
    content: "用户: 我最近在研究 HCI 超融合部署方案\n\nAI: 可以先梳理节点和网络规划。",
    tokenCount: 32,
    createdAt: 1770000000000,
    entityTags: ["HCI"],
    importance: 0.8,
    sourceRef: { type: "conversation", id: "session-a" },
  },
  {
    id: "l0-meeting",
    userId: "u1",
    source: "meeting",
    content: "会议: HCI 方案评审\n\n摘要:\n完成节点规划和网络配置讨论。",
    tokenCount: 24,
    createdAt: 1770000050000,
    entityTags: ["HCI"],
    importance: 0.9,
    sourceRef: { type: "meeting", id: "meeting-a" },
  },
];

const items: MemoryItem[] = [
  {
    id: "l1-2026-05-27",
    userId: "u1",
    level: 1,
    source: "conversation",
    content: "今天集中讨论 HCI 超融合部署方案，重点是节点规划和网络配置。",
    tokenCount: 28,
    createdAt: 1770000100000,
    dateKey: "2026-05-27",
    importance: 0.6,
    childCount: 1,
  },
];

const timeline = buildMemoryTimelineResponse({ chunks, items, lastUpdated: 1770000200000 });

assert.equal(timeline.stats.totalMemories, 3);
assert.equal(timeline.stats.levels.l0, 2);
assert.equal(timeline.stats.levels.l1, 1);
assert.equal(timeline.nodes.length, 2);

const l0Group = timeline.nodes.find((node) => node.level === "L0");
assert(l0Group);
assert.equal(l0Group.children?.[0].sourceType, "interaction");
assert.equal(l0Group.children?.[0].source, "session-a");
assert(l0Group.children?.[0].title.includes("HCI"));

const meetingNode = l0Group.children?.find((node) => node.id === "l0-meeting");
assert(meetingNode);
assert.equal(meetingNode.sourceType, "meeting");
assert.equal(meetingNode.sourceLabel, "会议记忆");
assert.equal(meetingNode.source, "meeting-a");
assert(meetingNode.title.includes("HCI 方案评审"));

const l1Group = timeline.nodes.find((node) => node.level === "L1");
assert(l1Group);
assert.equal(l1Group.children?.[0].title, "日摘要 2026-05-27");
assert(l1Group.children?.[0].summary.includes("HCI"));

console.log("Memory timeline assertions passed");
