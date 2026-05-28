import { i as OpenClawConfig } from "../types.openclaw-AW0IHsvN.js";
import { n as MsgContext } from "../templating-5iVgSDdS.js";

//#region src/link-understanding/apply.d.ts
type ApplyLinkUnderstandingResult = {
  outputs: string[];
  urls: string[];
};
declare function applyLinkUnderstanding(params: {
  ctx: MsgContext;
  cfg: OpenClawConfig;
}): Promise<ApplyLinkUnderstandingResult>;
//#endregion
export { applyLinkUnderstanding };