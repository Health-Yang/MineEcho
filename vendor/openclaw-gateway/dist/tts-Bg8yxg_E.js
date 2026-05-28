import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { S as setTtsEnabled, T as setTtsProvider, _ as resolveTtsPrefsPath, a as getTtsPersona, c as isTtsEnabled, d as listTtsPersonas, g as resolveTtsConfig, h as resolveTtsAutoMode, k as textToSpeech, l as isTtsProviderConfigured, m as resolveExplicitTtsOverrides, o as getTtsProvider, r as getResolvedSpeechProviderConfig, v as resolveTtsProviderOrder, w as setTtsPersona } from "./tts-runtime-DJIgAVUc.js";
import "./tts-Bcr0yUeq.js";
import { i as listSpeechProviders, n as getSpeechProvider, t as canonicalizeSpeechProviderId } from "./provider-registry-DRDZYvBl.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
//#region src/gateway/server-methods/tts.ts
const ttsHandlers = {
	"tts.status": async ({ respond, context }) => {
		try {
			const cfg = context.getRuntimeConfig();
			const config = resolveTtsConfig(cfg);
			const prefsPath = resolveTtsPrefsPath(config);
			const provider = getTtsProvider(config, prefsPath);
			const persona = getTtsPersona(config, prefsPath);
			const autoMode = resolveTtsAutoMode({
				config,
				prefsPath
			});
			const fallbackProviders = resolveTtsProviderOrder(provider, cfg).slice(1).filter((candidate) => isTtsProviderConfigured(config, candidate, cfg));
			const providerStates = listSpeechProviders(cfg).map((candidate) => ({
				id: candidate.id,
				label: candidate.label,
				configured: candidate.isConfigured({
					cfg,
					providerConfig: getResolvedSpeechProviderConfig(config, candidate.id, cfg),
					timeoutMs: config.timeoutMs
				})
			}));
			respond(true, {
				enabled: isTtsEnabled(config, prefsPath),
				auto: autoMode,
				provider,
				persona: persona?.id ?? null,
				personas: listTtsPersonas(config).map((entry) => ({
					id: entry.id,
					label: entry.label,
					description: entry.description,
					provider: entry.provider
				})),
				fallbackProvider: fallbackProviders[0] ?? null,
				fallbackProviders,
				prefsPath,
				providerStates
			});
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.enable": async ({ respond, context }) => {
		try {
			setTtsEnabled(resolveTtsPrefsPath(resolveTtsConfig(context.getRuntimeConfig())), true);
			respond(true, { enabled: true });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.disable": async ({ respond, context }) => {
		try {
			setTtsEnabled(resolveTtsPrefsPath(resolveTtsConfig(context.getRuntimeConfig())), false);
			respond(true, { enabled: false });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.convert": async ({ params, respond, context }) => {
		const text = normalizeOptionalString(params.text) ?? "";
		if (!text) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "tts.convert requires text"));
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const channel = normalizeOptionalString(params.channel);
			const providerRaw = normalizeOptionalString(params.provider);
			const modelId = normalizeOptionalString(params.modelId);
			const voiceId = normalizeOptionalString(params.voiceId);
			let overrides;
			try {
				overrides = resolveExplicitTtsOverrides({
					cfg,
					provider: providerRaw,
					modelId,
					voiceId
				});
			} catch (err) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, formatForLog(err)));
				return;
			}
			const result = await textToSpeech({
				text,
				cfg,
				channel,
				overrides,
				disableFallback: Boolean(overrides.provider || modelId || voiceId)
			});
			if (result.success && result.audioPath) {
				respond(true, {
					audioPath: result.audioPath,
					provider: result.provider,
					outputFormat: result.outputFormat,
					voiceCompatible: result.voiceCompatible
				});
				return;
			}
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, result.error ?? "TTS conversion failed"));
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.setProvider": async ({ params, respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const provider = canonicalizeSpeechProviderId(normalizeOptionalString(params.provider) ?? "", cfg);
		if (!provider || !getSpeechProvider(provider, cfg)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "Invalid provider. Use a registered TTS provider id."));
			return;
		}
		try {
			setTtsProvider(resolveTtsPrefsPath(resolveTtsConfig(cfg)), provider);
			respond(true, { provider });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.personas": async ({ respond, context }) => {
		try {
			const config = resolveTtsConfig(context.getRuntimeConfig());
			respond(true, {
				active: getTtsPersona(config, resolveTtsPrefsPath(config))?.id ?? null,
				personas: listTtsPersonas(config).map((persona) => ({
					id: persona.id,
					label: persona.label,
					description: persona.description,
					provider: persona.provider,
					fallbackPolicy: persona.fallbackPolicy,
					providers: Object.keys(persona.providers ?? {})
				}))
			});
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.setPersona": async ({ params, respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const rawPersona = normalizeOptionalString(params.persona);
		try {
			const config = resolveTtsConfig(cfg);
			const prefsPath = resolveTtsPrefsPath(config);
			if (!rawPersona || [
				"off",
				"none",
				"default"
			].includes(rawPersona.toLowerCase())) {
				setTtsPersona(prefsPath, null);
				respond(true, { persona: null });
				return;
			}
			const persona = listTtsPersonas(config).find((entry) => entry.id === rawPersona.toLowerCase());
			if (!persona) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "Invalid persona. Use a configured TTS persona id."));
				return;
			}
			setTtsPersona(prefsPath, persona.id);
			respond(true, { persona: persona.id });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"tts.providers": async ({ respond, context }) => {
		try {
			const cfg = context.getRuntimeConfig();
			const config = resolveTtsConfig(cfg);
			const prefsPath = resolveTtsPrefsPath(config);
			respond(true, {
				providers: listSpeechProviders(cfg).map((provider) => ({
					id: provider.id,
					name: provider.label,
					configured: provider.isConfigured({
						cfg,
						providerConfig: getResolvedSpeechProviderConfig(config, provider.id, cfg),
						timeoutMs: config.timeoutMs
					}),
					models: [...provider.models ?? []],
					voices: [...provider.voices ?? []]
				})),
				active: getTtsProvider(config, prefsPath)
			});
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	}
};
//#endregion
export { ttsHandlers };
