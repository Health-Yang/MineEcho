import type { Commitment, Meeting } from "./db.js";
import { storeToMemoryTree } from "../memory/memory-tree-service.js";
import { logger } from "../utils/logger.js";

const MAX_TRANSCRIPT_CHARS = 4200;

export interface MeetingMemoryPayload {
  reason: "transcript" | "summary" | "commitments" | "completed";
  summary?: string | null;
  transcript?: string | null;
  commitments?: Commitment[];
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return "未记录";
  return new Date(timestamp).toISOString();
}

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...[已截断]`;
}

function formatCommitments(commitments: Commitment[] = []): string {
  if (commitments.length === 0) return "";
  return commitments
    .map((item) => {
      const who = item.who || "待定";
      const deadline = item.deadline || "未定";
      return `- ${who}: ${item.what} 截止 ${deadline} 置信度 ${item.confidence}`;
    })
    .join("\n");
}

export function buildMeetingMemoryContent(
  meeting: Meeting,
  payload: MeetingMemoryPayload = { reason: "completed" }
): string {
  const summary = payload.summary ?? meeting.summary;
  const transcript = payload.transcript ?? meeting.cleanedTranscript ?? meeting.transcript;
  const commitments = payload.commitments ?? [];

  const sections = [
    `会议: ${meeting.title || meeting.id}`,
    `时间: ${formatTime(meeting.startedAt)} - ${formatTime(meeting.endedAt)}`,
  ];

  if (meeting.participants) sections.push(`参与人: ${meeting.participants}`);
  if (meeting.location) sections.push(`地点: ${meeting.location}`);
  sections.push(`来源: meeting/${meeting.id}`);
  sections.push(`沉淀类型: ${payload.reason}`);

  if (summary?.trim()) {
    sections.push(`摘要:\n${summary.trim()}`);
  }

  if (transcript?.trim()) {
    sections.push(`转录:\n${truncate(transcript.trim(), MAX_TRANSCRIPT_CHARS)}`);
  }

  const commitmentText = formatCommitments(commitments);
  if (commitmentText) {
    sections.push(`承诺项:\n${commitmentText}`);
  }

  return sections.join("\n\n");
}

export function persistMeetingMemory(
  userId: string,
  meeting: Meeting,
  payload: MeetingMemoryPayload = { reason: "completed" }
): void {
  const content = buildMeetingMemoryContent(meeting, payload);

  Promise.resolve().then(async () => {
    await storeToMemoryTree(userId, "meeting", content, {
      sessionId: meeting.id,
      interactionType: `meeting_${payload.reason}`,
    });
    logger.info("[MeetingMemory] Persisted meeting memory", {
      userId,
      meetingId: meeting.id,
      reason: payload.reason,
    });
  }).catch((error) => {
    logger.warn("[MeetingMemory] Failed to persist meeting memory", {
      userId,
      meetingId: meeting.id,
      reason: payload.reason,
      error: (error as Error).message,
    });
  });
}
