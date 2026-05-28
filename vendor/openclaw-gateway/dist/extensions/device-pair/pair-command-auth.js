//#region extensions/device-pair/pair-command-auth.ts
const COMMAND_OWNER_PAIRING_SCOPES = ["operator.pairing"];
const PAIRING_SCOPE = "operator.pairing";
const ADMIN_SCOPE = "operator.admin";
const TALK_SECRETS_SCOPE = "operator.talk.secrets";
function isInternalGatewayPairingCaller(params) {
	return params.channel === "webchat" || Array.isArray(params.gatewayClientScopes);
}
function hasPairingPrivilege(scopes) {
	return scopes.includes(PAIRING_SCOPE) || scopes.includes(ADMIN_SCOPE);
}
function hasSetupHandoffPrivilege(scopes) {
	return scopes.includes(TALK_SECRETS_SCOPE) || scopes.includes(ADMIN_SCOPE);
}
function resolvePairingCommandAuthState(params) {
	const isInternalGatewayCaller = isInternalGatewayPairingCaller(params);
	if (isInternalGatewayCaller) {
		const approvalCallerScopes = Array.isArray(params.gatewayClientScopes) ? params.gatewayClientScopes : [];
		return {
			isInternalGatewayCaller,
			isMissingPairingPrivilege: !hasPairingPrivilege(approvalCallerScopes),
			isMissingSetupHandoffPrivilege: !hasSetupHandoffPrivilege(approvalCallerScopes),
			approvalCallerScopes
		};
	}
	if (params.senderIsOwner === true) return {
		isInternalGatewayCaller,
		isMissingPairingPrivilege: false,
		isMissingSetupHandoffPrivilege: false,
		approvalCallerScopes: COMMAND_OWNER_PAIRING_SCOPES
	};
	return {
		isInternalGatewayCaller,
		isMissingPairingPrivilege: true,
		isMissingSetupHandoffPrivilege: true,
		approvalCallerScopes: void 0
	};
}
function buildMissingPairingScopeReply() {
	return { text: "⚠️ This command requires operator.pairing." };
}
function buildMissingSetupHandoffScopeReply() {
	return { text: "⚠️ Setup code handoff includes Talk secrets and requires operator.talk.secrets." };
}
//#endregion
export { buildMissingPairingScopeReply, buildMissingSetupHandoffScopeReply, resolvePairingCommandAuthState };
