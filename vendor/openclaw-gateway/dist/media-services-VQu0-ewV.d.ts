import { ImageMetadata } from "rastermill";

//#region src/media/local-media-access.d.ts
type LocalMediaAccessErrorCode = "path-not-allowed" | "invalid-root" | "invalid-file-url" | "network-path-not-allowed" | "unsafe-bypass" | "not-found" | "invalid-path" | "not-file";
declare class LocalMediaAccessError extends Error {
  code: LocalMediaAccessErrorCode;
  constructor(code: LocalMediaAccessErrorCode, message: string, options?: ErrorOptions);
}
declare function getDefaultLocalRoots(): readonly string[];
declare function assertLocalMediaAllowed(mediaPath: string, localRoots: readonly string[] | "any" | undefined, options?: {
  inboundRoots?: readonly string[];
}): Promise<void>;
//#endregion
//#region src/media/audio-transcode.d.ts
declare function transcodeAudioBufferToOpus(params: {
  audioBuffer: Buffer;
  inputExtension?: string;
  inputFileName?: string;
  tempPrefix?: string;
  outputFileName?: string;
  timeoutMs?: number;
  sampleRateHz?: number;
  bitrate?: string;
  channels?: number;
}): Promise<Buffer>;
type AudioContainerTranscodeOutcome = {
  ok: true;
  buffer: Buffer;
} | {
  ok: false;
  reason: "platform-unsupported" | "invalid-extension" | "noop-same-container" | "no-recipe" | "transcoder-failed";
  detail?: string;
};
declare function transcodeAudioBuffer(params: {
  audioBuffer: Buffer;
  sourceExtension: string;
  targetExtension: string;
  timeoutMs?: number;
}): Promise<AudioContainerTranscodeOutcome>;
//#endregion
//#region src/media/ffmpeg-exec.d.ts
type MediaExecOptions = {
  timeoutMs?: number;
  maxBufferBytes?: number;
  input?: Buffer | string;
};
declare function resolveFfmpegBin(): string;
declare function runFfprobe(args: string[], options?: MediaExecOptions): Promise<string>;
declare function runFfmpeg(args: string[], options?: MediaExecOptions): Promise<string>;
declare function parseFfprobeCsvFields(stdout: string, maxFields: number): string[];
declare function parseFfprobeCodecAndSampleRate(stdout: string): {
  codec: string | null;
  sampleRateHz: number | null;
};
//#endregion
//#region src/media/image-ops.d.ts
declare class ImageProcessorUnavailableError extends Error {
  readonly code = "IMAGE_PROCESSOR_UNAVAILABLE";
  readonly operation: string;
  readonly causes: unknown[];
  constructor(operation: string, message?: string, causes?: unknown[]);
}
type ResizeToJpegParams = {
  buffer: Buffer;
  maxSide: number;
  quality: number;
  withoutEnlargement?: boolean;
};
type ResizeToPngParams = {
  buffer: Buffer;
  maxSide: number;
  compressionLevel?: number;
  withoutEnlargement?: boolean;
};
declare const IMAGE_REDUCE_QUALITY_STEPS: readonly [85, 75, 65, 55, 45, 35];
declare const MAX_IMAGE_INPUT_PIXELS = 25000000;
declare function isImageProcessorUnavailableError(err: unknown): boolean;
declare function buildImageResizeSideGrid(maxSide: number, sideStart: number): number[];
declare function getImageMetadata(buffer: Buffer): Promise<ImageMetadata | null>;
declare function normalizeExifOrientation(buffer: Buffer): Promise<Buffer>;
declare function resizeToJpeg(params: ResizeToJpegParams): Promise<Buffer>;
declare function convertHeicToJpeg(buffer: Buffer): Promise<Buffer>;
declare function hasAlphaChannel(buffer: Buffer): Promise<boolean>;
declare function resizeToPng(params: ResizeToPngParams): Promise<Buffer>;
declare function optimizeImageToPng(buffer: Buffer, maxBytes: number, options?: {
  sides?: readonly number[];
}): Promise<{
  buffer: Buffer;
  optimizedSize: number;
  resizeSide: number;
  compressionLevel: number;
}>;
//#endregion
//#region src/media/video-dimensions.d.ts
type VideoDimensions = {
  width: number;
  height: number;
};
declare function parseFfprobeVideoDimensions(stdout: string): VideoDimensions | undefined;
declare function probeVideoDimensions(buffer: Buffer): Promise<VideoDimensions | undefined>;
//#endregion
export { AudioContainerTranscodeOutcome as C, LocalMediaAccessErrorCode as D, LocalMediaAccessError as E, assertLocalMediaAllowed as O, runFfprobe as S, transcodeAudioBufferToOpus as T, MediaExecOptions as _, ImageMetadata as a, resolveFfmpegBin as b, buildImageResizeSideGrid as c, hasAlphaChannel as d, isImageProcessorUnavailableError as f, resizeToPng as g, resizeToJpeg as h, IMAGE_REDUCE_QUALITY_STEPS as i, getDefaultLocalRoots as k, convertHeicToJpeg as l, optimizeImageToPng as m, parseFfprobeVideoDimensions as n, ImageProcessorUnavailableError as o, normalizeExifOrientation as p, probeVideoDimensions as r, MAX_IMAGE_INPUT_PIXELS as s, VideoDimensions as t, getImageMetadata as u, parseFfprobeCodecAndSampleRate as v, transcodeAudioBuffer as w, runFfmpeg as x, parseFfprobeCsvFields as y };