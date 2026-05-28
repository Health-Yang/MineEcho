import { f as normalizeStringifiedOptionalString } from "./string-coerce-DKw2K5wM.js";
import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { t as createAsyncLock } from "./async-lock-CaiUOILd.js";
import { m as writeJson, o as tryReadJson } from "./json-files-za1pmDfK.js";
import { Ii as ErrorCodes, Jn as validateWebPushSubscribeParams, Li as errorShape, Xn as validateWebPushUnsubscribeParams, Yn as validateWebPushTestParams, Zn as validateWebPushVapidPublicKeyParams, kt as validatePushTestParams } from "./protocol-BkfNT2Bp.js";
import { r as respondUnavailableOnThrow, t as respondInvalidParams } from "./nodes.helpers-pWq0E7xD.js";
import { a as resolveApnsAuthConfigFromEnv, d as resolveApnsRelayConfigFromEnv, n as loadApnsRegistration, o as sendApnsAlert, r as normalizeApnsEnvironment, t as clearApnsRegistrationIfCurrent, u as shouldClearStoredApnsRegistration } from "./push-apns-y_pm988l.js";
import { t as normalizeTrimmedString } from "./record-shared-LGLlGFwr.js";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
//#region src/infra/push-web.ts
const WEB_PUSH_STATE_FILENAME = "push/web-push-subscriptions.json";
const VAPID_KEYS_FILENAME = "push/vapid-keys.json";
const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;
const DEFAULT_VAPID_SUBJECT = "https://openclaw.ai";
const withLock = createAsyncLock();
let webPushRuntimePromise;
async function loadWebPushRuntime() {
	webPushRuntimePromise ??= import("web-push").then((mod) => mod.default ?? mod);
	return await webPushRuntimePromise;
}
function resolveWebPushStatePath(baseDir) {
	const root = baseDir ?? resolveStateDir();
	return path.join(root, WEB_PUSH_STATE_FILENAME);
}
function resolveVapidKeysPath(baseDir) {
	const root = baseDir ?? resolveStateDir();
	return path.join(root, VAPID_KEYS_FILENAME);
}
function hashEndpoint(endpoint) {
	return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}
function isValidEndpoint(endpoint) {
	if (!endpoint || endpoint.length > MAX_ENDPOINT_LENGTH) return false;
	try {
		return new URL(endpoint).protocol === "https:";
	} catch {
		return false;
	}
}
function isValidKey(key) {
	return typeof key === "string" && key.length > 0 && key.length <= MAX_KEY_LENGTH;
}
async function loadState(baseDir) {
	return await tryReadJson(resolveWebPushStatePath(baseDir)) ?? { subscriptionsByEndpointHash: {} };
}
async function persistState(state, baseDir) {
	await writeJson(resolveWebPushStatePath(baseDir), state, { trailingNewline: true });
}
async function resolveVapidKeys(baseDir) {
	const envPublic = resolveVapidPublicKeyFromEnv();
	const envPrivate = resolveVapidPrivateKeyFromEnv();
	if (envPublic && envPrivate) return {
		publicKey: envPublic,
		privateKey: envPrivate,
		subject: resolveVapidSubjectFromEnv()
	};
	return await withLock(async () => {
		const filePath = resolveVapidKeysPath(baseDir);
		const existing = await tryReadJson(filePath);
		if (existing?.publicKey && existing?.privateKey) return {
			publicKey: existing.publicKey,
			privateKey: existing.privateKey,
			subject: resolveVapidSubjectFromEnv()
		};
		const keys = (await loadWebPushRuntime()).generateVAPIDKeys();
		const pair = {
			publicKey: keys.publicKey,
			privateKey: keys.privateKey,
			subject: resolveVapidSubjectFromEnv()
		};
		await writeJson(filePath, pair, { trailingNewline: true });
		return pair;
	});
}
function resolveVapidSubjectFromEnv() {
	return process.env.OPENCLAW_VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;
}
function resolveVapidPublicKeyFromEnv() {
	return process.env.OPENCLAW_VAPID_PUBLIC_KEY || void 0;
}
function resolveVapidPrivateKeyFromEnv() {
	return process.env.OPENCLAW_VAPID_PRIVATE_KEY || void 0;
}
async function registerWebPushSubscription(params) {
	const { endpoint, keys, baseDir } = params;
	if (!isValidEndpoint(endpoint)) throw new Error("invalid push subscription endpoint: must be an HTTPS URL under 2048 chars");
	if (!isValidKey(keys.p256dh) || !isValidKey(keys.auth)) throw new Error("invalid push subscription keys: must be non-empty strings under 512 chars");
	return await withLock(async () => {
		const state = await loadState(baseDir);
		const hash = hashEndpoint(endpoint);
		const now = Date.now();
		const existing = state.subscriptionsByEndpointHash[hash];
		const subscription = {
			subscriptionId: existing?.subscriptionId ?? randomUUID(),
			endpoint,
			keys: {
				p256dh: keys.p256dh,
				auth: keys.auth
			},
			createdAtMs: existing?.createdAtMs ?? now,
			updatedAtMs: now
		};
		state.subscriptionsByEndpointHash[hash] = subscription;
		await persistState(state, baseDir);
		return subscription;
	});
}
async function listWebPushSubscriptions(baseDir) {
	const state = await loadState(baseDir);
	return Object.values(state.subscriptionsByEndpointHash);
}
async function clearWebPushSubscriptionByEndpoint(endpoint, baseDir) {
	return await withLock(async () => {
		const state = await loadState(baseDir);
		const hash = hashEndpoint(endpoint);
		if (state.subscriptionsByEndpointHash[hash]) {
			delete state.subscriptionsByEndpointHash[hash];
			await persistState(state, baseDir);
			return true;
		}
		return false;
	});
}
function applyVapidDetails(webPush, keys) {
	webPush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
}
async function sendPreparedWebPushNotification(webPush, subscription, payload) {
	const pushSubscription = {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth
		}
	};
	try {
		const result = await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
		return {
			ok: true,
			subscriptionId: subscription.subscriptionId,
			statusCode: result.statusCode
		};
	} catch (err) {
		const statusCode = typeof err === "object" && err !== null && "statusCode" in err ? err.statusCode : void 0;
		const message = typeof err === "object" && err !== null && "message" in err ? err.message : "unknown error";
		return {
			ok: false,
			subscriptionId: subscription.subscriptionId,
			statusCode,
			error: message
		};
	}
}
async function broadcastWebPush(payload, baseDir) {
	const subscriptions = await listWebPushSubscriptions(baseDir);
	if (subscriptions.length === 0) return [];
	const vapidKeys = await resolveVapidKeys(baseDir);
	const webPush = await loadWebPushRuntime();
	applyVapidDetails(webPush, vapidKeys);
	const mapped = (await Promise.allSettled(subscriptions.map((sub) => sendPreparedWebPushNotification(webPush, sub, payload)))).map((r, i) => r.status === "fulfilled" ? r.value : {
		ok: false,
		subscriptionId: subscriptions[i].subscriptionId,
		error: r.reason instanceof Error ? r.reason.message : "unknown error"
	});
	const expiredEndpoints = mapped.map((result, i) => ({
		result,
		sub: subscriptions[i]
	})).filter(({ result }) => !result.ok && (result.statusCode === 410 || result.statusCode === 404)).map(({ sub }) => sub.endpoint);
	if (expiredEndpoints.length > 0) await Promise.allSettled(expiredEndpoints.map((endpoint) => clearWebPushSubscriptionByEndpoint(endpoint, baseDir)));
	return mapped;
}
//#endregion
//#region src/gateway/server-methods/push.ts
const pushHandlers = {
	"push.test": async ({ params, respond, context }) => {
		if (!validatePushTestParams(params)) {
			respondInvalidParams({
				respond,
				method: "push.test",
				validator: validatePushTestParams
			});
			return;
		}
		const nodeId = normalizeStringifiedOptionalString(params.nodeId) ?? "";
		if (!nodeId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const title = normalizeTrimmedString(params.title) ?? "OpenClaw";
		const body = normalizeTrimmedString(params.body) ?? `Push test for node ${nodeId}`;
		await respondUnavailableOnThrow(respond, async () => {
			const registration = await loadApnsRegistration(nodeId);
			if (!registration) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `node ${nodeId} has no APNs registration (connect iOS node first)`));
				return;
			}
			const overrideEnvironment = normalizeApnsEnvironment(params.environment);
			const result = registration.transport === "direct" ? await (async () => {
				const auth = await resolveApnsAuthConfigFromEnv(process.env);
				if (!auth.ok) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, auth.error));
					return null;
				}
				return await sendApnsAlert({
					registration: {
						...registration,
						environment: overrideEnvironment ?? registration.environment
					},
					nodeId,
					title,
					body,
					auth: auth.value
				});
			})() : await (async () => {
				const relay = resolveApnsRelayConfigFromEnv(process.env, context.getRuntimeConfig().gateway);
				if (!relay.ok) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, relay.error));
					return null;
				}
				return await sendApnsAlert({
					registration,
					nodeId,
					title,
					body,
					relayConfig: relay.value
				});
			})();
			if (!result) return;
			if (shouldClearStoredApnsRegistration({
				registration,
				result,
				overrideEnvironment
			})) await clearApnsRegistrationIfCurrent({
				nodeId,
				registration
			});
			respond(true, result, void 0);
		});
	},
	"push.web.vapidPublicKey": async ({ params, respond }) => {
		if (!validateWebPushVapidPublicKeyParams(params)) {
			respondInvalidParams({
				respond,
				method: "push.web.vapidPublicKey",
				validator: validateWebPushVapidPublicKeyParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, { vapidPublicKey: (await resolveVapidKeys()).publicKey }, void 0);
		});
	},
	"push.web.subscribe": async ({ params, respond }) => {
		if (!validateWebPushSubscribeParams(params)) {
			respondInvalidParams({
				respond,
				method: "push.web.subscribe",
				validator: validateWebPushSubscribeParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, { subscriptionId: (await registerWebPushSubscription({
				endpoint: params.endpoint,
				keys: params.keys
			})).subscriptionId }, void 0);
		});
	},
	"push.web.unsubscribe": async ({ params, respond }) => {
		if (!validateWebPushUnsubscribeParams(params)) {
			respondInvalidParams({
				respond,
				method: "push.web.unsubscribe",
				validator: validateWebPushUnsubscribeParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, { removed: await clearWebPushSubscriptionByEndpoint(params.endpoint) }, void 0);
		});
	},
	"push.web.test": async ({ params, respond }) => {
		if (!validateWebPushTestParams(params)) {
			respondInvalidParams({
				respond,
				method: "push.web.test",
				validator: validateWebPushTestParams
			});
			return;
		}
		const title = normalizeTrimmedString(params.title) ?? "OpenClaw";
		const body = normalizeTrimmedString(params.body) ?? "Web push test notification";
		await respondUnavailableOnThrow(respond, async () => {
			const results = await broadcastWebPush({
				title,
				body
			});
			if (results.length === 0) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "no web push subscriptions registered"));
				return;
			}
			respond(true, { results }, void 0);
		});
	}
};
//#endregion
export { pushHandlers };
