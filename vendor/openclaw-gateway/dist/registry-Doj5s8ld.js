import { t as normalizePluginGatewayMethodScope } from "./gateway-method-policy-CwyGMC_n.js";
import "./core-descriptors-BUnLwpF8.js";
import { t as ADMIN_SCOPE } from "./operator-scopes-DGvgHuOd.js";
//#region src/gateway/methods/registry.ts
function normalizeMethodName(name) {
	return name.trim();
}
function normalizeDescriptor(input) {
	const name = normalizeMethodName(input.name);
	if (!name) throw new Error("gateway method descriptor name must not be empty");
	const normalizedScope = input.scope === "node" || input.scope === "dynamic" ? input.scope : input.owner.kind === "plugin" ? normalizePluginGatewayMethodScope(name, input.scope).scope : input.scope;
	if (!normalizedScope) throw new Error(`gateway method descriptor is missing a scope: ${name}`);
	return {
		...input,
		name,
		scope: normalizedScope,
		...input.startup === "unavailable-until-sidecars" ? { startup: "unavailable-until-sidecars" } : {},
		...input.controlPlaneWrite === true ? { controlPlaneWrite: true } : {},
		...input.advertise === false ? { advertise: false } : {}
	};
}
function createGatewayMethodRegistry(inputs) {
	const descriptors = inputs.map(normalizeDescriptor);
	const byName = /* @__PURE__ */ new Map();
	for (const descriptor of descriptors) {
		if (byName.has(descriptor.name)) throw new Error(`gateway method already registered: ${descriptor.name}`);
		byName.set(descriptor.name, descriptor);
	}
	return {
		getHandler: (name) => byName.get(name)?.handler,
		listMethods: () => descriptors.map((descriptor) => descriptor.name),
		listAdvertisedMethods: () => descriptors.filter((descriptor) => descriptor.advertise !== false).map((descriptor) => descriptor.name),
		getScope: (name) => byName.get(name)?.scope,
		isStartupUnavailable: (name) => byName.get(name)?.startup === "unavailable-until-sidecars",
		isControlPlaneWrite: (name) => byName.get(name)?.controlPlaneWrite === true,
		descriptors: () => descriptors
	};
}
function createGatewayMethodDescriptorsFromHandlers(params) {
	return Object.entries(params.handlers).map(([name, handler]) => {
		const scope = params.scopes?.[name] ?? params.defaultScope;
		if (!scope) throw new Error(`gateway method is missing a scope: ${name}`);
		return {
			name,
			handler,
			owner: params.owner,
			scope
		};
	});
}
function createPluginGatewayMethodDescriptor(params) {
	const normalizedScope = normalizePluginGatewayMethodScope(params.name, params.scope).scope;
	return {
		name: params.name,
		handler: params.handler,
		owner: {
			kind: "plugin",
			pluginId: params.pluginId
		},
		scope: normalizedScope ?? "operator.admin"
	};
}
function createPluginGatewayMethodDescriptors(registry) {
	const descriptors = registry.gatewayMethodDescriptors ?? [];
	if (descriptors.length > 0) return [...descriptors];
	return createGatewayMethodDescriptorsFromHandlers({
		handlers: registry.gatewayHandlers,
		owner: {
			kind: "plugin",
			pluginId: "unknown"
		},
		defaultScope: ADMIN_SCOPE
	});
}
//#endregion
export { createPluginGatewayMethodDescriptors as i, createGatewayMethodRegistry as n, createPluginGatewayMethodDescriptor as r, createGatewayMethodDescriptorsFromHandlers as t };
