import { OPENCLAW_RUNTIME_CONTEXT_CUSTOM_TYPE } from "../../internal-runtime-context.js";
import type { CurrentInboundPromptContext } from "./params.js";
export { OPENCLAW_RUNTIME_CONTEXT_CUSTOM_TYPE };
type RuntimeContextPromptParts = {
    prompt: string;
    runtimeContext?: string;
    runtimeOnly?: boolean;
    runtimeSystemContext?: string;
};
export type RuntimeContextCustomMessage = {
    role: "custom";
    customType: string;
    content: string;
    display: false;
    details: {
        source: "openclaw-runtime-context";
    };
    timestamp: number;
};
type EmptyTranscriptMode = "model-prompt" | "runtime-event";
export declare function buildCurrentInboundPromptContextPrefix(context: CurrentInboundPromptContext | undefined): string;
export declare function buildCurrentInboundPrompt(params: {
    context: CurrentInboundPromptContext | undefined;
    prompt: string;
}): string;
export declare function resolveRuntimeContextPromptParts(params: {
    effectivePrompt: string;
    transcriptPrompt?: string;
    emptyTranscriptMode?: EmptyTranscriptMode;
}): RuntimeContextPromptParts;
export declare function buildRuntimeContextSystemContext(runtimeContext: string): string;
export declare function buildRuntimeEventSystemContext(runtimeContext: string): string;
export declare function buildRuntimeContextCustomMessage(runtimeContext: string | undefined): RuntimeContextCustomMessage | undefined;
