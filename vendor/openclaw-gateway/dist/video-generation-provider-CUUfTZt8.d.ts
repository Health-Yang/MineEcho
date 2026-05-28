import { o as fetchWithSsrFGuard } from "./fetch-guard-Cen7j0rw.js";
import { o as VideoGenerationProvider } from "./video-generation-W5tVE9w5.js";
//#region extensions/fal/video-generation-provider.d.ts
declare function setFalVideoFetchGuardForTesting(impl: typeof fetchWithSsrFGuard | null): void;
declare function buildFalVideoGenerationProvider(): VideoGenerationProvider;
//#endregion
export { setFalVideoFetchGuardForTesting as n, buildFalVideoGenerationProvider as t };