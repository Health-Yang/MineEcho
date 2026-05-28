//#region extensions/codex/src/app-server/client-factory.ts
const defaultCodexAppServerClientFactory = (startOptions, authProfileId, agentDir, config) => import("./shared-client-CbrZvr6T.js").then(({ getSharedCodexAppServerClient }) => getSharedCodexAppServerClient({
	startOptions,
	authProfileId,
	agentDir,
	config
}));
const defaultLeasedCodexAppServerClientFactory = (startOptions, authProfileId, agentDir, config) => import("./shared-client-CbrZvr6T.js").then(({ getLeasedSharedCodexAppServerClient }) => getLeasedSharedCodexAppServerClient({
	startOptions,
	authProfileId,
	agentDir,
	config
}));
//#endregion
export { defaultLeasedCodexAppServerClientFactory as n, defaultCodexAppServerClientFactory as t };
