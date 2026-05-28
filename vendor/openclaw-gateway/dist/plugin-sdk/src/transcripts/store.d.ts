import type { TranscriptSessionDescriptor, TranscriptUtterance } from "./provider-types.js";
import type { TranscriptsSummary } from "./summary.js";
export type TranscriptsSessionEntry = {
    session: TranscriptSessionDescriptor;
    sessionDir: string;
};
export declare class TranscriptsStore {
    private readonly rootDir;
    constructor(rootDir: string);
    sessionDir(session: TranscriptSessionDescriptor): string;
    private hasSessionMetadata;
    private findSessionDirForSession;
    private findSessionDir;
    writeSession(session: TranscriptSessionDescriptor): Promise<void>;
    readSession(sessionId: string): Promise<TranscriptSessionDescriptor | undefined>;
    readSessionEntry(sessionId: string): Promise<TranscriptsSessionEntry | undefined>;
    appendUtterance(sessionId: string, utterance: TranscriptUtterance): Promise<void>;
    appendUtteranceForSession(session: TranscriptSessionDescriptor, utterance: TranscriptUtterance): Promise<void>;
    private appendUtteranceToDir;
    readUtterancesForSession(session: TranscriptSessionDescriptor, options?: {
        maxUtterances?: number;
    }): Promise<TranscriptUtterance[]>;
    readUtterancesFromSessionDir(sessionDir: string, options?: {
        maxUtterances?: number;
    }): Promise<TranscriptUtterance[]>;
    readUtterances(sessionId: string, options?: {
        maxUtterances?: number;
    }): Promise<TranscriptUtterance[]>;
    private readUtterancesFromDir;
    updateStopped(sessionId: string, stoppedAt: string): Promise<void>;
    writeSummary(summary: TranscriptsSummary, session?: TranscriptSessionDescriptor): Promise<string>;
    writeSummaryToDir(summary: TranscriptsSummary, dir: string): Promise<string>;
}
