import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
//#region src/channels/thread-binding-id.ts
function resolveThreadBindingConversationIdFromBindingId(params) {
	const bindingId = normalizeOptionalString(params.bindingId);
	if (!bindingId) return;
	const prefix = `${params.accountId}:`;
	if (!bindingId.startsWith(prefix)) return;
	return normalizeOptionalString(bindingId.slice(prefix.length)) || void 0;
}
//#endregion
export { resolveThreadBindingConversationIdFromBindingId as t };
