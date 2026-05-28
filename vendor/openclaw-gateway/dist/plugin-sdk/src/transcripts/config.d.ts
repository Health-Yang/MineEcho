export type TranscriptsAutoStartConfig = {
    providerId: string;
    sessionId?: string;
    title?: string;
    accountId?: string;
    guildId?: string;
    channelId?: string;
    meetingUrl?: string;
};
export type ResolvedTranscriptsAutoStartConfig = {
    providerId: string;
    sessionId?: string;
    title?: string;
    accountId?: string;
    guildId?: string;
    channelId?: string;
    meetingUrl?: string;
};
export type TranscriptsConfig = {
    enabled?: boolean;
    maxUtterances?: number;
    autoStart?: TranscriptsAutoStartConfig[];
};
export type ResolvedTranscriptsConfig = {
    enabled: boolean;
    maxUtterances: number;
    autoStart: ResolvedTranscriptsAutoStartConfig[];
};
export declare function resolveTranscriptsConfig(raw: unknown): ResolvedTranscriptsConfig;
