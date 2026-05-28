import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import { n as resolveGatewayAuth, t as resolveEffectiveSharedGatewayAuth } from "./auth-resolve-DsCwkRwQ.js";
import "./auth-CbKYHGo4.js";
import { E as validateConfigObjectWithPlugins, H as projectSourceOntoRuntimeShape, T as validateConfigObjectRawWithPlugins, V as createMergePatch, d as readConfigFileSnapshotForWrite, o as parseConfigJson5, r as createConfigIO, u as readConfigFileSnapshot, y as resolveConfigSnapshotHash } from "./io-BlARNTf3.js";
import { n as formatConfigIssueLines } from "./issue-format-c8ezaSew.js";
import { t as applyMergePatch } from "./merge-patch-BKbUL9Ms.js";
import { I as isBuiltInModelProviderOverlayId } from "./zod-schema.core-BPJs63Rs.js";
import { i as replaceConfigFile } from "./mutate-CxD4vMnm.js";
import "./config-BtNBbhZb.js";
import { A as validateConfigSchemaParams, D as validateConfigPatchParams, E as validateConfigGetParams, Ii as ErrorCodes, Li as errorShape, O as validateConfigSchemaLookupParams, T as validateConfigApplyParams, j as validateConfigSetParams, k as validateConfigSchemaLookupResult, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { p as scheduleGatewaySigusr1Restart } from "./restart-BMCHYmJL.js";
import { t as extractDeliveryInfo } from "./delivery-info-xWCUU9hC.js";
import "./sessions-Ct4mpWsk.js";
import { d as writeRestartSentinel, r as formatDoctorNonInteractiveHint } from "./restart-sentinel-DePW2OSL.js";
import { i as restoreRedactedValues, n as redactConfigObject, r as redactConfigSnapshot } from "./redact-snapshot-BxUqpm5K.js";
import { a as getActiveSecretsRuntimeSnapshot } from "./runtime-state-CCyqNOzR.js";
import { r as lookupConfigSchema, t as loadGatewayRuntimeConfigSchema } from "./runtime-schema-DEsBBcQJ.js";
import { a as diffConfigPaths, i as resolveConfigReloadMetadata, t as buildGatewayReloadPlan } from "./config-reload-plan-DYGDzttF.js";
import { t as resolveGatewayReloadSettings } from "./config-reload-settings-BCSjTPm-.js";
import { n as resolveControlPlaneActor, r as summarizeChangedPaths, t as formatControlPlaneActor } from "./control-plane-audit-Ckq5Tcro.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { o as prepareSecretsRuntimeSnapshot } from "./runtime-DokToIx1.js";
import { t as resolveBaseHashParam } from "./base-hash-1n9gC3iI.js";
import { t as parseRestartRequestParams } from "./restart-request-BX718FK5.js";
import { execFile } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
//#region src/gateway/server-methods/config-write-flow.ts
function resolveGatewayConfigPath(snapshot) {
	return snapshot?.path ?? createConfigIO().configPath;
}
function normalizeStringListForAuthCompare(items) {
	return [...items ?? []].toSorted();
}
function normalizeTrustedProxyAuthForCompare(auth) {
	return {
		userHeader: auth.trustedProxy?.userHeader,
		requiredHeaders: normalizeStringListForAuthCompare(auth.trustedProxy?.requiredHeaders),
		allowUsers: normalizeStringListForAuthCompare(auth.trustedProxy?.allowUsers),
		allowLoopback: auth.trustedProxy?.allowLoopback
	};
}
function didSharedGatewayAuthChange(prev, next) {
	const prevResolvedAuth = resolveGatewayAuth({
		authConfig: prev.gateway?.auth,
		env: process.env,
		tailscaleMode: prev.gateway?.tailscale?.mode
	});
	const nextResolvedAuth = resolveGatewayAuth({
		authConfig: next.gateway?.auth,
		env: process.env,
		tailscaleMode: next.gateway?.tailscale?.mode
	});
	if (prevResolvedAuth.mode === "trusted-proxy" || nextResolvedAuth.mode === "trusted-proxy") {
		if (prevResolvedAuth.mode !== nextResolvedAuth.mode) return true;
		return !isDeepStrictEqual(normalizeTrustedProxyAuthForCompare(prevResolvedAuth), normalizeTrustedProxyAuthForCompare(nextResolvedAuth)) || !isDeepStrictEqual(normalizeStringListForAuthCompare(prev.gateway?.trustedProxies), normalizeStringListForAuthCompare(next.gateway?.trustedProxies));
	}
	const prevAuth = resolveEffectiveSharedGatewayAuth({
		authConfig: prev.gateway?.auth,
		env: process.env,
		tailscaleMode: prev.gateway?.tailscale?.mode
	});
	const nextAuth = resolveEffectiveSharedGatewayAuth({
		authConfig: next.gateway?.auth,
		env: process.env,
		tailscaleMode: next.gateway?.tailscale?.mode
	});
	if (prevAuth === null || nextAuth === null) return prevAuth !== nextAuth;
	return prevAuth.mode !== nextAuth.mode || !isDeepStrictEqual(prevAuth.secret, nextAuth.secret);
}
function didActiveSharedGatewayAuthChange(params) {
	return didSharedGatewayAuthChange(getActiveSecretsRuntimeSnapshot()?.config ?? params.fallbackPrev, params.next);
}
function queueSharedGatewayAuthDisconnect(shouldDisconnect, context) {
	if (!shouldDisconnect) return;
	queueMicrotask(() => {
		context?.disconnectClientsUsingSharedGatewayAuth?.();
	});
}
function queueSharedGatewayAuthGenerationRefresh(shouldRefresh, nextConfig, context) {
	if (!shouldRefresh) return;
	queueMicrotask(() => {
		context?.enforceSharedGatewayAuthGenerationForConfigWrite?.(nextConfig);
	});
}
function shouldScheduleDirectConfigRestart(params) {
	const reloadSettings = resolveGatewayReloadSettings(params.nextConfig);
	if (reloadSettings.mode === "off") return true;
	const plan = buildGatewayReloadPlan(params.changedPaths);
	if (reloadSettings.mode === "hot" && plan.restartGateway) return true;
	return false;
}
function resolveConfigRestartRequest(params) {
	const { sessionKey, deliveryContext: requestedDeliveryContext, threadId: requestedThreadId, note, restartDelayMs } = parseRestartRequestParams(params);
	const { deliveryContext: sessionDeliveryContext, threadId: sessionThreadId } = extractDeliveryInfo(sessionKey);
	return {
		sessionKey,
		note,
		restartDelayMs,
		deliveryContext: requestedDeliveryContext ?? sessionDeliveryContext,
		threadId: requestedThreadId ?? sessionThreadId
	};
}
function buildConfigRestartSentinelPayload(params) {
	return {
		kind: params.kind,
		status: "ok",
		ts: Date.now(),
		sessionKey: params.sessionKey,
		deliveryContext: params.deliveryContext,
		threadId: params.threadId,
		message: params.note ?? null,
		doctorHint: formatDoctorNonInteractiveHint(),
		stats: {
			mode: params.mode,
			root: params.configPath
		}
	};
}
async function tryWriteRestartSentinelPayload(payload) {
	try {
		return await writeRestartSentinel(payload);
	} catch {
		return null;
	}
}
async function commitGatewayConfigWrite(params) {
	const result = await replaceConfigFile({
		nextConfig: params.nextConfig,
		writeOptions: {
			...params.writeOptions,
			runtimeRefresh: {
				...params.writeOptions.runtimeRefresh,
				includeAuthStoreRefs: false
			}
		},
		afterWrite: { mode: "auto" }
	});
	return {
		path: resolveGatewayConfigPath(params.snapshot),
		config: result.nextConfig,
		queueFollowUp: () => {
			queueSharedGatewayAuthGenerationRefresh(true, result.nextConfig, params.context);
			queueSharedGatewayAuthDisconnect(Boolean(params.disconnectSharedAuthClients), params.context);
		}
	};
}
async function resolveGatewayConfigRestartWriteResult(params) {
	const { sessionKey, note, restartDelayMs, deliveryContext, threadId } = resolveConfigRestartRequest(params.requestParams);
	const payload = buildConfigRestartSentinelPayload({
		kind: params.kind,
		mode: params.mode,
		configPath: params.configPath,
		sessionKey,
		deliveryContext,
		threadId,
		note
	});
	const sentinelPath = await tryWriteRestartSentinelPayload(payload);
	const restart = shouldScheduleDirectConfigRestart({
		changedPaths: params.changedPaths,
		nextConfig: params.nextConfig
	}) ? scheduleGatewaySigusr1Restart({
		delayMs: restartDelayMs,
		reason: params.mode,
		audit: {
			actor: params.actor.actor,
			deviceId: params.actor.deviceId,
			clientIp: params.actor.clientIp,
			changedPaths: params.changedPaths
		}
	}) : void 0;
	if (restart?.coalesced) params.context?.logGateway?.warn(`${params.mode} restart coalesced ${formatControlPlaneActor(params.actor)} delayMs=${restart.delayMs}`);
	return {
		payload,
		sentinelPath,
		restart
	};
}
//#endregion
//#region src/gateway/server-methods/config.ts
const MAX_CONFIG_ISSUES_IN_ERROR_MESSAGE = 3;
const CONFIG_SCHEMA_RESPONSE_CACHE_TTL_MS = 5e3;
let configSchemaResponseCache = null;
function requireConfigBaseHash(params, snapshot, respond) {
	if (!snapshot.exists) return true;
	const snapshotHash = resolveConfigSnapshotHash(snapshot);
	if (!snapshotHash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "config base hash unavailable; re-run config.get and retry"));
		return false;
	}
	const baseHash = resolveBaseHashParam(params);
	if (!baseHash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "config base hash required; re-run config.get and retry"));
		return false;
	}
	if (baseHash !== snapshotHash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "config changed since last load; re-run config.get and retry"));
		return false;
	}
	return true;
}
function parseRawConfigOrRespond(params, requestName, respond) {
	const rawValue = params.raw;
	if (typeof rawValue !== "string") {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid ${requestName} params: raw (string) required`));
		return null;
	}
	return rawValue;
}
function sanitizeLookupPathForLog(path) {
	const sanitized = Array.from(path, (char) => {
		const code = char.charCodeAt(0);
		return code < 32 || code === 127 ? "?" : char;
	}).join("");
	return sanitized.length > 120 ? `${sanitized.slice(0, 117)}...` : sanitized;
}
function escapePowerShellSingleQuotedString(value) {
	return value.replaceAll("'", "''");
}
function resolveConfigOpenCommand(configPath, platform = process.platform) {
	if (platform === "win32") return {
		command: "powershell.exe",
		args: [
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			`Start-Process -LiteralPath '${escapePowerShellSingleQuotedString(configPath)}'`
		]
	};
	return {
		command: platform === "darwin" ? "open" : "xdg-open",
		args: [configPath]
	};
}
function execConfigOpenCommand(command) {
	return new Promise((resolve, reject) => {
		execFile(command.command, command.args, (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}
function formatConfigOpenError(error) {
	if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
	return String(error);
}
function hasOwnRecordValue(value, key) {
	return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}
function stripBundledProviderRuntimeDefaults(params) {
	if (!isRecord(params.candidate)) return params.candidate;
	const models = params.candidate.models;
	if (!isRecord(models) || !isRecord(models.providers)) return params.candidate;
	const sourceModels = isRecord(params.sourceConfig) ? params.sourceConfig.models : void 0;
	const sourceProviders = isRecord(sourceModels) ? sourceModels.providers : void 0;
	let nextProviders;
	for (const [providerId, provider] of Object.entries(models.providers)) {
		if (!isBuiltInModelProviderOverlayId(providerId) || !isRecord(provider)) continue;
		const sourceProvider = isRecord(sourceProviders) ? sourceProviders[providerId] : void 0;
		let nextProvider;
		if (provider.baseUrl === "" && !hasOwnRecordValue(sourceProvider, "baseUrl")) {
			nextProvider = { ...provider };
			delete nextProvider.baseUrl;
		}
		if (Array.isArray(provider.models) && provider.models.length === 0 && !hasOwnRecordValue(sourceProvider, "models")) {
			nextProvider ??= { ...provider };
			delete nextProvider.models;
		}
		if (nextProvider) {
			nextProviders ??= { ...models.providers };
			nextProviders[providerId] = nextProvider;
		}
	}
	if (!nextProviders) return params.candidate;
	return {
		...params.candidate,
		models: {
			...models,
			providers: nextProviders
		}
	};
}
function parseValidateConfigFromRawOrRespond(params, requestName, snapshot, respond) {
	const rawValue = parseRawConfigOrRespond(params, requestName, respond);
	if (!rawValue) return null;
	const parsedRes = parseConfigJson5(rawValue);
	if (!parsedRes.ok) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, parsedRes.error));
		return null;
	}
	const schema = loadSchemaWithPlugins();
	const restored = restoreRedactedValues(parsedRes.parsed, snapshot.config, schema.uiHints);
	if (!restored.ok) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, restored.humanReadableMessage ?? "invalid config"));
		return null;
	}
	const validationCandidate = stripBundledProviderRuntimeDefaults({
		candidate: snapshot.valid ? applyMergePatch(projectSourceOntoRuntimeShape(snapshot.resolved, snapshot.config), createMergePatch(snapshot.config, restored.result)) : restored.result,
		sourceConfig: snapshot.parsed
	});
	const sourceValidated = validateConfigObjectRawWithPlugins(validationCandidate);
	if (!sourceValidated.ok) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(sourceValidated.issues), { details: { issues: sourceValidated.issues } }));
		return null;
	}
	const validated = validateConfigObjectWithPlugins(validationCandidate);
	if (!validated.ok) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(validated.issues), { details: { issues: validated.issues } }));
		return null;
	}
	return {
		config: validated.config,
		writeConfig: validationCandidate,
		schema
	};
}
function summarizeConfigValidationIssues(issues) {
	const lines = normalizeStringEntries(formatConfigIssueLines(issues.slice(0, MAX_CONFIG_ISSUES_IN_ERROR_MESSAGE), "", { normalizeRoot: true }));
	if (lines.length === 0) return "invalid config";
	const hiddenCount = Math.max(0, issues.length - lines.length);
	return `invalid config: ${lines.join("; ")}${hiddenCount > 0 ? ` (+${hiddenCount} more issue${hiddenCount === 1 ? "" : "s"})` : ""}`;
}
async function ensureResolvableSecretRefsOrRespond(params) {
	try {
		return await prepareSecretsRuntimeSnapshot({
			config: params.config,
			includeAuthStoreRefs: false
		});
	} catch (error) {
		const details = formatErrorMessage(error);
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid config: active SecretRef resolution failed (${details})`));
		return null;
	}
}
function clearConfigSchemaResponseCacheForTests() {
	configSchemaResponseCache = null;
}
function loadConfigSchemaResponseForTests() {
	return loadSchemaWithPlugins();
}
function clearConfigSchemaResponseCache() {
	configSchemaResponseCache = null;
}
function loadSchemaWithPlugins() {
	const now = Date.now();
	if (configSchemaResponseCache && configSchemaResponseCache.expiresAtMs > now) return configSchemaResponseCache.response;
	const response = loadGatewayRuntimeConfigSchema();
	configSchemaResponseCache = {
		expiresAtMs: Date.now() + CONFIG_SCHEMA_RESPONSE_CACHE_TTL_MS,
		response
	};
	return response;
}
const configHandlers = {
	"config.get": async ({ params, respond }) => {
		if (!assertValidParams(params, validateConfigGetParams, "config.get", respond)) return;
		respond(true, redactConfigSnapshot(await readConfigFileSnapshot(), loadSchemaWithPlugins().uiHints), void 0);
	},
	"config.schema": ({ params, respond }) => {
		if (!assertValidParams(params, validateConfigSchemaParams, "config.schema", respond)) return;
		respond(true, loadSchemaWithPlugins(), void 0);
	},
	"config.schema.lookup": ({ params, respond, context }) => {
		if (!assertValidParams(params, validateConfigSchemaLookupParams, "config.schema.lookup", respond)) return;
		const path = params.path;
		const result = lookupConfigSchema(loadSchemaWithPlugins(), path, resolveConfigReloadMetadata);
		if (!result) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "config schema path not found"));
			return;
		}
		if (!validateConfigSchemaLookupResult(result)) {
			const errors = validateConfigSchemaLookupResult.errors ?? [];
			context.logGateway.warn(`config.schema.lookup produced invalid payload for ${sanitizeLookupPathForLog(path)}: ${formatValidationErrors(errors)}`);
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "config.schema.lookup returned invalid payload", { details: { errors } }));
			return;
		}
		respond(true, result, void 0);
	},
	"config.set": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateConfigSetParams, "config.set", respond)) return;
		const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
		if (!requireConfigBaseHash(params, snapshot, respond)) return;
		const parsed = parseValidateConfigFromRawOrRespond(params, "config.set", snapshot, respond);
		if (!parsed) return;
		if (!await ensureResolvableSecretRefsOrRespond({
			config: parsed.config,
			respond
		})) return;
		const writeResult = await commitGatewayConfigWrite({
			snapshot,
			writeOptions,
			nextConfig: parsed.writeConfig,
			context
		});
		clearConfigSchemaResponseCache();
		respond(true, {
			ok: true,
			path: writeResult.path,
			config: redactConfigObject(writeResult.config, parsed.schema.uiHints)
		}, void 0);
		writeResult.queueFollowUp();
	},
	"config.patch": async ({ params, respond, client, context }) => {
		if (!assertValidParams(params, validateConfigPatchParams, "config.patch", respond)) return;
		const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
		if (!requireConfigBaseHash(params, snapshot, respond)) return;
		if (!snapshot.valid) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid config; fix before patching"));
			return;
		}
		const rawValue = params.raw;
		if (typeof rawValue !== "string") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid config.patch params: raw (string) required"));
			return;
		}
		const parsedRes = parseConfigJson5(rawValue);
		if (!parsedRes.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, parsedRes.error));
			return;
		}
		if (!parsedRes.parsed || typeof parsedRes.parsed !== "object" || Array.isArray(parsedRes.parsed)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "config.patch raw must be an object"));
			return;
		}
		const merged = applyMergePatch(snapshot.config, parsedRes.parsed, { mergeObjectArraysById: true });
		const schemaPatch = loadSchemaWithPlugins();
		const restoredMerge = restoreRedactedValues(merged, snapshot.config, schemaPatch.uiHints);
		if (!restoredMerge.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, restoredMerge.humanReadableMessage ?? "invalid config"));
			return;
		}
		const restoredChangedPaths = diffConfigPaths(snapshot.config, restoredMerge.result);
		const actor = resolveControlPlaneActor(client);
		if (restoredChangedPaths.length === 0) {
			context?.logGateway?.info(`config.patch noop ${formatControlPlaneActor(actor)} (no changed paths)`);
			respond(true, {
				ok: true,
				noop: true,
				path: resolveGatewayConfigPath(snapshot),
				config: redactConfigObject(snapshot.config, schemaPatch.uiHints)
			}, void 0);
			return;
		}
		const validated = validateConfigObjectWithPlugins(restoredMerge.result);
		if (!validated.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(validated.issues), { details: { issues: validated.issues } }));
			return;
		}
		const preparedSecretsSnapshot = await ensureResolvableSecretRefsOrRespond({
			config: validated.config,
			respond
		});
		if (!preparedSecretsSnapshot) return;
		const changedPaths = diffConfigPaths(snapshot.config, validated.config);
		if (changedPaths.length === 0) {
			context?.logGateway?.info(`config.patch noop ${formatControlPlaneActor(actor)} (no changed paths)`);
			respond(true, {
				ok: true,
				noop: true,
				path: resolveGatewayConfigPath(snapshot),
				config: redactConfigObject(validated.config, schemaPatch.uiHints)
			}, void 0);
			return;
		}
		context?.logGateway?.info(`config.patch write ${formatControlPlaneActor(actor)} changedPaths=${summarizeChangedPaths(changedPaths)} restartReason=config.patch`);
		const disconnectSharedAuthClients = didSharedGatewayAuthChange(snapshot.config, validated.config) || didActiveSharedGatewayAuthChange({
			fallbackPrev: snapshot.config,
			next: preparedSecretsSnapshot.config
		});
		const writeResult = await commitGatewayConfigWrite({
			snapshot,
			writeOptions,
			nextConfig: validated.config,
			context,
			disconnectSharedAuthClients
		});
		clearConfigSchemaResponseCache();
		const { payload, sentinelPath, restart } = await resolveGatewayConfigRestartWriteResult({
			requestParams: params,
			kind: "config-patch",
			mode: "config.patch",
			configPath: writeResult.path,
			changedPaths,
			nextConfig: writeResult.config,
			actor,
			context
		});
		respond(true, {
			ok: true,
			path: writeResult.path,
			config: redactConfigObject(writeResult.config, schemaPatch.uiHints),
			restart,
			sentinel: {
				path: sentinelPath,
				payload
			}
		}, void 0);
		writeResult.queueFollowUp();
	},
	"config.apply": async ({ params, respond, client, context }) => {
		if (!assertValidParams(params, validateConfigApplyParams, "config.apply", respond)) return;
		const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
		if (!requireConfigBaseHash(params, snapshot, respond)) return;
		const parsed = parseValidateConfigFromRawOrRespond(params, "config.apply", snapshot, respond);
		if (!parsed) return;
		const preparedSecretsSnapshot = await ensureResolvableSecretRefsOrRespond({
			config: parsed.config,
			respond
		});
		if (!preparedSecretsSnapshot) return;
		const changedPaths = diffConfigPaths(snapshot.config, parsed.config);
		const actor = resolveControlPlaneActor(client);
		context?.logGateway?.info(`config.apply write ${formatControlPlaneActor(actor)} changedPaths=${summarizeChangedPaths(changedPaths)} restartReason=config.apply`);
		const disconnectSharedAuthClients = didSharedGatewayAuthChange(snapshot.config, parsed.config) || didActiveSharedGatewayAuthChange({
			fallbackPrev: snapshot.config,
			next: preparedSecretsSnapshot.config
		});
		const writeResult = await commitGatewayConfigWrite({
			snapshot,
			writeOptions,
			nextConfig: parsed.writeConfig,
			context,
			disconnectSharedAuthClients
		});
		clearConfigSchemaResponseCache();
		const { payload, sentinelPath, restart } = await resolveGatewayConfigRestartWriteResult({
			requestParams: params,
			kind: "config-apply",
			mode: "config.apply",
			configPath: writeResult.path,
			changedPaths,
			nextConfig: writeResult.config,
			actor,
			context
		});
		respond(true, {
			ok: true,
			path: writeResult.path,
			config: redactConfigObject(writeResult.config, parsed.schema.uiHints),
			restart,
			sentinel: {
				path: sentinelPath,
				payload
			}
		}, void 0);
		writeResult.queueFollowUp();
	},
	"config.openFile": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateConfigGetParams, "config.openFile", respond)) return;
		const configPath = createConfigIO().configPath;
		try {
			await execConfigOpenCommand(resolveConfigOpenCommand(configPath));
			respond(true, {
				ok: true,
				path: configPath
			}, void 0);
		} catch (error) {
			const errorMessage = formatConfigOpenError(error);
			const detailedError = errorMessage.includes("xdg-open") && errorMessage.includes("no method available") ? `Cannot open file in headless environment. File path: ${configPath}. This environment appears to lack a graphical or terminal browser handler.` : `Failed to open config file: ${errorMessage}`;
			context?.logGateway?.warn(`config.openFile failed path=${sanitizeLookupPathForLog(configPath)}: ${errorMessage}`);
			respond(true, {
				ok: false,
				path: configPath,
				error: detailedError
			}, void 0);
		}
	}
};
//#endregion
export { clearConfigSchemaResponseCacheForTests, configHandlers, loadConfigSchemaResponseForTests, resolveConfigOpenCommand };
