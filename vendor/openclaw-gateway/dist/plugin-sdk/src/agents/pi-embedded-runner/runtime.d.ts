export type EmbeddedAgentRuntime = "pi" | "openclaw" | "auto" | (string & {});
export declare function normalizeEmbeddedAgentRuntime(raw: string | undefined): EmbeddedAgentRuntime;
export declare function resolveEmbeddedAgentRuntime(env?: NodeJS.ProcessEnv): EmbeddedAgentRuntime;
