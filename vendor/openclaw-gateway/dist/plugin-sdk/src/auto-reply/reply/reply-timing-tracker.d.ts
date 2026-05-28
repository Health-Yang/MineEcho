import type { OpenClawConfig } from "../../config/types.openclaw.js";
type ReplyTimingLogger = {
    warn: (message: string, details?: Record<string, unknown>) => void;
};
type ReplyTimingTracker = {
    measure: <T>(name: string, run: () => Promise<T> | T) => Promise<T>;
    measureSync: <T>(name: string, run: () => T) => T;
    logIfSlow: (params: {
        message: string;
        outcome?: string;
        reason?: string;
        error?: string;
        details?: Record<string, unknown>;
    }) => void;
};
export declare function isReplyProfilerEnabled(params?: {
    config?: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
}): boolean;
export declare function createReplyTimingTracker(params: {
    log: ReplyTimingLogger;
    config?: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
    enabled?: boolean;
    totalWarnMs?: number;
    stageWarnMs?: number;
}): ReplyTimingTracker;
export {};
