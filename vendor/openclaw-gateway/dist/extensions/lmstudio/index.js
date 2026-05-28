import { t as createSubsystemLogger } from "../../subsystem-1gTaEPwP.js";
import { y as ssrfPolicyFromHttpBaseUrlAllowedHostname } from "../../ssrf-DcS_PaqX.js";
import { t as CUSTOM_LOCAL_AUTH_MARKER } from "../../model-auth-markers-BxvoYSZo.js";
import { s as createPlainTextToolCallCompatWrapper } from "../../provider-stream-shared-B1wEfslJ.js";
import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
import "../../provider-auth-CCtAcb6r.js";
import "../../ssrf-runtime-C8F9j9mo.js";
import "../../logging-core-DDIEOJyi.js";
import { F as LMSTUDIO_PROVIDER_LABEL, P as LMSTUDIO_PROVIDER_ID, c as resolveLmstudioRuntimeApiKey, f as shouldUseLmstudioSyntheticAuth, g as normalizeLmstudioConfiguredCatalogEntries, n as ensureLmstudioModelLoaded, o as resolveLmstudioProviderHeaders, v as normalizeLmstudioProviderConfig, w as LMSTUDIO_DEFAULT_API_KEY_ENV_VAR, y as resolveLmstudioInferenceBase } from "../../models.fetch-CyEH4yji.js";
import { t as lmstudioMemoryEmbeddingProviderAdapter } from "../../memory-embedding-adapter-BOXTMYw4.js";
import { streamSimple } from "@earendil-works/pi-ai";
//#region extensions/lmstudio/src/stream.ts
const log = createSubsystemLogger("extensions/lmstudio/stream");
const preloadInFlight = /* @__PURE__ */ new Map();
const preloadCooldown = /* @__PURE__ */ new Map();
const PRELOAD_BACKOFF_BASE_MS = 5e3;
const PRELOAD_BACKOFF_MAX_MS = 3e5;
function computePreloadBackoffMs(consecutiveFailures) {
	const raw = PRELOAD_BACKOFF_BASE_MS * 2 ** Math.max(0, consecutiveFailures - 1);
	return Math.min(PRELOAD_BACKOFF_MAX_MS, raw);
}
function recordPreloadSuccess(preloadKey) {
	preloadCooldown.delete(preloadKey);
}
function recordPreloadFailure(preloadKey, now) {
	const consecutiveFailures = (preloadCooldown.get(preloadKey)?.consecutiveFailures ?? 0) + 1;
	const entry = {
		consecutiveFailures,
		untilMs: now + computePreloadBackoffMs(consecutiveFailures)
	};
	preloadCooldown.set(preloadKey, entry);
	return entry;
}
function isPreloadCoolingDown(preloadKey, now) {
	const entry = preloadCooldown.get(preloadKey);
	if (!entry) return;
	if (entry.untilMs <= now) {
		preloadCooldown.delete(preloadKey);
		return;
	}
	return entry;
}
function normalizeLmstudioModelKey(modelId) {
	const trimmed = modelId.trim();
	if (trimmed.toLowerCase().startsWith("lmstudio/")) return trimmed.slice(9).trim();
	return trimmed;
}
function resolveRequestedContextLength(model) {
	const withContextTokens = model;
	const contextTokens = typeof withContextTokens.contextTokens === "number" && Number.isFinite(withContextTokens.contextTokens) ? Math.floor(withContextTokens.contextTokens) : void 0;
	if (contextTokens && contextTokens > 0) return contextTokens;
	const contextWindow = typeof model.contextWindow === "number" && Number.isFinite(model.contextWindow) ? Math.floor(model.contextWindow) : void 0;
	if (contextWindow && contextWindow > 0) return contextWindow;
}
function resolveModelHeaders(model) {
	if (!model.headers || typeof model.headers !== "object" || Array.isArray(model.headers)) return;
	return model.headers;
}
function toRecord(value) {
	return value && typeof value === "object" ? value : void 0;
}
function shouldPreloadLmstudioModels(value) {
	return toRecord(toRecord(value)?.params)?.preload !== false;
}
function withLmstudioUsageCompat(model) {
	return {
		...model,
		compat: {
			...model.compat && typeof model.compat === "object" ? model.compat : {},
			supportsUsageInStreaming: true
		}
	};
}
function createPreloadKey(params) {
	return `${params.baseUrl}::${params.modelKey}::${params.requestedContextLength ?? "default"}`;
}
async function ensureLmstudioModelLoadedBestEffort(params) {
	const providerHeaders = {
		...(params.ctx.config?.models?.providers?.[LMSTUDIO_PROVIDER_ID])?.headers,
		...params.modelHeaders
	};
	const runtimeApiKey = typeof params.options?.apiKey === "string" && params.options.apiKey.trim().length > 0 ? params.options.apiKey.trim() : void 0;
	const headers = await resolveLmstudioProviderHeaders({
		config: params.ctx.config,
		headers: providerHeaders
	});
	const configuredApiKey = runtimeApiKey !== void 0 ? void 0 : await resolveLmstudioRuntimeApiKey({
		config: params.ctx.config,
		agentDir: params.ctx.agentDir,
		headers: providerHeaders
	});
	await ensureLmstudioModelLoaded({
		baseUrl: params.baseUrl,
		apiKey: runtimeApiKey ?? configuredApiKey,
		headers,
		ssrfPolicy: ssrfPolicyFromHttpBaseUrlAllowedHostname(params.baseUrl),
		modelKey: params.modelKey,
		requestedContextLength: params.requestedContextLength
	});
}
function wrapLmstudioInferencePreload(ctx) {
	const underlying = ctx.streamFn ?? streamSimple;
	const streamWithPlainTextToolCalls = createPlainTextToolCallCompatWrapper(underlying);
	return (model, context, options) => {
		if (model.provider !== "lmstudio") return underlying(model, context, options);
		const modelKey = normalizeLmstudioModelKey(model.id);
		if (!modelKey) return underlying(model, context, options);
		const providerConfig = ctx.config?.models?.providers?.[LMSTUDIO_PROVIDER_ID];
		if (!shouldPreloadLmstudioModels(providerConfig)) return streamWithPlainTextToolCalls(withLmstudioUsageCompat(model), context, options);
		const providerBaseUrl = providerConfig?.baseUrl;
		const resolvedBaseUrl = resolveLmstudioInferenceBase(typeof model.baseUrl === "string" ? model.baseUrl : providerBaseUrl);
		const requestedContextLength = resolveRequestedContextLength(model);
		const preloadKey = createPreloadKey({
			baseUrl: resolvedBaseUrl,
			modelKey,
			requestedContextLength
		});
		const cooldownEntry = isPreloadCoolingDown(preloadKey, Date.now());
		const preloadPromise = preloadInFlight.get(preloadKey) ?? (cooldownEntry ? void 0 : (() => {
			const created = ensureLmstudioModelLoadedBestEffort({
				baseUrl: resolvedBaseUrl,
				modelKey,
				requestedContextLength,
				options,
				ctx,
				modelHeaders: resolveModelHeaders(model)
			}).then(() => {
				recordPreloadSuccess(preloadKey);
			}, (error) => {
				const entry = recordPreloadFailure(preloadKey, Date.now());
				throw Object.assign(/* @__PURE__ */ new Error("preload-failed"), {
					cause: error,
					consecutiveFailures: entry.consecutiveFailures,
					cooldownMs: entry.untilMs - Date.now()
				});
			}).finally(() => {
				preloadInFlight.delete(preloadKey);
			});
			preloadInFlight.set(preloadKey, created);
			return created;
		})());
		return (async () => {
			if (preloadPromise) try {
				await preloadPromise;
			} catch (error) {
				const annotated = error;
				const cause = annotated.cause ?? error;
				const failures = annotated.consecutiveFailures ?? 1;
				const cooldownSec = Math.max(0, Math.round((annotated.cooldownMs ?? 0) / 1e3));
				log.warn(`LM Studio inference preload failed for "${modelKey}" (${failures} consecutive failure${failures === 1 ? "" : "s"}, next preload attempt skipped for ~${cooldownSec}s); continuing without preload: ${String(cause)}`);
			}
			else if (cooldownEntry) log.debug(`LM Studio inference preload for "${modelKey}" skipped while backoff active (${cooldownEntry.consecutiveFailures} prior failures)`);
			const stream = streamWithPlainTextToolCalls(withLmstudioUsageCompat(model), context, options);
			return stream instanceof Promise ? await stream : stream;
		})();
	};
}
//#endregion
//#region extensions/lmstudio/index.ts
const PROVIDER_ID = "lmstudio";
const cachedDynamicModels = /* @__PURE__ */ new Map();
function resolveLmstudioAugmentedCatalogEntries(config) {
	if (!config) return [];
	return normalizeLmstudioConfiguredCatalogEntries(config.models?.providers?.lmstudio?.models).map((entry) => ({
		provider: PROVIDER_ID,
		id: entry.id,
		name: entry.name ?? entry.id,
		compat: {
			...entry.compat,
			supportsUsageInStreaming: true
		},
		contextWindow: entry.contextWindow,
		contextTokens: entry.contextTokens,
		reasoning: entry.reasoning,
		input: entry.input
	}));
}
/** Lazily loads setup helpers so provider wiring stays lightweight at startup. */
async function loadProviderSetup() {
	return await import("./api.js");
}
var lmstudio_default = definePluginEntry({
	id: PROVIDER_ID,
	name: "LM Studio Provider",
	description: "Bundled LM Studio provider plugin",
	register(api) {
		api.registerMemoryEmbeddingProvider(lmstudioMemoryEmbeddingProviderAdapter);
		api.registerProvider({
			id: PROVIDER_ID,
			label: "LM Studio",
			docsPath: "/providers/lmstudio",
			envVars: [LMSTUDIO_DEFAULT_API_KEY_ENV_VAR],
			auth: [{
				id: "custom",
				label: LMSTUDIO_PROVIDER_LABEL,
				hint: "Local/self-hosted LM Studio server",
				kind: "custom",
				run: async (ctx) => {
					return await (await loadProviderSetup()).promptAndConfigureLmstudioInteractive({
						config: ctx.config,
						agentDir: ctx.agentDir,
						prompter: ctx.prompter,
						secretInputMode: ctx.secretInputMode,
						allowSecretRefPrompt: ctx.allowSecretRefPrompt
					});
				},
				runNonInteractive: async (ctx) => {
					return await (await loadProviderSetup()).configureLmstudioNonInteractive(ctx);
				}
			}],
			catalog: {
				order: "late",
				run: async (ctx) => {
					return await (await loadProviderSetup()).discoverLmstudioProvider(ctx);
				}
			},
			resolveSyntheticAuth: ({ providerConfig }) => {
				if (!shouldUseLmstudioSyntheticAuth(providerConfig)) return;
				return {
					apiKey: CUSTOM_LOCAL_AUTH_MARKER,
					source: "models.providers.lmstudio (synthetic local key)",
					mode: "api-key"
				};
			},
			shouldDeferSyntheticProfileAuth: ({ resolvedApiKey }) => resolvedApiKey?.trim() === "lmstudio-local" || resolvedApiKey?.trim() === "custom-local",
			normalizeConfig: ({ providerConfig }) => normalizeLmstudioProviderConfig(providerConfig),
			prepareDynamicModel: async (ctx) => {
				const providerSetup = await loadProviderSetup();
				cachedDynamicModels.set(ctx.providerConfig?.baseUrl ?? "", await providerSetup.prepareLmstudioDynamicModels(ctx));
			},
			resolveDynamicModel: (ctx) => cachedDynamicModels.get(ctx.providerConfig?.baseUrl ?? "")?.find((model) => model.id === ctx.modelId),
			augmentModelCatalog: (ctx) => resolveLmstudioAugmentedCatalogEntries(ctx.config),
			wrapStreamFn: wrapLmstudioInferencePreload,
			wizard: {
				setup: {
					choiceId: PROVIDER_ID,
					choiceLabel: "LM Studio",
					choiceHint: "Local/self-hosted LM Studio server",
					groupId: PROVIDER_ID,
					groupLabel: "LM Studio",
					groupHint: "Self-hosted open-weight models",
					methodId: "custom"
				},
				modelPicker: {
					label: "LM Studio (custom)",
					hint: "Detect models from LM Studio /api/v1/models",
					methodId: "custom"
				}
			}
		});
	}
});
//#endregion
export { lmstudio_default as default };
