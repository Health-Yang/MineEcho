import { a as normalizeTelegramCommandName, i as normalizeTelegramCommandDescription, o as resolveTelegramCustomCommands, t as TELEGRAM_COMMAND_NAME_PATTERN } from "../../command-config-B5uSKuEF.js";
import { o as parseTelegramTopicConversation } from "../../runtime-api-Aue7EAWZ.js";
import { r as resetTelegramThreadBindingsForTests, t as createTelegramThreadBindingManager } from "../../thread-bindings-9c_qeGD3.js";
import { f as mergeTelegramAccountConfig } from "../../accounts-tn2SOIBD.js";
import { i as buildTelegramModelsProviderChannelData, n as TelegramInteractiveHandlerRegistration, r as buildCommandsPaginationKeyboard, t as TelegramInteractiveHandlerContext } from "../../interactive-dispatch-D2q28k0H.js";
import { n as listTelegramDirectoryPeersFromConfig, t as listTelegramDirectoryGroupsFromConfig } from "../../directory-config-C7-EKP7G.js";
import { t as collectTelegramSecurityAuditFindings } from "../../security-audit-DfqA5bIH.js";
import { n as normalizeCompatibilityConfig, t as legacyConfigRules } from "../../doctor-contract-B_MoM20I.js";
import { n as collectRuntimeConfigAssignments, r as secretTargetRegistryEntries } from "../../secret-contract-C5sEZ6SZ.js";

//#region extensions/telegram/src/setup-contract.d.ts
declare const singleAccountKeysToMove: string[];
//#endregion
export { TELEGRAM_COMMAND_NAME_PATTERN, type TelegramInteractiveHandlerContext, type TelegramInteractiveHandlerRegistration, buildCommandsPaginationKeyboard, buildTelegramModelsProviderChannelData, collectRuntimeConfigAssignments, collectTelegramSecurityAuditFindings, createTelegramThreadBindingManager, legacyConfigRules, listTelegramDirectoryGroupsFromConfig, listTelegramDirectoryPeersFromConfig, mergeTelegramAccountConfig, normalizeCompatibilityConfig, normalizeTelegramCommandDescription, normalizeTelegramCommandName, parseTelegramTopicConversation, resetTelegramThreadBindingsForTests, resolveTelegramCustomCommands, secretTargetRegistryEntries, singleAccountKeysToMove };