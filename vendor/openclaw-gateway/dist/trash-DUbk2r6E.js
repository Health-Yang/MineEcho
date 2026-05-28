import { d as movePathToTrash$1 } from "./fs-safe-JUdtLZkh.js";
import { n as resolvePreferredOpenClawTmpDir } from "./tmp-openclaw-dir-C60hWKdY.js";
import "./temp-path-CHSPBUGU.js";
import "./browser-config-BJW8fHrN.js";
import os from "node:os";
//#region extensions/browser/src/browser/trash.ts
async function movePathToTrash(targetPath) {
	return await movePathToTrash$1(targetPath, { allowedRoots: [os.homedir(), resolvePreferredOpenClawTmpDir()] });
}
//#endregion
export { movePathToTrash as t };
