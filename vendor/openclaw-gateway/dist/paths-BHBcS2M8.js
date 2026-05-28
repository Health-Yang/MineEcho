import { n as saveJsonFile } from "./json-file-DTvSUa2e.js";
import "./path-resolve-DsZZvktq.js";
import "./constants-0i5hheAU.js";
import fs from "node:fs";
//#region src/agents/auth-profiles/paths.ts
function ensureAuthStoreFile(pathname) {
	if (fs.existsSync(pathname)) return;
	saveJsonFile(pathname, {
		version: 1,
		profiles: {}
	});
}
//#endregion
export { ensureAuthStoreFile as t };
