import { t as listSystemPresence } from "./system-presence-CSyBe1J3.js";
//#region src/gateway/server/presence-events.ts
function broadcastPresenceSnapshot(params) {
	const presenceVersion = params.incrementPresenceVersion();
	params.broadcast("presence", { presence: listSystemPresence() }, {
		dropIfSlow: true,
		stateVersion: {
			presence: presenceVersion,
			health: params.getHealthVersion()
		}
	});
	return presenceVersion;
}
//#endregion
export { broadcastPresenceSnapshot as t };
