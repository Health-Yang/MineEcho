import { o as coerceSecretRef } from "../types.secrets-CtRQ27Ls.js";
import "../agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId } from "../agent-scope-config-BfxErZq2.js";
import { n as resolveConfiguredSecretInputWithFallback, r as resolveRequiredConfiguredSecretRefInputString, t as resolveConfiguredSecretInputString } from "../resolve-configured-secret-input-string-DPg7cVhm.js";
import { a as loadConfig, d as readConfigFileSnapshotForWrite, i as getRuntimeConfig, n as clearConfigCache, x as writeConfigFile } from "../io-BlARNTf3.js";
import { t as resolveAgentMaxConcurrent } from "../agent-limits-Y6_vNNMs.js";
import { i as resolveActiveTalkProviderConfig } from "../talk-Cxq1Zt-L.js";
import { i as getRuntimeConfigSnapshot, s as getRuntimeConfigSourceSnapshot, t as clearRuntimeConfigSnapshot, v as setRuntimeConfigSnapshot } from "../runtime-snapshot-D93_HOsR.js";
import { i as replaceConfigFile, n as mutateConfigFile } from "../mutate-CxD4vMnm.js";
import { t as canonicalizeMainSessionAlias } from "../main-session-896o98eb.js";
import { u as resolveStorePath } from "../paths-DZXdqwOo.js";
import { P as resolveSessionStoreEntry, t as loadSessionStore$1 } from "../store-load-Di_AfnVx.js";
import { a as readSessionUpdatedAt, b as resolveGroupSessionKey, c as saveSessionStore, d as updateSessionStoreEntry, f as upsertSessionEntry, i as patchSessionEntry, l as updateLastRoute, n as getSessionEntry, o as recordSessionMetaFromInbound, p as clearSessionStoreCacheForTest, r as listSessionEntries, u as updateSessionStore } from "../store-B5j4GKkg.js";
import { c as resolveSessionResetPolicy, i as resolveThreadFlag, n as resolveChannelResetConfig, o as evaluateSessionFreshness, r as resolveSessionResetType } from "../reset-g3NFNZsz.js";
import { n as resolveSessionKey } from "../session-key-Da-0RWbO.js";
import { a as saveCronStore, i as resolveCronStorePath, t as loadCronStore } from "../store-Dd-tb17i.js";
import { i as resolveToolsBySender, n as resolveChannelGroupRequireMention, t as resolveChannelGroupPolicy } from "../group-policy-CH35LESg.js";
import { a as warnMissingProviderGroupPolicyFallbackOnce, i as resolveOpenProviderRuntimeGroupPolicy, n as resolveAllowlistProviderRuntimeGroupPolicy, r as resolveDefaultGroupPolicy, t as GROUP_POLICY_BLOCKED_LABEL } from "../runtime-group-policy-BuTOjoo2.js";
import { t as applyModelOverrideToSessionEntry } from "../model-overrides-jsF3RKPy.js";
import { t as resolveChannelModelOverride } from "../model-overrides-Dn_YpC7-.js";
import { n as filterSupplementalContextItems, t as evaluateSupplementalContextVisibility } from "../context-visibility-C9pX_aod.js";
import { t as resolveMarkdownTableMode } from "../markdown-tables-B8E9CbD4.js";
import { n as isDangerousNameMatchingEnabled, r as resolveDangerousNameMatchingEnabled } from "../dangerous-name-matching-aeF3L3sU.js";
import { n as resolveLivePluginConfigObject, r as resolvePluginConfigObject, t as requireRuntimeConfig } from "../plugin-config-runtime-CbVZSjfC.js";
import { r as logConfigUpdated } from "../logging-MS6xnFJj.js";
import { u as updateConfig } from "../shared-DkSSKqzU.js";
import { n as resolveDefaultContextVisibility, t as resolveChannelContextVisibilityMode } from "../context-visibility-D9Mque0G.js";
import { n as resolveNativeCommandsEnabled, r as resolveNativeSkillsEnabled, t as isNativeCommandsExplicitlyDisabled } from "../commands-UVF5oBl2.js";
import { a as resolveTelegramCustomCommands, i as normalizeTelegramCommandName, t as TELEGRAM_COMMAND_NAME_PATTERN } from "../telegram-command-config-DJyxTYq_.js";
//#region src/plugin-sdk/config-runtime.ts
/**
* @deprecated Public SDK subpath has no bundled extension production imports.
* Prefer narrower config subpaths such as plugin-config-runtime,
* config-mutation, and runtime-config-snapshot.
*/
/**
* @deprecated Use getSessionEntry/listSessionEntries for reads and
* patchSessionEntry/upsertSessionEntry for writes. loadSessionStore keeps the
* legacy mutable whole-store shape and will remain a compatibility escape hatch.
*/
const loadSessionStore = loadSessionStore$1;
//#endregion
export { GROUP_POLICY_BLOCKED_LABEL, TELEGRAM_COMMAND_NAME_PATTERN, applyModelOverrideToSessionEntry, canonicalizeMainSessionAlias, clearConfigCache, clearRuntimeConfigSnapshot, clearSessionStoreCacheForTest, coerceSecretRef, evaluateSessionFreshness, evaluateSupplementalContextVisibility, filterSupplementalContextItems, getRuntimeConfig, getRuntimeConfigSnapshot, getRuntimeConfigSourceSnapshot, getSessionEntry, isDangerousNameMatchingEnabled, isNativeCommandsExplicitlyDisabled, listSessionEntries, loadConfig, loadCronStore, loadSessionStore, logConfigUpdated, mutateConfigFile, normalizeTelegramCommandName, patchSessionEntry, readConfigFileSnapshotForWrite, readSessionUpdatedAt, recordSessionMetaFromInbound, replaceConfigFile, requireRuntimeConfig, resolveActiveTalkProviderConfig, resolveAgentMaxConcurrent, resolveAllowlistProviderRuntimeGroupPolicy, resolveChannelContextVisibilityMode, resolveChannelGroupPolicy, resolveChannelGroupRequireMention, resolveChannelModelOverride, resolveChannelResetConfig, resolveConfiguredSecretInputString, resolveConfiguredSecretInputWithFallback, resolveCronStorePath, resolveDangerousNameMatchingEnabled, resolveDefaultAgentId, resolveDefaultContextVisibility, resolveDefaultGroupPolicy, resolveGroupSessionKey, resolveLivePluginConfigObject, resolveMarkdownTableMode, resolveNativeCommandsEnabled, resolveNativeSkillsEnabled, resolveOpenProviderRuntimeGroupPolicy, resolvePluginConfigObject, resolveRequiredConfiguredSecretRefInputString, resolveSessionKey, resolveSessionResetPolicy, resolveSessionResetType, resolveSessionStoreEntry, resolveStorePath, resolveTelegramCustomCommands, resolveThreadFlag, resolveToolsBySender, saveCronStore, saveSessionStore, setRuntimeConfigSnapshot, updateConfig, updateLastRoute, updateSessionStore, updateSessionStoreEntry, upsertSessionEntry, warnMissingProviderGroupPolicyFallbackOnce, writeConfigFile };
