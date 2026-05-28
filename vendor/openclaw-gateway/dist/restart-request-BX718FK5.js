import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { h as stringifyRouteThreadId } from "./channel-route-Dvehdg4D.js";
//#region src/gateway/server-methods/restart-request.ts
function parseRestartDeliveryContext(params) {
	const raw = params.deliveryContext;
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {
		deliveryContext: void 0,
		threadId: void 0
	};
	const context = raw;
	const deliveryContext = {
		channel: normalizeOptionalString(context.channel),
		to: normalizeOptionalString(context.to),
		accountId: normalizeOptionalString(context.accountId)
	};
	return {
		deliveryContext: deliveryContext.channel || deliveryContext.to || deliveryContext.accountId ? deliveryContext : void 0,
		threadId: stringifyRouteThreadId(context.threadId)
	};
}
function parseRestartRequestParams(params) {
	const sessionKey = normalizeOptionalString(params.sessionKey);
	const { deliveryContext, threadId } = parseRestartDeliveryContext(params);
	const note = normalizeOptionalString(params.note);
	const continuationMessage = normalizeOptionalString(params.continuationMessage);
	const restartDelayMsRaw = params.restartDelayMs;
	return {
		sessionKey,
		deliveryContext,
		threadId,
		note,
		continuationMessage,
		restartDelayMs: typeof restartDelayMsRaw === "number" && Number.isFinite(restartDelayMsRaw) ? Math.max(0, Math.floor(restartDelayMsRaw)) : void 0
	};
}
//#endregion
export { parseRestartRequestParams as t };
