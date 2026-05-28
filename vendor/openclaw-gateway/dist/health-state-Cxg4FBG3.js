import { r as STATE_DIR } from "./paths-CQv1_CDw.js";
import "./agent-scope-CudANNo3.js";
import { u as normalizeMainKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { n as resolveGatewayAuth } from "./auth-resolve-DsCwkRwQ.js";
import "./auth-CbKYHGo4.js";
import { i as getRuntimeConfig, r as createConfigIO } from "./io-BlARNTf3.js";
import { i as resolveMainSessionKey } from "./main-session-896o98eb.js";
import "./sessions-Ct4mpWsk.js";
import { n as getHealthSnapshot } from "./health-Bjwlv0N_.js";
import { t as listSystemPresence } from "./system-presence-CSyBe1J3.js";
import { t as getUpdateAvailable } from "./update-startup-8oueiUIT.js";
//#region src/gateway/server/health-state.ts
let presenceVersion = 1;
let healthVersion = 1;
let healthCache = null;
let healthRefresh = null;
let sensitiveHealthRefresh = null;
let broadcastHealthUpdate = null;
function buildGatewaySnapshot(opts) {
	const cfg = getRuntimeConfig();
	const defaultAgentId = resolveDefaultAgentId(cfg);
	const mainKey = normalizeMainKey(cfg.session?.mainKey);
	const mainSessionKey = resolveMainSessionKey(cfg);
	const scope = cfg.session?.scope ?? "per-sender";
	const presence = listSystemPresence();
	const uptimeMs = Math.round(process.uptime() * 1e3);
	const updateAvailable = getUpdateAvailable() ?? void 0;
	const snapshot = {
		presence,
		health: {},
		stateVersion: {
			presence: presenceVersion,
			health: healthVersion
		},
		uptimeMs,
		sessionDefaults: {
			defaultAgentId,
			mainKey,
			mainSessionKey,
			scope
		},
		updateAvailable
	};
	if (opts?.includeSensitive === true) {
		const auth = resolveGatewayAuth({
			authConfig: cfg.gateway?.auth,
			env: process.env
		});
		snapshot.configPath = createConfigIO().configPath;
		snapshot.stateDir = STATE_DIR;
		snapshot.authMode = auth.mode;
	}
	return snapshot;
}
function getHealthCache() {
	return healthCache;
}
function getHealthVersion() {
	return healthVersion;
}
function incrementPresenceVersion() {
	presenceVersion += 1;
	return presenceVersion;
}
function getPresenceVersion() {
	return presenceVersion;
}
function setBroadcastHealthUpdate(fn) {
	broadcastHealthUpdate = fn;
}
async function refreshGatewayHealthSnapshot(opts) {
	const includeSensitive = opts?.includeSensitive === true;
	let refresh = includeSensitive ? sensitiveHealthRefresh : healthRefresh;
	if (!refresh) {
		refresh = (async () => {
			let runtimeSnapshot;
			try {
				runtimeSnapshot = opts?.getRuntimeSnapshot?.();
			} catch {
				runtimeSnapshot = void 0;
			}
			const eventLoop = opts?.getEventLoopHealth?.();
			const snap = await getHealthSnapshot({
				probe: opts?.probe,
				includeSensitive,
				runtimeSnapshot,
				...eventLoop ? { eventLoop } : {}
			});
			if (!includeSensitive) {
				healthCache = snap;
				healthVersion += 1;
				if (broadcastHealthUpdate) broadcastHealthUpdate(snap);
			}
			return snap;
		})().finally(() => {
			if (includeSensitive) sensitiveHealthRefresh = null;
			else healthRefresh = null;
		});
		if (includeSensitive) sensitiveHealthRefresh = refresh;
		else healthRefresh = refresh;
	}
	return refresh;
}
//#endregion
export { incrementPresenceVersion as a, getPresenceVersion as i, getHealthCache as n, refreshGatewayHealthSnapshot as o, getHealthVersion as r, setBroadcastHealthUpdate as s, buildGatewaySnapshot as t };
