import assert from "node:assert/strict";
import type { EmbeddingProvider } from "../../knowledge-base/embedding.js";
import { buildSemanticVector } from "./semantic-vector.js";
import {
  rankByMemoryEmbedding,
  scoreMemoryEmbeddingBatch,
} from "./memory-embedding.js";

function makeProvider(vectors: number[][] | null): EmbeddingProvider {
  return {
    name: "test-provider",
    maxTokens: 8192,
    dimensions: 3,
    async getEmbedding(): Promise<number[] | null> {
      throw new Error("getEmbedding should not be used for reranking");
    },
    async batchEmbeddings(texts: string[]): Promise<number[][] | null> {
      assert.equal(texts.length, vectors?.length ?? texts.length);
      return vectors;
    },
  };
}

async function testExternalBatchScoring(): Promise<void> {
  const result = await scoreMemoryEmbeddingBatch(
    "hci query",
    ["unrelated", "hci memory"],
    {
      provider: makeProvider([
        [1, 0, 0],
        [0, 1, 0],
        [0.9, 0.1, 0],
      ]),
    }
  );

  assert.equal(result.providerName, "test-provider");
  assert.equal(result.scores.length, 2);
  assert.ok(result.scores[1] > result.scores[0], "external embedding should score related item higher");
}

async function testFallbackOnProviderFailure(): Promise<void> {
  const query = "之前问过哪些交互设计问题";
  const texts = ["今天晚饭买牛奶", "HCI 人机交互和用户体验问题"];
  const result = await scoreMemoryEmbeddingBatch(query, texts, {
    provider: makeProvider(null),
  });

  assert.equal(result.providerName, "local");
  assert.deepEqual(
    result.scores,
    texts.map((text) => Math.max(0, result.cosine(buildSemanticVector(text), buildSemanticVector(query))))
  );
}

async function testFallbackOnDimensionMismatch(): Promise<void> {
  const result = await scoreMemoryEmbeddingBatch("query", ["content"], {
    provider: makeProvider([
      [1, 0, 0],
      [1, 0],
    ]),
  });

  assert.equal(result.providerName, "local");
  assert.equal(result.scores.length, 1);
}

async function testRankingUsesExternalScores(): Promise<void> {
  const ranked = await rankByMemoryEmbedding(
    "query",
    [
      { item: { id: "a" }, text: "first" },
      { item: { id: "b" }, text: "second" },
    ],
    {
      provider: makeProvider([
        [1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ]),
    }
  );

  assert.equal(ranked[0]?.item.id, "b");
  assert.equal(ranked[0]?.providerName, "test-provider");
}

await testExternalBatchScoring();
await testFallbackOnProviderFailure();
await testFallbackOnDimensionMismatch();
await testRankingUsesExternalScores();

console.log("memory-embedding tests passed");
