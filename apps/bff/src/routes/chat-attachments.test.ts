import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAttachmentContext } from "./chat-attachments.js";

const uploadDir = await mkdtemp(join(tmpdir(), "mineecho-chat-attachments-"));
await writeFile(join(uploadDir, "note.txt"), "HCI 方案重点：三节点部署，管理网和业务网分离。", "utf-8");
await writeFile(join(uploadDir, "long.md"), `${"MineEcho 附件内容 ".repeat(2000)}`, "utf-8");

const context = await buildAttachmentContext(
  [
    {
      id: "a1",
      name: "note.txt",
      type: "text/plain",
      size: 1024,
      url: "/api/chat/uploads/note.txt",
    },
  ],
  { uploadDir, maxCharsPerFile: 1000, maxTotalChars: 4000 },
);

assert(context.includes("<attachments>"));
assert(context.includes("note.txt"));
assert(context.includes("HCI 方案重点"));
assert(!context.includes("/api/chat/uploads"));

const ignored = await buildAttachmentContext(
  [
    {
      id: "bad",
      name: "escape.txt",
      type: "text/plain",
      size: 10,
      url: "/api/chat/uploads/../escape.txt",
    },
  ],
  { uploadDir, maxCharsPerFile: 1000, maxTotalChars: 4000 },
);

assert.equal(ignored, "");

const truncated = await buildAttachmentContext(
  [
    {
      id: "long",
      name: "long.md",
      type: "text/markdown",
      size: 10000,
      url: "/api/chat/uploads/long.md",
    },
  ],
  { uploadDir, maxCharsPerFile: 120, maxTotalChars: 160 },
);

assert(truncated.includes("已截断"));
assert(truncated.length < 1000);

console.log("Chat attachment context assertions passed");
