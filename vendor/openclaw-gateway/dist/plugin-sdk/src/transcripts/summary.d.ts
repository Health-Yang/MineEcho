import type { TranscriptSessionDescriptor, TranscriptUtterance } from "./provider-types.js";
export type TranscriptsSummary = {
    sessionId: string;
    title: string;
    generatedAt: string;
    overview: string;
    transcript: string[];
    decisions: string[];
    actionItems: string[];
    risks: string[];
    utteranceCount: number;
};
export declare function summarizeTranscripts(params: {
    session: TranscriptSessionDescriptor;
    utterances: TranscriptUtterance[];
}): TranscriptsSummary;
export declare function renderTranscriptsMarkdown(summary: TranscriptsSummary): string;
