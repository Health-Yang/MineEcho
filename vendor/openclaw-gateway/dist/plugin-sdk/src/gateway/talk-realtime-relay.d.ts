import type { OpenClawConfig } from "../config/types.js";
import type { RealtimeVoiceProviderPlugin } from "../plugins/types.js";
import { type RealtimeVoiceAgentControlResult } from "../talk/agent-run-control.js";
import { type RealtimeVoiceBrowserAudioContract, type RealtimeVoiceProviderConfig, type RealtimeVoiceTool, type RealtimeVoiceToolResultOptions } from "../talk/provider-types.js";
import type { GatewayRequestContext } from "./server-methods/shared-types.js";
type CreateTalkRealtimeRelaySessionParams = {
    context: GatewayRequestContext;
    connId: string;
    cfg?: OpenClawConfig;
    provider: RealtimeVoiceProviderPlugin;
    providerConfig: RealtimeVoiceProviderConfig;
    instructions: string;
    tools: RealtimeVoiceTool[];
    model?: string;
    sessionKey?: string;
    voice?: string;
    forceAgentConsultOnFinalTranscript?: boolean;
};
type TalkRealtimeRelaySessionResult = {
    provider: string;
    transport: "gateway-relay";
    relaySessionId: string;
    audio: RealtimeVoiceBrowserAudioContract;
    model?: string;
    voice?: string;
    expiresAt: number;
};
export declare function createTalkRealtimeRelaySession(params: CreateTalkRealtimeRelaySessionParams): TalkRealtimeRelaySessionResult;
export declare function sendTalkRealtimeRelayAudio(params: {
    relaySessionId: string;
    connId: string;
    audioBase64: string;
    timestamp?: number;
}): void;
export declare function submitTalkRealtimeRelayToolResult(params: {
    relaySessionId: string;
    connId: string;
    callId: string;
    result: unknown;
    options?: RealtimeVoiceToolResultOptions;
}): void;
export declare function registerTalkRealtimeRelayAgentRun(params: {
    relaySessionId: string;
    connId: string;
    sessionKey: string;
    runId: string;
    callId?: string;
}): void;
export declare function steerTalkRealtimeRelayAgentRun(params: {
    relaySessionId: string;
    connId: string;
    sessionKey?: string;
    text: string;
    mode?: string;
}): Promise<RealtimeVoiceAgentControlResult>;
export declare function cancelTalkRealtimeRelayTurn(params: {
    relaySessionId: string;
    connId: string;
    reason?: string;
}): void;
export declare function stopTalkRealtimeRelaySession(params: {
    relaySessionId: string;
    connId: string;
}): void;
export declare function clearTalkRealtimeRelaySessionsForTest(): void;
export {};
