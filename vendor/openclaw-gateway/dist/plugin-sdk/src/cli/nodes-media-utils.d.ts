export { asFiniteNumber as asNumber } from "../shared/number-coercion.js";
import { readStringValue } from "../shared/string-coerce.js";
export { asRecord } from "../shared/record-coerce.js";
export { asBoolean } from "../utils/boolean.js";
export declare const asString: typeof readStringValue;
export declare function resolveTempPathParts(opts: {
    ext: string;
    tmpDir?: string;
    id?: string;
}): {
    ext: string;
    tmpDir: string;
    id: string;
};
