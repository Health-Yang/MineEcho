import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { Ct as validatePluginApprovalRequestParams, Ii as ErrorCodes, Li as errorShape, t as formatValidationErrors, wt as validatePluginApprovalResolveParams } from "./protocol-BkfNT2Bp.js";
import { h as validatePluginApprovalActionTemplates, i as MAX_PLUGIN_APPROVAL_TIMEOUT_MS, m as resolvePluginApprovalRequestAllowedDecisions, n as DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS, p as expandPluginApprovalActionTemplates } from "./plugin-approvals-C9xbHKhZ.js";
import { a as isApprovalRecordVisibleToClient, i as isApprovalDecision, n as handleApprovalWaitDecision, r as handlePendingApprovalRequest, t as handleApprovalResolve } from "./approval-shared-DcUd2XkA.js";
import { randomUUID } from "node:crypto";
//#region src/gateway/server-methods/plugin-approval.ts
function validateDecisionActionAvailability(params) {
	if (!Array.isArray(params.actions)) return null;
	for (const [index, action] of params.actions.entries()) if (action.kind === "decision" && !params.allowedDecisions.includes(action.decision)) return `actions[${index}] decision ${action.decision} is not in allowedDecisions`;
	return null;
}
function createPluginApprovalHandlers(manager, opts) {
	return {
		"plugin.approval.list": async ({ respond, client }) => {
			respond(true, manager.listPendingRecords().filter((record) => isApprovalRecordVisibleToClient({
				record,
				client
			})).map((record) => ({
				id: record.id,
				request: record.request,
				createdAtMs: record.createdAtMs,
				expiresAtMs: record.expiresAtMs
			})), void 0);
		},
		"plugin.approval.request": async ({ params, client, respond, context }) => {
			if (!validatePluginApprovalRequestParams(params)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid plugin.approval.request params: ${formatValidationErrors(validatePluginApprovalRequestParams.errors)}`));
				return;
			}
			const p = params;
			const actionTemplateError = Array.isArray(p.actions) ? validatePluginApprovalActionTemplates(p.actions) : null;
			if (actionTemplateError) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, actionTemplateError));
				return;
			}
			const allowedDecisions = resolvePluginApprovalRequestAllowedDecisions({ allowedDecisions: Array.isArray(p.allowedDecisions) ? p.allowedDecisions : null });
			const decisionActionError = validateDecisionActionAvailability({
				actions: p.actions,
				allowedDecisions
			});
			if (decisionActionError) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, decisionActionError));
				return;
			}
			const twoPhase = p.twoPhase === true;
			const timeoutMs = Math.min(typeof p.timeoutMs === "number" ? p.timeoutMs : DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS, MAX_PLUGIN_APPROVAL_TIMEOUT_MS);
			const normalizeTrimmedString = (value) => normalizeOptionalString(value) || null;
			const approvalId = `plugin:${randomUUID()}`;
			const request = {
				pluginId: p.pluginId ?? null,
				title: p.title,
				description: p.description,
				severity: p.severity ?? null,
				toolName: p.toolName ?? null,
				toolCallId: p.toolCallId ?? null,
				...Array.isArray(p.allowedDecisions) ? { allowedDecisions } : {},
				...Array.isArray(p.actions) ? { actions: expandPluginApprovalActionTemplates({
					approvalId,
					actions: p.actions
				}) } : {},
				agentId: p.agentId ?? null,
				sessionKey: p.sessionKey ?? null,
				turnSourceChannel: normalizeTrimmedString(p.turnSourceChannel),
				turnSourceTo: normalizeTrimmedString(p.turnSourceTo),
				turnSourceAccountId: normalizeTrimmedString(p.turnSourceAccountId),
				turnSourceThreadId: p.turnSourceThreadId ?? null
			};
			const record = manager.create(request, timeoutMs, approvalId);
			record.requestedByConnId = client?.connId ?? null;
			record.requestedByDeviceId = client?.connect?.device?.id ?? null;
			record.requestedByClientId = client?.connect?.client?.id ?? null;
			record.requestedByDeviceTokenAuth = client?.isDeviceTokenAuth === true;
			let decisionPromise;
			try {
				decisionPromise = manager.register(record, timeoutMs);
			} catch (err) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `registration failed: ${String(err)}`));
				return;
			}
			const requestEvent = {
				id: record.id,
				request: record.request,
				createdAtMs: record.createdAtMs,
				expiresAtMs: record.expiresAtMs
			};
			await handlePendingApprovalRequest({
				manager,
				record,
				decisionPromise,
				respond,
				context,
				clientConnId: client?.connId,
				requestEventName: "plugin.approval.requested",
				requestEvent,
				twoPhase,
				approvalKind: "plugin",
				keepPendingWithoutRoute: p.keepPendingWithoutRoute === true,
				deliverRequest: () => {
					if (!opts?.forwarder?.handlePluginApprovalRequested) return false;
					return opts.forwarder.handlePluginApprovalRequested(requestEvent).catch((err) => {
						context.logGateway?.error?.(`plugin approvals: forward request failed: ${String(err)}`);
						return false;
					});
				}
			});
		},
		"plugin.approval.waitDecision": async ({ params, respond, client }) => {
			await handleApprovalWaitDecision({
				manager,
				inputId: params.id,
				client,
				respond
			});
		},
		"plugin.approval.resolve": async ({ params, respond, client, context }) => {
			if (!validatePluginApprovalResolveParams(params)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid plugin.approval.resolve params: ${formatValidationErrors(validatePluginApprovalResolveParams.errors)}`));
				return;
			}
			const p = params;
			if (!isApprovalDecision(p.decision)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid decision"));
				return;
			}
			const decision = p.decision;
			await handleApprovalResolve({
				manager,
				inputId: p.id,
				decision,
				respond,
				context,
				client,
				exposeAmbiguousPrefixError: false,
				validateDecision: (snapshot) => resolvePluginApprovalRequestAllowedDecisions(snapshot.request).includes(decision) ? null : {
					message: `${decision} is unavailable for this plugin approval`,
					details: { allowedDecisions: resolvePluginApprovalRequestAllowedDecisions(snapshot.request) }
				},
				resolvedEventName: "plugin.approval.resolved",
				buildResolvedEvent: ({ approvalId, decision, resolvedBy, snapshot, nowMs }) => ({
					id: approvalId,
					decision,
					resolvedBy,
					ts: nowMs,
					request: snapshot.request
				}),
				forwardResolved: (resolvedEvent) => opts?.forwarder?.handlePluginApprovalResolved?.(resolvedEvent),
				forwardResolvedErrorLabel: "plugin approvals: forward resolve failed"
			});
		}
	};
}
//#endregion
export { createPluginApprovalHandlers };
