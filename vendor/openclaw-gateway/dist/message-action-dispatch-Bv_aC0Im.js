import { t as getChannelPlugin } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
//#region src/channels/plugins/message-action-dispatch.ts
function requiresTrustedRequesterSender(ctx) {
	const plugin = getChannelPlugin(ctx.channel);
	return Boolean(plugin?.actions?.requiresTrustedRequesterSender?.({
		action: ctx.action,
		toolContext: ctx.toolContext
	}));
}
async function dispatchChannelMessageAction(ctx) {
	if (requiresTrustedRequesterSender(ctx) && !ctx.requesterSenderId?.trim()) throw new Error(`Trusted sender identity is required for ${ctx.channel}:${ctx.action} in tool-driven contexts.`);
	const plugin = getChannelPlugin(ctx.channel);
	if (!plugin?.actions?.handleAction) return null;
	if (plugin.actions.supportsAction && !plugin.actions.supportsAction({ action: ctx.action })) return null;
	return await plugin.actions.handleAction(ctx);
}
//#endregion
export { dispatchChannelMessageAction as t };
