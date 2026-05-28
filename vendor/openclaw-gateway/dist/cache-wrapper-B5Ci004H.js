import { t as applyAnthropicEphemeralCacheControlMarkers } from "./anthropic-payload-policy-BMckDm45.js";
import { i as streamWithPayloadPatch } from "./moonshot-thinking-stream-wrappers-oygQHkq7.js";
import "./provider-stream-BJysH3n8.js";
//#region extensions/deepinfra/cache-wrapper.ts
function createDeepInfraAnthropicCacheWrapper(baseStreamFn) {
	return ((model, context, options) => {
		const modelIdRaw = model.id;
		if (!(typeof modelIdRaw === "string" ? modelIdRaw.toLowerCase() : "").startsWith("anthropic/")) return baseStreamFn(model, context, options);
		return streamWithPayloadPatch(baseStreamFn, model, context, options, (payload) => {
			applyAnthropicEphemeralCacheControlMarkers(payload);
		});
	});
}
//#endregion
export { createDeepInfraAnthropicCacheWrapper as t };
