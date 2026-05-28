import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import { i as setVoiceWakeTriggers, n as normalizeVoiceWakeTriggers, r as loadVoiceWakeConfig } from "./server-utils-nQL603BR.js";
//#region src/gateway/server-methods/voicewake.ts
const voicewakeHandlers = {
	"voicewake.get": async ({ respond }) => {
		try {
			respond(true, { triggers: (await loadVoiceWakeConfig()).triggers });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"voicewake.set": async ({ params, respond, context }) => {
		if (!Array.isArray(params.triggers)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "voicewake.set requires triggers: string[]"));
			return;
		}
		try {
			const cfg = await setVoiceWakeTriggers(normalizeVoiceWakeTriggers(params.triggers));
			context.broadcastVoiceWakeChanged(cfg.triggers);
			respond(true, { triggers: cfg.triggers });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	}
};
//#endregion
export { voicewakeHandlers };
