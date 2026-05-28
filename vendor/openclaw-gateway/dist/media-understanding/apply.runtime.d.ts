import { i as OpenClawConfig } from "../types.openclaw-AW0IHsvN.js";
import { d as MediaUnderstandingOutput, f as MediaUnderstandingProvider, u as MediaUnderstandingDecision } from "../types-nHJ6ji79.js";
import { n as MsgContext } from "../templating-5iVgSDdS.js";
import { t as ActiveMediaModel } from "../active-model.types-DCiq_ik4.js";

//#region src/media-understanding/apply.d.ts
type ApplyMediaUnderstandingResult = {
  outputs: MediaUnderstandingOutput[];
  decisions: MediaUnderstandingDecision[];
  appliedImage: boolean;
  appliedAudio: boolean;
  appliedVideo: boolean;
  appliedFile: boolean;
};
declare function applyMediaUnderstanding(params: {
  ctx: MsgContext;
  cfg: OpenClawConfig;
  agentId?: string;
  agentDir?: string;
  workspaceDir?: string;
  providers?: Record<string, MediaUnderstandingProvider>;
  activeModel?: ActiveMediaModel;
}): Promise<ApplyMediaUnderstandingResult>;
//#endregion
export { applyMediaUnderstanding };