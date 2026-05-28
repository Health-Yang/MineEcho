import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { appendSessionTranscriptMessage } from "../config/sessions/transcript-append.js";
import { type InputProvenance } from "./input-provenance.js";
type TranscriptAppendConfig = Parameters<typeof appendSessionTranscriptMessage>[0]["config"];
type UserTurnSessionEntry = {
    sessionId: string;
    updatedAt: number;
    sessionFile?: string;
    threadId?: string | number;
} & Record<string, unknown>;
type PersistedUserTurnMediaInput = {
    path?: string | null;
    url?: string | null;
    contentType?: string | null;
    kind?: string | null;
};
export type PersistedUserTurnMessage = Extract<AgentMessage, {
    role: "user";
}>;
export type UserTurnInput = {
    text?: string | null;
    media?: readonly PersistedUserTurnMediaInput[] | null;
    timestamp?: number;
    idempotencyKey?: string;
    provenance?: InputProvenance;
    mediaOnlyText?: string;
};
type UserTurnTranscriptUpdateMode = "inline" | "none";
export type UserTurnBeforeMessageWrite = (params: {
    message: PersistedUserTurnMessage;
    agentId?: string;
    sessionKey?: string;
}) => AgentMessage | null;
type AppendUserTurnTranscriptMessageParams = {
    transcriptPath: string;
    input?: UserTurnInput;
    message?: PersistedUserTurnMessage;
    sessionId?: string;
    agentId?: string;
    sessionKey?: string;
    cwd?: string;
    config?: TranscriptAppendConfig;
    updateMode?: UserTurnTranscriptUpdateMode;
    beforeMessageWrite?: UserTurnBeforeMessageWrite;
};
type PersistUserTurnTranscriptParams = {
    input?: UserTurnInput;
    message?: PersistedUserTurnMessage;
    sessionId: string;
    sessionKey: string;
    sessionEntry: UserTurnSessionEntry | undefined;
    sessionStore?: Record<string, UserTurnSessionEntry>;
    storePath?: string;
    agentId: string;
    threadId?: string | number;
    cwd?: string;
    config?: TranscriptAppendConfig;
    updateMode?: UserTurnTranscriptUpdateMode;
    beforeMessageWrite?: UserTurnBeforeMessageWrite;
};
type UserTurnTranscriptPersistenceTarget = Omit<PersistUserTurnTranscriptParams, "input" | "message" | "updateMode">;
type UserTurnTranscriptFileTarget = {
    transcriptPath: string;
    sessionId?: string;
    agentId?: string;
    sessionKey?: string;
    cwd?: string;
    config?: TranscriptAppendConfig;
};
type UserTurnTranscriptTarget = UserTurnTranscriptPersistenceTarget | UserTurnTranscriptFileTarget;
type UserTurnTranscriptPersistResult = {
    sessionFile: string;
    sessionEntry: UserTurnSessionEntry | undefined;
    messageId: string;
    message: PersistedUserTurnMessage;
};
type UserTurnTranscriptTargetResolver = UserTurnTranscriptTarget | (() => UserTurnTranscriptTarget | undefined | Promise<UserTurnTranscriptTarget | undefined>);
type UserTurnInputResolver = () => UserTurnInput | undefined | Promise<UserTurnInput | undefined>;
export type UserTurnTranscriptRecorder = {
    readonly message: PersistedUserTurnMessage | undefined;
    resolveMessage: () => Promise<PersistedUserTurnMessage | undefined>;
    markRuntimePersistencePending: (pending: Promise<void>) => void;
    markRuntimePersisted: (message?: PersistedUserTurnMessage) => void;
    markBlocked: () => void;
    hasPersisted: () => boolean;
    isBlocked: () => boolean;
    hasRuntimePersistencePending: () => boolean;
    waitForRuntimePersistence: () => Promise<void>;
    persistApproved: (params?: {
        target?: UserTurnTranscriptTargetResolver;
        updateMode?: UserTurnTranscriptUpdateMode;
    }) => Promise<UserTurnTranscriptPersistResult | undefined>;
    persistFallback: (params?: {
        target?: UserTurnTranscriptTargetResolver;
        updateMode?: UserTurnTranscriptUpdateMode;
    }) => Promise<UserTurnTranscriptPersistResult | undefined>;
};
type CreateUserTurnTranscriptRecorderParams = {
    input?: UserTurnInput;
    message?: PersistedUserTurnMessage;
    resolveInput?: UserTurnInputResolver;
    target: UserTurnTranscriptTargetResolver;
    updateMode?: UserTurnTranscriptUpdateMode;
    beforeMessageWrite?: UserTurnBeforeMessageWrite;
    errorContext?: string;
    onPersistenceError?: (error: unknown) => void;
};
type ResolvePersistedUserTurnTextOptions = {
    hasMedia?: boolean;
};
type PersistedUserTurnMediaFieldSource = {
    MediaPath?: string | null;
    MediaPaths?: readonly (string | null | undefined)[] | null;
    MediaUrl?: string | null;
    MediaUrls?: readonly (string | null | undefined)[] | null;
    MediaType?: string | null;
    MediaTypes?: readonly (string | null | undefined)[] | null;
    MediaWorkspaceDir?: string | null;
};
export declare function resolvePersistedUserTurnText(value: string | null | undefined, options?: ResolvePersistedUserTurnTextOptions): string | undefined;
export declare function buildPersistedUserTurnMediaInputsFromFields(fields: PersistedUserTurnMediaFieldSource | null | undefined): PersistedUserTurnMediaInput[];
export declare function mergePreparedUserTurnMessageForRuntime(params: {
    runtimeMessage: AgentMessage;
    preparedMessage?: PersistedUserTurnMessage;
}): AgentMessage;
export declare function appendUserTurnTranscriptMessage(params: AppendUserTurnTranscriptMessageParams): Promise<{
    sessionFile: string;
    messageId: string;
    message: PersistedUserTurnMessage;
} | undefined>;
export declare function persistUserTurnTranscript(params: PersistUserTurnTranscriptParams): Promise<UserTurnTranscriptPersistResult | undefined>;
export declare function createUserTurnTranscriptRecorder(params: CreateUserTurnTranscriptRecorderParams): UserTurnTranscriptRecorder;
export {};
