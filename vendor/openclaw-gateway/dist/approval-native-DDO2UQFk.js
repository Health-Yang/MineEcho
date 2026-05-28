import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { n as normalizeAccountId } from "./account-id-B0YIFDpA.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./routing-BEOAuKfu.js";
import { t as matchesApprovalRequestFilters } from "./approval-request-filters-VKwGhlg-.js";
import "./approval-client-runtime-DwawpTKX.js";
import { i as splitChannelApprovalCapability, r as createChannelApprovalCapability } from "./approval-delivery-helpers-0rGWr8Ti.js";
import "./approval-delivery-runtime-BCHo9nhy.js";
import { n as createLazyChannelApprovalNativeRuntimeAdapter } from "./approval-handler-adapter-runtime-uo1rB4v-.js";
import { a as doesApprovalRequestMatchChannelAccount, r as resolveApprovalRequestSessionTarget } from "./exec-approval-session-target-CXv85GEO.js";
import { a as shouldSuppressLocalNativeExecApprovalPrompt, i as nativeApprovalTargetsMatch, n as createChannelNativeOriginTargetResolver, r as createNativeApprovalForwardingFallbackSuppressor, t as createChannelApproverDmTargetResolver } from "./approval-native-helpers-DorIyB3D.js";
import "./approval-native-runtime-0Hr9Qyul.js";
import { a as buildApprovalReactionPendingContentForRequest } from "./approval-reaction-runtime-Ca4ba5X9.js";
import "./approval-runtime-DVCqoMA9.js";
import { i as resolveSignalAccount, n as listSignalAccountIds, r as resolveDefaultSignalAccountId } from "./accounts-CiPyF2G3.js";
import { d as normalizeSignalMessagingTarget } from "./identity-DoC1DJz7.js";
import { i as signalApprovalAuth, r as getSignalApprovalApprovers } from "./format-CwzvmVCR.js";
//#region extensions/signal/src/approval-native.ts
const DEFAULT_APPROVAL_FORWARDING_MODE = "session";
function isSignalApprovalTransportEnabled(params) {
	return resolveSignalAccount({
		cfg: params.cfg,
		accountId: params.accountId
	}).enabled;
}
function resolveApprovalKind(request, approvalKind) {
	if (approvalKind) return approvalKind;
	return "command" in request.request ? "exec" : "plugin";
}
function resolveApprovalForwardingConfig(params) {
	return params.approvalKind === "plugin" ? params.cfg.approvals?.plugin : params.cfg.approvals?.exec;
}
function normalizeApprovalForwardingMode(mode) {
	return mode ?? DEFAULT_APPROVAL_FORWARDING_MODE;
}
function approvalModeIncludesSession(mode) {
	return mode === "session" || mode === "both";
}
function approvalModeIncludesTargets(mode) {
	return mode === "targets" || mode === "both";
}
function matchesForwardingFilters(params) {
	return matchesApprovalRequestFilters({
		request: params.request.request,
		agentFilter: params.config.agentFilter,
		sessionFilter: params.config.sessionFilter,
		fallbackAgentIdFromSessionKey: true
	});
}
function targetAccountMatchesSignalAccount(params) {
	const targetAccountId = normalizeOptionalString(params.targetAccountId);
	const accountId = normalizeOptionalString(params.accountId);
	if (targetAccountId) return !accountId || normalizeAccountId(targetAccountId) === normalizeAccountId(accountId);
	if (!accountId) return true;
	const normalizedAccountId = normalizeAccountId(accountId);
	if (normalizedAccountId === normalizeAccountId(resolveDefaultSignalAccountId(params.cfg))) return true;
	const enabledAccountIds = listSignalAccountIds(params.cfg).filter((candidateAccountId) => isSignalApprovalTransportEnabled({
		cfg: params.cfg,
		accountId: candidateAccountId
	})).map((candidateAccountId) => normalizeAccountId(candidateAccountId));
	return enabledAccountIds.length === 1 && enabledAccountIds[0] === normalizedAccountId;
}
function normalizeSignalForwardTarget(target) {
	if (normalizeLowercaseStringOrEmpty(target.channel) !== "signal") return null;
	const to = normalizeSignalMessagingTarget(target.to);
	if (!to) return null;
	return {
		to,
		accountId: normalizeOptionalString(target.accountId),
		threadId: target.threadId ?? null
	};
}
function hasMatchingSignalTarget(params) {
	const candidateTarget = params.target ? normalizeSignalForwardTarget(params.target) : null;
	return (params.config.targets ?? []).some((target) => {
		const configuredTarget = normalizeSignalForwardTarget(target);
		if (!configuredTarget) return false;
		if (!targetAccountMatchesSignalAccount({
			cfg: params.cfg,
			targetAccountId: configuredTarget.accountId,
			accountId: params.accountId
		})) return false;
		if (!candidateTarget) return true;
		return nativeApprovalTargetsMatch({
			channel: "signal",
			left: configuredTarget,
			right: candidateTarget
		});
	});
}
function hasSignalOriginOrSessionTarget(params) {
	if (resolveTurnSourceSignalOriginTarget(params.request)) return true;
	const sessionTarget = resolveApprovalRequestSessionTarget({
		cfg: params.cfg,
		request: params.request
	});
	return normalizeLowercaseStringOrEmpty(sessionTarget?.channel) === "signal" && targetAccountMatchesSignalAccount({
		cfg: params.cfg,
		targetAccountId: sessionTarget?.accountId,
		accountId: params.accountId
	});
}
function canApprovalPotentiallyRouteToSignal(params) {
	if (!isSignalApprovalTransportEnabled(params)) return false;
	const config = resolveApprovalForwardingConfig(params);
	if (!config?.enabled) return false;
	const mode = normalizeApprovalForwardingMode(config.mode);
	if (approvalModeIncludesSession(mode)) return true;
	if (params.nativeSessionOnly) return false;
	return approvalModeIncludesTargets(mode) && hasMatchingSignalTarget({
		cfg: params.cfg,
		config,
		accountId: params.accountId
	});
}
function canAnyApprovalPotentiallyRouteToSignal(params) {
	return canApprovalPotentiallyRouteToSignal({
		...params,
		approvalKind: "exec"
	}) || canApprovalPotentiallyRouteToSignal({
		...params,
		approvalKind: "plugin"
	});
}
function isSignalNativeApprovalHandlerConfigured(params) {
	return canAnyApprovalPotentiallyRouteToSignal({
		...params,
		nativeSessionOnly: true
	});
}
function isSignalSessionApprovalEligible(params) {
	if (!isSignalApprovalTransportEnabled(params)) return false;
	const config = resolveApprovalForwardingConfig(params);
	if (!config?.enabled) return false;
	if (!approvalModeIncludesSession(normalizeApprovalForwardingMode(config.mode))) return false;
	if (!matchesForwardingFilters({
		config,
		request: params.request
	})) return false;
	if (!doesApprovalRequestMatchChannelAccount({
		cfg: params.cfg,
		request: params.request,
		channel: "signal",
		accountId: params.accountId
	})) return false;
	return hasSignalOriginOrSessionTarget({
		cfg: params.cfg,
		accountId: params.accountId,
		request: params.request
	});
}
function resolveTurnSourceSignalOriginTarget(request) {
	if (normalizeLowercaseStringOrEmpty(request.request.turnSourceChannel) !== "signal") return null;
	const to = normalizeSignalMessagingTarget(request.request.turnSourceTo ?? "");
	if (!to) return null;
	return {
		to,
		accountId: normalizeOptionalString(request.request.turnSourceAccountId)
	};
}
function resolveSessionSignalOriginTarget(sessionTarget) {
	const to = normalizeSignalMessagingTarget(sessionTarget.to);
	return to ? {
		to,
		accountId: normalizeOptionalString(sessionTarget.accountId)
	} : null;
}
function shouldHandleSignalApprovalRequest(params) {
	return isSignalSessionApprovalEligible({
		...params,
		approvalKind: resolveApprovalKind(params.request, params.approvalKind)
	});
}
function resolveSignalSessionTargetFromSessionKey(sessionKey) {
	const rest = parseAgentSessionKey(sessionKey)?.rest ?? normalizeOptionalString(sessionKey);
	if (!rest || !normalizeLowercaseStringOrEmpty(rest).startsWith("signal:")) return null;
	return normalizeSignalMessagingTarget(rest.slice(7)) ?? null;
}
function shouldSuppressLocalSignalExecApprovalPrompt(params) {
	return shouldSuppressLocalNativeExecApprovalPrompt({
		...params,
		isTransportEnabled: isSignalApprovalTransportEnabled,
		isSessionRouteEligible: ({ cfg, accountId, metadata }) => {
			if (getSignalApprovalApprovers({
				cfg,
				accountId
			}).length > 0) return true;
			const sessionTarget = resolveSignalSessionTargetFromSessionKey(metadata.sessionKey);
			return Boolean(sessionTarget && !isSignalGroupTarget(sessionTarget));
		}
	});
}
const resolveSignalOriginTargetBase = createChannelNativeOriginTargetResolver({
	channel: "signal",
	shouldHandleRequest: shouldHandleSignalApprovalRequest,
	resolveTurnSourceTarget: resolveTurnSourceSignalOriginTarget,
	resolveSessionTarget: resolveSessionSignalOriginTarget,
	normalizeTarget: (target) => {
		const to = normalizeSignalMessagingTarget(target.to);
		return to ? {
			...target,
			to
		} : null;
	}
});
function isSignalGroupTarget(to) {
	return normalizeLowercaseStringOrEmpty(to).startsWith("group:");
}
function resolveSignalOriginTarget(params) {
	const target = resolveSignalOriginTargetBase(params);
	if (!target) return null;
	if (isSignalGroupTarget(target.to) && getSignalApprovalApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	}).length === 0) return null;
	return target;
}
const resolveSignalApproverDmTargets = createChannelApproverDmTargetResolver({
	shouldHandleRequest: shouldHandleSignalApprovalRequest,
	resolveApprovers: getSignalApprovalApprovers,
	mapApprover: (approver, params) => {
		const to = normalizeSignalMessagingTarget(approver);
		if (!to) return null;
		return {
			to,
			accountId: normalizeOptionalString(params.accountId)
		};
	}
});
const shouldSuppressSignalForwardingFallback = createNativeApprovalForwardingFallbackSuppressor({
	channel: "signal",
	normalizeForwardTarget: normalizeSignalForwardTarget,
	resolveAccountId: ({ forwardingTarget, request }) => forwardingTarget.accountId ?? normalizeOptionalString(request.request.turnSourceAccountId),
	resolveForwardingTargetForMatch: ({ forwardingTarget, accountId }) => ({
		...forwardingTarget,
		accountId
	}),
	isSessionRouteEligible: isSignalSessionApprovalEligible,
	resolveOriginTarget: resolveSignalOriginTarget,
	resolveApproverDmTargets: resolveSignalApproverDmTargets
});
function buildSignalExecPendingPayload(params) {
	return buildApprovalReactionPendingContentForRequest(params).manualFallbackPayload;
}
function buildSignalPluginPendingPayload(params) {
	return buildApprovalReactionPendingContentForRequest(params).manualFallbackPayload;
}
const signalApprovalCapability = createChannelApprovalCapability({
	...signalApprovalAuth,
	getActionAvailabilityState: ({ cfg, accountId, approvalKind }) => (approvalKind ? canApprovalPotentiallyRouteToSignal({
		cfg,
		accountId,
		approvalKind
	}) : canAnyApprovalPotentiallyRouteToSignal({
		cfg,
		accountId
	})) ? { kind: "enabled" } : { kind: "disabled" },
	getExecInitiatingSurfaceState: ({ cfg, accountId }) => canApprovalPotentiallyRouteToSignal({
		cfg,
		accountId,
		approvalKind: "exec"
	}) ? { kind: "enabled" } : { kind: "disabled" },
	describeExecApprovalSetup: ({ accountId }) => {
		return `Signal supports native exec approvals for this account when \`approvals.exec.enabled\` is true and the route allows Signal. Link Signal and keep the gateway running; configure \`${accountId && accountId !== "default" ? `channels.signal.accounts.${accountId}` : "channels.signal"}.allowFrom\` to restrict approvers.`;
	},
	delivery: {
		hasConfiguredDmRoute: ({ cfg }) => listSignalAccountIds(cfg).some((accountId) => {
			if (!canAnyApprovalPotentiallyRouteToSignal({
				cfg,
				accountId,
				nativeSessionOnly: true
			})) return false;
			return getSignalApprovalApprovers({
				cfg,
				accountId
			}).length > 0;
		}),
		shouldSuppressForwardingFallback: shouldSuppressSignalForwardingFallback
	},
	render: {
		exec: { buildPendingPayload: ({ request, nowMs }) => buildSignalExecPendingPayload({
			request,
			nowMs
		}) },
		plugin: { buildPendingPayload: ({ request, nowMs }) => buildSignalPluginPendingPayload({
			request,
			nowMs
		}) }
	},
	native: {
		describeDeliveryCapabilities: ({ cfg, accountId, approvalKind, request }) => {
			const originTarget = resolveSignalOriginTarget({
				cfg,
				accountId,
				approvalKind,
				request
			});
			const approverTargets = resolveSignalApproverDmTargets({
				cfg,
				accountId,
				approvalKind,
				request
			});
			return {
				enabled: Boolean(originTarget) || approverTargets.length > 0,
				preferredSurface: originTarget ? "origin" : "approver-dm",
				supportsOriginSurface: Boolean(originTarget),
				supportsApproverDmSurface: approverTargets.length > 0,
				notifyOriginWhenDmOnly: true
			};
		},
		resolveOriginTarget: resolveSignalOriginTarget,
		resolveApproverDmTargets: resolveSignalApproverDmTargets
	},
	nativeRuntime: createLazyChannelApprovalNativeRuntimeAdapter({
		eventKinds: ["exec", "plugin"],
		isConfigured: ({ cfg, accountId, context }) => Boolean(context) && isSignalNativeApprovalHandlerConfigured({
			cfg,
			accountId
		}),
		shouldHandle: ({ cfg, accountId, context, request }) => Boolean(context) && shouldHandleSignalApprovalRequest({
			cfg,
			accountId,
			request
		}),
		load: async () => (await import("./approval-handler.runtime-CnCtrfkU.js")).signalApprovalNativeRuntime
	})
});
splitChannelApprovalCapability(signalApprovalCapability);
//#endregion
export { shouldSuppressLocalSignalExecApprovalPrompt as n, signalApprovalCapability as r, isSignalNativeApprovalHandlerConfigured as t };
