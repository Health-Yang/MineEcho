import assert from "node:assert/strict";
import { isSourceFileWithinDeletedPath } from "./graph-store.js";

assert.equal(isSourceFileWithinDeletedPath("raw/a.md", "raw/a.md"), true);
assert.equal(isSourceFileWithinDeletedPath("raw/folder/a.md", "raw/folder"), true);
assert.equal(isSourceFileWithinDeletedPath("raw/folder/deep/a.md", "raw/folder/"), true);
assert.equal(isSourceFileWithinDeletedPath("raw/folderish/a.md", "raw/folder"), false);
assert.equal(isSourceFileWithinDeletedPath("wiki/a.md", "raw/a.md"), false);

console.log("Knowledge graph cleanup assertions passed");
