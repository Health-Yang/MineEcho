import { c as normalizeSortedUniqueTrimmedStringList } from "./string-normalization-B8G0vlWE.js";
import { Ii as ErrorCodes, J as validateEnvironmentsStatusParams, Li as errorShape, q as validateEnvironmentsListParams } from "./protocol-BkfNT2Bp.js";
import { r as respondUnavailableOnThrow, t as respondInvalidParams } from "./nodes.helpers-pWq0E7xD.js";
import { r as listNodePairing } from "./node-pairing-BVmUcGRr.js";
import { l as listDevicePairing } from "./device-pairing-3ziNdlg5.js";
import { r as listKnownNodes, t as createKnownNodeCatalog } from "./node-catalog-BDt3sPKN.js";
//#region src/gateway/server-methods/environments.ts
const GATEWAY_ENVIRONMENT = {
	id: "gateway",
	type: "local",
	label: "Gateway local",
	status: "available",
	capabilities: [
		"agent.run",
		"sessions",
		"tools",
		"workspace"
	]
};
function uniqueSortedStrings(...items) {
	return normalizeSortedUniqueTrimmedStringList(items.flatMap((item) => item ?? []));
}
function summarizeNodeEnvironment(node) {
	const capabilities = uniqueSortedStrings(node.caps, node.commands);
	return {
		id: `node:${node.nodeId}`,
		type: "node",
		label: node.displayName ?? node.nodeId,
		status: node.connected ? "available" : "unavailable",
		...capabilities.length > 0 ? { capabilities } : {}
	};
}
function listEnvironmentSummaries(nodes) {
	return [GATEWAY_ENVIRONMENT, ...nodes.map(summarizeNodeEnvironment)];
}
async function listEnvironments(context) {
	const [devicePairing, nodePairing] = await Promise.all([listDevicePairing(), listNodePairing()]);
	return listEnvironmentSummaries(listKnownNodes(createKnownNodeCatalog({
		pairedDevices: devicePairing.paired,
		pairedNodes: nodePairing.paired,
		connectedNodes: context.nodeRegistry.listConnected()
	})));
}
const environmentsHandlers = {
	"environments.list": async ({ params, respond, context }) => {
		if (!validateEnvironmentsListParams(params)) {
			respondInvalidParams({
				respond,
				method: "environments.list",
				validator: validateEnvironmentsListParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, { environments: await listEnvironments(context) }, void 0);
		});
	},
	"environments.status": async ({ params, respond, context }) => {
		if (!validateEnvironmentsStatusParams(params)) {
			respondInvalidParams({
				respond,
				method: "environments.status",
				validator: validateEnvironmentsStatusParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			const environment = (await listEnvironments(context)).find((entry) => entry.id === params.environmentId);
			if (!environment) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown environmentId"));
				return;
			}
			respond(true, environment, void 0);
		});
	}
};
//#endregion
export { environmentsHandlers };
