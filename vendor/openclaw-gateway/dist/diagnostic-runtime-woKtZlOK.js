import { i as emitInternalDiagnosticEvent, t as areDiagnosticsEnabledForProcess } from "./diagnostic-events-CNGydBWO.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
//#region src/logging/diagnostic-runtime.ts
const diag = createSubsystemLogger("diagnostic");
let lastActivityAt = 0;
const diagnosticLogger = diag;
function markDiagnosticActivity() {
	lastActivityAt = Date.now();
}
function getLastDiagnosticActivityAt() {
	return lastActivityAt;
}
function resetDiagnosticActivityForTest() {
	lastActivityAt = 0;
}
function logLaneEnqueue(lane, queueSize) {
	if (!areDiagnosticsEnabledForProcess()) return;
	diag.debug(`lane enqueue: lane=${lane} queueSize=${queueSize}`);
	emitInternalDiagnosticEvent({
		type: "queue.lane.enqueue",
		lane,
		queueSize
	});
	markDiagnosticActivity();
}
function logLaneDequeue(lane, waitMs, queueSize) {
	if (!areDiagnosticsEnabledForProcess()) return;
	diag.debug(`lane dequeue: lane=${lane} waitMs=${waitMs} queueSize=${queueSize}`);
	emitInternalDiagnosticEvent({
		type: "queue.lane.dequeue",
		lane,
		queueSize,
		waitMs
	});
	markDiagnosticActivity();
}
//#endregion
export { markDiagnosticActivity as a, logLaneEnqueue as i, getLastDiagnosticActivityAt as n, resetDiagnosticActivityForTest as o, logLaneDequeue as r, diagnosticLogger as t };
