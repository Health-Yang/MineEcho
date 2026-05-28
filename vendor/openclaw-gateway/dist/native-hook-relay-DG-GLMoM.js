import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { r as invokeNativeHookRelay } from "./native-hook-relay-BZnqw5Bo.js";
//#region src/gateway/server-methods/native-hook-relay.ts
const nativeHookRelayHandlers = { "nativeHook.invoke": async ({ params, respond }) => {
	try {
		respond(true, await invokeNativeHookRelay({
			provider: params.provider,
			relayId: params.relayId,
			generation: params.generation,
			event: params.event,
			rawPayload: params.rawPayload,
			requireGeneration: true
		}));
	} catch (error) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, error instanceof Error ? error.message : "native hook relay failed"));
	}
} };
//#endregion
export { nativeHookRelayHandlers };
