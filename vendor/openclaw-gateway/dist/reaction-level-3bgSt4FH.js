import { t as resolveReactionLevel } from "./reaction-level-Djuz3vHr.js";
import "./status-helpers-BrYXq8bp.js";
import { t as inspectTelegramAccount } from "./account-inspect-D4YU-UDv.js";
//#region extensions/telegram/src/reaction-level.ts
/**
* Resolve the effective reaction level and its implications.
*/
function resolveTelegramReactionLevel(params) {
	return resolveReactionLevel({
		value: inspectTelegramAccount({
			cfg: params.cfg,
			accountId: params.accountId
		}).config.reactionLevel,
		defaultLevel: "minimal",
		invalidFallback: "ack"
	});
}
//#endregion
export { resolveTelegramReactionLevel as t };
