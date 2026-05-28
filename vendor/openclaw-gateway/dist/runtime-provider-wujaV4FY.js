import { t as resolveMemoryBackendConfig } from "./backend-config-DEWzVa4I.js";
import "./memory-core-host-runtime-files-CI8RsVB1.js";
import { n as closeMemorySearchManager, r as getMemorySearchManager, t as closeAllMemorySearchManagers } from "./memory-Df6ikZ4n.js";
//#region extensions/memory-core/src/runtime-provider.ts
const memoryRuntime = {
	async getMemorySearchManager(params) {
		const { manager, error } = await getMemorySearchManager(params);
		return {
			manager,
			error
		};
	},
	resolveMemoryBackendConfig(params) {
		return resolveMemoryBackendConfig(params);
	},
	async closeAllMemorySearchManagers() {
		await closeAllMemorySearchManagers();
	},
	async closeMemorySearchManager(params) {
		await closeMemorySearchManager(params);
	}
};
//#endregion
export { memoryRuntime as t };
