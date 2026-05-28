import { callGateway, getRuntimeConfig, readSessionEntry, readSessionMessagesAsync, resolveAgentIdFromSessionKey, resolveStorePath } from "./subagent-announce.runtime.js";
type SubagentAnnounceOutputDeps = {
    callGateway: typeof callGateway;
    getRuntimeConfig: typeof getRuntimeConfig;
    readSessionEntry: typeof readSessionEntry;
    readSessionMessagesAsync: typeof readSessionMessagesAsync;
    resolveAgentIdFromSessionKey: typeof resolveAgentIdFromSessionKey;
    resolveStorePath: typeof resolveStorePath;
};
type AgentWaitResult = {
    status?: string;
    startedAt?: number;
    endedAt?: number;
    error?: string;
    stopReason?: string;
    livenessState?: string;
    yielded?: boolean;
};
export type SubagentRunOutcome = {
    status: "ok" | "error" | "timeout" | "unknown";
    error?: string;
    startedAt?: number;
    endedAt?: number;
    elapsedMs?: number;
};
export declare function withSubagentOutcomeTiming(outcome: SubagentRunOutcome, timing: {
    startedAt?: number;
    endedAt?: number;
}): SubagentRunOutcome;
export declare function readSubagentOutput(sessionKey: string, _outcome?: SubagentRunOutcome, options?: {
    sessionFile?: string;
}): Promise<string | undefined>;
export declare function readLatestSubagentOutputWithRetry(params: {
    sessionKey: string;
    maxWaitMs: number;
    outcome?: SubagentRunOutcome;
}): Promise<string | undefined>;
export declare function waitForSubagentRunOutcome(runId: string, timeoutMs: number): Promise<AgentWaitResult>;
export declare function applySubagentWaitOutcome(params: {
    wait: AgentWaitResult | undefined;
    outcome: SubagentRunOutcome | undefined;
    startedAt?: number;
    endedAt?: number;
}): {
    outcome: SubagentRunOutcome | undefined;
    startedAt: number | undefined;
    endedAt: number | undefined;
};
export declare function captureSubagentCompletionReply(sessionKey: string, options?: {
    waitForReply?: boolean;
    outcome?: SubagentRunOutcome;
    sessionFile?: string;
}): Promise<string | undefined>;
type ChildCompletionRow = {
    childSessionKey: string;
    task: string;
    label?: string;
    createdAt: number;
    endedAt?: number;
    frozenResultText?: string | null;
    completion?: {
        resultText?: string | null;
        fallbackResultText?: string | null;
    };
    delivery?: {
        payload?: {
            frozenResultText?: string | null;
            fallbackFrozenResultText?: string | null;
        };
    };
    outcome?: SubagentRunOutcome;
};
export declare function buildChildCompletionFindings(children: Array<ChildCompletionRow>): string | undefined;
export declare function dedupeLatestChildCompletionRows(children: Array<{
    childSessionKey: string;
    task: string;
    label?: string;
    createdAt: number;
    endedAt?: number;
    frozenResultText?: string | null;
    completion?: {
        resultText?: string | null;
        fallbackResultText?: string | null;
    };
    delivery?: {
        payload?: {
            frozenResultText?: string | null;
            fallbackFrozenResultText?: string | null;
        };
    };
    outcome?: SubagentRunOutcome;
}>): {
    childSessionKey: string;
    task: string;
    label?: string;
    createdAt: number;
    endedAt?: number;
    frozenResultText?: string | null;
    completion?: {
        resultText?: string | null;
        fallbackResultText?: string | null;
    };
    delivery?: {
        payload?: {
            frozenResultText?: string | null;
            fallbackFrozenResultText?: string | null;
        };
    };
    outcome?: SubagentRunOutcome;
}[];
export declare function filterCurrentDirectChildCompletionRows(children: Array<{
    runId: string;
    childSessionKey: string;
    requesterSessionKey: string;
    task: string;
    label?: string;
    createdAt: number;
    endedAt?: number;
    frozenResultText?: string | null;
    completion?: {
        resultText?: string | null;
        fallbackResultText?: string | null;
    };
    delivery?: {
        payload?: {
            frozenResultText?: string | null;
            fallbackFrozenResultText?: string | null;
        };
    };
    outcome?: SubagentRunOutcome;
}>, params: {
    requesterSessionKey: string;
    getLatestSubagentRunByChildSessionKey?: (childSessionKey: string) => {
        runId: string;
        requesterSessionKey: string;
    } | null | undefined;
}): {
    runId: string;
    childSessionKey: string;
    requesterSessionKey: string;
    task: string;
    label?: string;
    createdAt: number;
    endedAt?: number;
    frozenResultText?: string | null;
    completion?: {
        resultText?: string | null;
        fallbackResultText?: string | null;
    };
    delivery?: {
        payload?: {
            frozenResultText?: string | null;
            fallbackFrozenResultText?: string | null;
        };
    };
    outcome?: SubagentRunOutcome;
}[];
export declare function buildCompactAnnounceStatsLine(params: {
    sessionKey: string;
    startedAt?: number;
    endedAt?: number;
}): Promise<string>;
export declare const testing: {
    setDepsForTest(overrides?: Partial<SubagentAnnounceOutputDeps>): void;
};
export { testing as __testing };
