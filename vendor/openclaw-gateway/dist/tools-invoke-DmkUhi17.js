import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { Hn as validateToolsInvokeParams, Ii as ErrorCodes, Li as errorShape, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { t as invokeGatewayTool } from "./tools-invoke-shared-CcDhjdOe.js";
//#region src/gateway/server-methods/tools-invoke.ts
function resolveRpcErrorCode(params) {
	if (params.requiresApproval) return "requires_approval";
	switch (params.type) {
		case "invalid_request": return "validation_error";
		case "not_found": return "not_found";
		case "tool_call_blocked": return "forbidden";
		case "tool_error": return "internal_error";
	}
	return "internal_error";
}
const toolsInvokeHandlers = { "tools.invoke": async ({ params, respond, context }) => {
	if (!validateToolsInvokeParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tools.invoke params: ${formatValidationErrors(validateToolsInvokeParams.errors)}`));
		return;
	}
	const requestedToolName = normalizeOptionalString(params.name);
	if (!requestedToolName) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid tools.invoke params: name required"));
		return;
	}
	const outcome = await invokeGatewayTool({
		cfg: context.getRuntimeConfig(),
		input: params,
		toolCallIdPrefix: "rpc",
		approvalMode: params.confirm === true ? "request" : "report"
	});
	if (outcome.ok) {
		respond(true, {
			ok: true,
			toolName: outcome.toolName,
			output: outcome.result,
			source: outcome.source
		}, void 0);
		return;
	}
	respond(true, {
		ok: false,
		toolName: outcome.toolName || requestedToolName,
		...outcome.error.requiresApproval ? { requiresApproval: true } : {},
		error: {
			code: resolveRpcErrorCode(outcome.error),
			message: outcome.error.message
		}
	}, void 0);
} };
//#endregion
export { toolsInvokeHandlers };
