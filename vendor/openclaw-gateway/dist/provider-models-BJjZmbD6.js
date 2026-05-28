import { s as hasConfiguredSecretInput } from "./types.secrets-CtRQ27Ls.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { r as fetchWithTimeout } from "./fetch-timeout-yG8tB5AA.js";
import "./runtime-env-CcOqZeJj.js";
import { r as isProviderApiKeyConfigured } from "./provider-auth-CCtAcb6r.js";
import "./secret-input-BrsvLCK3.js";
import "./provider-http-CDs6F6rL.js";
import { n as buildManifestModelProviderConfig } from "./provider-catalog-shared-DGUcvumn.js";
//#region extensions/deepinfra/openclaw.plugin.json
var modelCatalog = {
	"providers": { "deepinfra": {
		"baseUrl": "https://api.deepinfra.com/v1/openai",
		"api": "openai-completions",
		"models": [
			{
				"id": "deepseek-ai/DeepSeek-V4-Flash",
				"name": "DeepSeek V4 Flash",
				"reasoning": true,
				"input": ["text"],
				"contextWindow": 1048576,
				"maxTokens": 1048576,
				"cost": {
					"input": .1,
					"output": .2,
					"cacheRead": .02,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "deepseek-ai/DeepSeek-V3.2",
				"name": "DeepSeek V3.2",
				"reasoning": false,
				"input": ["text"],
				"contextWindow": 163840,
				"maxTokens": 163840,
				"cost": {
					"input": .26,
					"output": .38,
					"cacheRead": .13,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "zai-org/GLM-5.1",
				"name": "GLM-5.1",
				"reasoning": true,
				"input": ["text"],
				"contextWindow": 202752,
				"maxTokens": 202752,
				"cost": {
					"input": 1.05,
					"output": 3.5,
					"cacheRead": .205000005,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "stepfun-ai/Step-3.5-Flash",
				"name": "Step 3.5 Flash",
				"reasoning": false,
				"input": ["text"],
				"contextWindow": 262144,
				"maxTokens": 262144,
				"cost": {
					"input": .1,
					"output": .3,
					"cacheRead": .02,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "MiniMaxAI/MiniMax-M2.5",
				"name": "MiniMax M2.5",
				"reasoning": true,
				"input": ["text"],
				"contextWindow": 196608,
				"maxTokens": 196608,
				"cost": {
					"input": .15,
					"output": 1.15,
					"cacheRead": .03,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "moonshotai/Kimi-K2.5",
				"name": "Kimi K2.5",
				"reasoning": true,
				"input": ["text", "image"],
				"contextWindow": 262144,
				"maxTokens": 262144,
				"cost": {
					"input": .45,
					"output": 2.25,
					"cacheRead": .070000002,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B",
				"name": "NVIDIA Nemotron 3 Super 120B A12B",
				"reasoning": true,
				"input": ["text"],
				"contextWindow": 262144,
				"maxTokens": 262144,
				"cost": {
					"input": .1,
					"output": .5,
					"cacheRead": 0,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			},
			{
				"id": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
				"name": "Llama 3.3 70B Instruct Turbo",
				"reasoning": false,
				"input": ["text"],
				"contextWindow": 131072,
				"maxTokens": 131072,
				"cost": {
					"input": .1,
					"output": .32,
					"cacheRead": 0,
					"cacheWrite": 0
				},
				"compat": { "supportsUsageInStreaming": true }
			}
		]
	} },
	"discovery": { "deepinfra": "refreshable" }
};
//#endregion
//#region extensions/deepinfra/provider-models.ts
const log = createSubsystemLogger("deepinfra-models");
const DEEPINFRA_MANIFEST_PROVIDER = buildManifestModelProviderConfig({
	providerId: "deepinfra",
	catalog: modelCatalog.providers.deepinfra
});
const DEEPINFRA_BASE_URL = DEEPINFRA_MANIFEST_PROVIDER.baseUrl;
const DEEPINFRA_MODELS_URL = `${DEEPINFRA_BASE_URL}/models?sort_by=openclaw&filter=with_meta`;
const DEEPINFRA_DEFAULT_MODEL_ID = "deepseek-ai/DeepSeek-V4-Flash";
const DEEPINFRA_DEFAULT_MODEL_REF = `deepinfra/${DEEPINFRA_DEFAULT_MODEL_ID}`;
const DEEPINFRA_DEFAULT_CONTEXT_WINDOW = 128e3;
const DEEPINFRA_DEFAULT_MAX_TOKENS = 8192;
const DEEPINFRA_MODEL_CATALOG = DEEPINFRA_MANIFEST_PROVIDER.models;
const DISCOVERY_TIMEOUT_MS = 5e3;
const DISCOVERY_CACHE_TTL_MS = 300 * 1e3;
let cachedCatalog = null;
let cachedAt = 0;
function resetDeepInfraModelCacheForTest() {
	cachedCatalog = null;
	cachedAt = 0;
}
const SURFACE_FOR_TAG = {
	chat: "chat",
	vlm: "vlm",
	embed: "embed",
	"image-gen": "image-gen",
	"video-gen": "video-gen",
	tts: "tts",
	stt: "stt"
};
function entryToSurfaceModel(entry) {
	const id = typeof entry?.id === "string" ? entry.id.trim() : "";
	if (!id) return null;
	const metadata = entry.metadata;
	if (!metadata) return null;
	const tags = Array.isArray(metadata.tags) ? metadata.tags.filter((t) => typeof t === "string") : [];
	const pricing = metadata.pricing ?? {};
	return {
		id,
		name: id,
		description: metadata.description ?? void 0,
		tags,
		contextWindow: typeof metadata.context_length === "number" ? metadata.context_length : void 0,
		maxTokens: typeof metadata.max_tokens === "number" ? metadata.max_tokens : void 0,
		pricing,
		defaultWidth: typeof metadata.default_width === "number" ? metadata.default_width : void 0,
		defaultHeight: typeof metadata.default_height === "number" ? metadata.default_height : void 0,
		defaultIterations: typeof metadata.default_iterations === "number" ? metadata.default_iterations : void 0
	};
}
function bucketBySurface(models) {
	const catalog = {
		chat: [],
		vlm: [],
		embed: [],
		imageGen: [],
		videoGen: [],
		tts: [],
		stt: [],
		live: true
	};
	const buckets = {
		chat: catalog.chat,
		vlm: catalog.vlm,
		embed: catalog.embed,
		"image-gen": catalog.imageGen,
		"video-gen": catalog.videoGen,
		tts: catalog.tts,
		stt: catalog.stt
	};
	for (const model of models) {
		const seen = /* @__PURE__ */ new Set();
		for (const tag of model.tags) {
			const surface = SURFACE_FOR_TAG[tag];
			if (surface && !seen.has(surface)) {
				seen.add(surface);
				buckets[surface].push(model);
			}
		}
	}
	return catalog;
}
function manifestChatEntryToSurfaceModel(entry) {
	const cost = entry.cost ?? {};
	const pricing = {};
	if (typeof cost.input === "number") pricing.input_tokens = cost.input;
	if (typeof cost.output === "number") pricing.output_tokens = cost.output;
	if (typeof cost.cacheRead === "number" && cost.cacheRead > 0) pricing.cache_read_tokens = cost.cacheRead;
	const tags = ["chat"];
	if (entry.input?.includes("image")) tags.push("vlm");
	if (entry.reasoning) tags.push("reasoning");
	return {
		id: entry.id,
		name: entry.name ?? entry.id,
		tags,
		contextWindow: entry.contextWindow,
		maxTokens: entry.maxTokens,
		pricing
	};
}
const STATIC_NON_CHAT_FALLBACK = [
	{
		id: "black-forest-labs/FLUX-1-schnell",
		name: "black-forest-labs/FLUX-1-schnell",
		tags: ["image-gen"],
		pricing: { per_image_unit: .003 },
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultIterations: 4
	},
	{
		id: "black-forest-labs/FLUX-1-dev",
		name: "black-forest-labs/FLUX-1-dev",
		tags: ["image-gen"],
		pricing: { per_image_unit: .025 },
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultIterations: 28
	},
	{
		id: "Qwen/Qwen-Image-Max",
		name: "Qwen/Qwen-Image-Max",
		tags: ["image-gen"],
		pricing: { per_image_unit: .075 },
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultIterations: 28
	},
	{
		id: "stabilityai/sdxl-turbo",
		name: "stabilityai/sdxl-turbo",
		tags: ["image-gen"],
		pricing: { per_image_unit: 2e-4 },
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultIterations: 4
	},
	{
		id: "hexgrad/Kokoro-82M",
		name: "hexgrad/Kokoro-82M",
		tags: ["tts"],
		pricing: { input_characters: .65 }
	},
	{
		id: "Qwen/Qwen3-TTS",
		name: "Qwen/Qwen3-TTS",
		tags: ["tts"],
		pricing: { input_characters: .65 }
	},
	{
		id: "ResembleAI/chatterbox-turbo",
		name: "ResembleAI/chatterbox-turbo",
		tags: ["tts"],
		pricing: { input_characters: 1 }
	},
	{
		id: "sesame/csm-1b",
		name: "sesame/csm-1b",
		tags: ["tts"],
		pricing: { input_characters: 7 }
	},
	{
		id: "openai/whisper-large-v3-turbo",
		name: "openai/whisper-large-v3-turbo",
		tags: ["stt"],
		pricing: { input_seconds: 4e-5 }
	},
	{
		id: "BAAI/bge-m3",
		name: "BAAI/bge-m3",
		tags: ["embed"],
		pricing: { input_tokens: .01 },
		maxTokens: 8192,
		contextWindow: 8192
	}
];
function manifestFallbackCatalog() {
	const catalog = bucketBySurface([...(modelCatalog.providers.deepinfra.models ?? []).map(manifestChatEntryToSurfaceModel), ...STATIC_NON_CHAT_FALLBACK]);
	catalog.live = false;
	return catalog;
}
function getDeepInfraSurfaceFallbackCatalog() {
	return manifestFallbackCatalog();
}
function buildDeepInfraModelDefinition(model) {
	return {
		...model,
		compat: {
			...model.compat,
			supportsUsageInStreaming: model.compat?.supportsUsageInStreaming ?? true
		}
	};
}
function chatSurfaceModelToModelDefinition(model) {
	const input = model.tags.includes("vlm") ? ["text", "image"] : ["text"];
	const reasoning = model.tags.includes("reasoning") || model.tags.includes("reasoning_effort");
	return buildDeepInfraModelDefinition({
		id: model.id,
		name: model.name,
		reasoning,
		input,
		contextWindow: model.contextWindow ?? DEEPINFRA_DEFAULT_CONTEXT_WINDOW,
		maxTokens: model.maxTokens ?? DEEPINFRA_DEFAULT_MAX_TOKENS,
		cost: {
			input: model.pricing.input_tokens ?? 0,
			output: model.pricing.output_tokens ?? 0,
			cacheRead: model.pricing.cache_read_tokens ?? 0,
			cacheWrite: 0
		}
	});
}
function hasDeepInfraApiKey(options) {
	const fromEnv = (options?.env ?? process.env).DEEPINFRA_API_KEY;
	if (typeof fromEnv === "string" && fromEnv.trim() !== "") return true;
	const providers = options?.config?.models?.providers;
	for (const [providerId, provider] of Object.entries(providers ?? {})) if (providerId.trim().toLowerCase() === "deepinfra" && hasConfiguredSecretInput(provider?.apiKey, options?.config?.secrets?.defaults)) return true;
	return isProviderApiKeyConfigured({
		provider: "deepinfra",
		agentDir: options?.agentDir
	});
}
async function discoverDeepInfraSurfaces(options) {
	if (process.env.VITEST) return manifestFallbackCatalog();
	const env = options?.env ?? process.env;
	if (!(options?.hasApiKey ?? hasDeepInfraApiKey({
		env,
		agentDir: options?.agentDir
	}))) return manifestFallbackCatalog();
	if (cachedCatalog && Date.now() - cachedAt < DISCOVERY_CACHE_TTL_MS) return cachedCatalog;
	try {
		const response = await fetchWithTimeout(DEEPINFRA_MODELS_URL, { headers: { Accept: "application/json" } }, DISCOVERY_TIMEOUT_MS);
		if (!response.ok) {
			log.warn(`Failed to discover models: HTTP ${response.status}, using static catalog`);
			return manifestFallbackCatalog();
		}
		const body = await response.json();
		if (!Array.isArray(body.data) || body.data.length === 0) {
			log.warn("No models found from DeepInfra agent-projection endpoint, using static catalog");
			return manifestFallbackCatalog();
		}
		const seenIds = /* @__PURE__ */ new Set();
		const surfaceModels = [];
		for (const entry of body.data) {
			const model = entryToSurfaceModel(entry);
			if (!model || seenIds.has(model.id)) continue;
			seenIds.add(model.id);
			surfaceModels.push(model);
		}
		if (surfaceModels.length === 0) return manifestFallbackCatalog();
		const catalog = bucketBySurface(surfaceModels);
		cachedCatalog = catalog;
		cachedAt = Date.now();
		return catalog;
	} catch (error) {
		log.warn(`Discovery failed: ${String(error)}, using static catalog`);
		return manifestFallbackCatalog();
	}
}
async function discoverDeepInfraModels(options) {
	const catalog = await discoverDeepInfraSurfaces(options);
	const chatModels = catalog.chat.length > 0 ? catalog.chat : [...catalog.chat, ...catalog.vlm];
	if (chatModels.length === 0) return DEEPINFRA_MODEL_CATALOG.map(buildDeepInfraModelDefinition);
	const liveModels = chatModels.map(chatSurfaceModelToModelDefinition);
	const seen = new Set(liveModels.map((model) => model.id));
	const manifestModels = DEEPINFRA_MODEL_CATALOG.map(buildDeepInfraModelDefinition).filter((model) => {
		if (seen.has(model.id)) return false;
		seen.add(model.id);
		return true;
	});
	return [...liveModels, ...manifestModels];
}
//#endregion
export { DEEPINFRA_MODEL_CATALOG as a, discoverDeepInfraSurfaces as c, resetDeepInfraModelCacheForTest as d, DEEPINFRA_MODELS_URL as i, getDeepInfraSurfaceFallbackCatalog as l, DEEPINFRA_DEFAULT_MODEL_ID as n, buildDeepInfraModelDefinition as o, DEEPINFRA_DEFAULT_MODEL_REF as r, discoverDeepInfraModels as s, DEEPINFRA_BASE_URL as t, hasDeepInfraApiKey as u };
