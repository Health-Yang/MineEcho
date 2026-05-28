import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
import { t as buildMicrosoftSpeechProvider } from "../../speech-provider-Did4VNj7.js";
//#region extensions/microsoft/index.ts
var microsoft_default = definePluginEntry({
	id: "microsoft",
	name: "Microsoft Speech",
	description: "Bundled Microsoft speech provider",
	register(api) {
		api.registerSpeechProvider(buildMicrosoftSpeechProvider());
	}
});
//#endregion
export { microsoft_default as default };
