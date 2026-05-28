type BundledChannelConfigMetadata = {
    pluginId: string;
    channelId: string;
    aliases?: readonly string[];
    order?: number;
    configurable?: boolean;
    channelEnvVars?: readonly string[];
    label?: string;
    description?: string;
    schema: Record<string, unknown>;
    uiHints?: Record<string, unknown>;
    unsupportedSecretRefSurfacePatterns?: readonly string[];
};
export declare const GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA: readonly BundledChannelConfigMetadata[];
export {};
