import { Ii as ErrorCodes, Kn as validateWebLoginStartParams, Li as errorShape, qn as validateWebLoginWaitParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { i as listChannelPlugins } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
//#region src/gateway/server-methods/web.ts
const WEB_LOGIN_METHODS = new Set(["web.login.start", "web.login.wait"]);
const resolveWebLoginProvider = () => listChannelPlugins().find((plugin) => [...plugin.gatewayMethods ?? [], ...(plugin.gatewayMethodDescriptors ?? []).map((descriptor) => descriptor.name)].some((method) => WEB_LOGIN_METHODS.has(method))) ?? null;
function resolveAccountId(params) {
	return typeof params.accountId === "string" ? params.accountId : void 0;
}
function respondProviderUnavailable(respond) {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "web login provider is not available"));
}
function respondProviderUnsupported(respond, providerId) {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `web login is not supported by provider ${providerId}`));
}
function wasChannelRunning(params) {
	const runtime = params.context.getRuntimeSnapshot();
	if (params.accountId) {
		const accountRuntime = runtime.channelAccounts[params.channelId]?.[params.accountId];
		if (accountRuntime) return accountRuntime.running === true;
	}
	if (!params.accountId) return runtime.channels[params.channelId]?.running === true;
	const defaultRuntime = runtime.channels[params.channelId];
	return defaultRuntime?.accountId === params.accountId && defaultRuntime.running === true;
}
const webHandlers = {
	"web.login.start": async ({ params, respond, context }) => {
		if (!validateWebLoginStartParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid web.login.start params: ${formatValidationErrors(validateWebLoginStartParams.errors)}`));
			return;
		}
		try {
			const accountId = resolveAccountId(params);
			const provider = resolveWebLoginProvider();
			if (!provider) {
				respondProviderUnavailable(respond);
				return;
			}
			if (!provider.gateway?.loginWithQrStart) {
				respondProviderUnsupported(respond, provider.id);
				return;
			}
			const wasRunning = wasChannelRunning({
				context,
				channelId: provider.id,
				accountId
			});
			await context.stopChannel(provider.id, accountId);
			const result = await provider.gateway.loginWithQrStart({
				force: Boolean(params.force),
				timeoutMs: typeof params.timeoutMs === "number" ? params.timeoutMs : void 0,
				verbose: Boolean(params.verbose),
				accountId
			});
			if (result.connected) await context.startChannel(provider.id, accountId);
			else if (wasRunning && !result.qrDataUrl) await context.startChannel(provider.id, accountId);
			respond(true, result, void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"web.login.wait": async ({ params, respond, context }) => {
		if (!validateWebLoginWaitParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid web.login.wait params: ${formatValidationErrors(validateWebLoginWaitParams.errors)}`));
			return;
		}
		try {
			const accountId = resolveAccountId(params);
			const provider = resolveWebLoginProvider();
			if (!provider) {
				respondProviderUnavailable(respond);
				return;
			}
			if (!provider.gateway?.loginWithQrWait) {
				respondProviderUnsupported(respond, provider.id);
				return;
			}
			const result = await provider.gateway.loginWithQrWait({
				timeoutMs: typeof params.timeoutMs === "number" ? params.timeoutMs : void 0,
				accountId,
				currentQrDataUrl: typeof params.currentQrDataUrl === "string" ? params.currentQrDataUrl : void 0
			});
			if (result.connected) await context.startChannel(provider.id, accountId);
			respond(true, result, void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	}
};
//#endregion
export { webHandlers };
