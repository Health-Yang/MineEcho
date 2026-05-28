import assert from "node:assert/strict";
import { getLightRagWorkingDir } from "./lightrag-path.js";

assert.equal(
  getLightRagWorkingDir({ HOME: "/Users/example" }),
  "/Users/example/Library/Application Support/MineEcho/lightrag"
);
assert.equal(
  getLightRagWorkingDir({ HOME: "/Users/example", LIGHT_RAG_WORKING_DIR: "/tmp/lightrag" }),
  "/tmp/lightrag"
);
assert.equal(getLightRagWorkingDir({}), ".mineecho/lightrag");

console.log("LightRAG path assertions passed");
