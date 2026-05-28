import { t as inspectDiscordAccount } from "./account-inspect-DsJXLLwb.js";
import { O as fetchChannelPermissionsDiscord } from "./send.shared-7pwia81k.js";
import "./send-6pM2ablf.js";
import { n as collectDiscordAuditChannelIdsForAccount, t as auditDiscordChannelPermissionsWithFetcher } from "./audit-core-BXr4LFe_.js";
//#region extensions/discord/src/audit.ts
function collectDiscordAuditChannelIds(params) {
	return collectDiscordAuditChannelIdsForAccount(inspectDiscordAccount({
		cfg: params.cfg,
		accountId: params.accountId
	}).config);
}
async function auditDiscordChannelPermissions(params) {
	return await auditDiscordChannelPermissionsWithFetcher({
		...params,
		fetchChannelPermissions: fetchChannelPermissionsDiscord
	});
}
//#endregion
export { collectDiscordAuditChannelIds as n, auditDiscordChannelPermissions as t };
