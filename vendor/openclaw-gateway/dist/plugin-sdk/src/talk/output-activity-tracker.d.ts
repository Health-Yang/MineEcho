export type RealtimeVoiceOutputActivityTrackerOptions = {
    now?: () => number;
};
export type RealtimeVoiceOutputActivityDelta = {
    audioMs?: number;
    sourceAudioBytes?: number;
    sinkAudioBytes?: number;
};
export type RealtimeVoiceOutputActivitySnapshot = {
    audioMs: number;
    chunks: number;
    sourceAudioBytes: number;
    sinkAudioBytes: number;
    playbackStarted: boolean;
    streamEnding: boolean;
    lastAudioAt?: number;
    playbackStartedAt?: number;
};
export type RealtimeVoiceOutputActivityTracker = {
    markStreamOpened(): void;
    markStreamEnding(): void;
    markPlaybackStarted(): void;
    markAudio(delta: RealtimeVoiceOutputActivityDelta): void;
    reset(): void;
    isActive(sinkActive?: boolean): boolean;
    isInterruptible(sinkActive?: boolean): boolean;
    elapsedPlaybackMs(): number;
    playbackWatchdogDelayMs(options: {
        marginMs: number;
        minMs?: number;
    }): number | undefined;
    snapshot(): RealtimeVoiceOutputActivitySnapshot;
};
export declare function createRealtimeVoiceOutputActivityTracker(options?: RealtimeVoiceOutputActivityTrackerOptions): RealtimeVoiceOutputActivityTracker;
