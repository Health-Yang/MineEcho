//#region extensions/device-pair/pair-command-auth.d.ts
type PairingCommandAuthParams = {
  channel: string;
  gatewayClientScopes?: readonly string[] | null;
  senderIsOwner?: boolean;
};
type PairingCommandAuthState = {
  isInternalGatewayCaller: boolean;
  isMissingPairingPrivilege: boolean;
  isMissingSetupHandoffPrivilege: boolean;
  approvalCallerScopes?: readonly string[];
};
declare function resolvePairingCommandAuthState(params: PairingCommandAuthParams): PairingCommandAuthState;
declare function buildMissingPairingScopeReply(): {
  text: string;
};
declare function buildMissingSetupHandoffScopeReply(): {
  text: string;
};
//#endregion
export { buildMissingPairingScopeReply, buildMissingSetupHandoffScopeReply, resolvePairingCommandAuthState };