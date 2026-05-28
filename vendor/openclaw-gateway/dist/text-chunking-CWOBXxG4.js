import "./safe-text-J_0sTthZ.js";
import { l as chunkTextByBreakResolver } from "./chunk-D9iphjyK.js";
import "./tables-CSTxKJa3.js";
import "./chunk-items-CFv2WPIb.js";
import "./auto-linked-file-ref-Uv6kgYfd.js";
//#region src/plugin-sdk/text-chunking.ts
/** Chunk outbound text while preferring newline boundaries over spaces. */
function chunkTextForOutbound(text, limit) {
	return chunkTextByBreakResolver(text, limit, (window) => {
		const lastNewline = window.lastIndexOf("\n");
		const lastSpace = window.lastIndexOf(" ");
		return lastNewline > 0 ? lastNewline : lastSpace;
	});
}
//#endregion
export { chunkTextForOutbound as t };
