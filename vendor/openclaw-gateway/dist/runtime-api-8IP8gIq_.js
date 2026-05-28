import "./file-lock-C4JGV-yb.js";
import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
import "./channel-policy-DUgslXLg.js";
import "./channel-outbound-DuRkxH3q.js";
import "./outbound-media-CqtNSHxz.js";
import "./ssrf-runtime-C8F9j9mo.js";
import "./media-runtime-BndVydhQ.js";
import "./text-chunking-CWOBXxG4.js";
import "./dangerous-name-runtime-SM1xKatU.js";
import "./channel-status-BX1a89bS.js";
import "./channel-inbound-DCx_VUbe.js";
import "./channel-pairing-BQ_p8VVd.js";
import "./channel-targets-CI_w95YR.js";
import "./webhook-ingress-UeOF0INQ.js";
//#region extensions/msteams/src/runtime.ts
const { setRuntime: setMSTeamsRuntime, getRuntime: getMSTeamsRuntime, tryGetRuntime: getOptionalMSTeamsRuntime } = createPluginRuntimeStore({
	pluginId: "msteams",
	errorMessage: "MSTeams runtime not initialized"
});
//#endregion
export { getOptionalMSTeamsRuntime as n, setMSTeamsRuntime as r, getMSTeamsRuntime as t };
