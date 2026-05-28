import assert from "node:assert/strict";
import { scoreSemanticMemory } from "./semantic-recall.js";

function testSynonymRecall() {
  const score = scoreSemanticMemory(
    "我前几天研究了 HCI 里的费茨定律、认知负荷和交互反馈。",
    "之前问过哪些人机交互的问题？"
  );
  assert(score > 0.2, `expected HCI semantic memory to score, got ${score}`);
}

function testUnrelatedMemoryScoresLow() {
  const score = scoreSemanticMemory(
    "今天晚饭想吃番茄炒蛋，顺便买牛奶。",
    "之前问过哪些人机交互的问题？"
  );
  assert(score < 0.12, `expected unrelated memory to score low, got ${score}`);
}

function testChineseAndEnglishAliases() {
  const score = scoreSemanticMemory(
    "用户正在优化 MineEcho 的长期记忆和知识图谱体验。",
    "mineecho 能不能记住我之前做过的任务"
  );
  assert(score > 0.2, `expected MineEcho memory topic to score, got ${score}`);
}

testSynonymRecall();
testUnrelatedMemoryScoresLow();
testChineseAndEnglishAliases();
console.log("semantic-recall tests passed");
