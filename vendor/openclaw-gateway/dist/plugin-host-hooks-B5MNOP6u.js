import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as validateJsonSchemaValue } from "./schema-validator-ocH5WSQX.js";
import { Dt as validatePluginsUiDescriptorsParams, Et as validatePluginsSessionActionResult, Ii as ErrorCodes, Li as errorShape, Tt as validatePluginsSessionActionParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { o as WRITE_SCOPE, t as ADMIN_SCOPE } from "./operator-scopes-DGvgHuOd.js";
import { a as getActivePluginRegistry } from "./runtime-B5Ug58ea.js";
import { t as isPluginJsonValue } from "./host-hook-json-BHsxXV1L.js";
//#region src/gateway/server-methods/plugin-host-hooks.ts
const log = createSubsystemLogger("gateway/plugin-host-hooks");
function formatSessionActionPayloadSchemaErrors(errors) {
	return errors.map((error) => error.text).join("; ");
}
function validatePluginSessionActionJsonFields(result) {
	for (const field of [
		"result",
		"reply",
		"details"
	]) if (result[field] !== void 0 && !isPluginJsonValue(result[field])) return `plugin session action ${field} must be JSON-compatible`;
}
const pluginHostHookHandlers = {
	"plugins.uiDescriptors": ({ params, respond }) => {
		if (!validatePluginsUiDescriptorsParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid plugins.uiDescriptors params: ${formatValidationErrors(validatePluginsUiDescriptorsParams.errors)}`));
			return;
		}
		respond(true, {
			ok: true,
			descriptors: (getActivePluginRegistry()?.controlUiDescriptors ?? []).map((entry) => Object.assign({}, entry.descriptor, {
				pluginId: entry.pluginId,
				pluginName: entry.pluginName
			}))
		}, void 0);
	},
	"plugins.sessionAction": async ({ params, client, respond }) => {
		if (!validatePluginsSessionActionParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid plugins.sessionAction params: ${formatValidationErrors(validatePluginsSessionActionParams.errors)}`));
			return;
		}
		const pluginId = normalizeOptionalString(params.pluginId);
		const actionId = normalizeOptionalString(params.actionId);
		const sessionKey = normalizeOptionalString(params.sessionKey);
		if (!pluginId || !actionId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "plugins.sessionAction pluginId and actionId must be non-empty"));
			return;
		}
		const registry = getActivePluginRegistry();
		const pluginLoaded = Boolean(registry?.plugins.some((plugin) => plugin.id === pluginId && plugin.status === "loaded"));
		const registration = (registry?.sessionActions ?? []).find((entry) => entry.pluginId === pluginId && entry.action.id === actionId);
		if (!registration || !pluginLoaded) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `unknown plugin session action: ${pluginId}/${actionId}`));
			return;
		}
		const scopes = Array.isArray(client?.connect.scopes) ? client.connect.scopes : [];
		const hasAdmin = scopes.includes(ADMIN_SCOPE);
		const missingScope = (registration.action.requiredScopes && registration.action.requiredScopes.length > 0 ? registration.action.requiredScopes : [WRITE_SCOPE]).find((scope) => !hasAdmin && !scopes.includes(scope) && !(scope === "operator.read" && scopes.includes("operator.write")));
		if (missingScope) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `missing scope: ${missingScope}`));
			return;
		}
		try {
			if (params.payload !== void 0 && !isPluginJsonValue(params.payload)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "plugin session action payload must be JSON-compatible"));
				return;
			}
			if (registration.action.schema !== void 0) {
				if (typeof registration.action.schema !== "boolean" && !isRecord(registration.action.schema)) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "plugin session action schema must be an object or boolean"));
					return;
				}
				const validation = validateJsonSchemaValue({
					schema: registration.action.schema,
					cacheKey: `plugin-session-action:${pluginId}:${actionId}`,
					value: params.payload
				});
				if (!validation.ok) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `plugin session action payload does not match schema: ${formatSessionActionPayloadSchemaErrors(validation.errors)}`));
					return;
				}
			}
			const result = await registration.action.handler({
				pluginId,
				actionId,
				...sessionKey ? { sessionKey } : {},
				...params.payload !== void 0 ? { payload: params.payload } : {},
				client: {
					...client?.connId ? { connId: client.connId } : {},
					scopes: [...scopes]
				}
			});
			if (result !== void 0 && !isRecord(result)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "plugin session action result must be an object"));
				return;
			}
			const wireResult = result?.ok === false ? result : {
				ok: true,
				...result
			};
			if (!validatePluginsSessionActionResult(wireResult)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid plugin session action result: ${formatValidationErrors(validatePluginsSessionActionResult.errors)}`));
				return;
			}
			const jsonFieldError = result ? validatePluginSessionActionJsonFields(result) : void 0;
			if (jsonFieldError) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, jsonFieldError));
				return;
			}
			if (!wireResult.ok) {
				respond(true, {
					ok: false,
					error: wireResult.error,
					...wireResult.code !== void 0 ? { code: wireResult.code } : {},
					...wireResult.details !== void 0 ? { details: wireResult.details } : {}
				}, void 0);
				return;
			}
			respond(true, {
				ok: true,
				...wireResult.result !== void 0 ? { result: wireResult.result } : {},
				...wireResult.continueAgent !== void 0 ? { continueAgent: wireResult.continueAgent } : {},
				...wireResult.reply !== void 0 ? { reply: wireResult.reply } : {}
			});
		} catch (error) {
			log.warn(`plugin session action failed plugin=${pluginId} action=${actionId}: ${formatErrorMessage(error)}`);
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "plugin session action failed"));
		}
	}
};
//#endregion
export { pluginHostHookHandlers };
