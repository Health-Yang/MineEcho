import "./utils-B5r0V84N.js";
import "./types.secrets-CtRQ27Ls.js";
import "./setup-helpers-CaJFRzVY.js";
import "./setup-binary-DEEYfRB2.js";
import "./setup-wizard-helpers-Xh7mdtEp.js";
import "./setup-wizard-proxy-CHbfvZM5.js";
//#region src/plugin-sdk/resolution-notes.ts
/** Format a short note that separates successfully resolved targets from unresolved passthrough values. */
function formatResolvedUnresolvedNote(params) {
	if (params.resolved.length === 0 && params.unresolved.length === 0) return;
	return [params.resolved.length > 0 ? `Resolved: ${params.resolved.join(", ")}` : void 0, params.unresolved.length > 0 ? `Unresolved (kept as typed): ${params.unresolved.join(", ")}` : void 0].filter(Boolean).join("\n");
}
//#endregion
export { formatResolvedUnresolvedNote as t };
