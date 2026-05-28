import { isEmbeddingAvailable, getActiveProvider } from "../src/knowledge-base/embedding.js";

async function main() {
  console.log("=== Embedding E2E Test ===");
  console.log("Available:", isEmbeddingAvailable());

  const provider = getActiveProvider();
  if (!provider) {
    console.error("No embedding provider available");
    process.exit(1);
  }

  console.log("Provider:", provider.name, "dims:", provider.dimensions);

  // Test single embedding (query type)
  const vec = await provider.getEmbedding("测试文本");
  if (!vec || vec.length !== provider.dimensions) {
    console.error("Single embedding FAILED");
    process.exit(1);
  }
  console.log("Single embedding: OK, length=", vec.length);

  // Test batch embedding (db type)
  const batch = await provider.batchEmbeddings(["文本1", "文本2", "文本3"]);
  if (!batch || batch.length !== 3) {
    console.error("Batch embedding FAILED");
    process.exit(1);
  }
  console.log("Batch embedding: OK, count=", batch.length);

  // Test similarity (cosine)
  const dot = vec.reduce((s, v, i) => s + v * vec[i], 0);
  const normA = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  const similarity = dot / (normA * normA);
  console.log("Self-similarity:", similarity.toFixed(4), "(should be ~1.0)");

  console.log("\n=== All tests passed ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
