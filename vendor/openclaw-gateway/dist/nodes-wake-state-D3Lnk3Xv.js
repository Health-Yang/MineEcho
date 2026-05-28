//#region src/gateway/server-methods/nodes-wake-state.ts
const NODE_WAKE_RECONNECT_WAIT_MS = 3e3;
const NODE_WAKE_RECONNECT_RETRY_WAIT_MS = 12e3;
const nodeWakeById = /* @__PURE__ */ new Map();
const nodeWakeNudgeById = /* @__PURE__ */ new Map();
function clearNodeWakeState(nodeId) {
	nodeWakeById.delete(nodeId);
	nodeWakeNudgeById.delete(nodeId);
}
//#endregion
export { nodeWakeNudgeById as a, nodeWakeById as i, NODE_WAKE_RECONNECT_WAIT_MS as n, clearNodeWakeState as r, NODE_WAKE_RECONNECT_RETRY_WAIT_MS as t };
