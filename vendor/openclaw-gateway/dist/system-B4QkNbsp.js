import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, p as readStringValue } from "./string-coerce-DKw2K5wM.js";
import { a as publicKeyRawBase64UrlFromPem, r as loadOrCreateDeviceIdentity } from "./device-identity-CQT2_tZO.js";
import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { l as resolveMainSessionKeyFromConfig } from "./sessions-Ct4mpWsk.js";
import { c as setHeartbeatsEnabled } from "./heartbeat-wake-D8JKi1wr.js";
import { a as enqueueSystemEvent, s as isSystemEventContextChanged } from "./system-events-BbV9wJlR.js";
import { n as getLastHeartbeatEvent } from "./heartbeat-events-BMVPfx2x.js";
import "./heartbeat-runner-Ccq-U2xP.js";
import { n as updateSystemPresence, t as listSystemPresence } from "./system-presence-CSyBe1J3.js";
import { t as broadcastPresenceSnapshot } from "./presence-events-UgI6M8FR.js";
//#region src/gateway/server-methods/system.ts
const systemHandlers = {
	"gateway.identity.get": ({ respond }) => {
		const identity = loadOrCreateDeviceIdentity();
		respond(true, {
			deviceId: identity.deviceId,
			publicKey: publicKeyRawBase64UrlFromPem(identity.publicKeyPem)
		}, void 0);
	},
	"last-heartbeat": ({ respond }) => {
		respond(true, getLastHeartbeatEvent(), void 0);
	},
	"set-heartbeats": ({ params, respond }) => {
		const enabled = params.enabled;
		if (typeof enabled !== "boolean") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid set-heartbeats params: enabled (boolean) required"));
			return;
		}
		setHeartbeatsEnabled(enabled);
		respond(true, {
			ok: true,
			enabled
		}, void 0);
	},
	"system-presence": ({ respond }) => {
		respond(true, listSystemPresence(), void 0);
	},
	"system-event": ({ params, respond, context }) => {
		const text = normalizeOptionalString(params.text) ?? "";
		if (!text) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "text required"));
			return;
		}
		const sessionKey = resolveMainSessionKeyFromConfig();
		const deviceId = readStringValue(params.deviceId);
		const instanceId = readStringValue(params.instanceId);
		const host = readStringValue(params.host);
		const ip = readStringValue(params.ip);
		const mode = readStringValue(params.mode);
		const version = readStringValue(params.version);
		const platform = readStringValue(params.platform);
		const deviceFamily = readStringValue(params.deviceFamily);
		const modelIdentifier = readStringValue(params.modelIdentifier);
		const lastInputSeconds = typeof params.lastInputSeconds === "number" && Number.isFinite(params.lastInputSeconds) ? params.lastInputSeconds : void 0;
		const reason = readStringValue(params.reason);
		const presenceUpdate = updateSystemPresence({
			text,
			deviceId,
			instanceId,
			host,
			ip,
			mode,
			version,
			platform,
			deviceFamily,
			modelIdentifier,
			lastInputSeconds,
			reason,
			roles: Array.isArray(params.roles) && params.roles.every((t) => typeof t === "string") ? params.roles : void 0,
			scopes: Array.isArray(params.scopes) && params.scopes.every((t) => typeof t === "string") ? params.scopes : void 0,
			tags: Array.isArray(params.tags) && params.tags.every((t) => typeof t === "string") ? params.tags : void 0
		});
		if (text.startsWith("Node:")) {
			const next = presenceUpdate.next;
			const changed = new Set(presenceUpdate.changedKeys);
			const reasonValue = next.reason ?? reason;
			const normalizedReason = normalizeLowercaseStringOrEmpty(reasonValue);
			const ignoreReason = normalizedReason.startsWith("periodic") || normalizedReason === "heartbeat";
			const hostChanged = changed.has("host");
			const ipChanged = changed.has("ip");
			const versionChanged = changed.has("version");
			const modeChanged = changed.has("mode");
			const reasonChanged = changed.has("reason") && !ignoreReason;
			if (hostChanged || ipChanged || versionChanged || modeChanged || reasonChanged) {
				const contextChanged = isSystemEventContextChanged(sessionKey, presenceUpdate.key);
				const parts = [];
				if (contextChanged || hostChanged || ipChanged) {
					const hostLabel = normalizeOptionalString(next.host) ?? "Unknown";
					const ipLabel = normalizeOptionalString(next.ip);
					parts.push(`Node: ${hostLabel}${ipLabel ? ` (${ipLabel})` : ""}`);
				}
				if (versionChanged) parts.push(`app ${normalizeOptionalString(next.version) ?? "unknown"}`);
				if (modeChanged) parts.push(`mode ${normalizeOptionalString(next.mode) ?? "unknown"}`);
				if (reasonChanged) parts.push(`reason ${normalizeOptionalString(reasonValue) ?? "event"}`);
				const deltaText = parts.join(" · ");
				if (deltaText) enqueueSystemEvent(deltaText, {
					sessionKey,
					contextKey: presenceUpdate.key
				});
			}
		} else enqueueSystemEvent(text, { sessionKey });
		broadcastPresenceSnapshot({
			broadcast: context.broadcast,
			incrementPresenceVersion: context.incrementPresenceVersion,
			getHealthVersion: context.getHealthVersion
		});
		respond(true, { ok: true }, void 0);
	}
};
//#endregion
export { systemHandlers };
