//#region extensions/pixverse/constants.d.ts
declare const PIXVERSE_PROVIDER_ID = "pixverse";
declare const PIXVERSE_BASE_URL_BY_REGION: {
  readonly international: "https://app-api.pixverse.ai/openapi/v2";
  readonly cn: "https://app-api.pixverseai.cn/openapi/v2";
};
type PixVerseApiRegion = keyof typeof PIXVERSE_BASE_URL_BY_REGION;
declare const DEFAULT_PIXVERSE_REGION = "international";
declare const DEFAULT_PIXVERSE_MODEL_ID = "v6";
declare const PIXVERSE_DEFAULT_VIDEO_MODEL_REF = "pixverse/v6";
//#endregion
export { PIXVERSE_PROVIDER_ID as a, PIXVERSE_DEFAULT_VIDEO_MODEL_REF as i, DEFAULT_PIXVERSE_REGION as n, PixVerseApiRegion as o, PIXVERSE_BASE_URL_BY_REGION as r, DEFAULT_PIXVERSE_MODEL_ID as t };