//#region src/agents/model-tool-support.ts
function supportsModelTools(model) {
	return (model.compat && typeof model.compat === "object" ? model.compat : void 0)?.supportsTools !== false;
}
//#endregion
export { supportsModelTools as t };
