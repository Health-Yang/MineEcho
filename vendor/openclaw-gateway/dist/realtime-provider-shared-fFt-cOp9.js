import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { r as fetchWithSsrFGuard } from "./fetch-guard-D0S6eBky.js";
import { s as resolveProviderRequestHeaders } from "./provider-request-config-CVigAzJO.js";
import { a as createProviderHttpError } from "./provider-http-errors-B2G_gKJv.js";
import { n as captureWsEvent } from "./runtime-CJbjwaZM.js";
import "./proxy-capture-CLJYLKcI.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./ssrf-runtime-C8F9j9mo.js";
import "./provider-http-CDs6F6rL.js";
//#region extensions/openai/realtime-provider-shared.ts
const trimToUndefined = normalizeOptionalString;
function readRealtimeErrorDetail(error) {
	if (typeof error === "string" && error) return error;
	const message = asOptionalRecord(error)?.message;
	if (typeof message === "string" && message) return message;
	return "Unknown error";
}
function resolveOpenAIProviderConfigRecord(config) {
	return asOptionalRecord(asOptionalRecord(config.providers)?.openai) ?? asOptionalRecord(config.openai) ?? asOptionalRecord(config);
}
function captureOpenAIRealtimeWsClose(params) {
	captureWsEvent({
		url: params.url,
		direction: "local",
		kind: "ws-close",
		flowId: params.flowId,
		closeCode: typeof params.code === "number" ? params.code : void 0,
		meta: {
			provider: "openai",
			capability: params.capability,
			reason: Buffer.isBuffer(params.reasonBuffer) && params.reasonBuffer.length > 0 ? params.reasonBuffer.toString("utf8") : void 0
		}
	});
}
function readStringField(value, key) {
	if (!value || typeof value !== "object") return;
	const raw = value[key];
	return typeof raw === "string" && raw.trim() ? raw.trim() : void 0;
}
async function createOpenAIRealtimeSecret(params) {
	const { response, release } = await fetchWithSsrFGuard({
		url: params.url,
		init: {
			method: "POST",
			headers: resolveProviderRequestHeaders({
				provider: "openai",
				baseUrl: params.url,
				capability: "audio",
				transport: "http",
				defaultHeaders: {
					Authorization: `Bearer ${params.authToken}`,
					"Content-Type": "application/json"
				}
			}) ?? {
				Authorization: `Bearer ${params.authToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(params.body)
		},
		auditContext: params.auditContext
	});
	const payload = await (async () => {
		try {
			if (!response.ok) throw await createProviderHttpError(response, params.errorMessage);
			return await response.json();
		} finally {
			await release();
		}
	})();
	const nestedSecret = payload && typeof payload === "object" ? payload.client_secret : void 0;
	const clientSecret = readStringField(payload, "value") ?? readStringField(nestedSecret, "value");
	if (!clientSecret) throw new Error(params.missingValueMessage);
	const expiresAt = payload && typeof payload === "object" ? payload.expires_at : void 0;
	return {
		value: clientSecret,
		...typeof expiresAt === "number" ? { expiresAt } : {}
	};
}
async function createOpenAIRealtimeClientSecret(params) {
	const url = "https://api.openai.com/v1/realtime/client_secrets";
	return createOpenAIRealtimeSecret({
		...params,
		url,
		body: { session: params.session },
		errorMessage: "OpenAI Realtime client secret failed",
		missingValueMessage: "OpenAI Realtime client secret response did not include a value"
	});
}
async function createOpenAIRealtimeTranscriptionClientSecret(params) {
	const url = "https://api.openai.com/v1/realtime/transcription_sessions";
	return createOpenAIRealtimeSecret({
		...params,
		url,
		body: params.session,
		errorMessage: "OpenAI Realtime transcription client secret failed",
		missingValueMessage: "OpenAI Realtime transcription client secret response did not include a value"
	});
}
//#endregion
export { resolveOpenAIProviderConfigRecord as a, readRealtimeErrorDetail as i, createOpenAIRealtimeClientSecret as n, trimToUndefined as o, createOpenAIRealtimeTranscriptionClientSecret as r, captureOpenAIRealtimeWsClose as t };
