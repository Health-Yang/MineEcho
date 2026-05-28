//#region src/plugins/current-plugin-metadata-state.ts
let currentPluginMetadataSnapshot;
let currentPluginMetadataSnapshotConfigFingerprint;
let currentPluginMetadataSnapshotCompatiblePolicyHashes;
let currentPluginMetadataSnapshotCompatibleConfigFingerprints;
function setCurrentPluginMetadataSnapshotState(snapshot, configFingerprint, compatiblePolicyHashes, compatibleConfigFingerprints) {
	currentPluginMetadataSnapshot = snapshot;
	currentPluginMetadataSnapshotConfigFingerprint = snapshot ? configFingerprint : void 0;
	currentPluginMetadataSnapshotCompatiblePolicyHashes = snapshot ? compatiblePolicyHashes : void 0;
	currentPluginMetadataSnapshotCompatibleConfigFingerprints = snapshot ? compatibleConfigFingerprints : void 0;
}
function clearCurrentPluginMetadataSnapshotState() {
	currentPluginMetadataSnapshot = void 0;
	currentPluginMetadataSnapshotConfigFingerprint = void 0;
	currentPluginMetadataSnapshotCompatiblePolicyHashes = void 0;
	currentPluginMetadataSnapshotCompatibleConfigFingerprints = void 0;
}
function getCurrentPluginMetadataSnapshotState() {
	return {
		snapshot: currentPluginMetadataSnapshot,
		configFingerprint: currentPluginMetadataSnapshotConfigFingerprint,
		compatiblePolicyHashes: currentPluginMetadataSnapshotCompatiblePolicyHashes,
		compatibleConfigFingerprints: currentPluginMetadataSnapshotCompatibleConfigFingerprints
	};
}
//#endregion
//#region src/plugins/plugin-metadata-lifecycle.ts
const pluginMetadataProcessMemoClears = /* @__PURE__ */ new Set();
function registerPluginMetadataProcessMemoLifecycleClear(clearProcessMemo) {
	pluginMetadataProcessMemoClears.add(clearProcessMemo);
}
function clearPluginMetadataLifecycleCaches() {
	clearCurrentPluginMetadataSnapshotState();
	for (const clearProcessMemo of pluginMetadataProcessMemoClears) clearProcessMemo();
}
//#endregion
export { setCurrentPluginMetadataSnapshotState as a, getCurrentPluginMetadataSnapshotState as i, registerPluginMetadataProcessMemoLifecycleClear as n, clearCurrentPluginMetadataSnapshotState as r, clearPluginMetadataLifecycleCaches as t };
