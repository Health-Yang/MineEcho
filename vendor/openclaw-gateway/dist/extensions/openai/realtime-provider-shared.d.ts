import { c as normalizeOptionalString } from "../../string-coerce-Rv-c17oH.js";
import { t as asFiniteNumber } from "../../number-coercion-0BUWM4ME.js";
import { a as asOptionalRecord } from "../../string-sample-CcymBpGc.js";

//#region extensions/openai/realtime-provider-shared.d.ts
declare const trimToUndefined: typeof normalizeOptionalString;
declare function readRealtimeErrorDetail(error: unknown): string;
declare function resolveOpenAIProviderConfigRecord(config: Record<string, unknown>): Record<string, unknown> | undefined;
declare function captureOpenAIRealtimeWsClose(params: {
  url: string;
  flowId: string;
  capability: "realtime-transcription" | "realtime-voice";
  code: unknown;
  reasonBuffer: unknown;
}): void;
type OpenAIRealtimeClientSecretResult = {
  value: string;
  expiresAt?: number;
};
declare function createOpenAIRealtimeClientSecret(params: {
  authToken: string;
  auditContext: string;
  session: Record<string, unknown>;
}): Promise<OpenAIRealtimeClientSecretResult>;
declare function createOpenAIRealtimeTranscriptionClientSecret(params: {
  authToken: string;
  auditContext: string;
  session: Record<string, unknown>;
}): Promise<OpenAIRealtimeClientSecretResult>;
//#endregion
export { OpenAIRealtimeClientSecretResult, asFiniteNumber, asOptionalRecord as asObjectRecord, captureOpenAIRealtimeWsClose, createOpenAIRealtimeClientSecret, createOpenAIRealtimeTranscriptionClientSecret, readRealtimeErrorDetail, resolveOpenAIProviderConfigRecord, trimToUndefined };