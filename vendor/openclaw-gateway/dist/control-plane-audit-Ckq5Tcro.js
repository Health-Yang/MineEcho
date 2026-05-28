//#region src/gateway/control-plane-audit.ts
function normalizePart(value, fallback) {
	if (typeof value !== "string") return fallback;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : fallback;
}
function resolveControlPlaneActor(client) {
	return {
		actor: normalizePart(client?.connect?.client?.id, "unknown-actor"),
		deviceId: normalizePart(client?.connect?.device?.id, "unknown-device"),
		clientIp: normalizePart(client?.clientIp, "unknown-ip"),
		connId: normalizePart(client?.connId, "unknown-conn")
	};
}
function formatControlPlaneActor(actor) {
	return `actor=${actor.actor} device=${actor.deviceId} ip=${actor.clientIp} conn=${actor.connId}`;
}
function summarizeChangedPaths(paths, maxPaths = 8) {
	if (paths.length === 0) return "<none>";
	if (paths.length <= maxPaths) return paths.join(",");
	return `${paths.slice(0, maxPaths).join(",")},+${paths.length - maxPaths} more`;
}
//#endregion
export { resolveControlPlaneActor as n, summarizeChangedPaths as r, formatControlPlaneActor as t };
