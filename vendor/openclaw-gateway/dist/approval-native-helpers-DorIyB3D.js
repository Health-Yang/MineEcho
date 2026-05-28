import { o as channelRouteTargetsMatchExact } from "./channel-route-Dvehdg4D.js";
import { t as matchesApprovalRequestFilters } from "./approval-request-filters-VKwGhlg-.js";
import { p as getExecApprovalReplyMetadata } from "./exec-approval-reply-CvpRi92u.js";
import { t as resolveApprovalRequestOriginTarget } from "./exec-approval-session-target-CXv85GEO.js";
//#region src/plugin-sdk/approval-native-helpers.ts
function nativeApprovalTargetsMatch(params) {
	return channelRouteTargetsMatchExact({
		left: {
			channel: params.channel,
			to: params.left.to,
			accountId: params.left.accountId,
			threadId: params.left.threadId
		},
		right: {
			channel: params.channel,
			to: params.right.to,
			accountId: params.right.accountId,
			threadId: params.right.threadId
		}
	});
}
function shouldSuppressLocalNativeExecApprovalPrompt(params) {
	if (params.hint?.kind !== "approval-pending" || params.hint.approvalKind !== "exec") return false;
	if (params.hint.nativeRouteActive !== true) return false;
	const metadata = getExecApprovalReplyMetadata(params.payload);
	if (!metadata || metadata.approvalKind !== "exec") return false;
	if (!(params.isNativeDeliveryEnabled ?? params.isTransportEnabled)?.({
		cfg: params.cfg,
		accountId: params.accountId
	})) return false;
	const config = params.resolveApprovalConfig?.({
		cfg: params.cfg,
		accountId: params.accountId,
		metadata
	}) ?? params.cfg.approvals?.exec;
	if ((params.requireApprovalConfigEnabled ?? params.resolveApprovalConfig === void 0) && !config?.enabled) return false;
	if (params.enforceForwardingMode ?? params.resolveApprovalConfig === void 0) {
		const mode = config?.mode ?? "session";
		if (mode !== "session" && mode !== "both" && !params.hasExactTargetProof) return false;
	}
	if (params.isSessionRouteEligible && !params.isSessionRouteEligible({
		cfg: params.cfg,
		accountId: params.accountId,
		metadata
	})) return false;
	return matchesApprovalRequestFilters({
		request: {
			agentId: metadata.agentId,
			sessionKey: metadata.sessionKey
		},
		agentFilter: config?.agentFilter,
		sessionFilter: config?.sessionFilter,
		fallbackAgentIdFromSessionKey: params.fallbackAgentIdFromSessionKey ?? true
	});
}
function isNativeApprovalTarget(value) {
	return Boolean(value && typeof value === "object" && typeof value.to === "string");
}
function nativeApprovalTargetMatcher(channel) {
	return (left, right) => isNativeApprovalTarget(left) && isNativeApprovalTarget(right) && nativeApprovalTargetsMatch({
		channel,
		left,
		right
	});
}
function resolveApprovalKind(request, approvalKind) {
	if (approvalKind) return approvalKind;
	return "command" in request.request ? "exec" : "plugin";
}
function normalizeOptionalAccountId(value) {
	return value?.trim() || void 0;
}
function createNativeApprovalForwardingFallbackSuppressor(params) {
	const targetsMatch = params.targetsMatch ?? ((left, right) => nativeApprovalTargetsMatch({
		channel: params.channel,
		left,
		right
	}));
	return (input) => {
		const forwardingTarget = params.normalizeForwardTarget(input.target);
		if (!forwardingTarget) return false;
		const accountId = normalizeOptionalAccountId(params.resolveAccountId?.({
			forwardingTarget,
			target: input.target,
			request: input.request
		})) ?? normalizeOptionalAccountId(forwardingTarget.accountId) ?? normalizeOptionalAccountId(input.request.request.turnSourceAccountId);
		const approvalKind = params.resolveApprovalKind?.({
			approvalKind: input.approvalKind,
			request: input.request
		}) ?? resolveApprovalKind(input.request, input.approvalKind);
		if (!(input.target.source === "target" ? params.isExplicitTargetEligible?.({
			cfg: input.cfg,
			accountId,
			approvalKind,
			request: input.request,
			target: input.target
		}) ?? false : params.isSessionRouteEligible({
			cfg: input.cfg,
			accountId,
			approvalKind,
			request: input.request
		}))) return false;
		const forwardingTargetForMatch = params.resolveForwardingTargetForMatch?.({
			forwardingTarget,
			accountId,
			target: input.target,
			approvalKind,
			request: input.request
		}) ?? forwardingTarget;
		if (!forwardingTargetForMatch) return false;
		const originTarget = params.resolveOriginTarget({
			cfg: input.cfg,
			accountId,
			approvalKind,
			request: input.request
		});
		if (originTarget && targetsMatch(forwardingTargetForMatch, originTarget)) return true;
		return params.resolveApproverDmTargets({
			cfg: input.cfg,
			accountId,
			approvalKind,
			request: input.request
		}).some((approverTarget) => targetsMatch(forwardingTargetForMatch, approverTarget));
	};
}
function createOriginTargetResolver(params) {
	return (input) => {
		if (params.shouldHandleRequest && !params.shouldHandleRequest(input)) return null;
		const normalizeTarget = (target) => {
			if (!target) return null;
			return params.normalizeTarget ? params.normalizeTarget(target, input.request) ?? null : target;
		};
		const normalizeTargetForMatch = (target) => params.normalizeTargetForMatch?.(target, input.request) ?? target;
		return resolveApprovalRequestOriginTarget({
			cfg: input.cfg,
			request: input.request,
			channel: params.channel,
			accountId: input.accountId,
			resolveTurnSourceTarget: (request) => normalizeTarget(params.resolveTurnSourceTarget(request)),
			resolveSessionTarget: (sessionTarget) => normalizeTarget(params.resolveSessionTarget(sessionTarget, input.request)),
			targetsMatch: (left, right) => {
				const normalizedLeft = normalizeTargetForMatch(left);
				const normalizedRight = normalizeTargetForMatch(right);
				return Boolean(normalizedLeft && normalizedRight && params.targetsMatch(normalizedLeft, normalizedRight));
			},
			resolveFallbackTarget: params.resolveFallbackTarget ? (request) => normalizeTarget(params.resolveFallbackTarget?.(request) ?? null) : void 0
		});
	};
}
function hasCustomTargetsMatch(params) {
	return typeof params.targetsMatch === "function";
}
function createChannelNativeOriginTargetResolver(params) {
	if (hasCustomTargetsMatch(params)) return createOriginTargetResolver(params);
	return createOriginTargetResolver({
		...params,
		targetsMatch: nativeApprovalTargetMatcher(params.channel)
	});
}
function createChannelApproverDmTargetResolver(params) {
	return (input) => {
		if (params.shouldHandleRequest && !params.shouldHandleRequest(input)) return [];
		const targets = [];
		for (const approver of params.resolveApprovers({
			cfg: input.cfg,
			accountId: input.accountId
		})) {
			const target = params.mapApprover(approver, input);
			if (target) targets.push(target);
		}
		return targets;
	};
}
//#endregion
export { shouldSuppressLocalNativeExecApprovalPrompt as a, nativeApprovalTargetsMatch as i, createChannelNativeOriginTargetResolver as n, createNativeApprovalForwardingFallbackSuppressor as r, createChannelApproverDmTargetResolver as t };
