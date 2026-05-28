/**
 * 测试 MiniMax Embedding API 实际响应格式
 */
const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: npx tsx test-embedding-api.ts <api-key>");
  process.exit(1);
}

async function testMiniMaxEmbedding() {
  const text = "这是一个测试文本";
  const res = await fetch("https://api.minimax.chat/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: "embo-01", input: text }),
  });
  console.log("Status:", res.status, res.statusText);
  const json = await res.json();
  console.log("Response keys:", Object.keys(json));
  if (json.data) {
    console.log("data[0] keys:", Object.keys(json.data[0] || {}));
    console.log("Has embedding:", Array.isArray(json.data[0]?.embedding));
    if (Array.isArray(json.data[0]?.embedding)) {
      console.log("Embedding length:", json.data[0].embedding.length);
    }
  }
  if (json.error) {
    console.log("Error:", json.error);
  }
}

testMiniMaxEmbedding().catch(console.error);
