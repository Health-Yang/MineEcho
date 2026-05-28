import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import "./agent-scope-CudANNo3.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { d as resolveAgentIdFromSessionKey, l as normalizeAgentId, v as toAgentStoreSessionKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { Ii as ErrorCodes, Li as errorShape, f as validateArtifactsDownloadParams, m as validateArtifactsListParams, p as validateArtifactsGetParams } from "./protocol-BkfNT2Bp.js";
import { a as resolveStoredSessionKeyForAgentStore, i as resolveSessionStoreKey, r as resolveSessionStoreAgentId } from "./session-store-key-Bm8fGm9t.js";
import { p as visitSessionMessagesAsync } from "./session-utils.fs-D_Qde0sG.js";
import { c as loadSessionEntry } from "./session-utils-CmwnszsS.js";
import { t as getTaskSessionLookupByIdForStatus } from "./task-status-access-sB4--_Zp.js";
import { n as resolveSessionKeyForRun } from "./server-session-key-DEGjEDLL.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { createHash } from "node:crypto";
//#region src/gateway/server-methods/artifacts.ts
function artifactError(type, message, details) {
	return errorShape(ErrorCodes.INVALID_REQUEST, message, { details: {
		type,
		...details
	} });
}
function resolveRequesterSessionAgentId(sessionKey, cfg) {
	const key = normalizeOptionalString(sessionKey);
	if (!key) return;
	const parsed = parseAgentSessionKey(key);
	if (!parsed && key.toLowerCase().startsWith("agent:")) return;
	if (cfg) return resolveSessionStoreAgentId(cfg, resolveSessionStoreKey({
		cfg,
		sessionKey: key
	}));
	if (parsed) return parsed.agentId;
	return resolveAgentIdFromSessionKey(key);
}
function resolveScopedArtifactSessionKey(sessionKey, agentId, cfg) {
	const key = normalizeOptionalString(sessionKey);
	if (!key) return;
	const scopedAgentId = normalizeOptionalString(agentId);
	if (!scopedAgentId) return key;
	const parsed = parseAgentSessionKey(key);
	if (!parsed && key.toLowerCase().startsWith("agent:")) return;
	if (cfg) {
		const scopedKey = resolveStoredSessionKeyForAgentStore({
			cfg,
			agentId: scopedAgentId,
			sessionKey: key
		});
		if (scopedKey !== "global" && scopedKey !== "unknown" && resolveSessionStoreAgentId(cfg, scopedKey) !== normalizeAgentId(scopedAgentId)) return;
		return scopedKey;
	}
	if (parsed && parsed.agentId !== normalizeAgentId(scopedAgentId)) return;
	return toAgentStoreSessionKey({
		agentId: scopedAgentId,
		requestKey: key
	});
}
function normalizeArtifactType(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "image" || normalized === "input_image" || normalized === "image_url") return "image";
	if (normalized === "audio" || normalized === "input_audio") return "audio";
	if (normalized === "file" || normalized === "input_file") return "file";
	return "file";
}
function mimeFromDataUrl(value) {
	return /^data:([^;,]+)(?:;[^,]*)?,/i.exec(value.trim())?.[1]?.toLowerCase();
}
function base64FromDataUrl(value) {
	return /^data:[^,]*;base64,(.*)$/is.exec(value.trim())?.[1]?.replace(/\s+/g, "");
}
function estimateBase64Size(value) {
	if (!value) return;
	try {
		return Buffer.from(value, "base64").byteLength;
	} catch {
		return;
	}
}
function mediaUrlValue(value) {
	if (typeof value === "string") return normalizeOptionalString(value);
	return normalizeOptionalString(asOptionalRecord(value)?.url);
}
function isSafeDownloadUrl(value) {
	const trimmed = value.trim();
	if (!trimmed || /^data:/i.test(trimmed)) return false;
	if (trimmed.startsWith("/")) return !trimmed.startsWith("//") && trimmed.startsWith("/api/");
	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}
function artifactId(parts) {
	return `artifact_${createHash("sha256").update(`${parts.sessionKey}\0${parts.messageSeq}\0${parts.contentIndex}\0${parts.type}\0${parts.title}`).digest("base64url").slice(0, 18)}`;
}
function resolveMessageSeq(message, fallback) {
	const seq = asOptionalRecord(message["__openclaw"])?.seq;
	return typeof seq === "number" && Number.isInteger(seq) && seq > 0 ? seq : fallback;
}
function resolveMessageRunId(message) {
	return normalizeOptionalString(asOptionalRecord(message["__openclaw"])?.runId) ?? normalizeOptionalString(message.runId);
}
function resolveMessageTaskId(message) {
	const meta = asOptionalRecord(message["__openclaw"]);
	return normalizeOptionalString(meta?.messageTaskId) ?? normalizeOptionalString(meta?.taskId) ?? normalizeOptionalString(message.messageTaskId) ?? normalizeOptionalString(message.taskId);
}
function resolveBlockDownload(block) {
	const data = normalizeOptionalString(block.data);
	const content = normalizeOptionalString(block.content);
	const url = normalizeOptionalString(block.url) ?? normalizeOptionalString(block.openUrl);
	const imageUrl = mediaUrlValue(block.image_url);
	const audioUrl = normalizeOptionalString(block.audio_url);
	const source = asOptionalRecord(block.source);
	const sourceData = normalizeOptionalString(source?.data);
	const sourceUrl = normalizeOptionalString(source?.url);
	const dataUrl = [
		url,
		sourceUrl,
		imageUrl,
		audioUrl,
		data,
		content,
		sourceData
	].find((value) => typeof value === "string" && /^data:/i.test(value));
	const base64FromDetectedDataUrl = dataUrl ? base64FromDataUrl(dataUrl) : void 0;
	const directBase64 = [
		data,
		sourceData,
		content
	].find((value) => typeof value === "string" && !/^data:/i.test(value));
	const base64 = base64FromDetectedDataUrl ?? directBase64;
	const remoteUrl = [
		url,
		sourceUrl,
		imageUrl,
		audioUrl
	].find((value) => typeof value === "string" && isSafeDownloadUrl(value));
	const mimeType = normalizeOptionalString(block.mimeType) ?? normalizeOptionalString(block.media_type) ?? normalizeOptionalString(source?.media_type) ?? normalizeOptionalString(source?.mimeType) ?? (dataUrl ? mimeFromDataUrl(dataUrl) : void 0);
	const explicitSize = block.sizeBytes ?? source?.sizeBytes;
	const sizeBytes = typeof explicitSize === "number" && Number.isFinite(explicitSize) && explicitSize >= 0 ? Math.floor(explicitSize) : estimateBase64Size(base64);
	if (base64) return {
		mode: "bytes",
		data: base64,
		mimeType,
		sizeBytes
	};
	if (remoteUrl) return {
		mode: "url",
		url: remoteUrl,
		mimeType,
		sizeBytes
	};
	return {
		mode: "unsupported",
		mimeType,
		sizeBytes
	};
}
function isArtifactBlock(block) {
	const type = normalizeOptionalString(block.type)?.toLowerCase();
	if (type === "image" || type === "audio" || type === "file" || type === "input_image" || type === "input_audio" || type === "input_file" || type === "image_url") return true;
	return Boolean(block.url || block.openUrl || block.data || block.source || block.image_url || block.audio_url);
}
function collectArtifactsFromMessages(params) {
	const artifacts = [];
	let messageFallbackSeq = 0;
	for (const message of params.messages) {
		messageFallbackSeq += 1;
		collectArtifactsFromMessage({
			...params,
			message,
			messageFallbackSeq,
			artifacts
		});
	}
	return artifacts;
}
function collectArtifactsFromMessage(params) {
	const msg = asOptionalRecord(params.message);
	if (!msg) return;
	const messageSeq = resolveMessageSeq(msg, params.messageFallbackSeq);
	const messageRunId = resolveMessageRunId(msg);
	const messageTaskId = resolveMessageTaskId(msg);
	if (params.runId && messageRunId !== params.runId) return;
	if (params.taskId && messageTaskId !== params.taskId) return;
	const content = Array.isArray(msg.content) ? msg.content : [];
	for (let contentIndex = 0; contentIndex < content.length; contentIndex += 1) {
		const block = asOptionalRecord(content[contentIndex]);
		if (!block || !isArtifactBlock(block)) continue;
		const type = normalizeArtifactType(normalizeOptionalString(block.type) ?? "file");
		const title = normalizeOptionalString(block.title) ?? normalizeOptionalString(block.fileName) ?? normalizeOptionalString(block.filename) ?? normalizeOptionalString(block.alt) ?? `${type} ${params.artifacts.length + 1}`;
		const download = resolveBlockDownload(block);
		const summary = {
			id: artifactId({
				sessionKey: params.sessionKey,
				messageSeq,
				contentIndex,
				title,
				type
			}),
			type,
			title,
			...download.mimeType ? { mimeType: download.mimeType } : {},
			...download.sizeBytes !== void 0 ? { sizeBytes: download.sizeBytes } : {},
			sessionKey: params.sessionKey,
			...messageRunId ? { runId: messageRunId } : {},
			...messageTaskId ? { taskId: messageTaskId } : {},
			messageSeq,
			source: "session-transcript",
			download: { mode: download.mode },
			...download.data ? { data: download.data } : {},
			...download.url ? { url: download.url } : {}
		};
		params.artifacts.push(summary);
	}
}
function resolveQuerySession(query, cfg) {
	if (query.sessionKey) {
		const sessionKey = resolveScopedArtifactSessionKey(query.sessionKey, query.agentId, cfg);
		if (!sessionKey) return;
		return {
			sessionKey,
			...query.agentId ? { agentId: query.agentId } : {}
		};
	}
	if (query.runId) {
		const agentId = query.agentId ?? resolveDefaultAgentId(cfg ?? {});
		const scopedSessionKey = resolveScopedArtifactSessionKey(resolveSessionKeyForRun(query.runId, { agentId }), agentId, cfg);
		return scopedSessionKey ? {
			sessionKey: scopedSessionKey,
			agentId
		} : void 0;
	}
	if (query.taskId) {
		const task = getTaskSessionLookupByIdForStatus(query.taskId);
		const requesterSessionKey = normalizeOptionalString(task?.requesterSessionKey);
		const taskAgentId = normalizeOptionalString(task?.agentId) ?? resolveRequesterSessionAgentId(requesterSessionKey, cfg);
		if (query.agentId && taskAgentId && normalizeAgentId(query.agentId) !== normalizeAgentId(taskAgentId)) return;
		const agentId = query.agentId ?? taskAgentId ?? resolveDefaultAgentId(cfg ?? {});
		if (requesterSessionKey) {
			const scopedSessionKey = resolveScopedArtifactSessionKey(requesterSessionKey, agentId, cfg);
			return scopedSessionKey ? {
				sessionKey: scopedSessionKey,
				agentId
			} : void 0;
		}
		const runId = normalizeOptionalString(task?.runId);
		const scopedSessionKey = resolveScopedArtifactSessionKey(runId ? resolveSessionKeyForRun(runId, { agentId }) : void 0, agentId, cfg);
		return scopedSessionKey ? {
			sessionKey: scopedSessionKey,
			agentId
		} : void 0;
	}
}
async function loadArtifacts(query, cfg) {
	const resolved = resolveQuerySession(query, cfg);
	if (!resolved) return { artifacts: [] };
	const { sessionKey } = resolved;
	const scopedGlobalAgentId = cfg?.session?.scope === "global" && sessionKey === "global" ? resolved.agentId : void 0;
	const { storePath, entry } = scopedGlobalAgentId ? loadSessionEntry(sessionKey, { agentId: scopedGlobalAgentId }) : loadSessionEntry(sessionKey);
	const sessionId = entry?.sessionId;
	if (!sessionId || !storePath) return {
		sessionKey,
		artifacts: []
	};
	const artifacts = [];
	await visitSessionMessagesAsync(sessionId, storePath, entry?.sessionFile, (message, seq) => {
		collectArtifactsFromMessage({
			message,
			messageFallbackSeq: seq,
			artifacts,
			sessionKey,
			runId: query.runId,
			taskId: query.taskId
		});
	}, {
		mode: "full",
		reason: "artifact query transcript scan"
	});
	return {
		sessionKey,
		artifacts
	};
}
function requireQueryable(params, respond) {
	if (params.sessionKey || params.runId || params.taskId) return true;
	respond(false, void 0, artifactError("artifact_query_unsupported", "artifacts require one of sessionKey, runId, or taskId"));
	return false;
}
async function findArtifact(params, cfg) {
	const loaded = await loadArtifacts(params, cfg);
	return {
		sessionKey: loaded.sessionKey,
		artifact: loaded.artifacts.find((artifact) => artifact.id === params.artifactId)
	};
}
function toSummary(artifact) {
	const { data: dataValue, url: _url, ...summary } = artifact;
	return summary;
}
const artifactsHandlers = {
	"artifacts.list": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateArtifactsListParams, "artifacts.list", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifacts, sessionKey } = await loadArtifacts(params, context.getRuntimeConfig?.());
		if (!sessionKey && (params.runId || params.taskId)) {
			respond(false, void 0, artifactError("artifact_scope_not_found", "no session found for artifact query"));
			return;
		}
		respond(true, { artifacts: artifacts.map(toSummary) });
	},
	"artifacts.get": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateArtifactsGetParams, "artifacts.get", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifact } = await findArtifact(params, context.getRuntimeConfig?.());
		if (!artifact) {
			respond(false, void 0, artifactError("artifact_not_found", "artifact not found", { artifactId: params.artifactId }));
			return;
		}
		respond(true, { artifact: toSummary(artifact) });
	},
	"artifacts.download": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateArtifactsDownloadParams, "artifacts.download", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifact } = await findArtifact(params, context.getRuntimeConfig?.());
		if (!artifact) {
			respond(false, void 0, artifactError("artifact_not_found", "artifact not found", { artifactId: params.artifactId }));
			return;
		}
		if (artifact.download.mode === "unsupported") {
			respond(false, void 0, artifactError("artifact_download_unsupported", "artifact download is unsupported", { artifactId: artifact.id }));
			return;
		}
		respond(true, {
			artifact: toSummary(artifact),
			...artifact.download.mode === "bytes" ? {
				encoding: "base64",
				data: artifact.data
			} : {},
			...artifact.download.mode === "url" ? { url: artifact.url } : {}
		});
	}
};
//#endregion
export { artifactsHandlers, collectArtifactsFromMessages };
