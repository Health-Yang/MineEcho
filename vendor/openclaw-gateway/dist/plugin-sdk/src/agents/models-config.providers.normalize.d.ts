import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { PluginManifestRecord } from "../plugins/manifest-registry.js";
import type { SecretDefaults } from "./models-config.providers.secret-helpers.js";
type ModelsConfig = NonNullable<OpenClawConfig["models"]>;
type ProviderModelNormalizationOptions = {
    manifestPlugins?: readonly Pick<PluginManifestRecord, "modelIdNormalization">[];
};
export declare function normalizeProviderCatalogModelsForConfig(providers: ModelsConfig["providers"], options?: ProviderModelNormalizationOptions): ModelsConfig["providers"];
export declare function normalizeProviders(params: {
    providers: ModelsConfig["providers"];
    agentDir: string;
    env?: NodeJS.ProcessEnv;
    secretDefaults?: SecretDefaults;
    sourceProviders?: ModelsConfig["providers"];
    sourceSecretDefaults?: SecretDefaults;
    secretRefManagedProviders?: Set<string>;
    manifestPlugins?: ProviderModelNormalizationOptions["manifestPlugins"];
}): ModelsConfig["providers"];
export {};
