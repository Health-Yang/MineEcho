export declare const AGENT_RUN_ABORTED_STOP_REASON: "aborted";
export declare const AGENT_RUN_ABORTED_ERROR: "agent run aborted";
export declare function isAbortedAgentStopReason(value: unknown): value is typeof AGENT_RUN_ABORTED_STOP_REASON;
