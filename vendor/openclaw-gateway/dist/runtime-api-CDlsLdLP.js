import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
import "./channel-outbound-DuRkxH3q.js";
import "./ssrf-runtime-C8F9j9mo.js";
import "./channel-inbound-DCx_VUbe.js";
import "./channel-pairing-BQ_p8VVd.js";
//#region extensions/nextcloud-talk/src/runtime.ts
const { setRuntime: setNextcloudTalkRuntime, getRuntime: getNextcloudTalkRuntime } = createPluginRuntimeStore({
	pluginId: "nextcloud-talk",
	errorMessage: "Nextcloud Talk runtime not initialized"
});
//#endregion
export { setNextcloudTalkRuntime as n, getNextcloudTalkRuntime as t };
