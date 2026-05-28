import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
import { t as buildFalImageGenerationProvider } from "../../image-generation-provider-B8xs1lBc.js";
import { t as buildFalMusicGenerationProvider } from "../../music-generation-provider-Cy6Kdbls.js";
import { t as createFalProvider } from "../../provider-registration-CSNSE5Gu.js";
import { t as buildFalVideoGenerationProvider } from "../../video-generation-provider-BSV1olAr.js";
var fal_default = definePluginEntry({
	id: "fal",
	name: "fal Provider",
	description: "Bundled fal image, video, and music generation provider",
	register(api) {
		api.registerProvider(createFalProvider());
		api.registerImageGenerationProvider(buildFalImageGenerationProvider());
		api.registerMusicGenerationProvider(buildFalMusicGenerationProvider());
		api.registerVideoGenerationProvider(buildFalVideoGenerationProvider());
	}
});
//#endregion
export { fal_default as default };
