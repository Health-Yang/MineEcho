import { n as findNormalizedProviderValue, r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { r as resolveProviderIdForAuth } from "./provider-auth-aliases-5VCl4fwR.js";
import "./constants-0i5hheAU.js";
import { l as resolveCliRuntimeExecutionProvider } from "./model-runtime-aliases-DXHvPXsy.js";
//#region src/agents/auth-profiles/external-cli-auth-selection.ts
const CLAUDE_CLI_PROVIDER_ID = "claude-cli";
function resolveExternalCliAuthOverlayScopeFromSelection(params) {
	const authScope = resolveExternalCliAuthScopeFromAuthSelection({
		provider: params.provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		store: params.store,
		userLockedAuthProfileId: params.userLockedAuthProfileId
	});
	const selectedRuntimeProvider = resolveCliRuntimeExecutionProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentId: params.agentId,
		modelId: params.modelId,
		authProfileId: params.userLockedAuthProfileId
	}) || (params.provider === CLAUDE_CLI_PROVIDER_ID ? CLAUDE_CLI_PROVIDER_ID : void 0);
	const selectedProvider = authScope.selectedProviderId ?? (selectedRuntimeProvider === CLAUDE_CLI_PROVIDER_ID ? CLAUDE_CLI_PROVIDER_ID : void 0);
	const providerIds = [...new Set([...authScope.providerIds, ...selectedRuntimeProvider === CLAUDE_CLI_PROVIDER_ID ? [CLAUDE_CLI_PROVIDER_ID] : []])];
	return {
		...providerIds.length > 0 ? { providerIds } : {},
		ignoreAutoPreferredProfile: !params.userLockedAuthProfileId && selectedProvider === CLAUDE_CLI_PROVIDER_ID
	};
}
function resolveExternalCliAuthScopeFromAuthSelection(params) {
	if (params.userLockedAuthProfileId) {
		const providerId = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId: params.userLockedAuthProfileId
		})?.externalCliProviderId;
		return {
			providerIds: providerId ? [providerId] : [],
			...providerId ? { selectedProviderId: providerId } : {}
		};
	}
	const providerIds = [];
	let sawCompatibleOrderedProfile = false;
	let selectedProviderId;
	for (const profileId of resolveConfiguredAuthProfileOrder(params)) {
		const resolved = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId
		});
		if (!resolved.compatible) continue;
		if (!sawCompatibleOrderedProfile) {
			selectedProviderId = resolved.externalCliProviderId;
			sawCompatibleOrderedProfile = true;
		}
		if (resolved.externalCliProviderId) providerIds.push(resolved.externalCliProviderId);
	}
	if (sawCompatibleOrderedProfile) return {
		providerIds: [...new Set(providerIds)],
		...selectedProviderId ? { selectedProviderId } : {}
	};
	let compatibleProfileCount = 0;
	const profileIds = [...new Set([...Object.keys(params.cfg?.auth?.profiles ?? {}), ...Object.keys(params.store?.profiles ?? {})])];
	for (const profileId of profileIds) {
		const resolved = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId
		});
		if (!resolved.compatible) continue;
		compatibleProfileCount += 1;
		if (resolved.externalCliProviderId) providerIds.push(resolved.externalCliProviderId);
	}
	const uniqueProviderIds = [...new Set(providerIds)];
	return {
		providerIds: uniqueProviderIds,
		...compatibleProfileCount === 1 && uniqueProviderIds[0] ? { selectedProviderId: uniqueProviderIds[0] } : {}
	};
}
function resolveConfiguredAuthProfileOrder(params) {
	const providerAuthKey = resolveProviderIdForAuth(params.provider, {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	});
	const orderedProfileIds = resolveAuthProfileOrderEntries({
		order: params.store?.order,
		provider: params.provider,
		providerAuthKey
	}) ?? resolveAuthProfileOrderEntries({
		order: params.cfg?.auth?.order,
		provider: params.provider,
		providerAuthKey
	}) ?? [];
	return [...new Set(orderedProfileIds.map((profileId) => profileId?.trim()).filter((profileId) => !!profileId))];
}
function resolveAuthProfileOrderEntries(params) {
	return findNormalizedProviderValue(params.order, params.providerAuthKey) ?? (normalizeProviderId(params.providerAuthKey) === normalizeProviderId(params.provider) ? void 0 : findNormalizedProviderValue(params.order, params.provider));
}
function resolveExternalCliProviderIdForCompatibleAuthProfile(params) {
	const profile = params.cfg?.auth?.profiles?.[params.profileId];
	const credential = params.store?.profiles?.[params.profileId];
	const profileProvider = profile?.provider ?? credential?.provider ?? (params.profileId === "anthropic:claude-cli" ? CLAUDE_CLI_PROVIDER_ID : void 0);
	if (!profileProvider) return { compatible: false };
	const authAliasParams = {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	};
	const providerAuthKey = resolveProviderIdForAuth(params.provider, authAliasParams);
	const profileAuthKey = resolveProviderIdForAuth(profileProvider, authAliasParams);
	if (!providerAuthKey || profileAuthKey !== providerAuthKey) return { compatible: false };
	return {
		compatible: true,
		...normalizeProviderId(profileProvider) === CLAUDE_CLI_PROVIDER_ID ? { externalCliProviderId: CLAUDE_CLI_PROVIDER_ID } : {}
	};
}
//#endregion
export { resolveExternalCliAuthOverlayScopeFromSelection as t };
