import "./agent-scope-CudANNo3.js";
import { a as resolveAgentDir, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-mDjiWzE5.js";
import { i as resolveSessionFilePath, u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { c as saveSessionStore, d as updateSessionStoreEntry, u as updateSessionStore } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import { t as resolveThinkingDefault } from "./model-thinking-default-aCWhd_zB.js";
import "./model-selection-DF4MbMUd.js";
import { r as resolveAgentTimeoutMs } from "./task-completion-contract-D5t-_eBh.js";
import { l as ensureAgentWorkspace } from "./workspace-BxBAoMrZ.js";
import { n as resolveAgentIdentity } from "./identity-BFeakJ9C.js";
import { t as runEmbeddedPiAgent } from "./pi-embedded-DHh5YEOO.js";
//#region src/extensionAPI.ts
if (process.env.VITEST !== "true" && process.env.OPENCLAW_SUPPRESS_EXTENSION_API_WARNING !== "1") process.emitWarning("openclaw/extension-api is deprecated. Migrate to api.runtime.agent.* or focused openclaw/plugin-sdk/<subpath> imports. See https://docs.openclaw.ai/plugins/sdk-migration", {
	code: "OPENCLAW_EXTENSION_API_DEPRECATED",
	detail: "This compatibility bridge is temporary. Bundled plugins should use the injected plugin runtime instead of importing host-side agent helpers directly. Migration guide: https://docs.openclaw.ai/plugins/sdk-migration"
});
//#endregion
export { DEFAULT_MODEL, DEFAULT_PROVIDER, ensureAgentWorkspace, loadSessionStore, resolveAgentDir, resolveAgentIdentity, resolveAgentTimeoutMs, resolveAgentWorkspaceDir, resolveSessionFilePath, resolveStorePath, resolveThinkingDefault, runEmbeddedPiAgent, saveSessionStore, updateSessionStore, updateSessionStoreEntry };
