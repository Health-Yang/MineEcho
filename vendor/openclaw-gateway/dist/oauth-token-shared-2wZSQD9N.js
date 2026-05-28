import { p as readStringValue } from "./string-coerce-DKw2K5wM.js";
import "./string-coerce-runtime-qOd7_06l.js";
//#region extensions/google/oauth-token-shared.ts
function parseGoogleOauthApiKey(apiKey) {
	try {
		const parsed = JSON.parse(apiKey);
		return {
			token: readStringValue(parsed.token),
			projectId: readStringValue(parsed.projectId)
		};
	} catch {
		return null;
	}
}
function formatGoogleOauthApiKey(cred) {
	if (cred.type !== "oauth" || typeof cred.access !== "string" || !cred.access.trim()) return "";
	return JSON.stringify({
		token: cred.access,
		projectId: cred.projectId
	});
}
function parseGoogleUsageToken(apiKey) {
	const parsed = parseGoogleOauthApiKey(apiKey);
	if (parsed?.token) return parsed.token;
	return apiKey;
}
//#endregion
export { parseGoogleOauthApiKey as n, parseGoogleUsageToken as r, formatGoogleOauthApiKey as t };
