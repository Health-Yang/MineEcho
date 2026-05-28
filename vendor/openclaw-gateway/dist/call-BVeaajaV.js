import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import { r as callGateway } from "./call-D_O83KsN.js";
import { n as parseTimeoutMsWithFallback } from "./parse-timeout-Dy07gDgv.js";
import { r as withProgress } from "./progress-Dr4m3lDw.js";
//#region src/cli/gateway-cli/call.ts
const DEFAULT_GATEWAY_RPC_TIMEOUT_MS = 1e4;
const callGatewayCli = async (method, opts, params) => withProgress({
	label: `Gateway ${method}`,
	indeterminate: true,
	enabled: opts.json !== true
}, async () => await callGateway({
	config: opts.config,
	url: opts.url,
	token: opts.token,
	password: opts.password,
	method,
	params,
	expectFinal: Boolean(opts.expectFinal),
	timeoutMs: parseTimeoutMsWithFallback(opts.timeout, DEFAULT_GATEWAY_RPC_TIMEOUT_MS),
	clientName: GATEWAY_CLIENT_NAMES.CLI,
	mode: GATEWAY_CLIENT_MODES.CLI
}));
//#endregion
export { callGatewayCli };
