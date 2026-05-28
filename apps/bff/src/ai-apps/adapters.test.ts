import assert from "node:assert/strict";
import { buildRequestBody, buildStreamingRequestBody, extractDeltaFromStreamChunk, formatAiAppHttpError } from "./adapters.js";

assert.equal(
  formatAiAppHttpError(
    500,
    '{"code":500004,"statusText":"aiPointsNotEnough","message":"common:code_error.team_error.ai_points_not_enough","data":null}'
  ),
  "FastGPT 点数不足：请检查应用所属团队的 AI Points / 余额，充值或更换可用 API Key 后重试。"
);

assert.equal(
  formatAiAppHttpError(401, '{"message":"invalid token"}'),
  "HTTP 401: invalid token"
);

assert.equal(
  formatAiAppHttpError(502, "Bad Gateway"),
  "HTTP 502: Bad Gateway"
);

assert.deepEqual(
  JSON.parse(buildRequestBody("解释 HCI 虚拟存储", { endpoint: "https://example.com/api", requestStyle: "messages" })),
  {
    messages: [{ role: "user", content: "解释 HCI 虚拟存储" }],
    stream: false,
    max_tokens: 65536,
  }
);

assert.deepEqual(
  JSON.parse(
    buildRequestBody("输出完整迁移方案", {
      endpoint: "https://example.com/api",
      requestStyle: "messages",
      maxTokens: 120000,
    })
  ),
  {
    messages: [{ role: "user", content: "输出完整迁移方案" }],
    stream: false,
    max_tokens: 120000,
  }
);

process.env.MINEECHO_AI_APP_MAX_TOKENS = "96000";
assert.deepEqual(
  JSON.parse(buildRequestBody("输出完整知识图谱", { endpoint: "https://example.com/api", requestStyle: "messages" })),
  {
    messages: [{ role: "user", content: "输出完整知识图谱" }],
    stream: false,
    max_tokens: 96000,
  }
);
delete process.env.MINEECHO_AI_APP_MAX_TOKENS;

assert.deepEqual(
  JSON.parse(buildRequestBody("解释 HCI 虚拟存储", { endpoint: "https://example.com/api", requestStyle: "query", queryKey: "question" })),
  {
    question: "解释 HCI 虚拟存储",
  }
);

assert.deepEqual(
  JSON.parse(buildStreamingRequestBody("解释 HCI 虚拟存储", { endpoint: "https://example.com/api", requestStyle: "messages" })),
  {
    messages: [{ role: "user", content: "解释 HCI 虚拟存储" }],
    stream: true,
    max_tokens: 65536,
  }
);

assert.equal(
  extractDeltaFromStreamChunk('{"choices":[{"delta":{"content":"第一段"}}]}'),
  "第一段"
);

assert.equal(
  extractDeltaFromStreamChunk('{"choices":[{"message":{"content":"完整回答"}}]}'),
  "完整回答"
);

assert.equal(extractDeltaFromStreamChunk("[DONE]"), "");

console.log("AI app adapter error assertions passed");
