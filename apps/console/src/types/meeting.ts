export interface Meeting {
  id: string;
  title: string | null;
  participants: string | null;
  location: string | null;
  startedAt: number;
  endedAt: number | null;
  durationSec: number | null;
  audioPath: string | null;
  status: "recording" | "transcribing" | "cleaning" | "extracting" | "summarizing" | "completed";
  transcript: string | null;
  cleanedTranscript: string | null;
  summary: string | null;
  createdAt: number;
}

export interface Commitment {
  id: string;
  meetingId: string;
  who: string;
  what: string;
  deadline: string | null;
  confidence: number;
  status: "pending" | "done" | "overdue";
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: number;
  endAt: number | null;
  type: "meeting" | "commitment" | "personal";
  sourceId: string | null;
  description: string | null;
}
