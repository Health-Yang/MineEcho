import assert from "node:assert";
import { planChatContext, classifyTaskScenario } from "./context-budget-planner.js";

function repeated(prefix: string, count: number): string {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index}: 这是一段用于测试上下文预算的长文本，需要被压缩。`).join("\n");
}

async function testClassifiesTaskScenario() {
  assert.equal(classifyTaskScenario("帮我排查 npm build 报错 TypeError"), "troubleshooting");
  assert.equal(classifyTaskScenario("写一个 React 组件并补充测试"), "coding");
  assert.equal(classifyTaskScenario("执行 ls 命令看看目录"), "command");
  assert.equal(classifyTaskScenario("帮我写一份项目汇报材料"), "document");
  assert.equal(classifyTaskScenario("搜索最新资料并总结"), "research");
}

async function testCompactsLongHistoryAndSystemContext() {
  const messages = [
    { role: "system" as const, content: `系统提示\n\n[相关旧记忆]\n${repeated("memory", 80)}` },
    { role: "user" as const, content: repeated("old user", 90) },
    { role: "assistant" as const, content: repeated("old assistant", 90) },
    { role: "user" as const, content: "请继续排查这个报错" },
  ];

  const planned = await planChatContext(messages, {
    currentMessage: "请继续排查这个报错",
    historyMaxChars: 900,
    systemExtensionMaxChars: 700,
  });

  assert.equal(planned.scenario, "troubleshooting");
  assert.equal(planned.messages.at(-1)?.content, "请继续排查这个报错");
  assert.ok(planned.messages[0].content.length < messages[0].content.length, "system context should be compacted");
  assert.ok(planned.messages[1].content.length < messages[1].content.length, "history should be compacted");
  assert.ok(planned.metrics.some((metric) => metric.area === "memory"));
  assert.ok(planned.metrics.some((metric) => metric.area === "history"));
}

async function run() {
  await testClassifiesTaskScenario();
  await testCompactsLongHistoryAndSystemContext();
  console.log("context-budget-planner tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
