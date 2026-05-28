import type { SsrFPolicy } from "../infra/net/ssrf.js";
import { type MediaKind } from "./constants.js";
import { getDefaultLocalRoots, LocalMediaAccessError, type LocalMediaAccessErrorCode } from "./local-media-access.js";
export { getDefaultLocalRoots, LocalMediaAccessError };
export type { LocalMediaAccessErrorCode };
export type WebMediaResult = {
    buffer: Buffer;
    contentType?: string;
    kind: MediaKind | undefined;
    fileName?: string;
};
type WebMediaOptions = {
    maxBytes?: number;
    optimizeImages?: boolean;
    imageCompression?: ImageCompressionPolicy;
    ssrfPolicy?: SsrFPolicy;
    proxyUrl?: string;
    fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    requestInit?: RequestInit;
    readIdleTimeoutMs?: number;
    trustExplicitProxyDns?: boolean;
    workspaceDir?: string;
    /** Allowed root directories for local path reads. "any" is deprecated; prefer sandboxValidated + readFile. */
    localRoots?: readonly string[] | "any";
    /** Channel inbound attachment root patterns checked with inbound path policy semantics. */
    inboundRoots?: readonly string[];
    /** Caller already validated the local path (sandbox/other guards); requires readFile override. */
    sandboxValidated?: boolean;
    readFile?: (filePath: string) => Promise<Buffer>;
    /** Host-local fs-policy read piggyback; rejects plaintext-like document sends. */
    hostReadCapability?: boolean;
};
export type ImageQualityPreference = "auto" | "efficient" | "balanced" | "high";
export type ImageCompressionModelPolicy = {
    maxBytes?: number;
    maxPixels?: number;
    maxSidePx?: number;
    preferredSidePx?: number;
};
export type ImageCompressionPolicy = {
    quality?: ImageQualityPreference;
    models?: ImageCompressionModelPolicy[];
    imageCount?: number;
};
export declare function effectiveImageBytesCap(baseCap: number | undefined, policy?: ImageCompressionPolicy): number | undefined;
export declare function resolveImageCompressionGrid(policy?: ImageCompressionPolicy): {
    sides: number[];
    qualities: number[];
};
export declare function optimizeImageBufferForWebMedia(params: {
    buffer: Buffer;
    contentType?: string;
    fileName?: string;
    maxBytes?: number;
    imageCompression?: ImageCompressionPolicy;
}): Promise<WebMediaResult>;
export declare function loadWebMedia(mediaUrl: string, maxBytesOrOptions?: number | WebMediaOptions, options?: {
    ssrfPolicy?: SsrFPolicy;
    localRoots?: readonly string[] | "any";
}): Promise<WebMediaResult>;
export declare function loadWebMediaRaw(mediaUrl: string, maxBytesOrOptions?: number | WebMediaOptions, options?: {
    ssrfPolicy?: SsrFPolicy;
    localRoots?: readonly string[] | "any";
}): Promise<WebMediaResult>;
export declare function optimizeImageToJpeg(buffer: Buffer, maxBytes: number, opts?: {
    contentType?: string;
    fileName?: string;
    imageCompression?: ImageCompressionPolicy;
}): Promise<{
    buffer: Buffer;
    optimizedSize: number;
    resizeSide: number;
    quality: number;
}>;
export { optimizeImageToPng } from "./media-services.js";
