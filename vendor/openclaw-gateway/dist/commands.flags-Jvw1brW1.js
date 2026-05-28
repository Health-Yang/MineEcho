import { b as isPlainObject } from "./utils-B5r0V84N.js";
//#region src/config/commands.flags.ts
function getOwnCommandFlagValue(config, key) {
	const { commands } = config ?? {};
	if (!isPlainObject(commands) || !Object.hasOwn(commands, key)) return;
	return commands[key];
}
function isCommandFlagEnabled(config, key) {
	return getOwnCommandFlagValue(config, key) === true;
}
function isRestartEnabled(config) {
	return getOwnCommandFlagValue(config, "restart") !== false;
}
//#endregion
export { isRestartEnabled as n, isCommandFlagEnabled as t };
