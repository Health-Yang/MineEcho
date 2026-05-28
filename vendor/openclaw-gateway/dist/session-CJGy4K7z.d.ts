import { r as GroupKeyResolution } from "./types-DQR5UfEP.js";
import { n as MsgContext } from "./templating-5iVgSDdS.js";
import { t as InboundLastRouteUpdate } from "./session.types-vPV3VUND.js";

//#region src/channels/session.d.ts
declare function recordInboundSession(params: {
  storePath: string;
  sessionKey: string;
  ctx: MsgContext;
  groupResolution?: GroupKeyResolution | null;
  createIfMissing?: boolean;
  updateLastRoute?: InboundLastRouteUpdate;
  onRecordError: (err: unknown) => void;
  trackSessionMetaTask?: (task: Promise<unknown>) => void;
}): Promise<void>;
//#endregion
export { recordInboundSession as t };