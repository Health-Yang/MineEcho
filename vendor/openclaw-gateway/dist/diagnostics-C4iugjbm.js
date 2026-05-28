import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { n as getDiagnosticStabilitySnapshot, r as normalizeDiagnosticStabilityQuery } from "./diagnostic-stability-B5DLb6EX.js";
//#region src/gateway/server-methods/diagnostics.ts
const diagnosticsHandlers = { "diagnostics.stability": async ({ params, respond }) => {
	try {
		respond(true, getDiagnosticStabilitySnapshot(normalizeDiagnosticStabilityQuery(params)), void 0);
	} catch (err) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, err instanceof Error ? err.message : "invalid diagnostics.stability params"));
	}
} };
//#endregion
export { diagnosticsHandlers };
