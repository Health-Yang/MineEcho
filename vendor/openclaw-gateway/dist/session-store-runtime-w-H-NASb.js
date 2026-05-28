import "./paths-DZXdqwOo.js";
import { t as loadSessionStore$1 } from "./store-load-Di_AfnVx.js";
import "./store-B5j4GKkg.js";
import "./reset-g3NFNZsz.js";
import "./session-key-Da-0RWbO.js";
import "./transcript-DxGLLD67.js";
//#region src/plugin-sdk/session-store-runtime.ts
/**
* @deprecated Use getSessionEntry/listSessionEntries for reads and
* patchSessionEntry/upsertSessionEntry for writes. loadSessionStore keeps the
* legacy mutable whole-store shape and will remain a compatibility escape hatch.
*/
const loadSessionStore = loadSessionStore$1;
//#endregion
export { loadSessionStore as t };
