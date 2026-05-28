import type { OpenClawConfig } from "../../config/types.openclaw.js";
import { resolveAutoMediaKeyProviders, resolveDefaultMediaModel } from "../../media-understanding/defaults.js";
import { buildMediaUnderstandingRegistry as buildProviderRegistry, getMediaUnderstandingProvider } from "../../media-understanding/provider-registry.js";
import type { ImageCompressionPolicy } from "../../media/web-media.js";
import { describeImageWithModel, describeImagesWithModel } from "../../plugin-sdk/media-understanding.js";
import type { AuthProfileStore } from "../auth-profiles/types.js";
import { resolveModelAsync } from "../pi-embedded-runner/model.js";
import { resolveBundledStaticCatalogModel } from "../pi-embedded-runner/model.static-catalog.js";
import { coerceImageAssistantText, decodeDataUrl, hasImageReasoningOnlyResponse, type ImageModelConfig } from "./image-tool.helpers.js";
import { type AnyAgentTool, type SandboxFsBridge, type ToolFsPolicy } from "./tool-runtime.helpers.js";
type ImageWebMediaRuntime = Pick<typeof import("../../media/web-media.js"), "loadWebMedia" | "optimizeImageBufferForWebMedia">;
declare function loadImageWebMediaRuntime(): Promise<ImageWebMediaRuntime>;
export declare const testing: {
    readonly decodeDataUrl: typeof decodeDataUrl;
    readonly coerceImageAssistantText: typeof coerceImageAssistantText;
    readonly hasImageReasoningOnlyResponse: typeof hasImageReasoningOnlyResponse;
    readonly resolveImageToolMaxTokens: typeof resolveImageToolMaxTokens;
    readonly resolveImageCompressionPolicy: typeof resolveImageCompressionPolicy;
    readonly setProviderDepsForTest: (overrides?: {
        buildProviderRegistry?: typeof buildProviderRegistry;
        getMediaUnderstandingProvider?: typeof getMediaUnderstandingProvider;
        describeImageWithModel?: typeof describeImageWithModel;
        describeImagesWithModel?: typeof describeImagesWithModel;
        resolveAutoMediaKeyProviders?: typeof resolveAutoMediaKeyProviders;
        resolveDefaultMediaModel?: typeof resolveDefaultMediaModel;
        resolveBundledStaticCatalogModel?: typeof resolveBundledStaticCatalogModel;
        resolveModelAsync?: typeof resolveModelAsync;
        loadImageWebMediaRuntime?: typeof loadImageWebMediaRuntime;
    }) => void;
};
declare function resolveImageToolMaxTokens(modelMaxTokens: number | undefined, requestedMaxTokens?: number): number;
/**
 * Resolve the effective image model config for the `image` tool.
 *
 * - Prefer explicit config (`agents.defaults.imageModel`).
 * - Otherwise, try to "pair" the primary model with an image-capable model:
 *   - same provider (best effort)
 *   - fall back to OpenAI/Anthropic when available
 */
export declare function resolveImageModelConfigForTool(params: {
    cfg?: OpenClawConfig;
    agentDir: string;
    workspaceDir?: string;
    authStore?: AuthProfileStore;
}): ImageModelConfig | null;
declare function resolveImageCompressionPolicy(params: {
    cfg?: OpenClawConfig;
    imageModelConfig?: ImageModelConfig | null;
    modelOverride?: string;
    imageCount: number;
    agentDir?: string;
    workspaceDir?: string;
}): Promise<ImageCompressionPolicy>;
type ImageSandboxConfig = {
    root: string;
    bridge: SandboxFsBridge;
};
export declare function createImageTool(options?: {
    config?: OpenClawConfig;
    agentDir?: string;
    authProfileStore?: AuthProfileStore;
    workspaceDir?: string;
    sandbox?: ImageSandboxConfig;
    fsPolicy?: ToolFsPolicy;
    agentChannel?: string | null;
    agentAccountId?: string | null;
    currentChannelId?: string | null;
    /** If true, the model has native vision capability and images in the prompt are auto-injected */
    modelHasVision?: boolean;
    /**
     * Avoid resolving auto image-provider/model candidates while registering the
     * tool. The concrete image model is still resolved before execution.
     */
    deferAutoModelResolution?: boolean;
}): AnyAgentTool | null;
export { testing as __testing };
