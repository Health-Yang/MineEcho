//#region src/auto-reply/reply/inbound-text.ts
function normalizeInboundTextNewlines(input) {
	return input.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}
//#endregion
export { normalizeInboundTextNewlines as t };
