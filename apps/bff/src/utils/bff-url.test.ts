import assert from "node:assert/strict";
import { getBffBaseUrl, getBffPort, getLocalBffUrl } from "./bff-url.js";

assert.equal(getBffPort({}), 3085);
assert.equal(getBffPort({ BFF_PORT: "3099" }), 3099);
assert.equal(getBffPort({ BFF_PORT: "not-a-number" }), 3085);
assert.equal(getBffPort({ BFF_PORT: "0" }), 3085);
assert.equal(getBffBaseUrl({}), "http://127.0.0.1:3085");
assert.equal(getBffBaseUrl({ BFF_PORT: "3099" }), "http://127.0.0.1:3099");
assert.equal(getLocalBffUrl("/api/health", { BFF_PORT: "3099" }), "http://127.0.0.1:3099/api/health");
assert.equal(getLocalBffUrl("api/health", { BFF_PORT: "3099" }), "http://127.0.0.1:3099/api/health");

console.log("MineEcho BFF URL assertions passed");
