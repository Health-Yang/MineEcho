import type { ProviderAuthEvidence, ProviderAuthLookupMaps, ProviderEnvVarLookupParams } from "../secrets/provider-env-vars.js";
export declare function resolveProviderEnvApiKeyCandidates(params?: ProviderEnvVarLookupParams): Record<string, readonly string[]>;
export declare function resolveProviderEnvAuthEvidence(params?: ProviderEnvVarLookupParams): Record<string, readonly ProviderAuthEvidence[]>;
export declare function resolveProviderEnvAuthLookupMaps(params?: ProviderEnvVarLookupParams): ProviderAuthLookupMaps;
export declare function listProviderEnvAuthLookupKeys(params: {
    envCandidateMap: Readonly<Record<string, readonly string[]>>;
    authEvidenceMap: Readonly<Record<string, readonly ProviderAuthEvidence[]>>;
}): string[];
export declare function resolveProviderEnvAuthLookupKeys(params?: ProviderEnvVarLookupParams): string[];
export declare function listKnownProviderEnvApiKeyNames(): string[];
