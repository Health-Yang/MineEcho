import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { c as normalizeSortedUniqueTrimmedStringList } from "./string-normalization-B8G0vlWE.js";
import { s as hasEffectivePairedDeviceRole } from "./device-pairing-3ziNdlg5.js";
//#region src/gateway/node-catalog.ts
function uniqueSortedStrings(...items) {
	return normalizeSortedUniqueTrimmedStringList(items.flatMap((item) => item ?? []));
}
function buildDevicePairingSource(entry) {
	return {
		nodeId: entry.deviceId,
		displayName: entry.displayName,
		platform: entry.platform,
		clientId: entry.clientId,
		clientMode: entry.clientMode,
		remoteIp: entry.remoteIp,
		approvedAtMs: entry.approvedAtMs,
		lastSeenAtMs: entry.lastSeenAtMs,
		lastSeenReason: entry.lastSeenReason
	};
}
function buildApprovedNodeSource(entry) {
	return {
		nodeId: entry.nodeId,
		displayName: entry.displayName,
		platform: entry.platform,
		version: entry.version,
		coreVersion: entry.coreVersion,
		uiVersion: entry.uiVersion,
		remoteIp: entry.remoteIp,
		deviceFamily: entry.deviceFamily,
		modelIdentifier: entry.modelIdentifier,
		caps: entry.caps ?? [],
		commands: entry.commands ?? [],
		permissions: entry.permissions,
		approvedAtMs: entry.approvedAtMs,
		lastConnectedAtMs: entry.lastConnectedAtMs,
		lastSeenAtMs: entry.lastSeenAtMs,
		lastSeenReason: entry.lastSeenReason
	};
}
function resolveEffectiveLastSeen(params) {
	const candidates = [
		params.live?.connectedAtMs ? {
			atMs: params.live.connectedAtMs,
			reason: "connect"
		} : void 0,
		params.nodePairing?.lastSeenAtMs ? {
			atMs: params.nodePairing.lastSeenAtMs,
			reason: params.nodePairing.lastSeenReason
		} : void 0,
		params.nodePairing?.lastConnectedAtMs ? {
			atMs: params.nodePairing.lastConnectedAtMs,
			reason: "connect"
		} : void 0,
		params.devicePairing?.lastSeenAtMs ? {
			atMs: params.devicePairing.lastSeenAtMs,
			reason: params.devicePairing.lastSeenReason
		} : void 0
	].filter((entry) => entry !== void 0);
	let newest;
	for (const candidate of candidates) if (!newest || candidate.atMs > newest.atMs) newest = candidate;
	if (!newest) return {};
	return {
		lastSeenAtMs: newest.atMs,
		lastSeenReason: newest.reason
	};
}
function buildEffectiveKnownNode(entry) {
	const { nodeId, devicePairing, nodePairing, live } = entry;
	const lastSeen = resolveEffectiveLastSeen({
		live,
		devicePairing,
		nodePairing
	});
	return {
		nodeId,
		displayName: live?.displayName ?? nodePairing?.displayName ?? devicePairing?.displayName,
		platform: live?.platform ?? nodePairing?.platform ?? devicePairing?.platform,
		version: live?.version ?? nodePairing?.version,
		coreVersion: live?.coreVersion ?? nodePairing?.coreVersion,
		uiVersion: live?.uiVersion ?? nodePairing?.uiVersion,
		clientId: live?.clientId ?? devicePairing?.clientId,
		clientMode: live?.clientMode ?? devicePairing?.clientMode,
		deviceFamily: live?.deviceFamily ?? nodePairing?.deviceFamily,
		modelIdentifier: live?.modelIdentifier ?? nodePairing?.modelIdentifier,
		remoteIp: live?.remoteIp ?? nodePairing?.remoteIp ?? devicePairing?.remoteIp,
		caps: live ? uniqueSortedStrings(live.caps) : uniqueSortedStrings(nodePairing?.caps),
		commands: live ? uniqueSortedStrings(live.commands) : uniqueSortedStrings(nodePairing?.commands),
		pathEnv: live?.pathEnv,
		permissions: live?.permissions ?? nodePairing?.permissions,
		connectedAtMs: live?.connectedAtMs,
		lastSeenAtMs: lastSeen.lastSeenAtMs,
		lastSeenReason: lastSeen.lastSeenReason,
		approvedAtMs: nodePairing?.approvedAtMs ?? devicePairing?.approvedAtMs,
		paired: Boolean(devicePairing ?? nodePairing),
		connected: Boolean(live)
	};
}
function compareKnownNodes(left, right) {
	if (left.connected !== right.connected) return left.connected ? -1 : 1;
	const leftName = normalizeLowercaseStringOrEmpty(left.displayName ?? left.nodeId);
	const rightName = normalizeLowercaseStringOrEmpty(right.displayName ?? right.nodeId);
	if (leftName < rightName) return -1;
	if (leftName > rightName) return 1;
	return left.nodeId.localeCompare(right.nodeId);
}
function createKnownNodeCatalog(params) {
	const devicePairingById = new Map(params.pairedDevices.filter((entry) => hasEffectivePairedDeviceRole(entry, "node")).map((entry) => [entry.deviceId, buildDevicePairingSource(entry)]));
	const nodePairingById = new Map((params.pairedNodes ?? []).map((entry) => [entry.nodeId, buildApprovedNodeSource(entry)]));
	const liveById = new Map(params.connectedNodes.map((entry) => [entry.nodeId, entry]));
	const nodeIds = new Set([
		...devicePairingById.keys(),
		...nodePairingById.keys(),
		...liveById.keys()
	]);
	const entriesById = /* @__PURE__ */ new Map();
	for (const nodeId of nodeIds) {
		const devicePairing = devicePairingById.get(nodeId);
		const nodePairing = nodePairingById.get(nodeId);
		const live = liveById.get(nodeId);
		entriesById.set(nodeId, {
			nodeId,
			devicePairing,
			nodePairing,
			live,
			effective: buildEffectiveKnownNode({
				nodeId,
				devicePairing,
				nodePairing,
				live
			})
		});
	}
	return { entriesById };
}
function listKnownNodes(catalog) {
	return [...catalog.entriesById.values()].map((entry) => entry.effective).toSorted(compareKnownNodes);
}
function getKnownNodeEntry(catalog, nodeId) {
	return catalog.entriesById.get(nodeId) ?? null;
}
function getKnownNode(catalog, nodeId) {
	return getKnownNodeEntry(catalog, nodeId)?.effective ?? null;
}
//#endregion
export { getKnownNode as n, listKnownNodes as r, createKnownNodeCatalog as t };
