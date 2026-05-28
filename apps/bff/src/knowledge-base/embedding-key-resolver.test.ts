import { strict as assert } from "node:assert";
import { customModelToEmbeddingProviderConfig, resolveEmbeddingApiKeys } from "./embedding.js";

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

test("resolveEmbeddingApiKeys reuses shared provider keys when explicit embedding env is missing", () => {
  const resolved = resolveEmbeddingApiKeys(
    { minimax: "env-minimax" },
    { minimax: "shared-minimax", aliyun: "shared-aliyun", zhipu: "shared-zhipu" }
  );

  assert.deepEqual(resolved, {
    minimax: "env-minimax",
    aliyun: "shared-aliyun",
    zhipu: "shared-zhipu",
  });
});

test("resolveEmbeddingApiKeys keeps explicit embedding keys ahead of shared provider keys", () => {
  const resolved = resolveEmbeddingApiKeys(
    { minimax: "env-minimax", aliyun: "env-aliyun", zhipu: "env-zhipu" },
    { minimax: "shared-minimax", aliyun: "shared-aliyun", zhipu: "shared-zhipu" }
  );

  assert.deepEqual(resolved, {
    minimax: "env-minimax",
    aliyun: "env-aliyun",
    zhipu: "env-zhipu",
  });
});

test("customModelToEmbeddingProviderConfig enables OpenAI-compatible private embedding endpoints", () => {
  const config = customModelToEmbeddingProviderConfig({
    id: "custom-private",
    label: "Private Embedding",
    baseUrl: "https://llm.company.com/v1",
    apiKey: "private-key",
    modelId: "qwen2.5",
    embeddingModelId: "bge-m3",
    embeddingDimensions: 1024,
  });

  assert.deepEqual(config, {
    name: "custom:custom-private",
    baseUrl: "https://llm.company.com/v1",
    apiKey: "private-key",
    model: "bge-m3",
    dimensions: 1024,
  });
});
