import "./subsystem-1gTaEPwP.js";
import "./provider-env-vars-CteAyjcQ.js";
import "./failover-error-wBZizcCn.js";
import "./provider-registry-Dv4nxjit.js";
import "./runtime-shared-PyiD84A7.js";
import "./provider-model-shared-Co6lnz7Y.js";
//#region src/plugin-sdk/image-generation-core.ts
const OPENAI_DEFAULT_IMAGE_MODEL = "gpt-image-2";
let imageGenerationCoreAuthRuntimePromise;
async function loadImageGenerationCoreAuthRuntime() {
	imageGenerationCoreAuthRuntimePromise ??= import("./image-generation-core.auth.runtime.js");
	return imageGenerationCoreAuthRuntimePromise;
}
async function resolveApiKeyForProvider(...args) {
	return (await loadImageGenerationCoreAuthRuntime()).resolveApiKeyForProvider(...args);
}
//#endregion
export { resolveApiKeyForProvider as n, OPENAI_DEFAULT_IMAGE_MODEL as t };
