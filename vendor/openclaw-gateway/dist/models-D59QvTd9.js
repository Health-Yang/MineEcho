import "./agent-scope-CudANNo3.js";
import { n as resolveDefaultAgentWorkspaceDir } from "./workspace-default-BYXB4T7J.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { r as DEFAULT_PROVIDER } from "./defaults-mDjiWzE5.js";
import { Ii as ErrorCodes, Li as errorShape, at as validateModelsListParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import "./workspace-BxBAoMrZ.js";
import { t as loadModelCatalogForBrowse } from "./model-catalog-browse-DhBWH7h1.js";
import { t as resolveVisibleModelCatalog } from "./model-catalog-visibility-Dc4irYT4.js";
//#region src/gateway/server-methods/models.ts
let loggedSlowModelsListCatalog = false;
function resolveModelsListView(params) {
	return typeof params.view === "string" ? params.view : "default";
}
function omitRuntimeModelParams(entry) {
	const { params: _params, ...rest } = entry;
	return rest;
}
function omitRuntimeModelParamsFromCatalog(catalog) {
	return catalog.map(omitRuntimeModelParams);
}
const modelsHandlers = { "models.list": async ({ params, respond, context }) => {
	if (!validateModelsListParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid models.list params: ${formatValidationErrors(validateModelsListParams.errors)}`));
		return;
	}
	try {
		const cfg = context.getRuntimeConfig();
		const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)) ?? resolveDefaultAgentWorkspaceDir();
		const view = resolveModelsListView(params);
		const catalog = await loadModelCatalogForBrowse({
			cfg,
			view,
			loadCatalog: context.loadGatewayModelCatalog,
			onTimeout: (timeoutMs) => {
				if (loggedSlowModelsListCatalog) return;
				loggedSlowModelsListCatalog = true;
				context.logGateway.debug(`models.list continuing without model catalog after ${timeoutMs}ms`);
			}
		});
		if (view === "all") {
			respond(true, { models: omitRuntimeModelParamsFromCatalog(catalog) }, void 0);
			return;
		}
		respond(true, { models: omitRuntimeModelParamsFromCatalog(await resolveVisibleModelCatalog({
			cfg,
			catalog,
			defaultProvider: DEFAULT_PROVIDER,
			workspaceDir,
			view,
			runtimeAuthDiscovery: false
		})) }, void 0);
	} catch (err) {
		respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
	}
} };
//#endregion
export { modelsHandlers };
