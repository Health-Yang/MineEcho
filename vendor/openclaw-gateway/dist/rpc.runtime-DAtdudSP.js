import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import { r as callGateway } from "./call-D_O83KsN.js";
import { n as parseTimeoutMsWithFallback } from "./parse-timeout-Dy07gDgv.js";
import { r as withProgress } from "./progress-Dr4m3lDw.js";
//#region src/cli/nodes-cli/rpc.runtime.ts
const NODE_PAIR_APPROVAL_GATEWAY_METHODS = new Set(["node.pair.list", "node.pair.approve"]);
const DEFAULT_NODES_RPC_TIMEOUT_MS = 1e4;
function resolveNodesTransportTimeoutMs(opts, overrideMs) {
	return overrideMs ?? parseTimeoutMsWithFallback(opts.timeout, DEFAULT_NODES_RPC_TIMEOUT_MS);
}
async function callGatewayCliRuntime(method, opts, params, callOpts) {
	return await withProgress({
		label: `Nodes ${method}`,
		indeterminate: true,
		enabled: opts.json !== true
	}, async () => await callGateway({
		url: opts.url,
		token: opts.token,
		method,
		params,
		timeoutMs: resolveNodesTransportTimeoutMs(opts, callOpts?.transportTimeoutMs),
		clientName: GATEWAY_CLIENT_NAMES.CLI,
		mode: GATEWAY_CLIENT_MODES.CLI
	}));
}
async function callNodePairApprovalGatewayCliRuntime(method, opts, params, callOpts) {
	if (!NODE_PAIR_APPROVAL_GATEWAY_METHODS.has(method)) throw new Error(`unsupported node pair approval gateway method: ${method}`);
	return await withProgress({
		label: `Nodes ${method}`,
		indeterminate: true,
		enabled: opts.json !== true
	}, async () => await callGateway({
		url: opts.url,
		token: opts.token,
		method,
		params,
		timeoutMs: resolveNodesTransportTimeoutMs(opts, callOpts.transportTimeoutMs),
		clientName: GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
		mode: GATEWAY_CLIENT_MODES.BACKEND,
		scopes: callOpts.scopes
	}));
}
//#endregion
export { callGatewayCliRuntime, callNodePairApprovalGatewayCliRuntime };
