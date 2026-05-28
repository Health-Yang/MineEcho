import { Ii as ErrorCodes, Li as errorShape, rt as validateLogsTailParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { t as readConfiguredLogTail } from "./log-tail-quJdRb5H.js";
//#region src/gateway/server-methods/logs.ts
const logsHandlers = { "logs.tail": async ({ params, respond }) => {
	if (!validateLogsTailParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid logs.tail params: ${formatValidationErrors(validateLogsTailParams.errors)}`));
		return;
	}
	const p = params;
	try {
		respond(true, await readConfiguredLogTail({
			cursor: p.cursor,
			limit: p.limit,
			maxBytes: p.maxBytes
		}), void 0);
	} catch (err) {
		respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `log read failed: ${String(err)}`));
	}
} };
//#endregion
export { logsHandlers };
