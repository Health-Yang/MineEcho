import { $ as validateExecApprovalsGetParams, Ii as ErrorCodes, Li as errorShape, et as validateExecApprovalsNodeGetParams, nt as validateExecApprovalsSetParams, tt as validateExecApprovalsNodeSetParams } from "./protocol-BkfNT2Bp.js";
import { N as saveExecApprovals, b as readExecApprovalsSnapshot, f as mergeExecApprovalsSocketDefaults, m as normalizeExecApprovals, s as ensureExecApprovals } from "./exec-approvals-oH5G9_TS.js";
import { i as safeParseJson, n as respondUnavailableOnNodeInvokeError, r as respondUnavailableOnThrow } from "./nodes.helpers-pWq0E7xD.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { t as resolveBaseHashParam } from "./base-hash-1n9gC3iI.js";
//#region src/gateway/server-methods/exec-approvals.ts
function requireApprovalsBaseHash(params, snapshot, respond) {
	if (!snapshot.exists) return true;
	if (!snapshot.hash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "exec approvals base hash unavailable; re-run exec.approvals.get and retry"));
		return false;
	}
	const baseHash = resolveBaseHashParam(params);
	if (!baseHash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "exec approvals base hash required; re-run exec.approvals.get and retry"));
		return false;
	}
	if (baseHash !== snapshot.hash) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "exec approvals changed since last load; re-run exec.approvals.get and retry"));
		return false;
	}
	return true;
}
function redactExecApprovals(file) {
	const socketPath = file.socket?.path?.trim();
	return {
		...file,
		socket: socketPath ? { path: socketPath } : void 0
	};
}
function toExecApprovalsPayload(snapshot) {
	return {
		path: snapshot.path,
		exists: snapshot.exists,
		hash: snapshot.hash,
		file: redactExecApprovals(snapshot.file)
	};
}
function resolveNodeIdOrRespond(nodeId, respond) {
	const id = nodeId.trim();
	if (!id) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId required"));
		return null;
	}
	return id;
}
const execApprovalsHandlers = {
	"exec.approvals.get": ({ params, respond }) => {
		if (!assertValidParams(params, validateExecApprovalsGetParams, "exec.approvals.get", respond)) return;
		ensureExecApprovals();
		respond(true, toExecApprovalsPayload(readExecApprovalsSnapshot()), void 0);
	},
	"exec.approvals.set": ({ params, respond }) => {
		if (!assertValidParams(params, validateExecApprovalsSetParams, "exec.approvals.set", respond)) return;
		ensureExecApprovals();
		const snapshot = readExecApprovalsSnapshot();
		if (!requireApprovalsBaseHash(params, snapshot, respond)) return;
		const incoming = params.file;
		if (!incoming || typeof incoming !== "object") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "exec approvals file is required"));
			return;
		}
		saveExecApprovals(mergeExecApprovalsSocketDefaults({
			normalized: normalizeExecApprovals(incoming),
			current: snapshot.file
		}));
		respond(true, toExecApprovalsPayload(readExecApprovalsSnapshot()), void 0);
	},
	"exec.approvals.node.get": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateExecApprovalsNodeGetParams, "exec.approvals.node.get", respond)) return;
		const { nodeId } = params;
		const id = resolveNodeIdOrRespond(nodeId, respond);
		if (!id) return;
		await respondUnavailableOnThrow(respond, async () => {
			const res = await context.nodeRegistry.invoke({
				nodeId: id,
				command: "system.execApprovals.get",
				params: {}
			});
			if (!respondUnavailableOnNodeInvokeError(respond, res)) return;
			respond(true, res.payloadJSON ? safeParseJson(res.payloadJSON) : res.payload, void 0);
		});
	},
	"exec.approvals.node.set": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateExecApprovalsNodeSetParams, "exec.approvals.node.set", respond)) return;
		const { nodeId, file, baseHash } = params;
		const id = resolveNodeIdOrRespond(nodeId, respond);
		if (!id) return;
		await respondUnavailableOnThrow(respond, async () => {
			const res = await context.nodeRegistry.invoke({
				nodeId: id,
				command: "system.execApprovals.set",
				params: {
					file,
					baseHash
				}
			});
			if (!respondUnavailableOnNodeInvokeError(respond, res)) return;
			respond(true, safeParseJson(res.payloadJSON ?? null), void 0);
		});
	}
};
//#endregion
export { execApprovalsHandlers };
