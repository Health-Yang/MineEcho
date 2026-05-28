import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as normalizeOptionalSecretInput } from "./normalize-secret-input-CsdRhsMj.js";
import { s as upsertAuthProfileWithLock } from "./profiles-7sSr_su8.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./plugin-entry-BiutI5rd.js";
import { i as normalizeApiKeyInput, n as ensureApiKeyFromOptionEnvOrPrompt, s as validateApiKeyInput } from "./provider-auth-input-CydwoCLd.js";
import { n as buildApiKeyCredential, t as applyAuthProfileConfig } from "./provider-auth-helpers-BypOO1dt.js";
import "./provider-auth-api-key-TXdfHYbc.js";
import { a as PIXVERSE_PROVIDER_ID, i as PIXVERSE_DEFAULT_VIDEO_MODEL_REF, n as DEFAULT_PIXVERSE_REGION, r as PIXVERSE_BASE_URL_BY_REGION } from "./constants-B9NyNM3q.js";
//#region extensions/pixverse/onboard.ts
const PROFILE_ID = `${PIXVERSE_PROVIDER_ID}:default`;
async function upsertAuthProfileWithLockOrThrow(params) {
	if (!await upsertAuthProfileWithLock(params)) throw new Error("Failed to update auth profile store; the auth store lock may be busy. Wait a moment and retry.");
}
function normalizePixVerseRegion(value) {
	switch (normalizeOptionalString(value)?.toLowerCase()) {
		case "cn":
		case "china":
		case "mainland":
		case "pai": return "cn";
		case "global":
		case "intl":
		case "international": return "international";
		default: return;
	}
}
function pixVerseRegionNote(region) {
	return `PixVerse endpoint: ${region === "cn" ? "CN" : "International"} (${PIXVERSE_BASE_URL_BY_REGION[region]})`;
}
function applyPixVerseProviderConfig(cfg, region, options) {
	const existingProvider = cfg.models?.providers?.["pixverse"] ?? {};
	const selectedBaseUrl = PIXVERSE_BASE_URL_BY_REGION[region];
	const baseUrl = options?.resetBaseUrl ? selectedBaseUrl : normalizeOptionalString(existingProvider.baseUrl) ?? selectedBaseUrl;
	return {
		...cfg,
		models: {
			...cfg.models,
			providers: {
				...cfg.models?.providers,
				[PIXVERSE_PROVIDER_ID]: {
					...existingProvider,
					baseUrl,
					models: existingProvider.models ?? [],
					region
				}
			}
		}
	};
}
function applyPixVerseConfig(cfg, region, options) {
	const next = applyPixVerseProviderConfig(cfg, region, options);
	if (next.agents?.defaults?.videoGenerationModel) return next;
	return {
		...next,
		agents: {
			...next.agents,
			defaults: {
				...next.agents?.defaults,
				videoGenerationModel: { primary: PIXVERSE_DEFAULT_VIDEO_MODEL_REF }
			}
		}
	};
}
async function promptForPixVerseRegion(ctx) {
	return await ctx.prompter.select({
		message: "Select PixVerse API region",
		initialValue: DEFAULT_PIXVERSE_REGION,
		options: [{
			value: "international",
			label: "International",
			hint: PIXVERSE_BASE_URL_BY_REGION.international
		}, {
			value: "cn",
			label: "CN",
			hint: PIXVERSE_BASE_URL_BY_REGION.cn
		}]
	});
}
async function runPixVerseApiKeyAuth(ctx) {
	let capturedSecretInput;
	let capturedCredential = false;
	let capturedMode;
	await ensureApiKeyFromOptionEnvOrPrompt({
		token: normalizeOptionalSecretInput(ctx.opts?.pixverseApiKey) ?? normalizeOptionalSecretInput(ctx.opts?.token),
		tokenProvider: normalizeOptionalSecretInput(ctx.opts?.pixverseApiKey) ? PIXVERSE_PROVIDER_ID : normalizeOptionalSecretInput(ctx.opts?.tokenProvider),
		secretInputMode: ctx.allowSecretRefPrompt === false ? ctx.secretInputMode ?? "plaintext" : ctx.secretInputMode,
		config: ctx.config,
		env: ctx.env,
		expectedProviders: [PIXVERSE_PROVIDER_ID],
		provider: PIXVERSE_PROVIDER_ID,
		envLabel: "PIXVERSE_API_KEY",
		promptMessage: "Enter PixVerse API key",
		normalize: normalizeApiKeyInput,
		validate: validateApiKeyInput,
		prompter: ctx.prompter,
		setCredential: async (apiKey, mode) => {
			capturedSecretInput = apiKey;
			capturedCredential = true;
			capturedMode = mode;
		}
	});
	if (!capturedCredential) throw new Error("Missing PixVerse API key.");
	const region = await promptForPixVerseRegion(ctx);
	return {
		profiles: [{
			profileId: PROFILE_ID,
			credential: buildApiKeyCredential(PIXVERSE_PROVIDER_ID, capturedSecretInput ?? "", void 0, capturedMode ? {
				secretInputMode: capturedMode,
				config: ctx.config
			} : void 0)
		}],
		configPatch: applyPixVerseConfig(ctx.config, region, { resetBaseUrl: true }),
		notes: [pixVerseRegionNote(region)]
	};
}
async function runPixVerseApiKeyAuthNonInteractive(ctx) {
	const resolved = await ctx.resolveApiKey({
		provider: PIXVERSE_PROVIDER_ID,
		flagValue: normalizeOptionalSecretInput(ctx.opts.pixverseApiKey),
		flagName: "--pixverse-api-key",
		envVar: "PIXVERSE_API_KEY"
	});
	if (!resolved) return null;
	if (resolved.source !== "profile") {
		const credential = ctx.toApiKeyCredential({
			provider: PIXVERSE_PROVIDER_ID,
			resolved
		});
		if (!credential) return null;
		await upsertAuthProfileWithLockOrThrow({
			profileId: PROFILE_ID,
			credential,
			agentDir: ctx.agentDir
		});
	}
	const next = applyAuthProfileConfig(ctx.config, {
		profileId: PROFILE_ID,
		provider: PIXVERSE_PROVIDER_ID,
		mode: "api_key"
	});
	const explicitRegion = normalizePixVerseRegion(ctx.opts.pixverseRegion);
	return applyPixVerseConfig(next, explicitRegion ?? "international", { resetBaseUrl: explicitRegion !== void 0 });
}
function buildPixVerseApiKeyAuthMethod() {
	return {
		id: "api-key",
		label: "PixVerse API key",
		hint: "Video generation API key",
		kind: "api_key",
		wizard: {
			choiceId: "pixverse-api-key",
			choiceLabel: "PixVerse API key",
			choiceHint: "Prompts for International or CN endpoint",
			groupId: "pixverse",
			groupLabel: "PixVerse",
			groupHint: "Video generation",
			onboardingScopes: ["image-generation"]
		},
		run: runPixVerseApiKeyAuth,
		runNonInteractive: runPixVerseApiKeyAuthNonInteractive
	};
}
//#endregion
export { applyPixVerseProviderConfig as n, buildPixVerseApiKeyAuthMethod as r, applyPixVerseConfig as t };
