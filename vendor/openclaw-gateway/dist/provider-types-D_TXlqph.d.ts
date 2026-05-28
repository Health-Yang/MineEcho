import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";

//#region src/transcripts/provider-types.d.ts
type TranscriptSourceKind = "live-audio" | "live-caption" | "posthoc-transcript" | "recording-stt";
type TranscriptSourceLocator = {
  providerId: string;
  kind?: TranscriptSourceKind;
  accountId?: string;
  guildId?: string;
  channelId?: string;
  meetingUrl?: string;
  threadTs?: string;
  fileId?: string;
  [key: string]: string | undefined;
};
type TranscriptParticipant = {
  id?: string;
  label: string;
};
type TranscriptUtterance = {
  id?: string;
  sessionId?: string;
  startedAt?: string;
  endedAt?: string;
  speaker?: TranscriptParticipant;
  text: string;
  final?: boolean;
  metadata?: Record<string, unknown>;
};
type TranscriptSessionDescriptor = {
  sessionId: string;
  title?: string;
  source: TranscriptSourceLocator;
  startedAt: string;
  stoppedAt?: string;
  metadata?: Record<string, unknown>;
};
type TranscriptStartRequest = {
  cfg?: OpenClawConfig;
  session: TranscriptSessionDescriptor;
  abortSignal?: AbortSignal;
  startupWaitMs?: number;
  onUtterance: (utterance: TranscriptUtterance) => void | Promise<void>;
  onStatus?: (status: TranscriptSourceStatus) => void | Promise<void>;
};
type TranscriptsStartResult = {
  ok: true;
  session: TranscriptSessionDescriptor;
} | {
  ok: false;
  error: string;
};
type TranscriptStopRequest = {
  cfg?: OpenClawConfig;
  sessionId: string;
  source: TranscriptSourceLocator;
  reason?: string;
};
type TranscriptsStopResult = {
  ok: true;
  sessionId: string;
  stoppedAt?: string;
} | {
  ok: false;
  error: string;
};
type TranscriptSourceStatus = {
  sessionId?: string;
  active: boolean;
  message?: string;
  source?: TranscriptSourceLocator;
};
type TranscriptImportRequest = {
  cfg?: OpenClawConfig;
  session: TranscriptSessionDescriptor;
  text: string;
  speakerLabel?: string;
};
type TranscriptSourceProvider = {
  id: string;
  aliases?: readonly string[];
  name: string;
  sourceKinds: readonly TranscriptSourceKind[];
  start?: (request: TranscriptStartRequest) => Promise<TranscriptsStartResult>;
  stop?: (request: TranscriptStopRequest) => Promise<TranscriptsStopResult>;
  status?: (source: TranscriptSourceLocator, cfg?: OpenClawConfig) => Promise<TranscriptSourceStatus[]>;
  importTranscript?: (request: TranscriptImportRequest) => Promise<TranscriptUtterance[]>;
};
//#endregion
export { TranscriptSourceLocator as a, TranscriptStartRequest as c, TranscriptsStartResult as d, TranscriptsStopResult as f, TranscriptSourceKind as i, TranscriptStopRequest as l, TranscriptParticipant as n, TranscriptSourceProvider as o, TranscriptSessionDescriptor as r, TranscriptSourceStatus as s, TranscriptImportRequest as t, TranscriptUtterance as u };