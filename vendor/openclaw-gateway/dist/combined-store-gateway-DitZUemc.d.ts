import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { s as SessionEntry } from "./types-DQR5UfEP.js";

//#region src/config/sessions/combined-store-gateway.d.ts
declare function loadCombinedSessionStoreForGateway(cfg: OpenClawConfig, opts?: {
  agentId?: string;
  configuredAgentsOnly?: boolean;
}): {
  storePath: string;
  store: Record<string, SessionEntry>;
};
//#endregion
export { loadCombinedSessionStoreForGateway as t };