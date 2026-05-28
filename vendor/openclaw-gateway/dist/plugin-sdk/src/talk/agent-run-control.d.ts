import type { EmbeddedPiQueueMessageOutcome } from "../agents/pi-embedded-runner/runs.js";
import { type RealtimeVoiceAgentControlResult, type RealtimeVoiceAgentRunActivity } from "./agent-run-control-shared.js";
import type { TalkEvent } from "./talk-events.js";
export { buildRealtimeVoiceAgentCancelProviderResult, buildRealtimeVoiceAgentControlSpeechMessage, classifyRealtimeVoiceAgentControlText, normalizeRealtimeVoiceAgentControlMode, parseRealtimeVoiceAgentControlToolArgs, REALTIME_VOICE_AGENT_CONTROL_MODES, REALTIME_VOICE_AGENT_CONTROL_TOOL, REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME, resolveRealtimeVoiceAgentControlIntent, shouldAutoControlRealtimeVoiceAgentText, type RealtimeVoiceAgentControlMode, type RealtimeVoiceAgentControlIntent, type RealtimeVoiceAgentControlProviderResult, type RealtimeVoiceAgentControlResult, type RealtimeVoiceAgentRunActivity, } from "./agent-run-control-shared.js";
type RealtimeVoiceAgentControlDeps = {
    abortEmbeddedPiRun: (sessionId: string) => boolean;
    queueEmbeddedPiMessageWithOutcomeAsync: (sessionId: string, text: string, options?: {
        steeringMode?: "all";
        debounceMs?: number;
    }) => Promise<EmbeddedPiQueueMessageOutcome>;
    getDiagnosticSessionActivitySnapshot: (params: {
        sessionId?: string;
        sessionKey?: string;
    }) => RealtimeVoiceAgentRunActivity;
    resolveActiveEmbeddedRunSessionId: (sessionKey: string) => string | undefined;
};
export declare function controlRealtimeVoiceAgentRun(params: {
    sessionKey: string;
    text: string;
    mode?: unknown;
    recentEvents?: readonly TalkEvent[];
}, deps?: RealtimeVoiceAgentControlDeps): Promise<RealtimeVoiceAgentControlResult>;
