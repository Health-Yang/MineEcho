import { t as DEFAULT_ACCOUNT_ID } from "../../account-id-B0YIFDpA.js";
import { r as buildChannelConfigSchema } from "../../config-schema-CUPZ59ck.js";
import { p as formatTrimmedAllowFromEntries } from "../../channel-config-helpers-h3merl20.js";
import { c as getChatChannelMeta } from "../../core-CcqJUBno.js";
import { a as resolveChannelMediaMaxBytes } from "../../media-runtime-BndVydhQ.js";
import { t as chunkTextForOutbound } from "../../text-chunking-CWOBXxG4.js";
import { t as PAIRING_APPROVED_MESSAGE } from "../../pairing-message-C9w9gv4K.js";
import { c as collectStatusIssuesFromLastError, r as buildComputedAccountStatusSnapshot } from "../../status-helpers-BrYXq8bp.js";
import "../../channel-status-BX1a89bS.js";
import { i as IMessageConfigSchema } from "../../bundled-channel-config-schema-NfvDMYl5.js";
import { a as resolveIMessageAccount } from "../../accounts-BET9ibA4.js";
import { t as probeIMessage } from "../../probe-CrhccjPS.js";
import { n as resolveIMessageGroupToolPolicy, r as imessageMessageActions, t as resolveIMessageGroupRequireMention } from "../../group-policy-CjFAiqSF.js";
import { f as setIMessageRuntime, n as normalizeIMessageMessagingTarget, t as looksLikeIMessageTargetId } from "../../normalize-C6-Ial3a.js";
import "../../sanitize-outbound-BAErCM6J.js";
import "../../config-api-DMYKT0xX.js";
import { t as monitorIMessageProvider } from "../../monitor-BpIo4Ku8.js";
import { t as sendMessageIMessage } from "../../send-KkLSSs9Y.js";
//#region extensions/imessage/src/config-accessors.ts
function resolveIMessageConfigAllowFrom(params) {
	return (resolveIMessageAccount(params).config.allowFrom ?? []).map((entry) => String(entry));
}
function resolveIMessageConfigDefaultTo(params) {
	const defaultTo = resolveIMessageAccount(params).config.defaultTo;
	if (defaultTo == null) return;
	return defaultTo.trim() || void 0;
}
//#endregion
export { DEFAULT_ACCOUNT_ID, IMessageConfigSchema, PAIRING_APPROVED_MESSAGE, buildChannelConfigSchema, buildComputedAccountStatusSnapshot, chunkTextForOutbound, collectStatusIssuesFromLastError, formatTrimmedAllowFromEntries, getChatChannelMeta, imessageMessageActions, looksLikeIMessageTargetId, monitorIMessageProvider, normalizeIMessageMessagingTarget, probeIMessage, resolveChannelMediaMaxBytes, resolveIMessageConfigAllowFrom, resolveIMessageConfigDefaultTo, resolveIMessageGroupRequireMention, resolveIMessageGroupToolPolicy, sendMessageIMessage, setIMessageRuntime };
