import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import { r as callGateway } from "./call-D_O83KsN.js";
import { n as parseTimeoutMsWithFallback } from "./parse-timeout-Dy07gDgv.js";
import { r as withProgress } from "./progress-Dr4m3lDw.js";
//#region src/cli/gateway-rpc.runtime.ts
const DEFAULT_GATEWAY_RPC_TIMEOUT_MS = 1e4;
async function callGatewayFromCliRuntime(method, opts, params, extra) {
	const showProgress = extra?.progress ?? opts.json !== true;
	return await withProgress({
		label: `Gateway ${method}`,
		indeterminate: true,
		enabled: showProgress
	}, async () => await callGateway({
		url: opts.url,
		token: opts.token,
		method,
		params,
		deviceIdentity: extra?.deviceIdentity,
		expectFinal: extra?.expectFinal ?? Boolean(opts.expectFinal),
		scopes: extra?.scopes,
		timeoutMs: parseTimeoutMsWithFallback(opts.timeout, DEFAULT_GATEWAY_RPC_TIMEOUT_MS),
		clientName: extra?.clientName ?? GATEWAY_CLIENT_NAMES.CLI,
		mode: extra?.mode ?? GATEWAY_CLIENT_MODES.CLI
	}));
}
//#endregion
export { callGatewayFromCliRuntime };
