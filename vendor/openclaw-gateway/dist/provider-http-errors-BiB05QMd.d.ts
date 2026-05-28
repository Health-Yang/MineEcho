//#region src/agents/provider-http-errors.d.ts
declare function asObject(value: unknown): Record<string, unknown> | undefined;
declare function truncateErrorDetail(detail: string, limit?: number): string;
declare function readResponseTextLimited(response: Response, limitBytes?: number): Promise<string>;
declare function formatProviderErrorPayload(payload: unknown): string | undefined;
declare function extractProviderErrorDetail(response: Response): Promise<string | undefined>;
declare function extractProviderRequestId(response: Response): string | undefined;
declare function formatProviderHttpErrorMessage(params: {
  label: string;
  status: number;
  detail?: string;
  requestId?: string;
  statusPrefix?: string;
}): string;
declare function createProviderHttpError(response: Response, label: string, options?: {
  statusPrefix?: string;
}): Promise<Error>;
declare function assertOkOrThrowProviderError(response: Response, label: string): Promise<void>;
declare function assertOkOrThrowHttpError(response: Response, label: string): Promise<void>;
declare function readProviderJsonResponse<T>(response: Response, label: string): Promise<T>;
declare function readProviderJsonObjectResponse(response: Response, label: string): Promise<Record<string, unknown>>;
declare function readProviderJsonArrayFieldResponse(response: Response, label: string, field: string): Promise<unknown[]>;
declare function assertProviderBinaryResponseContent(response: Response, label: string, kind?: string): void;
declare function readProviderBinaryResponse(response: Response, label: string, kind?: string): Promise<Uint8Array>;
//#endregion
export { createProviderHttpError as a, formatProviderErrorPayload as c, readProviderJsonArrayFieldResponse as d, readProviderJsonObjectResponse as f, truncateErrorDetail as h, assertProviderBinaryResponseContent as i, formatProviderHttpErrorMessage as l, readResponseTextLimited as m, assertOkOrThrowHttpError as n, extractProviderErrorDetail as o, readProviderJsonResponse as p, assertOkOrThrowProviderError as r, extractProviderRequestId as s, asObject as t, readProviderBinaryResponse as u };