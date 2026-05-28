import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as INTERNAL_MESSAGE_CHANNEL } from "./message-channel-core-NW6lw3Ys.js";
import { c as isGatewayMessageChannel, s as isDeliverableMessageChannel, u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { c as normalizeAccountId } from "./delivery-context.shared-B9zntlj0.js";
import { r as resolveOutboundChannelPlugin } from "./channel-resolution-DAbY66ca.js";
import { n as resolveOutboundSessionRoute } from "./outbound-session-DPM4FIwc.js";
import { t as resolveSessionDeliveryTarget } from "./targets-session-DV5D5VT7.js";
import { i as resolveOutboundTarget } from "./targets-CviNlU8H.js";
//#region src/infra/outbound/agent-delivery.ts
function resolveAgentDeliveryPlan(params) {
	const requestedRaw = normalizeOptionalString(params.requestedChannel) ?? "";
	const requestedChannel = (requestedRaw ? normalizeMessageChannel(requestedRaw) : void 0) || "last";
	const explicitTo = normalizeOptionalString(params.explicitTo) ?? void 0;
	const normalizedTurnSource = params.turnSourceChannel ? normalizeMessageChannel(params.turnSourceChannel) : void 0;
	const turnSourceChannel = normalizedTurnSource && isDeliverableMessageChannel(normalizedTurnSource) ? normalizedTurnSource : void 0;
	const turnSourceTo = normalizeOptionalString(params.turnSourceTo) ?? void 0;
	const turnSourceAccountId = normalizeAccountId(params.turnSourceAccountId);
	const turnSourceThreadId = params.turnSourceThreadId != null && params.turnSourceThreadId !== "" ? params.turnSourceThreadId : void 0;
	const baseDelivery = resolveSessionDeliveryTarget({
		entry: params.sessionEntry,
		requestedChannel: requestedChannel === "webchat" ? "last" : requestedChannel,
		explicitTo,
		explicitThreadId: params.explicitThreadId,
		turnSourceChannel,
		turnSourceTo,
		turnSourceAccountId,
		turnSourceThreadId
	});
	const resolvedChannel = (() => {
		if (requestedChannel === "webchat") return INTERNAL_MESSAGE_CHANNEL;
		if (requestedChannel === "last") {
			if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
			return INTERNAL_MESSAGE_CHANNEL;
		}
		if (isGatewayMessageChannel(requestedChannel)) return requestedChannel;
		if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
		return INTERNAL_MESSAGE_CHANNEL;
	})();
	const deliveryTargetMode = explicitTo ? "explicit" : isDeliverableMessageChannel(resolvedChannel) ? "implicit" : void 0;
	const resolvedAccountId = normalizeAccountId(params.accountId) ?? (deliveryTargetMode === "implicit" ? baseDelivery.accountId : void 0);
	let resolvedTo = explicitTo;
	if (!resolvedTo && isDeliverableMessageChannel(resolvedChannel) && resolvedChannel === baseDelivery.lastChannel) resolvedTo = baseDelivery.lastTo;
	return {
		baseDelivery,
		resolvedChannel,
		resolvedTo,
		resolvedAccountId,
		resolvedThreadId: baseDelivery.threadId,
		deliveryTargetMode
	};
}
async function resolveAgentDeliveryPlanWithSessionRoute(params) {
	const plan = resolveAgentDeliveryPlan(params);
	if (!params.wantsDelivery || !plan.resolvedTo || !isDeliverableMessageChannel(plan.resolvedChannel) || !resolveOutboundChannelPlugin({
		channel: plan.resolvedChannel,
		cfg: params.cfg,
		allowBootstrap: true
	})?.messaging?.resolveOutboundSessionRoute) return plan;
	const normalizedTarget = resolveOutboundTarget({
		channel: plan.resolvedChannel,
		to: plan.resolvedTo,
		cfg: params.cfg,
		accountId: plan.resolvedAccountId,
		mode: plan.deliveryTargetMode ?? "explicit"
	});
	if (!normalizedTarget.ok) return plan;
	const explicitThreadId = params.explicitThreadId != null && params.explicitThreadId !== "" ? params.explicitThreadId : void 0;
	const route = await (async () => {
		try {
			return await resolveOutboundSessionRoute({
				cfg: params.cfg,
				channel: plan.resolvedChannel,
				agentId: params.agentId,
				accountId: plan.resolvedAccountId,
				target: normalizedTarget.to,
				currentSessionKey: params.currentSessionKey,
				threadId: plan.deliveryTargetMode === "explicit" ? explicitThreadId : plan.resolvedThreadId
			});
		} catch {
			return null;
		}
	})();
	if (!route) return plan;
	return {
		...plan,
		resolvedTo: route.to,
		resolvedThreadId: route.threadId ?? (plan.deliveryTargetMode === "explicit" ? explicitThreadId : plan.resolvedThreadId)
	};
}
function resolveAgentOutboundTarget(params) {
	const targetMode = params.targetMode ?? params.plan.deliveryTargetMode ?? (params.plan.resolvedTo ? "explicit" : "implicit");
	if (!isDeliverableMessageChannel(params.plan.resolvedChannel)) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	if (params.validateExplicitTarget !== true && params.plan.resolvedTo) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	const resolvedTarget = resolveOutboundTarget({
		channel: params.plan.resolvedChannel,
		to: params.plan.resolvedTo,
		cfg: params.cfg,
		accountId: params.plan.resolvedAccountId,
		mode: targetMode
	});
	return {
		resolvedTarget,
		resolvedTo: resolvedTarget.ok ? resolvedTarget.to : params.plan.resolvedTo,
		targetMode
	};
}
//#endregion
export { resolveAgentOutboundTarget as n, resolveAgentDeliveryPlanWithSessionRoute as t };
