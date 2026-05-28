export declare const REALTIME_VOICE_ACTIVATION_NAME_MAX_WORDS = 2;
export type RealtimeVoiceActivationNameEdge = "leading" | "trailing";
export type RealtimeVoiceActivationNameMatchKind = "exact" | "fuzzy";
export type RealtimeVoiceActivationNameTranscriptResult = {
    allowed: true;
    text: string;
    activationName: string;
    heardName: string;
    match: RealtimeVoiceActivationNameMatchKind;
    edge: RealtimeVoiceActivationNameEdge;
} | {
    allowed: false;
    text: string;
};
export declare function realtimeVoiceActivationNameWordCount(value: string): number;
export declare function normalizeRealtimeVoiceActivationName(value: string): string | undefined;
export declare function normalizeRealtimeVoiceActivationNamePrefix(value: string, maxWords?: number): string | undefined;
export declare function isSupportedRealtimeVoiceActivationName(value: string, maxWords?: number): boolean;
export declare function normalizeSupportedRealtimeVoiceActivationName(value: string | undefined, maxWords?: number): string | undefined;
export declare function sortRealtimeVoiceActivationNames(names: string[]): string[];
export declare function matchRealtimeVoiceActivationName(text: string, activationNames: string[], maxWords?: number): Extract<RealtimeVoiceActivationNameTranscriptResult, {
    allowed: true;
}> | undefined;
