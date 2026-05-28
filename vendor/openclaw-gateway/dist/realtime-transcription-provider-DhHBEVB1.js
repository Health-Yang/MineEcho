import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { u as normalizeResolvedSecretInputString } from "./types.secrets-CtRQ27Ls.js";
import { r as parseFiniteNumber } from "./number-coercion-CZ-2BQ9V.js";
import { n as parseBooleanValue } from "./boolean-CZag3-H2.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { i as isProviderAuthProfileConfigured } from "./provider-auth-CCtAcb6r.js";
import "./secret-input-BrsvLCK3.js";
import { o as resolveApiKeyForProvider } from "./provider-auth-runtime-DypUtByG.js";
import { t as createRealtimeTranscriptionWebSocketSession } from "./realtime-transcription-QUk1hF_O.js";
import "./model-definitions-BkLft5Sb.js";
import { n as xaiUserAgentHeaderFor } from "./xai-user-agent-BtnRIml1.js";
//#region extensions/xai/realtime-transcription-provider.ts
const XAI_REALTIME_STT_DEFAULT_SAMPLE_RATE = 8e3;
const XAI_REALTIME_STT_DEFAULT_ENCODING = "mulaw";
const XAI_REALTIME_STT_DEFAULT_ENDPOINTING_MS = 800;
const XAI_REALTIME_STT_CONNECT_TIMEOUT_MS = 1e4;
const XAI_REALTIME_STT_CLOSE_TIMEOUT_MS = 5e3;
const XAI_REALTIME_STT_MAX_RECONNECT_ATTEMPTS = 5;
const XAI_REALTIME_STT_RECONNECT_DELAY_MS = 1e3;
const XAI_REALTIME_STT_MAX_QUEUED_BYTES = 2 * 1024 * 1024;
function readRecord(value) {
	return value && typeof value === "object" ? value : void 0;
}
function readNestedXaiConfig(rawConfig) {
	const raw = readRecord(rawConfig);
	return readRecord(readRecord(raw?.providers)?.xai ?? raw?.xai ?? raw) ?? {};
}
function normalizeEncoding(value) {
	const normalized = normalizeOptionalString(value)?.toLowerCase();
	if (!normalized) return;
	if (normalized === "ulaw" || normalized === "g711_ulaw" || normalized === "g711-mulaw") return "mulaw";
	if (normalized === "g711_alaw" || normalized === "g711-alaw") return "alaw";
	if (normalized === "pcm" || normalized === "mulaw" || normalized === "alaw") return normalized;
	throw new Error(`Invalid xAI realtime transcription encoding: ${normalized}`);
}
function normalizeXaiRealtimeBaseUrl(value) {
	return normalizeOptionalString(value ?? process.env.XAI_BASE_URL) ?? "https://api.x.ai/v1";
}
function toXaiRealtimeWsUrl(config) {
	const url = new URL(normalizeXaiRealtimeBaseUrl(config.baseUrl));
	url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/stt`;
	url.searchParams.set("sample_rate", String(config.sampleRate));
	url.searchParams.set("encoding", config.encoding);
	url.searchParams.set("interim_results", String(config.interimResults));
	url.searchParams.set("endpointing", String(config.endpointingMs));
	if (config.language) url.searchParams.set("language", config.language);
	return url.toString();
}
function normalizeProviderConfig(config) {
	const raw = readNestedXaiConfig(config);
	return {
		apiKey: normalizeResolvedSecretInputString({
			value: raw.apiKey,
			path: "plugins.entries.voice-call.config.streaming.providers.xai.apiKey"
		}),
		baseUrl: normalizeOptionalString(raw.baseUrl),
		sampleRate: parseFiniteNumber(raw.sampleRate ?? raw.sample_rate),
		encoding: normalizeEncoding(raw.encoding),
		interimResults: parseBooleanValue(raw.interimResults ?? raw.interim_results),
		endpointingMs: parseFiniteNumber(raw.endpointingMs ?? raw.endpointing ?? raw.silenceDurationMs),
		language: normalizeOptionalString(raw.language)
	};
}
function readErrorDetail(value) {
	if (typeof value === "string") return value;
	const record = readRecord(value);
	const message = normalizeOptionalString(record?.message);
	const code = normalizeOptionalString(record?.code);
	return message ?? code ?? "xAI realtime transcription error";
}
function readTranscriptText(event) {
	return normalizeOptionalString(event.text ?? event.transcript);
}
function createXaiRealtimeTranscriptionSession(config) {
	let lastTranscript;
	let speechStarted = false;
	const emitTranscript = (text) => {
		if (text === lastTranscript) return;
		lastTranscript = text;
		config.onTranscript?.(text);
	};
	const handleEvent = (event, transport) => {
		if (event.type === "transcript.created") {
			transport.markReady();
			return;
		}
		if (!transport.isReady() && event.type === "error") {
			transport.failConnect(new Error(readErrorDetail(event.error ?? event.message)));
			return;
		}
		switch (event.type) {
			case "transcript.partial": {
				const text = readTranscriptText(event);
				if (!text) return;
				if (!speechStarted) {
					speechStarted = true;
					config.onSpeechStart?.();
				}
				if (event.is_final && event.speech_final) {
					emitTranscript(text);
					speechStarted = false;
					return;
				}
				config.onPartial?.(text);
				return;
			}
			case "transcript.done": {
				const text = readTranscriptText(event);
				if (text) emitTranscript(text);
				transport.closeNow();
				return;
			}
			case "error":
				config.onError?.(new Error(readErrorDetail(event.error ?? event.message)));
				return;
			default: return;
		}
	};
	return createRealtimeTranscriptionWebSocketSession({
		providerId: "xai",
		callbacks: config,
		url: () => toXaiRealtimeWsUrl(config),
		headers: async () => {
			return {
				Authorization: `Bearer ${config.resolveApiKey ? await config.resolveApiKey() : config.apiKey}`,
				...xaiUserAgentHeaderFor(config.baseUrl)
			};
		},
		connectTimeoutMs: XAI_REALTIME_STT_CONNECT_TIMEOUT_MS,
		closeTimeoutMs: XAI_REALTIME_STT_CLOSE_TIMEOUT_MS,
		maxReconnectAttempts: XAI_REALTIME_STT_MAX_RECONNECT_ATTEMPTS,
		reconnectDelayMs: XAI_REALTIME_STT_RECONNECT_DELAY_MS,
		maxQueuedBytes: XAI_REALTIME_STT_MAX_QUEUED_BYTES,
		connectTimeoutMessage: "xAI realtime transcription connection timeout",
		connectClosedBeforeReadyMessage: "xAI realtime transcription connection closed before ready",
		reconnectLimitMessage: "xAI realtime transcription reconnect limit reached",
		sendAudio: (audio, transport) => {
			transport.sendBinary(audio);
		},
		onClose: (transport) => {
			transport.sendJson({ type: "audio.done" });
		},
		onMessage: handleEvent
	});
}
function buildXaiRealtimeTranscriptionProvider() {
	return {
		id: "xai",
		label: "xAI Realtime Transcription",
		aliases: ["xai-realtime", "grok-stt-streaming"],
		autoSelectOrder: 25,
		resolveConfig: ({ rawConfig }) => normalizeProviderConfig(rawConfig),
		isConfigured: ({ providerConfig, cfg }) => Boolean(normalizeProviderConfig(providerConfig).apiKey || process.env.XAI_API_KEY) || isProviderAuthProfileConfigured({
			provider: "xai",
			cfg
		}),
		createSession: (req) => {
			const config = normalizeProviderConfig(req.providerConfig);
			const seedApiKey = normalizeOptionalString(config.apiKey) ?? normalizeOptionalString(process.env.XAI_API_KEY);
			return createXaiRealtimeTranscriptionSession({
				...req,
				apiKey: seedApiKey ?? "",
				resolveApiKey: () => resolveXaiRealtimeApiKey(config.apiKey, req.cfg),
				baseUrl: normalizeXaiRealtimeBaseUrl(config.baseUrl),
				sampleRate: config.sampleRate ?? XAI_REALTIME_STT_DEFAULT_SAMPLE_RATE,
				encoding: config.encoding ?? XAI_REALTIME_STT_DEFAULT_ENCODING,
				interimResults: config.interimResults ?? true,
				endpointingMs: config.endpointingMs ?? XAI_REALTIME_STT_DEFAULT_ENDPOINTING_MS,
				language: config.language
			});
		}
	};
}
async function resolveXaiRealtimeApiKey(configApiKey, cfg) {
	const direct = normalizeOptionalString(configApiKey) ?? normalizeOptionalString(process.env.XAI_API_KEY);
	if (direct) return direct;
	const oauthKey = normalizeOptionalString((await resolveApiKeyForProvider({
		provider: "xai",
		cfg
	}))?.apiKey);
	if (oauthKey) return oauthKey;
	throw new Error("xAI credentials missing for realtime STT. Sign in with `openclaw onboard --auth-choice xai-oauth`, or run `openclaw onboard --auth-choice xai-api-key`, or set XAI_API_KEY.");
}
//#endregion
export { buildXaiRealtimeTranscriptionProvider as t };
