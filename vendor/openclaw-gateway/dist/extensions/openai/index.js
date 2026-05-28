import { n as buildProviderToolCompatFamilyHooks } from "../../provider-tools-BUevcQsJ.js";
import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
import { r as resolvePluginConfigObject } from "../../plugin-config-runtime-CbVZSjfC.js";
import { t as buildOpenAIImageGenerationProvider } from "../../image-generation-provider-CUEDlONF.js";
import { n as openaiMediaUnderstandingProvider, t as openaiCodexMediaUnderstandingProvider } from "../../media-understanding-provider-ou9NJI5a.js";
import { t as openAiMemoryEmbeddingProviderAdapter } from "../../memory-embedding-adapter-Bvkwnyok.js";
import { t as buildOpenAICodexProviderPlugin } from "../../openai-codex-provider-C1_tbLdD.js";
import { t as buildOpenAIProvider } from "../../openai-provider-D8hGUIvl.js";
import { a as resolveOpenAISystemPromptContribution, i as resolveOpenAIPromptOverlayMode } from "../../prompt-overlay-CD8GZWNS.js";
import { t as buildOpenAIRealtimeTranscriptionProvider } from "../../realtime-transcription-provider-CB3vK_Pc.js";
import { t as buildOpenAIRealtimeVoiceProvider } from "../../realtime-voice-provider-DhEH7veA.js";
import { t as buildOpenAISpeechProvider } from "../../speech-provider-W-Pm5VLx.js";
import { t as buildOpenAIVideoGenerationProvider } from "../../video-generation-provider-BNGj_Xbh.js";
//#region extensions/openai/index.ts
var openai_default = definePluginEntry({
	id: "openai",
	name: "OpenAI Provider",
	description: "Bundled OpenAI provider plugins",
	register(api) {
		const openAIToolCompatHooks = buildProviderToolCompatFamilyHooks("openai");
		const buildProviderWithPromptContribution = (provider) => ({
			...provider,
			...openAIToolCompatHooks,
			resolveSystemPromptContribution: (ctx) => {
				const pluginConfig = resolvePluginConfigObject(ctx.config, "openai") ?? (ctx.config ? void 0 : api.pluginConfig);
				return resolveOpenAISystemPromptContribution({
					config: ctx.config,
					legacyPluginConfig: pluginConfig,
					mode: resolveOpenAIPromptOverlayMode(pluginConfig),
					modelProviderId: provider.id,
					modelId: ctx.modelId,
					trigger: ctx.trigger
				});
			}
		});
		api.registerProvider(buildProviderWithPromptContribution(buildOpenAIProvider()));
		api.registerProvider(buildProviderWithPromptContribution(buildOpenAICodexProviderPlugin()));
		api.registerMemoryEmbeddingProvider(openAiMemoryEmbeddingProviderAdapter);
		api.registerImageGenerationProvider(buildOpenAIImageGenerationProvider());
		api.registerRealtimeTranscriptionProvider(buildOpenAIRealtimeTranscriptionProvider());
		api.registerRealtimeVoiceProvider(buildOpenAIRealtimeVoiceProvider());
		api.registerSpeechProvider(buildOpenAISpeechProvider());
		api.registerMediaUnderstandingProvider(openaiMediaUnderstandingProvider);
		api.registerMediaUnderstandingProvider(openaiCodexMediaUnderstandingProvider);
		api.registerVideoGenerationProvider(buildOpenAIVideoGenerationProvider());
	}
});
//#endregion
export { openai_default as default };
