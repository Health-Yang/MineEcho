import type { Meeting } from "../types/meeting";

export function formatMeetingDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getMeetingDisplayDuration(meeting: Meeting, options: {
  isRecording?: boolean;
  selectedMeetingId?: string | null;
  recordingSeconds?: number;
} = {}): number {
  if (options.isRecording && options.selectedMeetingId === meeting.id) {
    return options.recordingSeconds || 0;
  }
  if (meeting.startedAt && !meeting.durationSec && meeting.endedAt) {
    return Math.round((meeting.endedAt - meeting.startedAt) / 1000);
  }
  return meeting.durationSec || 0;
}

export function buildMeetingStats(meetings: Meeting[], options: {
  isRecording?: boolean;
  selectedMeetingId?: string | null;
  recordingSeconds?: number;
} = {}) {
  return {
    total: meetings.length,
    completed: meetings.filter((meeting) => meeting.status === "completed").length,
    processing: meetings.filter((meeting) => meeting.status !== "completed").length,
    totalDuration: meetings.reduce(
      (sum, meeting) => sum + getMeetingDisplayDuration(meeting, options),
      0
    ),
  };
}
