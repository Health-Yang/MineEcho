import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { l as SecretInput } from "./types.secrets-tbFW-hY6.js";

//#region src/plugins/embedding-provider-types.d.ts
type EmbeddingInput = string | {
  text: string;
  parts?: Array<{
    type: "text";
    text: string;
  } | {
    type: "inline-data";
    mimeType: string;
    data: string;
  }>;
};
type EmbeddingProviderCallOptions = {
  signal?: AbortSignal;
  inputType?: "query" | "document" | "semantic" | "classification" | "clustering";
};
type EmbeddingProviderRuntime = {
  id: string;
  cacheKeyData?: Record<string, unknown>;
  inlineQueryTimeoutMs?: number;
  inlineBatchTimeoutMs?: number;
};
type EmbeddingProvider = {
  id: string;
  model: string;
  dimensions?: number;
  maxInputTokens?: number;
  embed: (input: EmbeddingInput, options?: EmbeddingProviderCallOptions) => Promise<number[]>;
  embedBatch: (inputs: EmbeddingInput[], options?: EmbeddingProviderCallOptions) => Promise<number[][]>;
  close?: () => Promise<void> | void;
};
type EmbeddingProviderCreateOptions = {
  config: OpenClawConfig;
  agentDir?: string;
  provider?: string;
  remote?: {
    baseUrl?: string;
    apiKey?: SecretInput;
    headers?: Record<string, string>;
  };
  model: string;
  inputType?: string;
  queryInputType?: string;
  documentInputType?: string;
  local?: {
    modelPath?: string;
    modelCacheDir?: string;
  };
  dimensions?: number;
  taskType?: string;
};
type EmbeddingProviderCreateResult = {
  provider: EmbeddingProvider | null;
  runtime?: EmbeddingProviderRuntime;
};
type EmbeddingProviderAdapter = {
  id: string;
  defaultModel?: string;
  transport?: "local" | "remote";
  authProviderId?: string;
  create: (options: EmbeddingProviderCreateOptions) => Promise<EmbeddingProviderCreateResult>;
  formatSetupError?: (err: unknown) => string;
};
type RegisteredEmbeddingProvider = {
  adapter: EmbeddingProviderAdapter;
  ownerPluginId?: string;
};
//#endregion
//#region src/plugins/embedding-providers.d.ts
declare function registerEmbeddingProvider(adapter: EmbeddingProviderAdapter, options?: {
  ownerPluginId?: string;
}): void;
declare function getRegisteredEmbeddingProvider(id: string): RegisteredEmbeddingProvider | undefined;
declare function listRegisteredEmbeddingProviders(): RegisteredEmbeddingProvider[];
declare function restoreRegisteredEmbeddingProviders(entries: RegisteredEmbeddingProvider[]): void;
declare function clearEmbeddingProviders(): void;
//#endregion
export { restoreRegisteredEmbeddingProviders as a, EmbeddingProviderAdapter as c, EmbeddingProviderCreateResult as d, EmbeddingProviderRuntime as f, registerEmbeddingProvider as i, EmbeddingProviderCallOptions as l, getRegisteredEmbeddingProvider as n, EmbeddingInput as o, RegisteredEmbeddingProvider as p, listRegisteredEmbeddingProviders as r, EmbeddingProvider as s, clearEmbeddingProviders as t, EmbeddingProviderCreateOptions as u };