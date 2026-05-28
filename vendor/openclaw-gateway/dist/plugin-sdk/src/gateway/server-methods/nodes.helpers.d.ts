import type { ValidationError } from "../protocol/index.js";
export { safeParseJson } from "../server-json.js";
import type { RespondFn } from "./types.js";
type ValidatorFn = ((value: unknown) => boolean) & {
    errors?: ValidationError[] | null;
};
export declare function respondInvalidParams(params: {
    respond: RespondFn;
    method: string;
    validator: ValidatorFn;
}): void;
export declare function respondUnavailableOnThrow(respond: RespondFn, fn: () => Promise<void>): Promise<void>;
export declare function respondUnavailableOnNodeInvokeError<T extends {
    ok: boolean;
    error?: unknown;
}>(respond: RespondFn, res: T): res is T & {
    ok: true;
};
