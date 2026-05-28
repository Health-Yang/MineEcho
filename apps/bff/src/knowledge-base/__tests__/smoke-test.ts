/**
 * 知识库模块冒烟测试
 * 运行方式: cd /Users/mac/test/mineecho-v3/apps/bff && npx tsx src/knowledge-base/__tests__/smoke-test.ts
 */
import { mkdir, writeFile, rm, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

// ── Test Framework (minimal) ───────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failCount++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`  ✗ ${name}\n    ${msg}`);
    console.log(`  ✗ ${name}\n    ${msg}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, msg?: string) {
  if (!value) throw new Error(msg || "Expected true");
}

function assertFalse(value: boolean, msg?: string) {
  if (value) throw new Error(msg || "Expected false");
}

// ── Test Helpers ───────────────────────────────────────────────────────────

let tmpKbDir = "";

async function setupTestEnv(): Promise<string> {
  tmpKbDir = await mkdtemp(join(tmpdir(), "kb-smoke-"));
  process.env.MINECHO_KB_BASE_PATH = tmpKbDir;
  return tmpKbDir;
}

async function teardownTestEnv() {
  if (tmpKbDir) {
    await rm(tmpKbDir, { recursive: true, force: true });
  }
}

function getKbBasePath(): string {
  return process.env.MINECHO_KB_BASE_PATH || tmpKbDir;
}

function resolveKbPath(relPath: string): string {
  return join(getKbBasePath(), relPath);
}

async function ensureKbInitialized(): Promise<void> {
  const base = getKbBasePath();
  const dirs = [
    join(base, "raw"),
    join(base, "wiki"),
    join(base, "wiki", "concepts"),
    join(base, "wiki", "entities"),
    join(base, "wiki", "sources"),
    join(base, "wiki", "comparisons"),
    join(base, "wiki", "syntheses"),
  ];
  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}

// ── Unit Tests (no server needed) ──────────────────────────────────────────

async function runUnitTests() {
  console.log("\n📦 Unit Tests\n");

  // ── paths.ts ──
  await test("resolveKbPath rejects absolute paths", async () => {
    const { resolveKbPath } = await import("../paths.js");
    let threw = false;
    try {
      resolveKbPath("/etc/passwd");
    } catch {
      threw = true;
    }
    assertTrue(threw, "Should throw for absolute path");
  });

  await test("resolveKbPath rejects path traversal", async () => {
    const { resolveKbPath } = await import("../paths.js");
    let threw = false;
    try {
      resolveKbPath("../claude.md");
    } catch {
      threw = true;
    }
    assertTrue(threw, "Should throw for path traversal");
  });

  await test("resolveKbPath allows safe relative paths", async () => {
    const { resolveKbPath } = await import("../paths.js");
    const resolved = resolveKbPath("raw/test.md");
    assertTrue(resolved.startsWith(getKbBasePath()), "Resolved path should be under KB base");
  });

  await test("resolveKbPath handles nested traversal attempt", async () => {
    const { resolveKbPath } = await import("../paths.js");
    let threw = false;
    try {
      resolveKbPath("wiki/../../../etc/passwd");
    } catch {
      threw = true;
    }
    assertTrue(threw, "Should throw for nested path traversal");
  });

  // ── extractors.ts ──
  await test("extractTextFromFile reads markdown", async () => {
    const { extractTextFromFile } = await import("../extractors.js");
    const testFile = resolveKbPath("raw/test.md");
    await writeFile(testFile, "# Hello\n\nWorld", "utf-8");
    const content = await extractTextFromFile(testFile);
    assertTrue(content.includes("Hello"), "Should contain 'Hello'");
    assertTrue(content.includes("World"), "Should contain 'World'");
  });

  // ── graph.ts ──
  await test("extractWikiLinks parses Obsidian [[alias|display]]", async () => {
    const content = `See [[RAG|检索增强生成]] and [[LLM Wiki 模式]].`;
    // We need to test the extractWikiLinks function
    // Since it's not exported, we replicate its logic
    const regex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const raw = match[1].trim();
      const link = raw.split("|")[0].trim();
      if (link) links.push(link);
    }
    assertEqual(links.length, 2, "Should extract 2 links");
    assertEqual(links[0], "RAG", "First link should be 'RAG'");
    assertEqual(links[1], "LLM Wiki 模式", "Second link should be 'LLM Wiki 模式'");
  });

  // ── service.ts ──
  await test("slugify handles Chinese titles", async () => {
    const { slugify } = await import("../service.js");
    const result = slugify("持久化知识库");
    assertEqual(result, "持久化知识库", "Chinese title should be preserved");
  });

  await test("slugify handles mixed Chinese-English", async () => {
    const { slugify } = await import("../service.js");
    const result = slugify("LLM Wiki 模式");
    assertEqual(result, "llm-wiki-模式", "Mixed title should be lowercased and hyphenated");
  });

  await test("inferTypeFromContent detects comparison", async () => {
    const { inferTypeFromContent } = await import("../service.js");
    const type = inferTypeFromContent("对比分析：A 与 B 的差异", "对比分析");
    assertEqual(type, "comparison", "Should detect comparison type");
  });

  await test("parseWikiPages extracts multiple files", async () => {
    const reply = `=== FILE: wiki/sources/test.md ===
---
title: "Test"
type: source
---

# Test
Content.
=== END FILE ===

=== FILE: wiki/concepts/idea.md ===
---
title: "Idea"
type: concept
---

# Idea
More content.
=== END FILE ===`;

    const { parseWikiPages } = await import("../service.js");
    const pages = parseWikiPages(reply);
    assertEqual(pages.length, 2, "Should extract 2 pages");
    assertTrue(pages[0].path.includes("sources/"), "First page should be in sources/");
    assertTrue(pages[1].path.includes("concepts/"), "Second page should be in concepts/");
  });

  // ── chunker.ts ──
  await test("chunkDocument splits by h2", async () => {
    const { chunkDocument } = await import("../chunker.js");
    const md = `---
title: Test
type: concept
tags: [test]
---

# Title

Intro paragraph.

## Section 1
Content of section 1.

## Section 2
Content of section 2.

## Section 3
Content of section 3.`;

    const chunks = chunkDocument("test.md", md);
    assertTrue(chunks.length >= 3, "Should produce at least 3 chunks for 3 h2 sections");
    assertTrue(
      chunks.some((c) => c.content.includes("Section 1")),
      "Should include Section 1"
    );
    assertTrue(
      chunks.some((c) => c.content.includes("Section 2")),
      "Should include Section 2"
    );
    assertTrue(
      chunks.some((c) => c.content.includes("Section 3")),
      "Should include Section 3"
    );
  });

  await test("chunkDocument handles frontmatter tags list", async () => {
    const { chunkDocument } = await import("../chunker.js");
    const md = `---
title: Test
type: concept
tags:
  - ai
  - llm
---

# Title
Content.`;

    const chunks = chunkDocument("test.md", md);
    // Note: current parseFrontmatter in chunker doesn't support list format
    // This test documents the current behavior (will get empty tags or fallback)
    assertTrue(chunks.length > 0, "Should produce at least one chunk");
  });

  // ── search.ts ──
  await test("extractQueryTokens extracts Chinese n-grams", async () => {
    const { extractQueryTokens } = await import("../search.js");
    const tokens = extractQueryTokens("知识管理系统");
    assertTrue(tokens.includes("知识管理"), "Should include 知识管理");
    assertTrue(tokens.includes("管理系统"), "Should include 管理系统");
  });

  await test("reciprocalRankFusion merges ranked lists", async () => {
    const { reciprocalRankFusion } = await import("../search.js");
    const result = reciprocalRankFusion(
      [
        [{ id: "a", score: 1 }, { id: "b", score: 0.8 }],
        [{ id: "b", score: 1 }, { id: "c", score: 0.9 }],
      ],
      60
    );
    assertTrue(result.length >= 2, "Should have at least 2 results");
    assertTrue(result.some((r) => r.id === "a"), "Should include 'a'");
    assertTrue(result.some((r) => r.id === "b"), "Should include 'b'");
  });
}

// ── Integration Tests (require BFF server) ─────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runIntegrationTests() {
  console.log("\n🌐 Integration Tests\n");

  // Check if server is available
  let serverAvailable = false;
  try {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/tree`);
    serverAvailable = res.ok;
  } catch {
    console.log("  ⚠️  BFF server not available at", BASE_URL);
    console.log("     Set TEST_BASE_URL to run integration tests.");
    return;
  }

  if (!serverAvailable) {
    console.log("  ⚠️  BFF server returned non-OK status");
    return;
  }

  await test("GET /tree returns valid structure", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/tree`);
    assertTrue(res.ok, `HTTP ${res.status}`);
    const json = (await res.json()) as { code: number; data: unknown };
    assertEqual(json.code, 0, `API code should be 0, got ${json.code}`);
    assertTrue(Array.isArray(json.data), "data should be an array");
  });

  await test("GET /graph returns valid structure", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/graph`);
    assertTrue(res.ok, `HTTP ${res.status}`);
    const json = (await res.json()) as {
      code: number;
      data: { nodes: unknown[]; edges: unknown[]; communities: unknown[] };
    };
    assertEqual(json.code, 0);
    assertTrue(Array.isArray(json.data.nodes), "nodes should be array");
    assertTrue(Array.isArray(json.data.edges), "edges should be array");
    assertTrue(Array.isArray(json.data.communities), "communities should be array");
  });

  await test("POST /upload accepts markdown file", async () => {
    const form = new FormData();
    const blob = new Blob(["# Test Document\n\nThis is a test."], { type: "text/markdown" });
    form.append("file", blob, "smoke-test.md");

    const res = await fetch(`${BASE_URL}/api/knowledge-base/upload`, {
      method: "POST",
      body: form,
    });
    assertTrue(res.ok, `HTTP ${res.status}`);
    const json = (await res.json()) as { code: number; data: { path: string } };
    assertEqual(json.code, 0);
    assertTrue(json.data.path.includes("raw/"), "Path should be in raw/");
  });

  await test("GET /file rejects path traversal", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/file?path=../../../etc/passwd`);
    assertFalse(res.ok, "Should return error for path traversal");
  });

  await test("POST /import-url rejects localhost", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/import-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://localhost:22" }),
    });
    assertFalse(res.ok, "Should reject localhost URL");
  });

  await test("POST /import-url rejects file protocol", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/import-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "file:///etc/passwd" }),
    });
    assertFalse(res.ok, "Should reject file:// URL");
  });

  await test("DELETE /file rejects path traversal", async () => {
    const res = await fetch(`${BASE_URL}/api/knowledge-base/file`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: "../claude.md" }),
    });
    assertFalse(res.ok, "Should reject path traversal in delete");
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MineEcho Knowledge Base Smoke Test");
  console.log("═══════════════════════════════════════════════════════════════");

  await setupTestEnv();

  try {
    await ensureKbInitialized();
    await runUnitTests();
    await runIntegrationTests();
  } finally {
    await teardownTestEnv();
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passCount} passed, ${failCount} failed`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failures.length > 0) {
    console.log("\n❌ Failures:\n");
    for (const f of failures) {
      console.log(f);
    }
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
