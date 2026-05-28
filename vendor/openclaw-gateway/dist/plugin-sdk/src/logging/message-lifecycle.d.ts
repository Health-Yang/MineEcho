type MessageLifecycleRef = {
    sessionId?: string;
    sessionKey?: string;
};
type MessageLifecycleOutcome = "completed" | "skipped" | "error";
type MessageLifecycleProcessedOptions = MessageLifecycleRef & {
    durationMs?: number;
    reason?: string;
    error?: string;
};
export declare function createDiagnosticMessageLifecycle(params: MessageLifecycleRef & {
    enabled: boolean;
    channel: string;
    source: string;
    chatId?: number | string;
    messageId?: number | string;
    processingReason?: string;
    startedAtMs?: number;
    trackSessionState: boolean;
}): {
    markProcessing(override?: MessageLifecycleRef): void;
    markIdle(reason?: string, override?: MessageLifecycleRef): void;
    markProcessed(outcome: MessageLifecycleOutcome, options?: MessageLifecycleProcessedOptions): void;
};
export {};
