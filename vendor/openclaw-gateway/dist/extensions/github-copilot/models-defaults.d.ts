import { s as ModelDefinitionConfig } from "../../types.models-CH300rpt.js";
//#region extensions/github-copilot/models-defaults.d.ts
declare function getDefaultCopilotModelIds(): string[];
declare function buildCopilotModelDefinition(modelId: string): ModelDefinitionConfig;
//#endregion
export { buildCopilotModelDefinition, getDefaultCopilotModelIds };