import { Un as ProviderWrapStreamFnContext } from "../../types-qwKXExVW.js";
//#region extensions/kilocode/stream.d.ts
type ThinkLevel = NonNullable<ProviderWrapStreamFnContext["thinkingLevel"]>;
type ProviderStreamFn = NonNullable<ProviderWrapStreamFnContext["streamFn"]>;
declare function createKilocodeStreamWrapper(baseStreamFn: ProviderWrapStreamFnContext["streamFn"], thinkingLevel?: ThinkLevel): ProviderWrapStreamFnContext["streamFn"];
declare function wrapKilocodeProviderStream(ctx: ProviderWrapStreamFnContext): ProviderStreamFn | undefined;
//#endregion
export { createKilocodeStreamWrapper, wrapKilocodeProviderStream };