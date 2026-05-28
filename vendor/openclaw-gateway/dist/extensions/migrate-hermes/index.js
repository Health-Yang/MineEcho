import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
import { t as buildHermesMigrationProvider } from "../../provider-BfEaR2Tk.js";
//#region extensions/migrate-hermes/index.ts
var migrate_hermes_default = definePluginEntry({
	id: "migrate-hermes",
	name: "Hermes Migration",
	description: "Imports Hermes state into OpenClaw.",
	register(api) {
		api.registerMigrationProvider(buildHermesMigrationProvider({ runtime: api.runtime }));
	}
});
//#endregion
export { migrate_hermes_default as default };
