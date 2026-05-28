import assert from "node:assert/strict";
import { join } from "node:path";
import { getChatUploadDir } from "./chat-upload-path.js";

const cwd = "/repo/apps/bff";

assert.equal(
  getChatUploadDir({ MINECHO_UPLOAD_DIR: "/custom/uploads" } as NodeJS.ProcessEnv, cwd),
  "/custom/uploads",
);

assert.equal(
  getChatUploadDir({ MINEECHO_CONFIG_HOME: "/tmp/mineecho-home" } as NodeJS.ProcessEnv, cwd),
  "/tmp/mineecho-home/uploads",
);

assert.equal(
  getChatUploadDir({} as NodeJS.ProcessEnv, cwd),
  join(cwd, ".mineecho", "uploads"),
);

console.log("Chat upload path assertions passed");
