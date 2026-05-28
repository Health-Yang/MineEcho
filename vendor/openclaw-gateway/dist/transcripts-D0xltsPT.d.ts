import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { o as TranscriptSourceProvider } from "./provider-types-D_TXlqph.js";

//#region src/transcripts/provider-registry.d.ts
declare function normalizeTranscriptSourceProviderId(providerId: string | undefined): string | undefined;
declare function listTranscriptSourceProviders(cfg?: OpenClawConfig): TranscriptSourceProvider[];
declare function getTranscriptSourceProvider(providerId: string | undefined, cfg?: OpenClawConfig): TranscriptSourceProvider | undefined;
//#endregion
export { listTranscriptSourceProviders as n, normalizeTranscriptSourceProviderId as r, getTranscriptSourceProvider as t };