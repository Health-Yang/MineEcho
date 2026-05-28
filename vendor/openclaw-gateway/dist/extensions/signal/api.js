import { i as resolveSignalAccount, n as listSignalAccountIds, r as resolveDefaultSignalAccountId, t as listEnabledSignalAccounts } from "../../accounts-CiPyF2G3.js";
import { a as normalizeSignalAllowRecipient, c as resolveSignalSender, d as normalizeSignalMessagingTarget, i as isSignalSenderAllowed, l as looksLikeUuid, n as formatSignalSenderDisplay, o as resolveSignalPeerId, r as formatSignalSenderId, s as resolveSignalRecipient, t as formatSignalPairingIdLine, u as looksLikeSignalTargetId } from "../../identity-DoC1DJz7.js";
import { n as markdownToSignalTextChunks, t as markdownToSignalText } from "../../format-CwzvmVCR.js";
import { n as sendReactionSignal, t as removeReactionSignal } from "../../reaction-runtime-api-YKl2Ha6c.js";
import { n as resolveSignalReactionLevel, t as signalMessageActions } from "../../message-actions-BcHNBA90.js";
import { i as resolveSignalOutboundTarget, n as createSignalPluginBase, r as signalSetupWizard, t as signalPlugin } from "../../channel-o0bF9HSO.js";
import { r as normalizeSignalAccountInput, s as signalSetupAdapter } from "../../setup-core-BQWGPMJX.js";
import { a as looksLikeArchive, n as extractSignalCliArchive, o as pickAsset, r as installSignalCli } from "../../install-signal-cli-D_XMG7jP.js";
import { t as monitorSignalProvider } from "../../monitor-BioCou4J.js";
import { n as sendReadReceiptSignal, r as sendTypingSignal, t as sendMessageSignal } from "../../send-uGMevXGS.js";
import { t as probeSignal } from "../../probe-Dnhmp0Gk.js";
//#region extensions/signal/src/channel.setup.ts
const signalSetupPlugin = { ...createSignalPluginBase({
	setupWizard: signalSetupWizard,
	setup: signalSetupAdapter
}) };
//#endregion
export { extractSignalCliArchive, formatSignalPairingIdLine, formatSignalSenderDisplay, formatSignalSenderId, installSignalCli, isSignalSenderAllowed, listEnabledSignalAccounts, listSignalAccountIds, looksLikeArchive, looksLikeSignalTargetId, looksLikeUuid, markdownToSignalText, markdownToSignalTextChunks, monitorSignalProvider, normalizeSignalAccountInput, normalizeSignalAllowRecipient, normalizeSignalMessagingTarget, pickAsset, probeSignal, removeReactionSignal, resolveDefaultSignalAccountId, resolveSignalAccount, resolveSignalOutboundTarget, resolveSignalPeerId, resolveSignalReactionLevel, resolveSignalRecipient, resolveSignalSender, sendMessageSignal, sendReactionSignal, sendReadReceiptSignal, sendTypingSignal, signalMessageActions, signalPlugin, signalSetupPlugin };
