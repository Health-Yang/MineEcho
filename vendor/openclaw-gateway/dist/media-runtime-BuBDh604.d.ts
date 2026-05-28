import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { f as MediaUnderstandingConfig } from "./types.tools-CnpvoH3X.js";
import { o as SsrFPolicy } from "./ssrf-skjEI_i5.js";
import { c as MediaAttachment, d as MediaUnderstandingOutput, f as MediaUnderstandingProvider, l as MediaUnderstandingCapability, u as MediaUnderstandingDecision } from "./types-nHJ6ji79.js";
import { n as MsgContext } from "./templating-5iVgSDdS.js";
import { t as ActiveMediaModel } from "./active-model.types-DCiq_ik4.js";
import { t as OutboundSendDeps } from "./send-deps-BaEC80iY.js";
import { t as OutboundMediaAccess } from "./load-options-CTuppEe4.js";
import { n as ChannelOutboundAdapter } from "./outbound.types-BgikmK_M.js";
//#region src/media/base64.d.ts
declare function estimateBase64DecodedBytes(base64: string): number;
/**
 * Normalize and validate a base64 string.
 * Returns canonical base64 (no whitespace) or undefined when invalid.
 */
declare function canonicalizeBase64(base64: string): string | undefined;
//#endregion
//#region src/media/ffmpeg-limits.d.ts
declare const MEDIA_FFMPEG_MAX_BUFFER_BYTES: number;
declare const MEDIA_FFPROBE_TIMEOUT_MS = 10000;
declare const MEDIA_FFMPEG_TIMEOUT_MS = 45000;
declare const MEDIA_FFMPEG_MAX_AUDIO_DURATION_SECS: number;
//#endregion
//#region src/media/outbound-attachment.d.ts
declare function resolveOutboundAttachmentFromUrl(mediaUrl: string, maxBytes: number, options?: {
  mediaAccess?: OutboundMediaAccess;
  localRoots?: readonly string[];
  readFile?: (filePath: string) => Promise<Buffer>;
}): Promise<{
  path: string;
  contentType?: string;
}>;
//#endregion
//#region src/media/qr-image.d.ts
type QrPngRenderOptions = {
  scale?: number;
  marginModules?: number;
};
type QrPngTempFileOptions = QrPngRenderOptions & {
  tmpRoot: string;
  dirPrefix: string;
  fileName?: string;
};
type QrPngTempFile = {
  filePath: string;
  dirPath: string;
  mediaLocalRoots: string[];
};
declare function renderQrPngBase64(input: string, opts?: QrPngRenderOptions): Promise<string>;
declare function formatQrPngDataUrl(base64: string): string;
declare function renderQrPngDataUrl(input: string, opts?: QrPngRenderOptions): Promise<string>;
declare function writeQrPngTempFile(input: string, opts: QrPngTempFileOptions): Promise<QrPngTempFile>;
//#endregion
//#region src/media/qr-terminal.d.ts
declare function renderQrTerminal(input: string, opts?: {
  small?: boolean;
}): Promise<string>;
//#endregion
//#region src/media/temp-files.d.ts
declare function unlinkIfExists(filePath: string | null | undefined): Promise<void>;
//#endregion
//#region src/channels/plugins/media-limits.d.ts
declare function resolveChannelMediaMaxBytes(params: {
  cfg: OpenClawConfig;
  resolveChannelLimitMb: (params: {
    cfg: OpenClawConfig;
    accountId: string;
  }) => number | undefined;
  accountId?: string | null;
}): number | undefined;
//#endregion
//#region src/media-understanding/audio-preflight.d.ts
/**
 * Transcribes the first audio attachment BEFORE mention checking.
 * This allows voice notes to be processed in group chats with requireMention: true.
 * Returns the transcript or undefined if transcription fails or no audio is found.
 */
declare function transcribeFirstAudio(params: {
  ctx: MsgContext;
  cfg: OpenClawConfig;
  agentDir?: string;
  providers?: Record<string, MediaUnderstandingProvider>;
  activeModel?: ActiveMediaModel;
}): Promise<string | undefined>;
//#endregion
//#region src/media-understanding/defaults.constants.d.ts
declare const DEFAULT_MAX_CHARS = 500;
declare const DEFAULT_MAX_CHARS_BY_CAPABILITY: Record<MediaUnderstandingCapability, number | undefined>;
declare const DEFAULT_MAX_BYTES: Record<MediaUnderstandingCapability, number>;
declare const DEFAULT_TIMEOUT_SECONDS: Record<MediaUnderstandingCapability, number>;
declare const DEFAULT_PROMPT: Record<MediaUnderstandingCapability, string>;
declare const DEFAULT_VIDEO_MAX_BASE64_BYTES: number;
declare const CLI_OUTPUT_MAX_BUFFER: number;
declare const DEFAULT_MEDIA_CONCURRENCY = 2;
declare const MIN_AUDIO_FILE_BYTES = 1024;
//#endregion
//#region src/media-understanding/defaults.d.ts
declare function resolveDefaultMediaModel(params: {
  providerId: string;
  capability: MediaUnderstandingCapability;
  cfg?: OpenClawConfig;
  workspaceDir?: string;
  providerRegistry?: Map<string, MediaUnderstandingProvider>;
  includeConfiguredImageModels?: boolean;
}): string | undefined;
declare function resolveAutoMediaKeyProviders(params: {
  capability: MediaUnderstandingCapability;
  cfg?: OpenClawConfig;
  workspaceDir?: string;
  providerRegistry?: Map<string, MediaUnderstandingProvider>;
}): string[];
declare function providerSupportsNativePdfDocument(params: {
  providerId: string;
  cfg?: OpenClawConfig;
  workspaceDir?: string;
  providerRegistry?: Map<string, MediaUnderstandingProvider>;
}): boolean;
declare function resolveDocumentMediaModel(params: {
  providerId: string;
  document: "pdf";
  mode: "textExtraction" | "image";
  cfg?: OpenClawConfig;
  workspaceDir?: string;
  providerRegistry?: Map<string, MediaUnderstandingProvider>;
}): string | false | undefined;
//#endregion
//#region src/media-understanding/attachments.cache.d.ts
type MediaBufferResult = {
  buffer: Buffer;
  mime?: string;
  fileName: string;
  size: number;
};
type MediaPathResult = {
  path: string;
  cleanup?: () => Promise<void> | void;
};
type MediaAttachmentCacheOptions = {
  localPathRoots?: readonly string[];
  includeDefaultLocalPathRoots?: boolean;
  ssrfPolicy?: SsrFPolicy;
  workspaceDir?: string;
};
declare class MediaAttachmentCache {
  private readonly entries;
  private readonly attachments;
  private readonly localPathRoots;
  private readonly ssrfPolicy;
  private readonly workspaceDir?;
  private canonicalLocalPathRoots?;
  constructor(attachments: MediaAttachment[], options?: MediaAttachmentCacheOptions);
  getBuffer(params: {
    attachmentIndex: number;
    maxBytes: number;
    timeoutMs: number;
  }): Promise<MediaBufferResult>;
  getPath(params: {
    attachmentIndex: number;
    maxBytes?: number;
    timeoutMs: number;
  }): Promise<MediaPathResult>;
  cleanup(): Promise<void>;
  private ensureEntry;
  private resolveLocalPath;
  private ensureLocalStat;
  private getCanonicalLocalPathRoots;
  private readLocalBuffer;
}
//#endregion
//#region src/media-understanding/runner.attachments.d.ts
declare function normalizeMediaAttachments(ctx: MsgContext): MediaAttachment[];
declare function createMediaAttachmentCache(attachments: MediaAttachment[], options?: MediaAttachmentCacheOptions): MediaAttachmentCache;
//#endregion
//#region src/media-understanding/runner.d.ts
type ProviderRegistry = Map<string, MediaUnderstandingProvider>;
type RunCapabilityResult = {
  outputs: MediaUnderstandingOutput[];
  decision: MediaUnderstandingDecision;
};
declare function buildProviderRegistry(overrides?: Record<string, MediaUnderstandingProvider>, cfg?: OpenClawConfig): ProviderRegistry;
declare function resolveMediaAttachmentLocalRoots(params: {
  cfg: OpenClawConfig;
  ctx: MsgContext;
  workspaceDir?: string;
}): readonly string[];
declare function clearMediaUnderstandingBinaryCacheForTests(): void;
declare function resolveAutoImageModel(params: {
  cfg: OpenClawConfig;
  agentId?: string;
  agentDir?: string;
  workspaceDir?: string;
  activeModel?: ActiveMediaModel;
}): Promise<ActiveMediaModel | null>;
declare function runCapability(params: {
  capability: MediaUnderstandingCapability;
  cfg: OpenClawConfig;
  ctx: MsgContext;
  attachments: MediaAttachmentCache;
  media: MediaAttachment[];
  agentId?: string;
  agentDir?: string;
  workspaceDir?: string;
  providerRegistry: ProviderRegistry;
  config?: MediaUnderstandingConfig;
  activeModel?: ActiveMediaModel;
}): Promise<RunCapabilityResult>;
//#endregion
//#region src/media-understanding/provider-id.d.ts
declare function normalizeMediaProviderId(id: string): string;
//#endregion
//#region src/channels/plugins/outbound/direct-text-media.d.ts
type DirectSendOptions = {
  cfg: OpenClawConfig;
  accountId?: string | null;
  replyToId?: string | null;
  mediaUrl?: string;
  mediaAccess?: OutboundMediaAccess;
  mediaLocalRoots?: readonly string[];
  mediaReadFile?: (filePath: string) => Promise<Buffer>;
  maxBytes?: number;
};
type DirectSendResult = {
  messageId: string;
  [key: string]: unknown;
};
type DirectSendFn<TOpts extends Record<string, unknown>, TResult extends DirectSendResult> = (to: string, text: string, opts: TOpts) => Promise<TResult>;
declare function resolveScopedChannelMediaMaxBytes(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  resolveChannelLimitMb: (params: {
    cfg: OpenClawConfig;
    accountId: string;
  }) => number | undefined;
}): number | undefined;
declare function createScopedChannelMediaMaxBytesResolver(channel: string): (params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
}) => number | undefined;
declare function createDirectTextMediaOutbound<TOpts extends Record<string, unknown>, TResult extends DirectSendResult>(params: {
  channel: string;
  resolveSender: (deps: OutboundSendDeps | undefined) => DirectSendFn<TOpts, TResult>;
  resolveMaxBytes: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
  }) => number | undefined;
  buildTextOptions: (params: DirectSendOptions) => TOpts;
  buildMediaOptions: (params: DirectSendOptions) => TOpts;
}): ChannelOutboundAdapter;
//#endregion
export { formatQrPngDataUrl as A, estimateBase64DecodedBytes as B, DEFAULT_TIMEOUT_SECONDS as C, resolveChannelMediaMaxBytes as D, transcribeFirstAudio as E, MEDIA_FFMPEG_MAX_AUDIO_DURATION_SECS as F, MEDIA_FFMPEG_MAX_BUFFER_BYTES as I, MEDIA_FFMPEG_TIMEOUT_MS as L, renderQrPngDataUrl as M, writeQrPngTempFile as N, unlinkIfExists as O, resolveOutboundAttachmentFromUrl as P, MEDIA_FFPROBE_TIMEOUT_MS as R, DEFAULT_PROMPT as S, MIN_AUDIO_FILE_BYTES as T, CLI_OUTPUT_MAX_BUFFER as _, RunCapabilityResult as a, DEFAULT_MAX_CHARS_BY_CAPABILITY as b, resolveAutoImageModel as c, createMediaAttachmentCache as d, normalizeMediaAttachments as f, resolveDocumentMediaModel as g, resolveDefaultMediaModel as h, normalizeMediaProviderId as i, renderQrPngBase64 as j, renderQrTerminal as k, resolveMediaAttachmentLocalRoots as l, resolveAutoMediaKeyProviders as m, createScopedChannelMediaMaxBytesResolver as n, buildProviderRegistry as o, providerSupportsNativePdfDocument as p, resolveScopedChannelMediaMaxBytes as r, clearMediaUnderstandingBinaryCacheForTests as s, createDirectTextMediaOutbound as t, runCapability as u, DEFAULT_MAX_BYTES as v, DEFAULT_VIDEO_MAX_BASE64_BYTES as w, DEFAULT_MEDIA_CONCURRENCY as x, DEFAULT_MAX_CHARS as y, canonicalizeBase64 as z };