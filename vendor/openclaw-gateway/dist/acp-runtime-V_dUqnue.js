import "./errors-CInk1Uju.js";
import { n as testing$1 } from "./manager-Cs6wHMF2.js";
import { i as testing$2 } from "./registry-COKHeWJa.js";
import "./session-meta-C0PGMNRj.js";
import "./acp-runtime-backend-Dls5X9sp.js";
//#region src/plugin-sdk/acp-runtime.ts
const testing = new Proxy({}, {
	get(_target, prop, receiver) {
		if (Reflect.has(testing$1, prop)) return Reflect.get(testing$1, prop, receiver);
		return Reflect.get(testing$2, prop, receiver);
	},
	has(_target, prop) {
		return Reflect.has(testing$1, prop) || Reflect.has(testing$2, prop);
	},
	ownKeys() {
		return Array.from(new Set([...Reflect.ownKeys(testing$1), ...Reflect.ownKeys(testing$2)]));
	},
	getOwnPropertyDescriptor(_target, prop) {
		if (Reflect.has(testing$1, prop) || Reflect.has(testing$2, prop)) return {
			configurable: true,
			enumerable: true
		};
	}
});
//#endregion
export { testing as t };
