import "../../provider-catalog-shared-DGUcvumn.js";
import { r as buildStaticDeepInfraProvider, t as buildDeepInfraApiKeyCatalog } from "../../provider-catalog-B6ZZUTsO.js";
//#region extensions/deepinfra/provider-discovery.ts
const deepinfraProviderDiscovery = {
	id: "deepinfra",
	label: "DeepInfra",
	docsPath: "/providers/deepinfra",
	auth: [],
	catalog: {
		order: "simple",
		run: (ctx) => buildDeepInfraApiKeyCatalog(ctx)
	},
	staticCatalog: {
		order: "simple",
		run: async () => ({ provider: buildStaticDeepInfraProvider() })
	}
};
//#endregion
export { deepinfraProviderDiscovery as default };
