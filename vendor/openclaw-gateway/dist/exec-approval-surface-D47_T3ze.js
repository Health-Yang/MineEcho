import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import "./message-channel-core-NW6lw3Ys.js";
import { s as isDeliverableMessageChannel, u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { i as listChannelPlugins, t as getChannelPlugin } from "./registry-Be8exPcf.js";
import { n as resolveChannelApprovalCapability } from "./plugins-BGmuVWWz.js";
//#region src/infra/exec-approval-surface.ts
function labelForChannel(channel) {
	if (channel === "tui") return "terminal UI";
	if (channel === "webchat") return "Web UI";
	return getChannelPlugin(channel ?? "")?.meta.label ?? (channel ? channel[0]?.toUpperCase() + channel.slice(1) : "this platform");
}
function hasNativeExecApprovalCapability(channel) {
	const capability = resolveChannelApprovalCapability(getChannelPlugin(channel ?? ""));
	if (!capability?.native) return false;
	return Boolean(capability.getExecInitiatingSurfaceState || capability.getActionAvailabilityState);
}
function resolveExecApprovalInitiatingSurfaceState(params) {
	return resolveApprovalInitiatingSurfaceState({
		...params,
		approvalKind: "exec"
	});
}
function resolveApprovalInitiatingSurfaceState(params) {
	const channel = normalizeMessageChannel(params.channel);
	const channelLabel = labelForChannel(channel);
	const accountId = normalizeOptionalString(params.accountId);
	if (!channel || channel === "webchat" || channel === "tui") return {
		kind: "enabled",
		channel,
		channelLabel,
		accountId
	};
	const cfg = params.cfg ?? getRuntimeConfig();
	const capability = resolveChannelApprovalCapability(getChannelPlugin(channel));
	const state = (params.approvalKind === "exec" ? capability?.getExecInitiatingSurfaceState?.({
		cfg,
		accountId: params.accountId,
		action: "approve"
	}) : void 0) ?? capability?.getActionAvailabilityState?.({
		cfg,
		accountId: params.accountId,
		action: "approve",
		approvalKind: params.approvalKind
	});
	if (state) return {
		...state,
		channel,
		channelLabel,
		accountId
	};
	if (isDeliverableMessageChannel(channel)) return {
		kind: "enabled",
		channel,
		channelLabel,
		accountId
	};
	return {
		kind: "unsupported",
		channel,
		channelLabel,
		accountId
	};
}
function supportsNativeExecApprovalClient(channel) {
	const normalized = normalizeMessageChannel(channel);
	if (!normalized || normalized === "webchat" || normalized === "tui") return true;
	return hasNativeExecApprovalCapability(normalized);
}
function listNativeExecApprovalClientLabels(params) {
	const excludeChannel = normalizeMessageChannel(params?.excludeChannel);
	return listChannelPlugins().filter((plugin) => plugin.id !== excludeChannel).filter((plugin) => hasNativeExecApprovalCapability(plugin.id)).map((plugin) => normalizeOptionalString(plugin.meta.label)).filter((label) => Boolean(label)).toSorted((a, b) => a.localeCompare(b));
}
function describeNativeExecApprovalClientSetup(params) {
	const channel = normalizeMessageChannel(params.channel);
	if (!channel || channel === "webchat" || channel === "tui") return null;
	const channelLabel = normalizeOptionalString(params.channelLabel) ?? labelForChannel(channel);
	const accountId = normalizeOptionalString(params.accountId);
	return resolveChannelApprovalCapability(getChannelPlugin(channel))?.describeExecApprovalSetup?.({
		channel,
		channelLabel,
		accountId
	}) ?? null;
}
//#endregion
export { supportsNativeExecApprovalClient as a, resolveExecApprovalInitiatingSurfaceState as i, listNativeExecApprovalClientLabels as n, resolveApprovalInitiatingSurfaceState as r, describeNativeExecApprovalClientSetup as t };
