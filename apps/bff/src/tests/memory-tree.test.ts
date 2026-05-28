/**
 * Memory Tree System Integration Tests
 *
 * Tests core API endpoints and methods:
 * - MemoryTreeManager instantiation
 * - storeChunk (addMemory)
 * - recall (queryMemory)
 * - aggregatedQuery
 * - getQuotaUsage
 * - getCompressionQueueStatus
 *
 * Run with: npx tsx src/tests/memory-tree.test.ts
 */

import assert from "node:assert";
import { MemoryTreeManager } from "../memory/memory-tree/tree-manager.js";
import {
  DEFAULT_MEMORY_TREE_CONFIG,
  DEFAULT_QUOTA_CONFIG,
  getWeekStart,
  type L0ChunkInput,
} from "../memory/memory-tree/types.js";
import { storeL1Summary, storeL2Summary } from "../memory/memory-tree/tree-db.js";

// Test configuration - use test user IDs
const TEST_USER_ID = "test-user-memory-tree";
const TEST_USER_ID_2 = "test-user-memory-tree-2";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper function for assertions with better error messages
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`${message}\nValue is undefined or null`);
  }
}

function assertTrue(value: boolean, message: string) {
  if (!value) {
    throw new Error(`${message}`);
  }
}

// ============================================================================
// Test Suite: MemoryTreeManager
// ============================================================================

async function testMemoryTreeManagerInstantiation() {
  const testName = "MemoryTreeManager instantiation";
  const start = Date.now();

  try {
    // Test with default config
    const manager = new MemoryTreeManager();
    assertDefined(manager, "Manager should be defined");

    // Test with custom config
    const customConfig = {
      ...DEFAULT_MEMORY_TREE_CONFIG,
      l0ChunkMaxTokens: 5000,
      l0SealThreshold: 25000,
    };
    const customManager = new MemoryTreeManager(customConfig, DEFAULT_QUOTA_CONFIG);
    assertDefined(customManager, "Custom config manager should be defined");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testStoreChunk() {
  const testName = "storeChunk (addMemory)";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-store-${Date.now()}`;

    // Test 1: Store a conversation chunk
    const conversationChunk: L0ChunkInput = {
      source: "conversation",
      content: "I worked on the new feature today. Implemented the user authentication module.",
      importance: 0.7,
      entityTags: ["authentication", "feature"],
    };

    const result1 = await manager.storeChunk(testUserId, conversationChunk);
    assertDefined(result1.chunk, "Chunk should be defined");
    assertEqual(result1.chunk.source, "conversation", "Source should be conversation");
    assertTrue(result1.chunk.content.includes("authentication"), "Content should include keyword");
    assertTrue(result1.chunk.tokenCount > 0, "Token count should be positive");
    assertTrue(result1.chunk.id.startsWith("l0-"), "Chunk ID should start with l0-");

    // Test 2: Store a document chunk
    const documentChunk: L0ChunkInput = {
      source: "document",
      content: "Project requirements document for Q2 features.",
      importance: 0.9,
    };

    const result2 = await manager.storeChunk(testUserId, documentChunk);
    assertDefined(result2.chunk, "Document chunk should be defined");
    assertEqual(result2.chunk.source, "document", "Source should be document");

    // Test 3: Store multiple chunks and check quota
    for (let i = 0; i < 5; i++) {
      await manager.storeChunk(testUserId, {
        source: "conversation",
        content: `Test conversation ${i} for token count verification.`,
        importance: 0.5,
      });
    }

    const chunks = manager.getChunks(testUserId);
    assertTrue(chunks.length >= 7, `Should have at least 7 chunks, got ${chunks.length}`);

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testRecall() {
  const testName = "recall (queryMemory)";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-recall-${Date.now()}`;

    // First, store some memories
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "I am working on the authentication feature for the project.",
      importance: 0.8,
    });

    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "The authentication module needs to be tested before deployment.",
      importance: 0.7,
    });

    await manager.storeChunk(testUserId, {
      source: "document",
      content: "Meeting notes about the authentication requirements.",
      importance: 0.6,
    });

    // Wait a moment for entity extraction
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 1: Recall with a query
    const recallResult = await manager.recall(testUserId, "authentication", {
      maxTokens: 2000,
    });

    assertDefined(recallResult, "Recall result should be defined");
    assertTrue(recallResult.totalTokens >= 0, "Total tokens should be non-negative");
    assertDefined(recallResult.scores, "Scores should be defined");
    assertTrue("l0" in recallResult.scores, "Scores should have l0 key");
    assertTrue("l1" in recallResult.scores, "Scores should have l1 key");

    // Test 2: Recall with time range
    const now = Date.now();
    const recallWithTimeRange = await manager.recall(testUserId, "project", {
      maxTokens: 1000,
      timeRange: {
        start: now - 24 * 60 * 60 * 1000, // Last 24 hours
        end: now,
      },
    });

    assertDefined(recallWithTimeRange, "Recall with time range should work");

    // Test 3: Empty recall for non-existent content
    const emptyRecall = await manager.recall(testUserId, "xyznonexistent12345");
    assertTrue(emptyRecall.text !== undefined, "Empty recall should still return text");

    // Test 4: Semantic recall should recover related Chinese memories even when wording differs
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "我前几天研究了 HCI 里的费茨定律、认知负荷和交互反馈。",
      importance: 0.8,
    });
    const semanticRecall = await manager.recall(testUserId, "之前问过哪些人机交互的问题？", {
      maxTokens: 2000,
    });
    assertTrue(
      semanticRecall.l0Chunks.some((chunk) => chunk.content.includes("费茨定律")),
      "Semantic recall should include HCI memory even without exact query wording"
    );

    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "我希望 MineEcho 能把普通聊天、任务执行和工具输出都做上下文预算，避免 token 成本失控。",
      importance: 0.78,
    });
    const vectorRecall = await manager.recall(testUserId, "怎么降低对话和任务里的上下文消耗？", {
      maxTokens: 2000,
    });
    assertTrue(
      vectorRecall.l0Chunks.some((chunk) => chunk.content.includes("上下文预算")),
      "Vector recall should include cost-control memory with related wording"
    );

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testRecallFiltersSummariesByRelevance() {
  const testName = "recall filters L1/L2 summaries by relevance";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-summary-recall-${Date.now()}`;
    const now = Date.now();

    storeL1Summary({
      id: `l1-${testUserId}-hci`,
      userId: testUserId,
      date: "2026-05-27",
      summary: "用户讨论了 HCI 人机交互、用户体验、认知负荷、费茨定律和反馈机制。",
      tokenCount: 40,
      childIds: [],
      createdAt: now,
    });
    storeL1Summary({
      id: `l1-${testUserId}-food`,
      userId: testUserId,
      date: "2026-05-28",
      summary: "用户记录了晚饭、牛奶采购和日常杂事安排。",
      tokenCount: 30,
      childIds: [],
      createdAt: now + 1,
    });
    storeL2Summary({
      id: `l2-${testUserId}-hci`,
      userId: testUserId,
      weekStart: getWeekStart(new Date(now)),
      summary: "本周围绕 HCI、交互设计、用户体验和反馈机制进行了多次讨论。",
      tokenCount: 40,
      childIds: [],
      createdAt: now,
    });

    const recall = await manager.recall(testUserId, "之前问过哪些用户体验和交互设计问题？", {
      maxTokens: 2000,
      timeRange: {
        start: now - 14 * 24 * 60 * 60 * 1000,
        end: now + 1,
      },
    });

    assertTrue(
      recall.l1Summaries.some((summary) => summary.summary.includes("HCI") || summary.summary.includes("交互")),
      "Relevant L1 summary should be included"
    );
    assertTrue(
      !recall.l1Summaries.some((summary) => summary.summary.includes("晚饭")),
      "Irrelevant recent L1 summary should not be included"
    );
    assertTrue(
      recall.l2Summaries.some((summary) => summary.summary.includes("HCI") || summary.summary.includes("交互")),
      "Relevant L2 summary should be included for longer time ranges"
    );

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`  ✗ ${testName} (${Date.now() - start}ms)`);
    console.log(`    Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testAggregatedQuery() {
  const testName = "aggregatedQuery";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-agg-${Date.now()}`;

    // Store some chunks
    for (let i = 0; i < 10; i++) {
      await manager.storeChunk(testUserId, {
        source: i % 2 === 0 ? "conversation" : "document",
        content: `Test memory item ${i} with specific keyword ${i}`,
        importance: i / 10,
      });
    }

    // Test 1: Basic aggregated query
    const now = Date.now();
    const aggResult = await manager.aggregatedQuery(testUserId, {
      timeRange: {
        start: now - 7 * 24 * 60 * 60 * 1000,
        end: now,
      },
      limit: 20,
    });

    assertDefined(aggResult, "Aggregated query result should be defined");
    assertDefined(aggResult.items, "Items array should be defined");
    assertTrue(aggResult.items.length <= 20, `Items should be limited to 20, got ${aggResult.items.length}`);
    assertDefined(aggResult.levelBreakdown, "Level breakdown should be defined");
    assertTrue("l0" in aggResult.levelBreakdown, "Level breakdown should have l0");
    assertTrue(aggResult.totalTokens >= 0, "Total tokens should be non-negative");

    // Test 2: Aggregated query with source filter
    const convResult = await manager.aggregatedQuery(testUserId, {
      sources: ["conversation"],
      limit: 5,
    });

    assertDefined(convResult, "Source-filtered query should work");
    // Check that all items have the correct source
    for (const item of convResult.items) {
      assertEqual(item.source, "conversation", "Source should be conversation");
    }

    // Test 3: Aggregated query with sorting
    const sortedResult = await manager.aggregatedQuery(testUserId, {
      sortBy: "importance",
      sortOrder: "desc",
      limit: 5,
    });

    assertDefined(sortedResult, "Sorted query should work");
    if (sortedResult.items.length > 1) {
      for (let i = 1; i < sortedResult.items.length; i++) {
        assertTrue(
          sortedResult.items[i - 1].importance >= sortedResult.items[i].importance,
          "Items should be sorted by importance descending"
        );
      }
    }

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testGetQuotaUsage() {
  const testName = "getQuotaUsage";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-quota-${Date.now()}`;

    // Test 1: Initial quota (empty)
    const initialQuota = manager.getQuotaUsage(testUserId);
    assertDefined(initialQuota, "Initial quota should be defined");
    assertEqual(initialQuota.userId, testUserId, "User ID should match");
    assertTrue(initialQuota.l0Used >= 0, "L0 used should be non-negative");
    assertTrue(initialQuota.l1Used >= 0, "L1 used should be non-negative");
    assertTrue(initialQuota.l2Used >= 0, "L2 used should be non-negative");
    assertTrue(initialQuota.l3Used >= 0, "L3 used should be non-negative");
    assertDefined(initialQuota.quota, "Quota config should be defined");
    assertTrue(initialQuota.quota.l0Limit >= 0, "L0 limit should be defined");

    // Test 2: After storing chunks
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "Testing quota tracking with this longer content to ensure token counting works correctly.",
      importance: 0.7,
    });

    await manager.storeChunk(testUserId, {
      source: "document",
      content: "Document content for quota verification purposes.",
      importance: 0.5,
    });

    const afterStoreQuota = manager.getQuotaUsage(testUserId);
    assertTrue(afterStoreQuota.l0Used > 0, "L0 used should be positive after storing");
    assertTrue(afterStoreQuota.l0Chunks > 0, "L0 chunks count should be positive");
    assertTrue(afterStoreQuota.totalUsed > 0, "Total used should be positive");

    // Test 3: Quota config structure
    assertTrue(afterStoreQuota.quota.l0Limit > 0, "L0 limit should be defined in quota config");
    assertTrue(afterStoreQuota.quota.l1Limit > 0, "L1 limit should be defined in quota config");
    assertTrue(afterStoreQuota.quota.compressThreshold > 0, "Compress threshold should be defined");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testGetCompressionQueueStatus() {
  const testName = "getCompressionQueueStatus";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-compress-${Date.now()}`;

    // Test 1: Initial status (empty queue)
    const initialStatus = manager.getCompressionQueueStatus();
    assertDefined(initialStatus, "Initial status should be defined");
    assertTrue(typeof initialStatus.pending === "number", "Pending should be a number");
    assertTrue(typeof initialStatus.running === "number", "Running should be a number");
    assertTrue(typeof initialStatus.total === "number", "Total should be a number");
    assertTrue(initialStatus.pending >= 0, "Pending should be non-negative");
    assertTrue(initialStatus.running >= 0, "Running should be non-negative");
    assertTrue(initialStatus.total >= 0, "Total should be non-negative");

    // Test 2: Enqueue a compression job
    manager.enqueueCompression({
      userId: testUserId,
      sourceLevel: 0,
      targetLevel: 1,
      itemIds: [],
      priority: 2, // NORMAL
    });

    const afterEnqueueStatus = manager.getCompressionQueueStatus();
    assertTrue(afterEnqueueStatus.total > initialStatus.total, "Total should increase after enqueue");
    assertTrue(afterEnqueueStatus.pending >= afterEnqueueStatus.total - afterEnqueueStatus.running,
      "Pending + running should equal total");

    // Test 3: Enqueue multiple jobs
    manager.enqueueCompression({
      userId: testUserId,
      sourceLevel: 0,
      targetLevel: 1,
      itemIds: [],
      priority: 3, // HIGH
    });

    const multiJobStatus = manager.getCompressionQueueStatus();
    assertTrue(multiJobStatus.total >= 2, "Should have at least 2 jobs after enqueueing 2");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testTreeStats() {
  const testName = "getTreeStats";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-stats-${Date.now()}`;

    // Get initial stats
    const initialStats = manager.getTreeStats(testUserId);
    assertDefined(initialStats, "Initial stats should be defined");
    assertTrue(typeof initialStats.l0Count === "number", "L0 count should be a number");
    assertTrue(typeof initialStats.l1Count === "number", "L1 count should be a number");
    assertTrue(typeof initialStats.l2Count === "number", "L2 count should be a number");
    assertTrue(typeof initialStats.l3Count === "number", "L3 count should be a number");
    assertTrue(typeof initialStats.entityCount === "number", "Entity count should be a number");

    // Store chunks and check stats update
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "Statistics tracking test content for verification.",
      importance: 0.8,
    });

    const afterStoreStats = manager.getTreeStats(testUserId);
    assertTrue(afterStoreStats.l0Count > initialStats.l0Count ||
      afterStoreStats.todayTokens > initialStats.todayTokens,
      "Stats should update after storing chunks");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testBuildContext() {
  const testName = "buildContext";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-context-${Date.now()}`;

    // Store some memories first
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "Building context for the memory tree system test.",
      importance: 0.7,
    });

    // Test build context
    const context = await manager.buildContext(testUserId, "memory", 2000);

    assertDefined(context, "Context should be defined");
    assertDefined(context.treeMemory, "Tree memory should be defined");
    assertDefined(context.shortTermMemory, "Short-term memory should be defined");
    assertDefined(context.longTermMemory, "Long-term memory should be defined");
    assertDefined(context.entities, "Entities should be defined");
    assertTrue(typeof context.totalTokens === "number", "Total tokens should be a number");

    // Check tree memory structure
    assertTrue(typeof context.treeMemory.l0Context === "string", "L0 context should be a string");
    assertTrue(typeof context.treeMemory.l1Context === "string", "L1 context should be a string");
    assertTrue(typeof context.treeMemory.l2Context === "string", "L2 context should be a string");
    assertTrue(typeof context.treeMemory.l3Context === "string", "L3 context should be a string");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

async function testEntityManagement() {
  const testName = "Entity management (searchEntities)";
  const start = Date.now();

  try {
    const manager = new MemoryTreeManager();
    const testUserId = `${TEST_USER_ID}-entity-${Date.now()}`;

    // Store chunks with entities
    await manager.storeChunk(testUserId, {
      source: "conversation",
      content: "I am working with TypeScript and React for the new project.",
      importance: 0.8,
      entityTags: ["TypeScript", "React"],
    });

    // Wait for entity extraction
    await new Promise(resolve => setTimeout(resolve, 200));

    // Test search entities
    const searchResult = manager.searchEntities(testUserId, "TypeScript");
    assertDefined(searchResult, "Search result should be defined");
    assertTrue(Array.isArray(searchResult), "Search result should be an array");

    // Test get entities
    const allEntities = manager.getEntities(testUserId);
    assertDefined(allEntities, "All entities should be defined");
    assertTrue(Array.isArray(allEntities), "All entities should be an array");

    results.push({
      name: testName,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`  ✗ ${testName}: ${(error as Error).message}`);
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("Memory Tree System - Integration Tests");
  console.log("=".repeat(60) + "\n");

  const testFunctions = [
    testMemoryTreeManagerInstantiation,
    testStoreChunk,
    testRecall,
    testRecallFiltersSummariesByRelevance,
    testAggregatedQuery,
    testGetQuotaUsage,
    testGetCompressionQueueStatus,
    testTreeStats,
    testBuildContext,
    testEntityManagement,
  ];

  for (const testFn of testFunctions) {
    await testFn();
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log("\nFailed Tests:");
    for (const result of results.filter(r => !r.passed)) {
      console.log(`  - ${result.name}`);
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log("=".repeat(60) + "\n");

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
