import assert from "node:assert/strict";
import { getLocalAuthModeLabel, isLocalAuthBypassEnabled } from "./localAuth";

assert.equal(isLocalAuthBypassEnabled({}), true);
assert.equal(isLocalAuthBypassEnabled({ VITE_MINEECHO_AUTH_REQUIRED: "false" }), true);
assert.equal(isLocalAuthBypassEnabled({ VITE_MINEECHO_AUTH_REQUIRED: "true" }), false);
assert.equal(isLocalAuthBypassEnabled({ VITE_MINEECHO_AUTH_REQUIRED: true }), false);

assert.deepEqual(getLocalAuthModeLabel({}), {
  enabled: true,
  title: "本地模式",
  subtitle: "未启用强制登录",
});
assert.deepEqual(getLocalAuthModeLabel({ VITE_MINEECHO_AUTH_REQUIRED: "true" }), {
  enabled: false,
  title: "账号模式",
  subtitle: "已启用登录认证",
});

console.log("Local auth bypass assertions passed");
