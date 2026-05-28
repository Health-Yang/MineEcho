import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
//#region src/gateway/server-methods/connect.ts
const connectHandlers = { connect: ({ respond }) => {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "connect is only valid as the first request"));
} };
//#endregion
export { connectHandlers };
