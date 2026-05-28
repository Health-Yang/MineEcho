import { r as normalizeOptionalAccountId } from "./account-id-B0YIFDpA.js";
import { a as resolveMatrixDefaultOrOnlyAccountId } from "./account-selection-DZUtZWk6.js";
import { t as resolveMatrixConfigFieldPath } from "./config-paths-Bh0Pnekg.js";
//#region extensions/matrix/src/matrix/encryption-guidance.ts
function resolveMatrixEncryptionConfigPath(cfg, accountId) {
	return resolveMatrixConfigFieldPath(cfg, normalizeOptionalAccountId(accountId) ?? resolveMatrixDefaultOrOnlyAccountId(cfg), "encryption");
}
function formatMatrixEncryptionUnavailableError(cfg, accountId) {
	return `Matrix encryption is not available (enable ${resolveMatrixEncryptionConfigPath(cfg, accountId)}=true)`;
}
function formatMatrixEncryptedEventDisabledWarning(cfg, accountId) {
	return `matrix: encrypted event received without encryption enabled; set ${resolveMatrixEncryptionConfigPath(cfg, accountId)}=true and verify the device to decrypt`;
}
//#endregion
export { formatMatrixEncryptionUnavailableError as n, formatMatrixEncryptedEventDisabledWarning as t };
