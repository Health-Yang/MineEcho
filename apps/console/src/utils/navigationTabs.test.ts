import assert from "node:assert/strict";
import { getMainTabFromPath } from "./navigationTabs";

assert.equal(getMainTabFromPath("/chat"), "chat");
assert.equal(getMainTabFromPath("/skills"), "skills");
assert.equal(getMainTabFromPath("/knowledge"), "knowledge");
assert.equal(getMainTabFromPath("/knowledge/graph"), "knowledge");
assert.equal(getMainTabFromPath("/memory"), "memory");
assert.equal(getMainTabFromPath("/meeting"), "meeting");
assert.equal(getMainTabFromPath("/calendar"), "meeting");
assert.equal(getMainTabFromPath("/cron"), "cron");
assert.equal(getMainTabFromPath("/config"), "config");
assert.equal(getMainTabFromPath("/settings"), "config");
assert.equal(getMainTabFromPath("/init"), "config");
assert.equal(getMainTabFromPath("/unknown"), "chat");

console.log("Navigation tab assertions passed");
