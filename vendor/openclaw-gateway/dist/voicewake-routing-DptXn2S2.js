import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { a as validateVoiceWakeRoutingConfigInput, i as setVoiceWakeRoutingConfig, n as normalizeVoiceWakeRoutingConfig, t as loadVoiceWakeRoutingConfig } from "./voicewake-routing-D3DNz6h6.js";
//#region src/gateway/server-methods/voicewake-routing.ts
const voicewakeRoutingHandlers = {
	"voicewake.routing.get": async ({ respond }) => {
		try {
			respond(true, { config: await loadVoiceWakeRoutingConfig() });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
		}
	},
	"voicewake.routing.set": async ({ params, respond, context }) => {
		if (!params || params.config === null || typeof params.config !== "object" || Array.isArray(params.config)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "voicewake.routing.set requires config: object"));
			return;
		}
		const validated = validateVoiceWakeRoutingConfigInput(params.config);
		if (!validated.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, validated.message));
			return;
		}
		try {
			const config = await setVoiceWakeRoutingConfig(normalizeVoiceWakeRoutingConfig(params.config));
			context.broadcastVoiceWakeRoutingChanged(config);
			respond(true, { config });
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
		}
	}
};
//#endregion
export { voicewakeRoutingHandlers };
