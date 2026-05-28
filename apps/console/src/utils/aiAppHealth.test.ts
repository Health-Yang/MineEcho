import assert from "node:assert/strict";
import { buildAiAppHealthQuery } from "./aiAppHealth";

assert.equal(
  buildAiAppHealthQuery({
    name: "HCI 实施方案助手",
    description: "生成超融合部署、巡检和故障排查方案",
  }),
  "HCI 实施方案助手：生成超融合部署、巡检和故障排查方案"
);

assert.equal(
  buildAiAppHealthQuery({
    name: "  产品知识库  ",
    description: "   ",
  }),
  "产品知识库"
);

console.log("AI app health query assertions passed");
