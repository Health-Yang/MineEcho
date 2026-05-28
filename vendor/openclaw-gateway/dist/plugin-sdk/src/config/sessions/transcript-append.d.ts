import type { OpenClawConfig } from "../../config/types.openclaw.js";
type AppendSessionTranscriptMessageParams<TMessage = unknown> = {
    transcriptPath: string;
    message: TMessage;
    now?: number;
    sessionId?: string;
    cwd?: string;
    useRawWhenLinear?: boolean;
    /** Opt into transcript idempotency lookup; default append stays O(1) for fresh keyed messages. */
    idempotencyLookup?: "scan" | "caller-checked";
    /** Runs under the transcript write lock after idempotency replay checks and before append. */
    prepareMessageAfterIdempotencyCheck?: (message: TMessage) => TMessage | undefined;
    config?: OpenClawConfig;
};
type AppendSessionTranscriptMessageResult<TMessage> = {
    messageId: string;
    message: TMessage;
    appended: boolean;
};
export declare function appendSessionTranscriptMessage<TMessage>(params: AppendSessionTranscriptMessageParams<TMessage> & {
    prepareMessageAfterIdempotencyCheck: (message: TMessage) => TMessage | undefined;
}): Promise<AppendSessionTranscriptMessageResult<TMessage> | undefined>;
export declare function appendSessionTranscriptMessage<TMessage>(params: AppendSessionTranscriptMessageParams<TMessage>): Promise<AppendSessionTranscriptMessageResult<TMessage>>;
export {};
