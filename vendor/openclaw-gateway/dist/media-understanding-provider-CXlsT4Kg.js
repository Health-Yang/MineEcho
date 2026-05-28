import { r as describeImagesWithModel, t as describeImageWithModel } from "./image-runtime-DJQhxkgx.js";
import "./media-understanding-Dy8I26Ln.js";
//#region extensions/anthropic/media-understanding-provider.ts
const anthropicMediaUnderstandingProvider = {
	id: "anthropic",
	capabilities: ["image"],
	defaultModels: { image: "claude-opus-4-7" },
	autoPriority: { image: 20 },
	nativeDocumentInputs: ["pdf"],
	describeImage: describeImageWithModel,
	describeImages: describeImagesWithModel
};
//#endregion
export { anthropicMediaUnderstandingProvider as t };
