import assert from "node:assert/strict";
import { getChatProcessingStatus } from "./chatProcessingStatus";

assert.equal(getChatProcessingStatus({ status: "waiting_model", message: "已等待 18 秒" }), "模型正在处理");
assert.equal(getChatProcessingStatus({ status: "retrieving_kb" }), "正在检索相关记忆与知识库");
assert.equal(getChatProcessingStatus({ status: "processing", message: "正在执行复杂操作，请稍后" }), "正在执行复杂操作，请稍后");
assert.equal(getChatProcessingStatus({ status: "thinking", message: "已等待 2 分钟，请稍候" }), "正在整理上下文");
assert.equal(getChatProcessingStatus({ status: "tool_start", toolName: "web-search" }), "正在调用「搜索网络」");
assert.equal(getChatProcessingStatus({ status: "tool_done" }), null);
assert.equal(getChatProcessingStatus({ status: "processing", answerStarted: true, message: "处理中" }), null);

console.log("Chat processing status assertions passed");
