import assert from "node:assert/strict";
import { buildMeetingMemoryContent } from "./memory-persist.js";
import type { Commitment, Meeting } from "./db.js";

const meeting: Meeting = {
  id: "meeting-1",
  title: "HCI 方案评审",
  participants: "张三, 李四",
  location: "线上会议",
  startedAt: 1770000000000,
  endedAt: 1770003600000,
  durationSec: 3600,
  audioPath: null,
  transcript: "原始转录内容",
  cleanedTranscript: "整理后的转录内容，讨论了 HCI 超融合部署、节点规划和网络配置。",
  summary: "会议决定先完成 HCI 节点规划，再推进网络配置清单。",
  status: "completed",
  createdAt: 1770000000000,
};

const commitments: Commitment[] = [
  {
    id: "commitment-1",
    meetingId: "meeting-1",
    who: "张三",
    what: "完成 HCI 节点规划",
    deadline: "2026-06-01",
    confidence: 0.92,
    status: "pending",
    createdAt: 1770000100000,
  },
];

const content = buildMeetingMemoryContent(meeting, {
  reason: "summary",
  summary: meeting.summary,
  commitments,
});

assert(content.includes("会议: HCI 方案评审"));
assert(content.includes("参与人: 张三, 李四"));
assert(content.includes("地点: 线上会议"));
assert(content.includes("摘要:\n会议决定先完成 HCI 节点规划"));
assert(content.includes("转录:\n整理后的转录内容"));
assert(content.includes("- 张三: 完成 HCI 节点规划 截止 2026-06-01 置信度 0.92"));

const longTranscriptContent = buildMeetingMemoryContent(
  { ...meeting, cleanedTranscript: "A".repeat(9000), summary: null },
  { reason: "transcript" }
);

assert(longTranscriptContent.length < 7600);
assert(longTranscriptContent.includes("...[已截断]"));

console.log("Meeting memory persistence assertions passed");
