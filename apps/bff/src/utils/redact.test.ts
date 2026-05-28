import { strict as assert } from "node:assert";
import { redactSecrets } from "./redact.js";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("redactSecrets hides common sk-prefixed provider keys", () => {
  const value = redactSecrets("provider failed with sk-abcdefghijklmnopqrstuvwxyz123456");
  assert.equal(value, "provider failed with [REDACTED]");
});

test("redactSecrets hides MiniMax coding plan keys", () => {
  const value = redactSecrets("provider failed with sk-cp-abcdefghijklmnopqrstuvwxyz1234567890_ABCDEF");
  assert.equal(value, "provider failed with [REDACTED]");
});
