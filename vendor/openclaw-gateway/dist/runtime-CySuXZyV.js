import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
//#region extensions/telegram/src/runtime.ts
const { setRuntime: setTelegramRuntime, clearRuntime: clearTelegramRuntime, getRuntime: getTelegramRuntime, tryGetRuntime: getOptionalTelegramRuntime } = createPluginRuntimeStore({
	pluginId: "telegram",
	errorMessage: "Telegram runtime not initialized"
});
//#endregion
export { getTelegramRuntime as n, setTelegramRuntime as r, getOptionalTelegramRuntime as t };
