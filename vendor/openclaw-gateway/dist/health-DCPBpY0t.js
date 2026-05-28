import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { o as getGatewayModelPricingHealth } from "./model-pricing-cache-state-CYVO4GmW.js";
import "./server-constants-BGwLM6XN.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import { t as getStatusSummary } from "./status.summary-Fu8hM54b.js";
import "./status-DrHLAJEe.js";
import { t as formatError } from "./server-utils-nQL603BR.js";
//#region src/gateway/server-methods/health.ts
const ADMIN_SCOPE = "operator.admin";
function cachedAccountForRuntimeSnapshot(params) {
	const accountId = params.accountId;
	if (accountId && params.cachedChannel?.accounts?.[accountId]) return params.cachedChannel.accounts[accountId];
}
function cachedLifecycleDiffersFromRuntime(params) {
	for (const key of ["running", "connected"]) {
		const runtimeValue = params.runtimeSnapshot[key];
		if (typeof runtimeValue !== "boolean") continue;
		if (params.cachedAccount?.[key] !== runtimeValue) return true;
	}
	return false;
}
function cachedHealthDiffersFromRuntime(cached, runtime) {
	for (const [channelId, runtimeSnapshot] of Object.entries(runtime.channels)) {
		if (!runtimeSnapshot) continue;
		const cachedChannel = cached.channels[channelId];
		if (cachedLifecycleDiffersFromRuntime({
			cachedAccount: cachedChannel,
			runtimeSnapshot
		})) return true;
	}
	for (const [channelId, accounts] of Object.entries(runtime.channelAccounts)) {
		if (!accounts) continue;
		const cachedChannel = cached.channels[channelId];
		for (const [accountId, runtimeSnapshot] of Object.entries(accounts)) {
			if (!runtimeSnapshot) continue;
			if (cachedLifecycleDiffersFromRuntime({
				cachedAccount: cachedAccountForRuntimeSnapshot({
					cachedChannel,
					accountId
				}),
				runtimeSnapshot
			})) return true;
		}
	}
	return false;
}
function mergeCachedHealthRuntimeState(params) {
	return {
		...params.cached,
		...params.eventLoop ? { eventLoop: params.eventLoop } : {},
		modelPricing: getGatewayModelPricingHealth({ enabled: params.cached.modelPricing?.state !== "disabled" })
	};
}
const healthHandlers = {
	health: async ({ respond, context, params, client }) => {
		const { getHealthCache, refreshHealthSnapshot, logHealth } = context;
		const wantsProbe = params?.probe === true;
		const includeSensitive = (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(ADMIN_SCOPE);
		const now = Date.now();
		const cached = getHealthCache();
		let cachedDiffersFromRuntime = false;
		if (!wantsProbe && cached) try {
			cachedDiffersFromRuntime = cachedHealthDiffersFromRuntime(cached, context.getRuntimeSnapshot());
		} catch {
			cachedDiffersFromRuntime = false;
		}
		if (!wantsProbe && cached && !cachedDiffersFromRuntime && now - cached.ts < 6e4) {
			respond(true, mergeCachedHealthRuntimeState({
				cached,
				eventLoop: context.getEventLoopHealth?.()
			}), void 0, { cached: true });
			refreshHealthSnapshot({
				probe: false,
				includeSensitive
			}).catch((err) => logHealth.error(`background health refresh failed: ${formatError(err)}`));
			return;
		}
		try {
			respond(true, await refreshHealthSnapshot({
				probe: wantsProbe,
				includeSensitive
			}), void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	status: async ({ respond, client, params, context }) => {
		const status = await getStatusSummary({
			includeSensitive: (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(ADMIN_SCOPE),
			includeChannelSummary: params.includeChannelSummary !== false
		});
		if (context.getEventLoopHealth) status.eventLoop = context.getEventLoopHealth();
		respond(true, status, void 0);
	}
};
//#endregion
export { healthHandlers };
