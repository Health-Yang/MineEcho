export type SkippableRealtimeVoiceConsultTranscriptReason = "empty" | "incomplete-transcript" | "trailing-fragment" | "non-actionable-closing";
export declare function classifySkippableRealtimeVoiceConsultTranscript(text: string): SkippableRealtimeVoiceConsultTranscriptReason | undefined;
