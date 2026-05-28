import assert from "node:assert/strict";
import { buildSemanticVector, cosineSimilarity } from "./semantic-vector.js";

function testRelatedTextsHaveHighSimilarity() {
  const memory = buildSemanticVector("我研究了 HCI 人机交互里的费茨定律、认知负荷和用户反馈。");
  const query = buildSemanticVector("之前问过哪些交互设计和用户体验问题？");
  const score = cosineSimilarity(memory, query);
  assert(score > 0.22, `expected related HCI texts to be similar, got ${score}`);
}

function testUnrelatedTextsHaveLowSimilarity() {
  const memory = buildSemanticVector("今天晚饭想吃番茄炒蛋，顺便买牛奶。");
  const query = buildSemanticVector("之前问过哪些交互设计和用户体验问题？");
  const score = cosineSimilarity(memory, query);
  assert(score < 0.18, `expected unrelated texts to be less similar, got ${score}`);
}

function testVectorIsDeterministicAndNormalized() {
  const first = buildSemanticVector("MineEcho 需要记住用户任务并控制 token 成本。");
  const second = buildSemanticVector("MineEcho 需要记住用户任务并控制 token 成本。");
  assert.deepEqual(first, second);

  const norm = Math.sqrt(first.reduce((sum, value) => sum + value * value, 0));
  assert(Math.abs(norm - 1) < 0.000001, `expected unit vector, got norm ${norm}`);
}

testRelatedTextsHaveHighSimilarity();
testUnrelatedTextsHaveLowSimilarity();
testVectorIsDeterministicAndNormalized();
console.log("semantic-vector tests passed");
