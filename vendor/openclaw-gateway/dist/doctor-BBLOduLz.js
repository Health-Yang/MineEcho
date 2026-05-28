//#region src/commands/doctor.ts
async function doctorCommand(runtime, options) {
	await (await import("./doctor-health-D8nAN4DT.js")).doctorCommand(runtime, options);
}
//#endregion
export { doctorCommand as t };
