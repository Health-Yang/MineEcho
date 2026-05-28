export declare function resolveInternalSessionEffectsTranscriptPath(runId: string): string;
export declare function prepareInternalSessionEffectsTranscript(params: {
    sessionFile?: string;
    runId: string;
}): Promise<string>;
export declare function removeInternalSessionEffectsTranscript(sessionFile: string | undefined): Promise<void>;
