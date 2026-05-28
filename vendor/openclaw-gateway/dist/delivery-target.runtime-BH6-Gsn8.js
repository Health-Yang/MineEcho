import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-neKhpFRr.js";
import { r as resolveOutboundChannelPlugin } from "./channel-resolution-DAbY66ca.js";
import { m as mapAllowFromEntries } from "./channel-config-helpers-h3merl20.js";
import { n as resolveOutboundSessionRoute } from "./outbound-session-DPM4FIwc.js";
import { i as resolveChannelTarget } from "./target-resolver-B7hXUFIt.js";
import { t as resolveFirstBoundAccountId } from "./bound-account-read-nfgnMgRx.js";
//#region src/cron/isolated-agent/delivery-target.runtime.ts
async function resolveChannelTargetForDelivery(params) {
	resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	try {
		return await resolveChannelTarget({
			cfg: params.cfg,
			channel: params.channel,
			input: params.input,
			accountId: params.accountId,
			unknownTargetMode: "normalized"
		});
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err : new Error(String(err))
		};
	}
}
async function resolveOutboundSessionRouteForDelivery(params) {
	resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	return await resolveOutboundSessionRoute(params);
}
function channelCanResolveOutboundSessionRoute(params) {
	return Boolean(resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	})?.messaging?.resolveOutboundSessionRoute);
}
//#endregion
export { channelCanResolveOutboundSessionRoute, getLoadedChannelPluginForRead, mapAllowFromEntries, resolveChannelTargetForDelivery, resolveFirstBoundAccountId, resolveOutboundSessionRouteForDelivery };
