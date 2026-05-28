import { Ii as ErrorCodes, Li as errorShape, bt as validateNodePendingEnqueueParams, yt as validateNodePendingDrainParams } from "./protocol-BkfNT2Bp.js";
import { r as respondUnavailableOnThrow, t as respondInvalidParams } from "./nodes.helpers-pWq0E7xD.js";
import { i as waitForNodeReconnect, n as maybeWakeNodeWithApns, t as maybeSendNodeWakeNudge } from "./nodes-QoZi8RXh.js";
import { n as NODE_WAKE_RECONNECT_WAIT_MS, t as NODE_WAKE_RECONNECT_RETRY_WAIT_MS } from "./nodes-wake-state-D3Lnk3Xv.js";
import { randomUUID } from "node:crypto";
//#region src/gateway/node-pending-work.ts
const DEFAULT_STATUS_ITEM_ID = "baseline-status";
const DEFAULT_STATUS_PRIORITY = "default";
const DEFAULT_PRIORITY = "normal";
const DEFAULT_MAX_ITEMS = 4;
const MAX_ITEMS = 10;
const PRIORITY_RANK = {
	high: 3,
	normal: 2,
	default: 1
};
const stateByNodeId = /* @__PURE__ */ new Map();
function getOrCreateState(nodeId) {
	let state = stateByNodeId.get(nodeId);
	if (!state) {
		state = {
			revision: 0,
			itemsById: /* @__PURE__ */ new Map()
		};
		stateByNodeId.set(nodeId, state);
	}
	return state;
}
function pruneExpired(state, nowMs) {
	let changed = false;
	for (const [id, item] of state.itemsById) if (item.expiresAtMs !== null && item.expiresAtMs <= nowMs) {
		state.itemsById.delete(id);
		changed = true;
	}
	if (changed) state.revision += 1;
	return changed;
}
function pruneStateIfEmpty(nodeId, state) {
	if (state.itemsById.size === 0) stateByNodeId.delete(nodeId);
}
function sortedItems(state) {
	return [...state.itemsById.values()].toSorted((a, b) => {
		const priorityDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
		if (priorityDelta !== 0) return priorityDelta;
		if (a.createdAtMs !== b.createdAtMs) return a.createdAtMs - b.createdAtMs;
		return a.id.localeCompare(b.id);
	});
}
function makeBaselineStatusItem(nowMs) {
	return {
		id: DEFAULT_STATUS_ITEM_ID,
		type: "status.request",
		priority: DEFAULT_STATUS_PRIORITY,
		createdAtMs: nowMs,
		expiresAtMs: null
	};
}
function enqueueNodePendingWork(params) {
	const nodeId = params.nodeId.trim();
	if (!nodeId) throw new Error("nodeId required");
	const nowMs = Date.now();
	const state = getOrCreateState(nodeId);
	pruneExpired(state, nowMs);
	const existing = [...state.itemsById.values()].find((item) => item.type === params.type);
	if (existing) return {
		revision: state.revision,
		item: existing,
		deduped: true
	};
	const item = {
		id: randomUUID(),
		type: params.type,
		priority: params.priority ?? DEFAULT_PRIORITY,
		createdAtMs: nowMs,
		expiresAtMs: typeof params.expiresInMs === "number" && Number.isFinite(params.expiresInMs) ? nowMs + Math.max(1e3, Math.trunc(params.expiresInMs)) : null,
		...params.payload ? { payload: params.payload } : {}
	};
	state.itemsById.set(item.id, item);
	state.revision += 1;
	return {
		revision: state.revision,
		item,
		deduped: false
	};
}
function drainNodePendingWork(nodeId, opts = {}) {
	const normalizedNodeId = nodeId.trim();
	if (!normalizedNodeId) return {
		revision: 0,
		items: [],
		hasMore: false
	};
	const nowMs = opts.nowMs ?? Date.now();
	const state = stateByNodeId.get(normalizedNodeId);
	const revision = state?.revision ?? 0;
	if (state) {
		pruneExpired(state, nowMs);
		pruneStateIfEmpty(normalizedNodeId, state);
	}
	const maxItems = Math.min(MAX_ITEMS, Math.max(1, Math.trunc(opts.maxItems ?? DEFAULT_MAX_ITEMS)));
	const explicitItems = state ? sortedItems(state) : [];
	const items = explicitItems.slice(0, maxItems);
	const hasExplicitStatus = explicitItems.some((item) => item.type === "status.request");
	const includeBaseline = opts.includeDefaultStatus !== false && !hasExplicitStatus;
	if (includeBaseline && items.length < maxItems) items.push(makeBaselineStatusItem(nowMs));
	const explicitReturnedCount = items.filter((item) => item.id !== DEFAULT_STATUS_ITEM_ID).length;
	const baselineIncluded = items.some((item) => item.id === DEFAULT_STATUS_ITEM_ID);
	return {
		revision,
		items,
		hasMore: explicitItems.length > explicitReturnedCount || includeBaseline && !baselineIncluded
	};
}
//#endregion
//#region src/gateway/server-methods/nodes-pending.ts
function resolveClientNodeId(client) {
	const trimmed = (client?.connect?.device?.id ?? client?.connect?.client?.id ?? "").trim();
	return trimmed.length > 0 ? trimmed : null;
}
const nodePendingHandlers = {
	"node.pending.drain": async ({ params, respond, client }) => {
		if (!validateNodePendingDrainParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pending.drain",
				validator: validateNodePendingDrainParams
			});
			return;
		}
		const nodeId = resolveClientNodeId(client);
		if (!nodeId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "node.pending.drain requires a connected device identity"));
			return;
		}
		respond(true, {
			nodeId,
			...drainNodePendingWork(nodeId, {
				maxItems: params.maxItems,
				includeDefaultStatus: true
			})
		}, void 0);
	},
	"node.pending.enqueue": async ({ params, respond, context }) => {
		if (!validateNodePendingEnqueueParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pending.enqueue",
				validator: validateNodePendingEnqueueParams
			});
			return;
		}
		const p = params;
		await respondUnavailableOnThrow(respond, async () => {
			const queued = enqueueNodePendingWork({
				nodeId: p.nodeId,
				type: p.type,
				priority: p.priority,
				expiresInMs: p.expiresInMs
			});
			let wakeTriggered = false;
			if (p.wake !== false && !queued.deduped && !context.nodeRegistry.get(p.nodeId)) {
				const wakeReqId = queued.item.id;
				context.logGateway.info(`node pending wake start node=${p.nodeId} req=${wakeReqId} type=${queued.item.type}`);
				const cfg = context.getRuntimeConfig();
				const wake = await maybeWakeNodeWithApns(p.nodeId, {
					wakeReason: "node.pending",
					cfg
				});
				context.logGateway.info(`node pending wake stage=wake1 node=${p.nodeId} req=${wakeReqId} available=${wake.available} throttled=${wake.throttled} path=${wake.path} durationMs=${wake.durationMs} apnsStatus=${wake.apnsStatus ?? -1} apnsReason=${wake.apnsReason ?? "-"}`);
				wakeTriggered = wake.available;
				if (wake.available) {
					const reconnected = await waitForNodeReconnect({
						nodeId: p.nodeId,
						context,
						timeoutMs: NODE_WAKE_RECONNECT_WAIT_MS
					});
					context.logGateway.info(`node pending wake stage=wait1 node=${p.nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${NODE_WAKE_RECONNECT_WAIT_MS}`);
				}
				if (!context.nodeRegistry.get(p.nodeId) && wake.available) {
					const retryWake = await maybeWakeNodeWithApns(p.nodeId, {
						force: true,
						wakeReason: "node.pending",
						cfg
					});
					context.logGateway.info(`node pending wake stage=wake2 node=${p.nodeId} req=${wakeReqId} force=true available=${retryWake.available} throttled=${retryWake.throttled} path=${retryWake.path} durationMs=${retryWake.durationMs} apnsStatus=${retryWake.apnsStatus ?? -1} apnsReason=${retryWake.apnsReason ?? "-"}`);
					if (retryWake.available) {
						const reconnected = await waitForNodeReconnect({
							nodeId: p.nodeId,
							context,
							timeoutMs: NODE_WAKE_RECONNECT_RETRY_WAIT_MS
						});
						context.logGateway.info(`node pending wake stage=wait2 node=${p.nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${NODE_WAKE_RECONNECT_RETRY_WAIT_MS}`);
					}
				}
				if (!context.nodeRegistry.get(p.nodeId)) {
					const nudge = await maybeSendNodeWakeNudge(p.nodeId, { cfg });
					context.logGateway.info(`node pending wake nudge node=${p.nodeId} req=${wakeReqId} sent=${nudge.sent} throttled=${nudge.throttled} reason=${nudge.reason} durationMs=${nudge.durationMs} apnsStatus=${nudge.apnsStatus ?? -1} apnsReason=${nudge.apnsReason ?? "-"}`);
					context.logGateway.warn(`node pending wake done node=${p.nodeId} req=${wakeReqId} connected=false reason=not_connected`);
				} else context.logGateway.info(`node pending wake done node=${p.nodeId} req=${wakeReqId} connected=true`);
			}
			respond(true, {
				nodeId: p.nodeId,
				revision: queued.revision,
				queued: queued.item,
				wakeTriggered
			}, void 0);
		});
	}
};
//#endregion
export { nodePendingHandlers };
