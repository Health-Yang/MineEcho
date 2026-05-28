//#region extensions/pixverse/constants.ts
const PIXVERSE_PROVIDER_ID = "pixverse";
const PIXVERSE_BASE_URL_BY_REGION = {
	international: "https://app-api.pixverse.ai/openapi/v2",
	cn: "https://app-api.pixverseai.cn/openapi/v2"
};
const DEFAULT_PIXVERSE_REGION = "international";
const DEFAULT_PIXVERSE_MODEL_ID = "v6";
const PIXVERSE_DEFAULT_VIDEO_MODEL_REF = `${PIXVERSE_PROVIDER_ID}/v6`;
//#endregion
export { PIXVERSE_PROVIDER_ID as a, PIXVERSE_DEFAULT_VIDEO_MODEL_REF as i, DEFAULT_PIXVERSE_REGION as n, PIXVERSE_BASE_URL_BY_REGION as r, DEFAULT_PIXVERSE_MODEL_ID as t };
