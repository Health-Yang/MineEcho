import { strict as assert } from "node:assert";
import { getEnvKeyForModelProvider, normalizeCustomProviderConfig } from "./config.js";

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

test("normalizeCustomProviderConfig uses OpenAI chat-completions compatibility for private servers", () => {
  const config = normalizeCustomProviderConfig({
    id: "custom-abc",
    label: "Private vLLM",
    baseUrl: "https://llm.example.com",
    apiKey: "private-key",
    modelId: "qwen2.5-72b",
  });

  assert.equal(config.baseUrl, "https://llm.example.com/v1");
  assert.equal(config.apiKey, "private-key");
  assert.equal(config.api, "openai-completions");
  assert.deepEqual(config.models, [{ id: "qwen2.5-72b", name: "Private vLLM" }]);
});

test("normalizeCustomProviderConfig preserves explicit /v1 URLs and local no-key deployment", () => {
  const config = normalizeCustomProviderConfig({
    id: "custom-local",
    label: "Ollama",
    baseUrl: "http://10.0.0.8:11434/v1/",
    modelId: "llama3.1",
  });

  assert.equal(config.baseUrl, "http://10.0.0.8:11434/v1");
  assert.equal(config.apiKey, "ollama-local");
  assert.deepEqual(config.models, [{ id: "llama3.1", name: "Ollama" }]);
});

test("getEnvKeyForModelProvider maps gateway provider ids to configured app keys", () => {
  assert.equal(getEnvKeyForModelProvider("minimax-cn"), "MINIMAX_API_KEY");
  assert.equal(getEnvKeyForModelProvider("aliyun"), "DASHSCOPE_API_KEY");
  assert.equal(getEnvKeyForModelProvider("zhipu"), "ZHIPU_API_KEY");
  assert.equal(getEnvKeyForModelProvider("deepseek"), "DEEPSEEK_API_KEY");
});
