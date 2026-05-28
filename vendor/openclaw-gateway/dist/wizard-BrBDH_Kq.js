import { p as readStringValue } from "./string-coerce-DKw2K5wM.js";
import { n as defaultRuntime } from "./runtime-yzlkhCoS.js";
import { $n as validateWizardNextParams, Ii as ErrorCodes, Li as errorShape, Qn as validateWizardCancelParams, er as validateWizardStartParams, tr as validateWizardStatusParams } from "./protocol-BkfNT2Bp.js";
import { t as WizardCancelledError } from "./prompts-E0FayNjJ.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { randomUUID } from "node:crypto";
//#region src/wizard/session.ts
function createDeferred() {
	let resolve;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
}
var WizardSessionPrompter = class {
	constructor(session) {
		this.session = session;
	}
	async intro(title) {
		await this.prompt({
			type: "note",
			title,
			message: "",
			executor: "client"
		});
	}
	async outro(message) {
		await this.prompt({
			type: "note",
			title: "Done",
			message,
			executor: "client"
		});
	}
	async note(message, title) {
		await this.prompt({
			type: "note",
			title,
			message,
			executor: "client"
		});
	}
	async plain(message) {
		await this.prompt({
			type: "note",
			message,
			format: "plain",
			executor: "client"
		});
	}
	async select(params) {
		return await this.prompt({
			type: "select",
			message: params.message,
			options: params.options.map((opt) => ({
				value: opt.value,
				label: opt.label,
				hint: opt.hint
			})),
			initialValue: params.initialValue,
			executor: "client"
		});
	}
	async multiselect(params) {
		const res = await this.prompt({
			type: "multiselect",
			message: params.message,
			options: params.options.map((opt) => ({
				value: opt.value,
				label: opt.label,
				hint: opt.hint
			})),
			initialValue: params.initialValues,
			executor: "client"
		});
		return Array.isArray(res) ? res : [];
	}
	async text(params) {
		const res = await this.prompt({
			type: "text",
			message: params.message,
			initialValue: params.initialValue,
			placeholder: params.placeholder,
			sensitive: params.sensitive,
			executor: "client"
		});
		const value = res === null || res === void 0 ? "" : typeof res === "string" ? res : typeof res === "number" || typeof res === "boolean" || typeof res === "bigint" ? String(res) : "";
		const error = params.validate?.(value);
		if (error) throw new Error(error);
		return value;
	}
	async confirm(params) {
		const res = await this.prompt({
			type: "confirm",
			message: params.message,
			initialValue: params.initialValue,
			executor: "client"
		});
		return Boolean(res);
	}
	progress(_label) {
		return {
			update: (_message) => {},
			stop: (_message) => {}
		};
	}
	async prompt(step) {
		return await this.session.awaitAnswer({
			...step,
			id: randomUUID()
		});
	}
};
var WizardSession = class {
	constructor(runner) {
		this.runner = runner;
		this.currentStep = null;
		this.stepDeferred = null;
		this.pendingTerminalResolution = false;
		this.answerDeferred = /* @__PURE__ */ new Map();
		this.status = "running";
		const prompter = new WizardSessionPrompter(this);
		this.run(prompter);
	}
	async next() {
		if (this.currentStep) return {
			done: false,
			step: this.currentStep,
			status: this.status
		};
		if (this.pendingTerminalResolution) {
			this.pendingTerminalResolution = false;
			return {
				done: true,
				status: this.status,
				error: this.error
			};
		}
		if (this.status !== "running") return {
			done: true,
			status: this.status,
			error: this.error
		};
		if (!this.stepDeferred) this.stepDeferred = createDeferred();
		const step = await this.stepDeferred.promise;
		if (step) return {
			done: false,
			step,
			status: this.status
		};
		return {
			done: true,
			status: this.status,
			error: this.error
		};
	}
	async answer(stepId, value) {
		const deferred = this.answerDeferred.get(stepId);
		if (!deferred) throw new Error("wizard: no pending step");
		this.answerDeferred.delete(stepId);
		this.currentStep = null;
		deferred.resolve(value);
	}
	cancel() {
		if (this.status !== "running") return;
		this.status = "cancelled";
		this.error = "cancelled";
		this.currentStep = null;
		for (const [, deferred] of this.answerDeferred) deferred.reject(new WizardCancelledError());
		this.answerDeferred.clear();
		this.resolveStep(null);
	}
	pushStep(step) {
		this.currentStep = step;
		this.resolveStep(step);
	}
	async run(prompter) {
		try {
			await this.runner(prompter);
			this.status = "done";
		} catch (err) {
			if (err instanceof WizardCancelledError) {
				this.status = "cancelled";
				this.error = err.message;
			} else {
				this.status = "error";
				this.error = String(err);
			}
		} finally {
			this.resolveStep(null);
		}
	}
	async awaitAnswer(step) {
		if (this.status !== "running") throw new Error("wizard: session not running");
		this.pushStep(step);
		const deferred = createDeferred();
		this.answerDeferred.set(step.id, deferred);
		return await deferred.promise;
	}
	resolveStep(step) {
		if (!this.stepDeferred) {
			if (step === null) this.pendingTerminalResolution = true;
			return;
		}
		const deferred = this.stepDeferred;
		this.stepDeferred = null;
		deferred.resolve(step);
	}
	getStatus() {
		return this.status;
	}
	getError() {
		return this.error;
	}
};
//#endregion
//#region src/gateway/server-methods/wizard.ts
function readWizardStatus(session) {
	return {
		status: session.getStatus(),
		error: session.getError()
	};
}
function findWizardSessionOrRespond(params) {
	const session = params.context.wizardSessions.get(params.sessionId);
	if (!session) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not found"));
		return null;
	}
	return session;
}
const wizardHandlers = {
	"wizard.start": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateWizardStartParams, "wizard.start", respond)) return;
		if (context.findRunningWizard()) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "wizard already running"));
			return;
		}
		const sessionId = randomUUID();
		const opts = {
			mode: params.mode,
			workspace: readStringValue(params.workspace)
		};
		const session = new WizardSession((prompter) => context.wizardRunner(opts, defaultRuntime, prompter));
		context.wizardSessions.set(sessionId, session);
		const result = await session.next();
		if (result.done) context.purgeWizardSession(sessionId);
		respond(true, {
			sessionId,
			...result
		}, void 0);
	},
	"wizard.next": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateWizardNextParams, "wizard.next", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		const answer = params.answer;
		if (answer) {
			if (session.getStatus() !== "running") {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not running"));
				return;
			}
			try {
				await session.answer(answer.stepId ?? "", answer.value);
			} catch (err) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, formatForLog(err)));
				return;
			}
		}
		const result = await session.next();
		if (result.done) context.purgeWizardSession(sessionId);
		respond(true, result, void 0);
	},
	"wizard.cancel": ({ params, respond, context }) => {
		if (!assertValidParams(params, validateWizardCancelParams, "wizard.cancel", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		session.cancel();
		const status = readWizardStatus(session);
		context.wizardSessions.delete(sessionId);
		respond(true, status, void 0);
	},
	"wizard.status": ({ params, respond, context }) => {
		if (!assertValidParams(params, validateWizardStatusParams, "wizard.status", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		const status = readWizardStatus(session);
		if (status.status !== "running") context.wizardSessions.delete(sessionId);
		respond(true, status, void 0);
	}
};
//#endregion
export { wizardHandlers };
