export type RealtimeVoiceForcedConsultTimer = {
    clear(): void;
};
export type RealtimeVoiceForcedConsultCoordinatorOptions = {
    limit?: number;
    nativeDedupeMs?: number;
    now?: () => number;
    setTimer?: (fn: () => void, ms: number) => RealtimeVoiceForcedConsultTimer;
    questionsMatch?: (left: string | undefined, right: string | undefined) => boolean;
};
export type RealtimeVoiceForcedConsultHandle<TContext = unknown> = {
    id: string;
    question: string;
    context?: TContext;
};
export type RealtimeVoiceForcedConsultNativeMatch<TContext = unknown> = {
    kind: "none";
    question?: string;
} | {
    kind: "pending";
    question?: string;
    handle: RealtimeVoiceForcedConsultHandle<TContext>;
} | {
    kind: "in_flight";
    question?: string;
    handle: RealtimeVoiceForcedConsultHandle<TContext>;
} | {
    kind: "already_delivered";
    question?: string;
    handle: RealtimeVoiceForcedConsultHandle<TContext>;
};
export type RealtimeVoiceForcedConsultNativeRecentOptions = {
    allowUnknownQuestion?: boolean;
};
export type RealtimeVoiceForcedConsultCoordinator<TContext = unknown> = {
    prepare(question: string, options?: {
        context?: TContext;
        id?: string;
    }): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
    schedule(handle: RealtimeVoiceForcedConsultHandle<TContext>, delayMs: number, run: (handle: RealtimeVoiceForcedConsultHandle<TContext>) => void): void;
    clearPending(): void;
    consumePending(question?: string): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
    cancelPending(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
    recordNativeConsult(args: unknown, nativeCallId?: string): RealtimeVoiceForcedConsultNativeMatch<TContext>;
    markStarted(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
    markDelivered(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
    markCancelled(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
    isCancelled(handle: RealtimeVoiceForcedConsultHandle<TContext>): boolean;
    nativeCallIds(handle: RealtimeVoiceForcedConsultHandle<TContext>): readonly string[];
    handles(): readonly RealtimeVoiceForcedConsultHandle<TContext>[];
    rememberQuestion(handle: RealtimeVoiceForcedConsultHandle<TContext>, question: string): void;
    findRecent(question: string): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
    hasRecent(question: string): boolean;
    hasRecentNativeConsult(question: string, options?: RealtimeVoiceForcedConsultNativeRecentOptions): boolean;
    remove(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
    clear(): void;
};
export declare function createRealtimeVoiceForcedConsultCoordinator<TContext = unknown>(options?: RealtimeVoiceForcedConsultCoordinatorOptions): RealtimeVoiceForcedConsultCoordinator<TContext>;
