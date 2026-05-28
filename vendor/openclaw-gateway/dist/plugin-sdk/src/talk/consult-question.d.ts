export type RealtimeVoiceConsultQuestionMatchOptions = {
    minTokenOverlapRatio?: number;
    minTokenOverlapCount?: number;
};
export type RealtimeVoiceSpeakableToolResultOptions = {
    keys?: readonly string[];
    maxChars?: number;
    stringResult?: boolean;
};
export declare function readRealtimeVoiceConsultQuestion(args: unknown, keys?: readonly string[]): string | undefined;
export declare function normalizeRealtimeVoiceConsultQuestion(value: string | undefined): string | undefined;
export declare function matchRealtimeVoiceConsultQuestions(left: string | undefined, right: string | undefined, options?: RealtimeVoiceConsultQuestionMatchOptions): boolean;
export declare function readSpeakableRealtimeVoiceToolResult(result: unknown, options?: RealtimeVoiceSpeakableToolResultOptions): string | undefined;
