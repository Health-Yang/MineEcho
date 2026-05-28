import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
import "./channel-outbound-DuRkxH3q.js";
import "./outbound-media-CqtNSHxz.js";
import "./ssrf-runtime-C8F9j9mo.js";
import "./media-runtime-BndVydhQ.js";
import "./text-chunking-CWOBXxG4.js";
import "./dangerous-name-runtime-SM1xKatU.js";
import "./channel-status-BX1a89bS.js";
import "./bundled-channel-config-schema-NfvDMYl5.js";
import "./channel-config-primitives-C4xGbxkF.js";
import "./channel-actions-De3bK4k3.js";
import "./channel-inbound-DCx_VUbe.js";
import "./channel-feedback-BMv7lXQV.js";
import "./channel-pairing-BQ_p8VVd.js";
import "./webhook-ingress-UeOF0INQ.js";
import "./webhook-request-guards-Bii1opsG.js";
import "./webhook-targets-CgnJsKVJ.js";
//#region extensions/googlechat/src/runtime.ts
const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } = createPluginRuntimeStore({
	pluginId: "googlechat",
	errorMessage: "Google Chat runtime not initialized"
});
//#endregion
export { setGoogleChatRuntime as n, getGoogleChatRuntime as t };
