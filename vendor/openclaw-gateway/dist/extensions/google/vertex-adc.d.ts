//#region extensions/google/vertex-adc.d.ts
declare const GCP_VERTEX_CREDENTIALS_MARKER = "gcp-vertex-credentials";
declare function resetGoogleVertexAuthorizedUserTokenCacheForTest(): void;
declare function isGoogleVertexCredentialsMarker(apiKey: string | undefined): apiKey is undefined | typeof GCP_VERTEX_CREDENTIALS_MARKER;
/**
 * Returns true when a file/env Application Default Credentials source usable
 * for Google Vertex AI is detectable synchronously. We still call the function
 * `...AuthorizedUserAdcSync` for backwards compatibility with older tests; the
 * predicate now also covers:
 *
 *   1. `authorized_user` credentials file (existing case - `gcloud auth
 *      application-default login` produces this).
 *   2. `external_account` credentials file (Workload Identity Federation).
 *   3. `service_account` credentials file (raw GSA key - rarely used in
 *      OpenClaw, included for completeness).
 * Metadata-server ADC is intentionally not detected here: `google-auth-library`
 * probes the default metadata hosts asynchronously at request time, and the
 * provider wires the Vertex transport without this sync predicate.
 */
declare function hasGoogleVertexAuthorizedUserAdcSync(env?: NodeJS.ProcessEnv): boolean;
/**
 * Resolve `Authorization: Bearer ...` headers for Google Vertex calls.
 *
 * We try the hand-rolled `authorized_user` refresh path first (preserves the
 * existing fetchImpl test seam and the OpenClaw upstream behaviour); when the
 * configured ADC source is anything other than `authorized_user` (the common
 * production cases on GKE: Workload Identity, Workload Identity Federation,
 * service-account JSON keys), we hand off to `google-auth-library` which
 * understands all of those natively.
 *
 * Note: the function is still named `...AuthorizedUserHeaders` to avoid a
 * symbol rename across the existing patch surface; the docstring above is
 * the truth, the name is legacy.
 */
declare function resolveGoogleVertexAuthorizedUserHeaders(fetchImpl?: typeof fetch): Promise<Record<string, string>>;
//#endregion
export { hasGoogleVertexAuthorizedUserAdcSync, isGoogleVertexCredentialsMarker, resetGoogleVertexAuthorizedUserTokenCacheForTest, resolveGoogleVertexAuthorizedUserHeaders };