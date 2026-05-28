import { t as applyAuthProfileConfig } from "./provider-auth-helpers-BypOO1dt.js";
import "./provider-auth-CCtAcb6r.js";
//#region extensions/migrate-hermes/auth-config.ts
var HermesAuthConfigConflict = class extends Error {};
function existingProfileIsCompatible(existing, profile) {
	if (existing.provider !== profile.provider || existing.mode !== profile.mode) return false;
	if (existing.email && profile.email && existing.email !== profile.email) return false;
	return true;
}
function hasAuthProfileConfigConflict(config, profile, overwrite) {
	if (overwrite) return false;
	const existing = config.auth?.profiles?.[profile.profileId];
	return Boolean(existing && !existingProfileIsCompatible(existing, profile));
}
function replaceConfigDraft(draft, next) {
	for (const key of Object.keys(draft)) delete draft[key];
	Object.assign(draft, next);
}
function hasCurrentAuthProfileConfigConflict(ctx, profile) {
	let config = ctx.config;
	try {
		config = ctx.runtime?.config?.current?.() ?? config;
	} catch {}
	return hasAuthProfileConfigConflict(config, profile, Boolean(ctx.overwrite));
}
async function applyAuthProfileConfigWithConflictCheck(params) {
	const configApi = params.ctx.runtime?.config;
	if (!configApi?.current || !configApi.mutateConfigFile) return "unavailable";
	try {
		await configApi.mutateConfigFile({
			base: "runtime",
			afterWrite: { mode: "auto" },
			mutate(draft) {
				let next = draft;
				if (params.applyConfigPatch) next = params.applyConfigPatch(next);
				if (hasAuthProfileConfigConflict(next, params.profile, Boolean(params.ctx.overwrite))) throw new HermesAuthConfigConflict();
				next = applyAuthProfileConfig(next, {
					profileId: params.profile.profileId,
					provider: params.profile.provider,
					mode: params.profile.mode,
					...params.profile.email ? { email: params.profile.email } : {},
					...params.profile.displayName ? { displayName: params.profile.displayName } : {},
					preferProfileFirst: false
				});
				replaceConfigDraft(draft, next);
			}
		});
		return "configured";
	} catch (error) {
		return error instanceof HermesAuthConfigConflict ? "conflict" : "unavailable";
	}
}
//#endregion
export { hasAuthProfileConfigConflict as n, hasCurrentAuthProfileConfigConflict as r, applyAuthProfileConfigWithConflictCheck as t };
