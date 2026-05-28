import type { DescribeImageFileParams, DescribeImageFileWithModelParams, DescribeVideoFileParams, ExtractStructuredWithModelParams, RunMediaUnderstandingFileParams, RunMediaUnderstandingFileResult, TranscribeAudioFileParams } from "./runtime-types.js";
export type { DescribeImageFileParams, DescribeImageFileWithModelParams, DescribeVideoFileParams, ExtractStructuredWithModelParams, RunMediaUnderstandingFileParams, RunMediaUnderstandingFileResult, TranscribeAudioFileParams, } from "./runtime-types.js";
export declare function runMediaUnderstandingFile(params: RunMediaUnderstandingFileParams): Promise<RunMediaUnderstandingFileResult>;
export declare function describeImageFile(params: DescribeImageFileParams): Promise<RunMediaUnderstandingFileResult>;
export declare function describeImageFileWithModel(params: DescribeImageFileWithModelParams): Promise<import("./types.ts").ImageDescriptionResult>;
export declare function extractStructuredWithModel(params: ExtractStructuredWithModelParams): Promise<import("./types.ts").StructuredExtractionResult>;
export declare function describeVideoFile(params: DescribeVideoFileParams): Promise<RunMediaUnderstandingFileResult>;
export declare function transcribeAudioFile(params: TranscribeAudioFileParams): Promise<RunMediaUnderstandingFileResult>;
