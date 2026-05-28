import { Ii as ErrorCodes, Li as errorShape, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
//#region src/gateway/server-methods/validation.ts
function assertValidParams(params, validate, method, respond) {
	if (validate(params)) return true;
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid ${method} params: ${formatValidationErrors(validate.errors)}`));
	return false;
}
//#endregion
export { assertValidParams as t };
