import assert from "node:assert/strict";
import { buildMemoryContext, formatMemoryContext } from "./context-builder.js";
import { memoryTreeManager } from "./memory-tree/tree-manager.js";

const formatted = formatMemoryContext({
  userProfile: {
    workStyle: "专业风格，偏好详细回复",
    technicalStack: ["React", "TypeScript"],
    domainExpertise: ["HCI"],
    preferredResponseLength: "detailed",
  },
  relevantTreeMemories: [
    {
      label: "2026-05-26",
      content: "用户询问过 HCI 交互原则，以及如何把知识库和记忆系统结合。",
      source: "conversation",
      importance: 0.8,
    },
  ],
});

assert(formatted.includes("[相关旧记忆]"));
assert(formatted.includes("2026-05-26"));
assert(formatted.includes("HCI 交互原则"));

async function testBuildMemoryContextRecallsOldTreeMemory() {
  const userId = `context-builder-recall-${Date.now()}`;
  await memoryTreeManager.storeChunk(userId, {
    source: "conversation",
    content: "前几天用户讨论了 HCI 人机交互中的认知负荷、费茨定律和反馈机制。",
    importance: 0.82,
  });

  const context = await buildMemoryContext(userId, "session-1", "我之前问过哪些交互设计问题？");
  assert(context, "context should be built from recalled memory");
  assert(context.relevantTreeMemories?.some((item) => item.content.includes("费茨定律")));

  const formattedContext = formatMemoryContext(context);
  assert(formattedContext.includes("[相关旧记忆]"));
  assert(formattedContext.includes("费茨定律"));
}

await testBuildMemoryContextRecallsOldTreeMemory();

console.log("Memory context builder assertions passed");
