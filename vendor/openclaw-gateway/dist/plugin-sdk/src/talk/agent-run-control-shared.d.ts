import type { RealtimeVoiceTool } from "./provider-types.js";
import type { TalkEvent } from "./talk-events.js";
export declare const REALTIME_VOICE_AGENT_CONTROL_MODES: readonly ["status", "steer", "cancel", "followup"];
export type RealtimeVoiceAgentControlMode = (typeof REALTIME_VOICE_AGENT_CONTROL_MODES)[number];
export type RealtimeVoiceAgentControlProviderResult = {
    status: "cancelled";
    message: string;
};
export declare const REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME = "openclaw_agent_control";
export declare const REALTIME_VOICE_AGENT_CONTROL_TOOL: RealtimeVoiceTool;
export type RealtimeVoiceAgentControlIntent = {
    mode: RealtimeVoiceAgentControlMode;
    confidence: "high" | "medium" | "low";
    reason: "explicit_mode" | "cancel_safety" | "status_query" | "followup_marker" | "steer_command" | "safe_default";
    shouldAutoControl: boolean;
};
export type RealtimeVoiceAgentRunActivity = {
    activeWorkKind?: "tool_call" | "model_call" | "embedded_run";
    hasActiveEmbeddedRun?: boolean;
    activeToolName?: string;
    activeToolCallId?: string;
    activeToolAgeMs?: number;
    lastProgressAgeMs?: number;
    lastProgressReason?: string;
};
export type RealtimeVoiceAgentControlResult = {
    ok: boolean;
    mode: RealtimeVoiceAgentControlMode;
    sessionKey: string;
    sessionId?: string;
    active: boolean;
    queued?: boolean;
    aborted?: boolean;
    target?: "embedded_run" | "reply_run";
    reason?: string;
    message: string;
    speak: boolean;
    show: boolean;
    suppress: boolean;
    providerResult?: RealtimeVoiceAgentControlProviderResult;
    enqueuedAtMs?: number;
    deliveredAtMs?: number;
};
export declare function normalizeRealtimeVoiceAgentControlMode(value: unknown): RealtimeVoiceAgentControlMode | undefined;
export declare function resolveRealtimeVoiceAgentControlIntent(params: {
    text: string;
    mode?: unknown;
}): RealtimeVoiceAgentControlIntent;
export declare function classifyRealtimeVoiceAgentControlText(text: string): RealtimeVoiceAgentControlMode;
export declare function shouldAutoControlRealtimeVoiceAgentText(text: string): boolean;
export declare function parseRealtimeVoiceAgentControlToolArgs(args: unknown): {
    text: string;
    mode: RealtimeVoiceAgentControlMode;
};
export declare function buildRealtimeVoiceAgentControlSpeechMessage(text: string): string;
export declare function buildRealtimeVoiceAgentCancelProviderResult(message?: string): RealtimeVoiceAgentControlProviderResult;
export declare function buildRealtimeVoiceAgentFollowupSteeringText(text: string): string;
export declare function formatRealtimeVoiceAgentQueueRejection(mode: RealtimeVoiceAgentControlMode, reason: string): string;
export declare function formatRealtimeVoiceAgentStatus(params: {
    active: boolean;
    recentEvents?: readonly TalkEvent[];
    activity?: RealtimeVoiceAgentRunActivity;
}): string;
