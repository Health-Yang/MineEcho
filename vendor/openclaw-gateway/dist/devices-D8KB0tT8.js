import { G as validateDeviceTokenRevokeParams, H as validateDevicePairListParams, Ii as ErrorCodes, K as validateDeviceTokenRotateParams, Li as errorShape, U as validateDevicePairRejectParams, V as validateDevicePairApproveParams, W as validateDevicePairRemoveParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { a as getPairedDevice, d as rejectDevicePairing, f as removePairedDevice, g as summarizeDeviceTokens, h as rotateDeviceToken, i as formatDevicePairingForbiddenMessage, l as listDevicePairing, m as revokeDeviceToken, n as approveDevicePairing, o as getPendingDevicePairing } from "./device-pairing-3ziNdlg5.js";
//#region src/gateway/server-methods/devices.ts
const DEVICE_TOKEN_ROTATION_DENIED_MESSAGE = "device token rotation denied";
const DEVICE_TOKEN_REVOCATION_DENIED_MESSAGE = "device token revocation denied";
const DEVICE_PAIR_APPROVAL_DENIED_MESSAGE = "device pairing approval denied";
const DEVICE_PAIR_REJECTION_DENIED_MESSAGE = "device pairing rejection denied";
function redactPairedDevice(device) {
	const { tokens, approvedScopes: _approvedScopes, ...rest } = device;
	return {
		...rest,
		tokens: summarizeDeviceTokens(tokens)
	};
}
function logDeviceTokenRotationDenied(params) {
	const suffix = params.scope ? ` scope=${params.scope}` : "";
	params.log.warn(`device token rotation denied device=${params.deviceId} role=${params.role} reason=${params.reason}${suffix}`);
}
function logDeviceTokenRevocationDenied(params) {
	const suffix = params.scope ? ` scope=${params.scope}` : "";
	params.log.warn(`device token revocation denied device=${params.deviceId} role=${params.role} reason=${params.reason}${suffix}`);
}
function resolveDeviceManagementAuthz(client, targetDeviceId) {
	return {
		...resolveDeviceSessionAuthz(client),
		normalizedTargetDeviceId: targetDeviceId.trim()
	};
}
function resolveDeviceSessionAuthz(client) {
	const callerScopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
	const rawCallerDeviceId = client?.connect?.device?.id;
	return {
		callerDeviceId: client?.isDeviceTokenAuth && typeof rawCallerDeviceId === "string" && rawCallerDeviceId.trim() ? rawCallerDeviceId.trim() : null,
		callerScopes,
		isAdminCaller: callerScopes.includes("operator.admin")
	};
}
function deniesCrossDeviceManagement(authz) {
	return Boolean(authz.callerDeviceId && authz.callerDeviceId !== authz.normalizedTargetDeviceId && !authz.isAdminCaller);
}
function shouldReturnRotatedDeviceToken(authz) {
	return Boolean(authz.callerDeviceId && authz.callerDeviceId === authz.normalizedTargetDeviceId);
}
function deniesDeviceTokenRoleManagement(authz, targetRole) {
	const normalizedTargetRole = targetRole.trim();
	if (!normalizedTargetRole || authz.isAdminCaller) return false;
	return normalizedTargetRole !== "operator";
}
function hasNonOperatorDeviceRole(input) {
	const roles = /* @__PURE__ */ new Set();
	const role = input.role?.trim();
	if (role) roles.add(role);
	for (const entry of input.roles ?? []) {
		const normalized = entry.trim();
		if (normalized) roles.add(normalized);
	}
	return [...roles].some((entry) => entry !== "operator");
}
function hasNonOperatorDeviceTokenRole(tokens) {
	for (const token of Object.values(tokens ?? {})) {
		const normalized = token.role.trim();
		if (normalized && normalized !== "operator") return true;
	}
	return false;
}
function requestsNonOperatorDeviceRole(pending) {
	return hasNonOperatorDeviceRole(pending);
}
function pairedDeviceHasNonOperatorRole(device) {
	return hasNonOperatorDeviceRole(device) || hasNonOperatorDeviceTokenRole(device.tokens);
}
const deviceHandlers = {
	"device.pair.list": async ({ params, respond, client }) => {
		if (!validateDevicePairListParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.pair.list params: ${formatValidationErrors(validateDevicePairListParams.errors)}`));
			return;
		}
		const list = await listDevicePairing();
		const authz = resolveDeviceSessionAuthz(client);
		const visibleList = authz.callerDeviceId && !authz.isAdminCaller ? {
			pending: list.pending.filter((request) => request.deviceId.trim() === authz.callerDeviceId),
			paired: list.paired.filter((device) => device.deviceId.trim() === authz.callerDeviceId)
		} : list;
		respond(true, {
			pending: visibleList.pending,
			paired: visibleList.paired.map((device) => redactPairedDevice(device))
		}, void 0);
	},
	"device.pair.approve": async ({ params, respond, context, client }) => {
		if (!validateDevicePairApproveParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.pair.approve params: ${formatValidationErrors(validateDevicePairApproveParams.errors)}`));
			return;
		}
		const { requestId } = params;
		const authz = resolveDeviceSessionAuthz(client);
		if (!authz.isAdminCaller) {
			const pending = await getPendingDevicePairing(requestId);
			if (!pending) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_PAIR_APPROVAL_DENIED_MESSAGE));
				return;
			}
			if (authz.callerDeviceId && pending.deviceId.trim() !== authz.callerDeviceId) {
				context.logGateway.warn(`device pairing approval denied request=${requestId} reason=device-ownership-mismatch`);
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_PAIR_APPROVAL_DENIED_MESSAGE));
				return;
			}
			if (requestsNonOperatorDeviceRole(pending)) {
				context.logGateway.warn(`device pairing approval denied request=${requestId} reason=role-management-requires-admin`);
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_PAIR_APPROVAL_DENIED_MESSAGE));
				return;
			}
		}
		const approved = await approveDevicePairing(requestId, { callerScopes: authz.callerScopes });
		if (!approved) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
			return;
		}
		if (approved.status === "forbidden") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, formatDevicePairingForbiddenMessage(approved)));
			return;
		}
		context.logGateway.info(`device pairing approved device=${approved.device.deviceId} role=${approved.device.role ?? "unknown"}`);
		context.broadcast("device.pair.resolved", {
			requestId,
			deviceId: approved.device.deviceId,
			decision: "approved",
			ts: Date.now()
		}, { dropIfSlow: true });
		respond(true, {
			requestId,
			device: redactPairedDevice(approved.device)
		}, void 0);
	},
	"device.pair.reject": async ({ params, respond, context, client }) => {
		if (!validateDevicePairRejectParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.pair.reject params: ${formatValidationErrors(validateDevicePairRejectParams.errors)}`));
			return;
		}
		const { requestId } = params;
		const authz = resolveDeviceSessionAuthz(client);
		if (authz.callerDeviceId && !authz.isAdminCaller) {
			const pending = await getPendingDevicePairing(requestId);
			if (!pending) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_PAIR_REJECTION_DENIED_MESSAGE));
				return;
			}
			if (pending.deviceId.trim() !== authz.callerDeviceId) {
				context.logGateway.warn(`device pairing rejection denied request=${requestId} reason=device-ownership-mismatch`);
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_PAIR_REJECTION_DENIED_MESSAGE));
				return;
			}
		}
		const rejected = await rejectDevicePairing(requestId);
		if (!rejected) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
			return;
		}
		context.broadcast("device.pair.resolved", {
			requestId,
			deviceId: rejected.deviceId,
			decision: "rejected",
			ts: Date.now()
		}, { dropIfSlow: true });
		respond(true, rejected, void 0);
	},
	"device.pair.remove": async ({ params, respond, context, client }) => {
		if (!validateDevicePairRemoveParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.pair.remove params: ${formatValidationErrors(validateDevicePairRemoveParams.errors)}`));
			return;
		}
		const { deviceId } = params;
		const authz = resolveDeviceManagementAuthz(client, deviceId);
		if (deniesCrossDeviceManagement(authz)) {
			context.logGateway.warn(`device pairing removal denied device=${deviceId} reason=device-ownership-mismatch`);
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "device pairing removal denied"));
			return;
		}
		if (authz.callerDeviceId && !authz.isAdminCaller) {
			const paired = await getPairedDevice(authz.normalizedTargetDeviceId);
			if (paired && pairedDeviceHasNonOperatorRole(paired)) {
				context.logGateway.warn(`device pairing removal denied device=${deviceId} reason=role-management-requires-admin`);
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "device pairing removal denied"));
				return;
			}
		}
		const removed = await removePairedDevice(deviceId);
		if (!removed) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown deviceId"));
			return;
		}
		context.logGateway.info(`device pairing removed device=${removed.deviceId}`);
		context.invalidateClientsForDevice?.(removed.deviceId, { reason: "device-pair-removed" });
		respond(true, removed, void 0);
		queueMicrotask(() => {
			context.disconnectClientsForDevice?.(removed.deviceId);
		});
	},
	"device.token.rotate": async ({ params, respond, context, client }) => {
		if (!validateDeviceTokenRotateParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.token.rotate params: ${formatValidationErrors(validateDeviceTokenRotateParams.errors)}`));
			return;
		}
		const { deviceId, role, scopes } = params;
		const authz = resolveDeviceManagementAuthz(client, deviceId);
		if (deniesCrossDeviceManagement(authz)) {
			logDeviceTokenRotationDenied({
				log: context.logGateway,
				deviceId,
				role,
				reason: "device-ownership-mismatch"
			});
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_ROTATION_DENIED_MESSAGE));
			return;
		}
		if (deniesDeviceTokenRoleManagement(authz, role)) {
			logDeviceTokenRotationDenied({
				log: context.logGateway,
				deviceId,
				role,
				reason: "role-management-requires-admin"
			});
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_ROTATION_DENIED_MESSAGE));
			return;
		}
		const rotated = await rotateDeviceToken({
			deviceId,
			role,
			scopes,
			callerScopes: authz.callerScopes
		});
		if (!rotated.ok) {
			logDeviceTokenRotationDenied({
				log: context.logGateway,
				deviceId,
				role,
				reason: rotated.reason,
				scope: rotated.scope
			});
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_ROTATION_DENIED_MESSAGE));
			return;
		}
		const entry = rotated.entry;
		context.logGateway.info(`device token rotated device=${deviceId} role=${entry.role} scopes=${entry.scopes.join(",")}`);
		context.invalidateClientsForDevice?.(deviceId.trim(), {
			role: entry.role,
			reason: "device-token-rotated"
		});
		respond(true, {
			deviceId,
			role: entry.role,
			...shouldReturnRotatedDeviceToken(authz) ? { token: entry.token } : {},
			scopes: entry.scopes,
			rotatedAtMs: entry.rotatedAtMs ?? entry.createdAtMs
		}, void 0);
		queueMicrotask(() => {
			context.disconnectClientsForDevice?.(deviceId.trim(), { role: entry.role });
		});
	},
	"device.token.revoke": async ({ params, respond, context, client }) => {
		if (!validateDeviceTokenRevokeParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid device.token.revoke params: ${formatValidationErrors(validateDeviceTokenRevokeParams.errors)}`));
			return;
		}
		const { deviceId, role } = params;
		const authz = resolveDeviceManagementAuthz(client, deviceId);
		if (deniesCrossDeviceManagement(authz)) {
			context.logGateway.warn(`device token revocation denied device=${deviceId} role=${role} reason=device-ownership-mismatch`);
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_REVOCATION_DENIED_MESSAGE));
			return;
		}
		if (deniesDeviceTokenRoleManagement(authz, role)) {
			logDeviceTokenRevocationDenied({
				log: context.logGateway,
				deviceId,
				role,
				reason: "role-management-requires-admin"
			});
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_REVOCATION_DENIED_MESSAGE));
			return;
		}
		const revoked = await revokeDeviceToken({
			deviceId,
			role,
			callerScopes: authz.callerScopes
		});
		if (!revoked.ok) {
			logDeviceTokenRevocationDenied({
				log: context.logGateway,
				deviceId,
				role,
				reason: revoked.reason,
				scope: revoked.scope
			});
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, DEVICE_TOKEN_REVOCATION_DENIED_MESSAGE));
			return;
		}
		const entry = revoked.entry;
		const normalizedDeviceId = deviceId.trim();
		context.logGateway.info(`device token revoked device=${normalizedDeviceId} role=${entry.role}`);
		context.invalidateClientsForDevice?.(normalizedDeviceId, {
			role: entry.role,
			reason: "device-token-revoked"
		});
		respond(true, {
			deviceId: normalizedDeviceId,
			role: entry.role,
			revokedAtMs: entry.revokedAtMs ?? Date.now()
		}, void 0);
		queueMicrotask(() => {
			context.disconnectClientsForDevice?.(normalizedDeviceId, { role: entry.role });
		});
	}
};
//#endregion
export { deviceHandlers };
