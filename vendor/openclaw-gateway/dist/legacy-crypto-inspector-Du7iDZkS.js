import { t as ensureMatrixCryptoRuntime } from "./deps-DFc2XKUQ.js";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
//#region extensions/matrix/src/matrix/legacy-crypto-inspector.ts
const MATRIX_CRYPTO_STORE_SQLITE = 0;
function resolveLegacyMachineStorePath(params) {
	const hashedDir = path.join(params.cryptoRootDir, crypto.createHash("sha256").update(params.deviceId).digest("hex"));
	if (fs.existsSync(path.join(hashedDir, "matrix-sdk-crypto.sqlite3"))) return hashedDir;
	if (fs.existsSync(path.join(params.cryptoRootDir, "matrix-sdk-crypto.sqlite3"))) return params.cryptoRootDir;
	const match = fs.readdirSync(params.cryptoRootDir, { withFileTypes: true }).find((entry) => entry.isDirectory() && fs.existsSync(path.join(params.cryptoRootDir, entry.name, "matrix-sdk-crypto.sqlite3")));
	return match ? path.join(params.cryptoRootDir, match.name) : null;
}
async function inspectLegacyMatrixCryptoStore(params) {
	const machineStorePath = resolveLegacyMachineStorePath(params);
	if (!machineStorePath) throw new Error(`Matrix legacy crypto store not found for device ${params.deviceId}`);
	const requireFn = createRequire(import.meta.url);
	await ensureMatrixCryptoRuntime({
		requireFn,
		resolveFn: requireFn.resolve.bind(requireFn),
		log: params.log
	});
	const { DeviceId, OlmMachine, UserId } = requireFn("@matrix-org/matrix-sdk-crypto-nodejs");
	const machine = await OlmMachine.initialize(new UserId(params.userId), new DeviceId(params.deviceId), machineStorePath, "", MATRIX_CRYPTO_STORE_SQLITE);
	try {
		const [backupKeys, roomKeyCounts] = await Promise.all([machine.getBackupKeys(), machine.roomKeyCounts()]);
		return {
			deviceId: params.deviceId,
			roomKeyCounts: roomKeyCounts ? {
				total: typeof roomKeyCounts.total === "number" ? roomKeyCounts.total : 0,
				backedUp: typeof roomKeyCounts.backedUp === "number" ? roomKeyCounts.backedUp : 0
			} : null,
			backupVersion: typeof backupKeys?.backupVersion === "string" && backupKeys.backupVersion.trim() ? backupKeys.backupVersion : null,
			decryptionKeyBase64: typeof backupKeys?.decryptionKeyBase64 === "string" && backupKeys.decryptionKeyBase64.trim() ? backupKeys.decryptionKeyBase64 : null
		};
	} finally {
		machine.close();
	}
}
//#endregion
export { inspectLegacyMatrixCryptoStore };
