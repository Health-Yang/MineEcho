import { i as OpenClawConfig } from "../../types.openclaw-AW0IHsvN.js";
import { n as normalizeAccountId, t as DEFAULT_ACCOUNT_ID } from "../../account-id-Dh6XMgGH.js";
import { g as chunkText } from "../../outbound.types-BgikmK_M.js";
import { y as ChannelMessageActionAdapter } from "../../types.core-CmhUJuY-.js";
import { C as OpenClawPluginApi } from "../../types-qwKXExVW.js";
import { l as normalizeE164 } from "../../utils-DSrjARXN.js";
import { n as ChannelPlugin } from "../../types.public-DkG_i7qb.js";
import { n as PluginRuntime } from "../../types-DTbj6Ogc.js";
import { r as emptyPluginConfigSchema } from "../../config-schema-C65xQpVG.js";
import { r as buildChannelConfigSchema } from "../../config-schema-Dx48Ud8L.js";
import { s as migrateBaseNameToDefaultAccount, t as applyAccountNameToChannelSection } from "../../setup-helpers-Cvan7IPE.js";
import { n as deleteAccountFromConfigSection, r as setAccountEnabledInConfigSection } from "../../config-helpers-BvGGP3hQ.js";
import { n as formatPairingApproveHint } from "../../helpers-DfDeo964.js";
import { d as getChatChannelMeta } from "../../core-BYRv2JnW.js";
import { t as formatCliCommand } from "../../command-format-d2gWtZzp.js";
import { D as resolveChannelMediaMaxBytes } from "../../media-runtime-BuBDh604.js";
import { t as detectBinary } from "../../detect-binary-DqlFLJ1Y.js";
import { t as formatDocsLink } from "../../links-Dz13kJx9.js";
import { n as resolveAllowlistProviderRuntimeGroupPolicy, r as resolveDefaultGroupPolicy } from "../../runtime-group-policy-DyPpFmQN.js";
import { t as PAIRING_APPROVED_MESSAGE } from "../../pairing-message-AZcwFUZz.js";
import { c as collectStatusIssuesFromLastError, d as createDefaultChannelRuntimeState, n as buildBaseChannelStatusSummary, t as buildBaseAccountStatusSnapshot } from "../../status-helpers-aAbrgQFj.js";
import { o as SignalConfigSchema } from "../../bundled-channel-config-schema-Qm5Cu-BU.js";
import { a as resolveSignalAccount, c as probeSignal, i as resolveDefaultSignalAccountId, n as listEnabledSignalAccounts, o as SignalAccountConfig, r as listSignalAccountIds, t as ResolvedSignalAccount } from "../../accounts-qxwSC-n-.js";
import { a as sendMessageSignal, f as monitorSignalProvider, p as signalMessageActions, u as resolveSignalReactionLevel } from "../../send-DL27ww25.js";
import { c as installSignalCli, n as normalizeSignalMessagingTarget, t as looksLikeSignalTargetId } from "../../normalize-BtYM5FLJ.js";
import { i as sendReactionSignal, r as removeReactionSignal } from "../../send-reactions-Dan_4YYz.js";

//#region extensions/signal/src/runtime.d.ts
declare const setSignalRuntime: (next: PluginRuntime) => void, getSignalRuntime: () => PluginRuntime, getOptionalSignalRuntime: () => PluginRuntime | null, clearSignalRuntime: () => void;
//#endregion
export { type ChannelMessageActionAdapter, type ChannelPlugin, DEFAULT_ACCOUNT_ID, type OpenClawConfig, type OpenClawPluginApi, PAIRING_APPROVED_MESSAGE, type PluginRuntime, type ResolvedSignalAccount, type SignalAccountConfig, SignalConfigSchema, applyAccountNameToChannelSection, buildBaseAccountStatusSnapshot, buildBaseChannelStatusSummary, buildChannelConfigSchema, chunkText, collectStatusIssuesFromLastError, createDefaultChannelRuntimeState, deleteAccountFromConfigSection, detectBinary, emptyPluginConfigSchema, formatCliCommand, formatDocsLink, formatPairingApproveHint, getChatChannelMeta, installSignalCli, listEnabledSignalAccounts, listSignalAccountIds, looksLikeSignalTargetId, migrateBaseNameToDefaultAccount, monitorSignalProvider, normalizeAccountId, normalizeE164, normalizeSignalMessagingTarget, probeSignal, removeReactionSignal, resolveAllowlistProviderRuntimeGroupPolicy, resolveChannelMediaMaxBytes, resolveDefaultGroupPolicy, resolveDefaultSignalAccountId, resolveSignalAccount, resolveSignalReactionLevel, sendMessageSignal, sendReactionSignal, setAccountEnabledInConfigSection, setSignalRuntime, signalMessageActions };