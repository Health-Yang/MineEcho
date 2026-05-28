import assert from "node:assert/strict";
import { buildMeetingStats, formatMeetingDuration, getMeetingDisplayDuration } from "./meetingStats";
import type { Meeting } from "../types/meeting";

const meetings: Meeting[] = [
  {
    id: "m1",
    title: "周会",
    participants: null,
    location: null,
    startedAt: 1000,
    endedAt: 61000,
    durationSec: null,
    audioPath: null,
    status: "completed",
    transcript: null,
    cleanedTranscript: null,
    summary: null,
    createdAt: 1000,
  },
  {
    id: "m2",
    title: "评审",
    participants: null,
    location: null,
    startedAt: 2000,
    endedAt: null,
    durationSec: 3661,
    audioPath: null,
    status: "summarizing",
    transcript: null,
    cleanedTranscript: null,
    summary: null,
    createdAt: 2000,
  },
];

assert.equal(formatMeetingDuration(61), "1:01");
assert.equal(formatMeetingDuration(3661), "1:01:01");
assert.equal(getMeetingDisplayDuration(meetings[0]), 60);
assert.equal(getMeetingDisplayDuration(meetings[1]), 3661);
assert.equal(getMeetingDisplayDuration(meetings[0], {
  isRecording: true,
  selectedMeetingId: "m1",
  recordingSeconds: 42,
}), 42);

const stats = buildMeetingStats(meetings);
assert.deepEqual(stats, {
  total: 2,
  completed: 1,
  processing: 1,
  totalDuration: 3721,
});

console.log("Meeting stats assertions passed");
