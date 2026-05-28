import { strict as assert } from "node:assert";
import { getInitProviderDefaults } from "./init.js";

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

test("getInitProviderDefaults includes gateway API formats for all built-in providers", () => {
  const defaults = getInitProviderDefaults();

  assert.equal(defaults["minimax-cn"].api, "anthropic-messages");
  assert.equal(defaults["minimax-cn"].authHeader, true);
  assert.equal(defaults["minimax-cn"].baseUrl, "https://api.minimax.io/anthropic");
  assert(defaults["minimax-cn"].models.some((model) => model.id === "MiniMax-M2.5-highspeed"));
  assert.equal(defaults.aliyun.api, "openai-completions");
  assert.equal(defaults.zhipu.api, "openai-completions");
  assert.equal(defaults.deepseek.api, "openai-completions");
});
