import { r as buildConfiguredModelCatalog } from "./model-selection-shared-BuXkxoPc.js";
import { n as modelKey } from "./model-selection-normalize-l_jinpMc.js";
import { n as createModelVisibilityPolicy, t as RUNTIME_MODEL_VISIBILITY_NORMALIZATION } from "./model-visibility-policy-CTaFNJ2U.js";
import { n as createProviderAuthChecker } from "./model-provider-auth-BdnG0kzt.js";
//#region src/agents/model-catalog-visibility.ts
function isPromiseLike(value) {
	return typeof value === "object" && value !== null && typeof value.then === "function";
}
async function providerHasAuth(providerAuthChecker, provider) {
	const result = providerAuthChecker(provider);
	return isPromiseLike(result) ? await result : result;
}
function sortModelCatalogEntries(entries) {
	return entries.toSorted((a, b) => a.provider.localeCompare(b.provider) || a.id.localeCompare(b.id));
}
function dedupeModelCatalogEntries(entries) {
	const seen = /* @__PURE__ */ new Set();
	const next = [];
	for (const entry of entries) {
		const key = modelKey(entry.provider, entry.id);
		if (seen.has(key)) continue;
		seen.add(key);
		next.push(entry);
	}
	return next;
}
async function resolveVisibleModelCatalog(params) {
	if (params.view === "all") return params.catalog;
	const buildDefaultVisibleCatalog = async () => {
		const configuredCatalog = sortModelCatalogEntries(buildConfiguredModelCatalog({ cfg: params.cfg }));
		const hasAuth = params.providerAuthChecker ?? createProviderAuthChecker({
			cfg: params.cfg,
			workspaceDir: params.workspaceDir,
			agentId: params.agentId,
			env: params.env,
			allowPluginSyntheticAuth: params.runtimeAuthDiscovery,
			discoverExternalCliAuth: params.runtimeAuthDiscovery
		});
		const authBackedCatalog = [];
		for (const entry of params.catalog) if (await providerHasAuth(hasAuth, entry.provider)) authBackedCatalog.push(entry);
		return sortModelCatalogEntries(dedupeModelCatalogEntries([...configuredCatalog, ...authBackedCatalog]));
	};
	const policy = createModelVisibilityPolicy({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		agentId: params.agentId,
		...RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const defaultVisibleCatalog = policy.allowAny || policy.hasProviderWildcards ? await buildDefaultVisibleCatalog() : [];
	return sortModelCatalogEntries(dedupeModelCatalogEntries(policy.visibleCatalog({
		catalog: params.catalog,
		defaultVisibleCatalog,
		view: params.view
	})));
}
//#endregion
export { resolveVisibleModelCatalog as t };
