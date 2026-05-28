import { type ImageProbe, type ImageMetadata } from "rastermill";
export type { ImageMetadata, ImageProbe };
export declare class ImageProcessorUnavailableError extends Error {
    readonly code = "IMAGE_PROCESSOR_UNAVAILABLE";
    readonly operation: string;
    readonly causes: unknown[];
    constructor(operation: string, message?: string, causes?: unknown[]);
}
export type ResizeToJpegParams = {
    buffer: Buffer;
    maxSide: number;
    quality: number;
    withoutEnlargement?: boolean;
};
export type ResizeToPngParams = {
    buffer: Buffer;
    maxSide: number;
    compressionLevel?: number;
    withoutEnlargement?: boolean;
};
export declare const IMAGE_REDUCE_QUALITY_STEPS: readonly [85, 75, 65, 55, 45, 35];
export declare const MAX_IMAGE_INPUT_PIXELS = 25000000;
export declare function createImageProcessor(): import("rastermill").Rastermill;
export declare function isImageProcessorUnavailableError(err: unknown): boolean;
export declare function buildImageResizeSideGrid(maxSide: number, sideStart: number): number[];
export declare function readImageMetadataFromHeader(buffer: Buffer): ImageMetadata | null;
export declare function readImageProbeFromHeader(buffer: Buffer): ImageProbe | null;
export declare function getImageMetadata(buffer: Buffer): Promise<ImageMetadata | null>;
export declare function normalizeExifOrientation(buffer: Buffer): Promise<Buffer>;
export declare function resizeToJpeg(params: ResizeToJpegParams): Promise<Buffer>;
export declare function convertHeicToJpeg(buffer: Buffer): Promise<Buffer>;
export declare function hasAlphaChannel(buffer: Buffer): Promise<boolean>;
export declare function resizeToPng(params: ResizeToPngParams): Promise<Buffer>;
export declare function optimizeImageToPng(buffer: Buffer, maxBytes: number, options?: {
    sides?: readonly number[];
}): Promise<{
    buffer: Buffer;
    optimizedSize: number;
    resizeSide: number;
    compressionLevel: number;
}>;
