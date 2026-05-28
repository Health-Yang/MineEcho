import assert from "node:assert/strict";
import { connectChannel, disconnectChannel, testChannelConnection } from "./channels.js";

const feishu = {
  id: "feishu",
  name: "飞书",
  enabled: true,
  icon: "",
  description: "",
  type: "feishu" as const,
  credentials: { appId: "app", appSecret: "secret" },
};

const testResult = await testChannelConnection(feishu as any);
assert.equal(testResult.success, false);
assert.match(testResult.message, /实验功能|未接入|未实现|暂未/);

const connectResult = await connectChannel(feishu as any);
assert.equal(connectResult.success, false);
assert.match(connectResult.message, /实验功能|未接入|未实现|暂未/);

const disconnectResult = await disconnectChannel(feishu as any);
assert.equal(disconnectResult.success, true);

console.log("Channel experimental status assertions passed");
