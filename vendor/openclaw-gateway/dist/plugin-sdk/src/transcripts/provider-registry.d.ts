import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { TranscriptSourceProvider } from "./provider-types.js";
export declare function normalizeTranscriptSourceProviderId(providerId: string | undefined): string | undefined;
export declare function listTranscriptSourceProviders(cfg?: OpenClawConfig): TranscriptSourceProvider[];
export declare function getTranscriptSourceProvider(providerId: string | undefined, cfg?: OpenClawConfig): TranscriptSourceProvider | undefined;
