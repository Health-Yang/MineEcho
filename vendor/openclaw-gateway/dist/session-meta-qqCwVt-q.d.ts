import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { a as SessionAcpMeta, s as SessionEntry } from "./types-DQR5UfEP.js";

//#region src/acp/runtime/session-meta.d.ts
type AcpSessionStoreEntry = {
  cfg: OpenClawConfig;
  storePath: string;
  sessionKey: string;
  storeSessionKey: string;
  entry?: SessionEntry;
  acp?: SessionAcpMeta;
  storeReadFailed?: boolean;
};
declare function readAcpSessionEntry(params: {
  sessionKey: string;
  cfg?: OpenClawConfig;
  clone?: boolean;
}): AcpSessionStoreEntry | null;
declare function listAcpSessionEntries(params: {
  cfg?: OpenClawConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<AcpSessionStoreEntry[]>;
declare function upsertAcpSessionMeta(params: {
  sessionKey: string;
  cfg?: OpenClawConfig;
  skipMaintenance?: boolean;
  takeCacheOwnership?: boolean;
  mutate: (current: SessionAcpMeta | undefined, entry: SessionEntry | undefined) => SessionAcpMeta | null | undefined;
}): Promise<SessionEntry | null>;
//#endregion
export { upsertAcpSessionMeta as i, listAcpSessionEntries as n, readAcpSessionEntry as r, AcpSessionStoreEntry as t };