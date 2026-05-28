import { o as SsrFPolicy } from "./ssrf-skjEI_i5.js";
import { a as MediaKind } from "./constants-Bjv4FoLj.js";
//#region src/media/web-media.d.ts
type WebMediaResult = {
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
  workspaceDir?: string; /** Allowed root directories for local path reads. "any" is deprecated; prefer sandboxValidated + readFile. */
  localRoots?: readonly string[] | "any"; /** Channel inbound attachment root patterns checked with inbound path policy semantics. */
  inboundRoots?: readonly string[]; /** Caller already validated the local path (sandbox/other guards); requires readFile override. */
  sandboxValidated?: boolean;
  readFile?: (filePath: string) => Promise<Buffer>; /** Host-local fs-policy read piggyback; rejects plaintext-like document sends. */
  hostReadCapability?: boolean;
};
type ImageQualityPreference = "auto" | "efficient" | "balanced" | "high";
type ImageCompressionModelPolicy = {
  maxBytes?: number;
  maxPixels?: number;
  maxSidePx?: number;
  preferredSidePx?: number;
};
type ImageCompressionPolicy = {
  quality?: ImageQualityPreference;
  models?: ImageCompressionModelPolicy[];
  imageCount?: number;
};
declare function loadWebMedia(mediaUrl: string, maxBytesOrOptions?: number | WebMediaOptions, options?: {
  ssrfPolicy?: SsrFPolicy;
  localRoots?: readonly string[] | "any";
}): Promise<WebMediaResult>;
declare function loadWebMediaRaw(mediaUrl: string, maxBytesOrOptions?: number | WebMediaOptions, options?: {
  ssrfPolicy?: SsrFPolicy;
  localRoots?: readonly string[] | "any";
}): Promise<WebMediaResult>;
declare function optimizeImageToJpeg(buffer: Buffer, maxBytes: number, opts?: {
  contentType?: string;
  fileName?: string;
  imageCompression?: ImageCompressionPolicy;
}): Promise<{
  buffer: Buffer;
  optimizedSize: number;
  resizeSide: number;
  quality: number;
}>;
//#endregion
export { optimizeImageToJpeg as i, loadWebMedia as n, loadWebMediaRaw as r, WebMediaResult as t };