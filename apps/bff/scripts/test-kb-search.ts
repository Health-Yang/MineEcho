import { hybridSearch } from "../src/knowledge-base/search.js";

async function main() {
  console.log("=== KB Search Regression Test ===");

  const results = await hybridSearch("RAG是什么", { limit: 5 });
  console.log("Results count:", results.length);

  for (const r of results.slice(0, 3)) {
    console.log(`- ${r.sourcePath} (score: ${r.score.toFixed(3)})`);
  }

  if (results.length === 0) {
    console.error("No results found - search may be broken");
    process.exit(1);
  }

  console.log("\n=== KB Search OK ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
