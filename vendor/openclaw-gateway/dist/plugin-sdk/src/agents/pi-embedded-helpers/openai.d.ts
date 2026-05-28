import type { AgentMessage } from "@earendil-works/pi-agent-core";
type DowngradeOpenAIReasoningBlocksOptions = {
    dropReplayableReasoning?: boolean;
};
/**
 * OpenAI Responses rejects replayed `function_call.call_id`,
 * `function_call.id`, and matching `function_call_output.call_id` values
 * that exceed its 64-char `call_*` / `fc_*` shape. pi-ai skips its own
 * normalizer for same-model replay, then splits persisted `call_id|fc_id`
 * pairs directly into the provider payload, so OpenClaw must normalize here.
 */
export declare function normalizeOpenAIResponsesToolCallIds(messages: AgentMessage[]): AgentMessage[];
/**
 * OpenAI can reject replayed `function_call` items with an `fc_*` id if the
 * matching `reasoning` item is absent in the same assistant turn.
 *
 * When that pairing is missing, strip the `|fc_*` suffix from tool call ids so
 * pi-ai omits `function_call.id` on replay.
 */
export declare function downgradeOpenAIFunctionCallReasoningPairs(messages: AgentMessage[]): AgentMessage[];
/**
 * OpenAI Responses API can reject transcripts that contain a standalone `reasoning` item id
 * without the required following item, or stale encrypted reasoning after a model route switch.
 *
 * OpenClaw persists provider-specific reasoning metadata in `thinkingSignature`; if that metadata
 * is incomplete or no longer replay-safe, drop the block to keep history usable.
 */
export declare function downgradeOpenAIReasoningBlocks(messages: AgentMessage[], options?: DowngradeOpenAIReasoningBlocksOptions): AgentMessage[];
export {};
