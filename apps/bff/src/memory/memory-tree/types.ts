/**
 * Memory Tree System - Type Definitions
 * Hierarchical summarization for long-term memory
 * Version 2.0 - Auto-compression enabled
 */

import type { Entity, KnowledgeNode, KnowledgeEdge } from "../types.js";

// ============================================================================
// Configuration
// ============================================================================

export interface MemoryTreeConfig {
  /** Maximum tokens per L0 chunk */
  l0ChunkMaxTokens: number;
  /** Token budget to trigger L0 → L1 seal */
  l0SealThreshold: number;
  /** Target tokens for L1 summary */
  l1SummaryTokens: number;
  /** Number of L0 chunks to merge into one L1 */
  l1Fanout: number;
  /** Target tokens for L2 summary */
  l2SummaryTokens: number;
  /** Number of L1 summaries to merge into one L2 */
  l2Fanout: number;
  /** Target tokens for L3 summary */
  l3SummaryTokens: number;
  /** Number of L2 summaries to merge into one L3 */
  l3Fanout: number;
  /** Maximum L0 chunks to keep in memory */
  l0MaxInMemory: number;
}

/**
 * Quota configuration for each memory level
 * User-facing limits for memory storage
 */
export interface QuotaConfig {
  /** L0 working memory limit (tokens) */
  l0Limit: number;
  /** L1 daily summaries limit (tokens) */
  l1Limit: number;
  /** L2 weekly summaries limit (tokens) */
  l2Limit: number;
  /** L3 monthly archives limit (0 = unlimited) */
  l3Limit: number;
  /** Threshold percentage to trigger auto-compression (0-1) */
  compressThreshold: number;
  /** Maximum L0 tokens per day to prevent burst */
  l0DailyLimit: number;
}

/**
 * Current quota usage for a user
 */
export interface QuotaUsage {
  /** User ID */
  userId: string;
  /** L0 tokens used */
  l0Used: number;
  /** L1 tokens used */
  l1Used: number;
  /** L2 tokens used */
  l2Used: number;
  /** L3 tokens used */
  l3Used: number;
  /** Total tokens used */
  totalUsed: number;
  /** L0 chunks count */
  l0Chunks: number;
  /** L1 summaries count */
  l1Count: number;
  /** L2 summaries count */
  l2Count: number;
  /** L3 summaries count */
  l3Count: number;
  /** Quota limit info */
  quota: QuotaConfig;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Quota status level for UI display
 */
export type QuotaStatus = "normal" | "warning" | "alert";

/**
 * Compression priority for background queue
 */
export enum CompressionPriority {
  /** High importance - never compress */
  HIGH = 3,
  /** Normal importance - compress after low */
  NORMAL = 2,
  /** Low importance - compress first */
  LOW = 1,
}

/**
 * Compression job in the background queue
 */
export interface CompressionJob {
  id: string;
  userId: string;
  sourceLevel: 0 | 1 | 2;
  targetLevel: 1 | 2 | 3;
  itemIds: string[];
  priority: CompressionPriority;
  createdAt: number;
  scheduledAt?: number;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

/**
 * Result of a compression operation
 */
export interface CompressionResult {
  success: boolean;
  sourceLevel: 0 | 1 | 2;
  targetLevel: 1 | 2 | 3;
  compressedItems: number;
  outputSummaryId?: string;
  tokensFreed: number;
  error?: string;
}

export const DEFAULT_MEMORY_TREE_CONFIG: MemoryTreeConfig = {
  l0ChunkMaxTokens: 3000,
  l0SealThreshold: 21000,      // 7 * 3000
  l1SummaryTokens: 500,
  l1Fanout: 7,
  l2SummaryTokens: 800,
  l2Fanout: 7,
  l3SummaryTokens: 1000,
  l3Fanout: 4,
  l0MaxInMemory: 100,
};

/**
 * Default quota configuration for auto-compression
 * Scaled for complex development scenarios
 */
export const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  /** L0: 200K tokens (~100 complex conversations) */
  l0Limit: 200_000,
  /** L1: 1M tokens (~1000 days ≈ 3 years) */
  l1Limit: 1_000_000,
  /** L2: 5M tokens (~500 weeks ≈ 10 years) */
  l2Limit: 5_000_000,
  /** L3: Unlimited */
  l3Limit: 0,
  /** Trigger compression at 80% usage */
  compressThreshold: 0.8,
  /** Max 50K tokens per day to prevent burst */
  l0DailyLimit: 50_000,
};

/**
 * Calculate quota status based on usage percentage
 */
export function getQuotaStatus(used: number, limit: number, threshold: number = 0.8): QuotaStatus {
  if (limit === 0) return "normal"; // Unlimited
  const percentage = used / limit;
  if (percentage >= threshold) return "alert";
  if (percentage >= threshold * 0.8) return "warning";
  return "normal";
}

// ============================================================================
// Content Sources
// ============================================================================

export type MemorySource = "conversation" | "document" | "skill" | "knowledge" | "manual" | "meeting";

export interface MemorySourceRef {
  type: MemorySource;
  id: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// L0 Buffer (New Content Chunks)
// ============================================================================

export interface L0Chunk {
  id: string;
  userId: string;
  source: MemorySource;
  content: string;
  tokenCount: number;
  createdAt: number;
  embeddedAt?: number;
  entityTags: string[];
  sourceRef?: MemorySourceRef;
  importance: number;
}

export interface L0ChunkInput {
  source: MemorySource;
  content: string;
  sourceRef?: MemorySourceRef;
  importance?: number;
  entityTags?: string[];
}

// ============================================================================
// L1 Daily Summaries
// ============================================================================

export interface L1Summary {
  id: string;
  userId: string;
  date: string;              // YYYY-MM-DD
  summary: string;
  tokenCount: number;
  childIds: string[];        // L0 chunk IDs
  createdAt: number;
  embedding?: number[];     // Summary embedding vector
}

export interface L1SummaryInput {
  date: string;
  summary: string;
  childIds: string[];
}

// ============================================================================
// L2 Weekly Summaries
// ============================================================================

export interface L2Summary {
  id: string;
  userId: string;
  weekStart: string;         // YYYY-WXX (ISO week)
  summary: string;
  tokenCount: number;
  childIds: string[];      // L1 summary IDs
  createdAt: number;
  embedding?: number[];
}

// ============================================================================
// L3 Monthly Summaries
// ============================================================================

export interface L3Summary {
  id: string;
  userId: string;
  month: string;            // YYYY-MM
  summary: string;
  tokenCount: number;
  childIds: string[];      // L2 summary IDs
  createdAt: number;
  embedding?: number[];
}

// ============================================================================
// Entities and Relations
// ============================================================================

export type EntityKind = "person" | "project" | "concept" | "technology" | "location" | "organization" | "event";

export interface MemoryEntity {
  id: string;
  userId: string;
  name: string;
  kind: EntityKind;
  mentions: number;
  lastSeen: number;
  createdAt: number;
}

export interface MemoryRelation {
  id: string;
  userId: string;
  subjectId: string;
  predicate: string;
  objectId: string;
  evidence: string;
  strength: number;
  createdAt: number;
}

// ============================================================================
// Tree Memory (Combined Structure)
// ============================================================================

export interface TreeNode {
  id: string;
  level: 0 | 1 | 2 | 3;
  content: string;
  tokenCount: number;
  childIds: string[];
  parentId?: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface TreeBranch {
  source: MemorySource;
  rootId: string;
  level: number;
  nodes: TreeNode[];
}

// ============================================================================
// Recall and Retrieval
// ============================================================================

export interface RecallOptions {
  /** Maximum tokens to return */
  maxTokens?: number;
  /** Time range to search */
  timeRange?: TimeRange;
  /** Sources to include */
  sources?: MemorySource[];
  /** Minimum importance threshold */
  minImportance?: number;
  /** Include entity context */
  includeEntities?: boolean;
}

export interface TimeRange {
  start?: number;   // Unix timestamp
  end?: number;
}

export interface RecallResult {
  /** Formatted text for context injection */
  text: string;
  /** Individual L0 chunks (if requested) */
  l0Chunks?: L0Chunk[];
  /** L1 summaries included */
  l1Summaries?: L1Summary[];
  /** L2 summaries included */
  l2Summaries?: L2Summary[];
  /** L3 summaries included */
  l3Summaries?: L3Summary[];
  /** Entities found */
  entities: MemoryEntity[];
  /** Total tokens used */
  totalTokens: number;
  /** Relevance scores */
  scores: {
    l0: number;
    l1: number;
    l2: number;
    l3: number;
    entity: number;
  };
}

// ============================================================================
// Memory Context (for LLM)
// ============================================================================

export interface MemoryContext {
  /** Working memory - recent messages */
  workingMemory: {
    messages: Array<{ role: string; content: string }>;
    context: Record<string, unknown>;
  };
  /** Short-term memory - today's data */
  shortTermMemory: {
    interactions: string[];
    tasks: string[];
    preferences: string[];
  };
  /** Tree memory - hierarchical summaries */
  treeMemory: {
    l0Context: string;
    l1Context: string;
    l2Context: string;
    l3Context: string;
  };
  /** Long-term memory - user profile */
  longTermMemory: {
    userProfile?: string;
    skills?: string[];
    projects?: string[];
  };
  /** Extracted entities */
  entities: Array<{ name: string; kind: EntityKind; description?: string }>;
  /** Total context tokens */
  totalTokens: number;
}

// ============================================================================
// Summary Generation
// ============================================================================

export interface SummaryInput {
  level: 1 | 2 | 3;
  content: string[];
  childIds: string[];
  metadata?: Record<string, unknown>;
}

export interface SummaryOutput {
  summary: string;
  tokenCount: number;
  keyPoints: string[];
  entities: Array<{ name: string; kind: EntityKind }>;
  relations: Array<{ from: string; to: string; label: string }>;
}

// ============================================================================
// Unified Memory Item (for aggregated queries)
// ============================================================================

/**
 * Unified memory item interface for cross-level queries
 */
export interface MemoryItem {
  id: string;
  userId: string;
  level: 0 | 1 | 2 | 3;
  source: MemorySource;
  content: string;
  tokenCount: number;
  createdAt: number;
  dateKey: string;        // date (L1), weekStart (L2), month (L3), or date string (L0)
  importance: number;
  childCount: number;     // Number of child items (0 for L0)
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated query options
 */
export interface AggregatedQueryOptions {
  /** Time range in milliseconds (defaults to all available) */
  timeRange?: TimeRange;
  /** Sources to include (defaults to all) */
  sources?: MemorySource[];
  /** Minimum importance threshold (0-1) */
  minImportance?: number;
  /** Maximum items to return */
  limit?: number;
  /** Sort order */
  sortBy?: "createdAt" | "importance" | "tokenCount";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
  /** Include archived L0 chunks */
  includeArchived?: boolean;
}

/**
 * Result of aggregated query
 */
export interface AggregatedQueryResult {
  items: MemoryItem[];
  totalTokens: number;
  levelBreakdown: {
    l0: number;
    l1: number;
    l2: number;
    l3: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

// ============================================================================
// API Types
// ============================================================================

export interface StoreChunkRequest {
  source: MemorySource;
  content: string;
  sourceRef?: MemorySourceRef;
  importance?: number;
}

export interface StoreChunkResponse {
  chunkId: string;
  tokenCount: number;
  sealed: boolean;       // Whether this triggered a seal
  sealResult?: {
    level: 1 | 2 | 3;
    summaryId: string;
  };
}

export interface GenerateSummaryRequest {
  level: 1 | 2 | 3;
  date?: string;         // For L1
  weekStart?: string;   // For L2
  month?: string;       // For L3
  force?: boolean;      // Force regeneration
}

export interface GenerateSummaryResponse {
  summaryId: string;
  summary: string;
  tokenCount: number;
  childIds: string[];
  createdAt: number;
}

export interface RecallRequest {
  query: string;
  options?: RecallOptions;
}

export interface RecallResponse {
  context: MemoryContext;
  result: RecallResult;
}

export interface RecapRequest {
  timeRange: TimeRange;
  maxTokens?: number;
}

export interface RecapResponse {
  recap: string;
  summaries: Array<{
    level: 1 | 2 | 3;
    id: string;
    preview: string;
    date: string;
  }>;
  totalTokens: number;
}

export interface GetTreeRequest {
  source?: MemorySource;
  date?: string;
}

export interface GetTreeResponse {
  tree: {
    l0: L0Chunk[];
    l1: L1Summary[];
    l2: L2Summary[];
    l3: L3Summary[];
  };
  stats: {
    totalChunks: number;
    totalSummaries: number;
    tokenBudget: {
      used: number;
      limit: number;
    };
  };
}

// ============================================================================
// Tree Manager Interface
// ============================================================================

export interface IMemoryTreeManager {
  // Storage
  storeChunk(userId: string, input: L0ChunkInput): Promise<L0Chunk>;
  getChunks(userId: string, options?: { date?: string; source?: MemorySource; limit?: number }): Promise<L0Chunk[]>;
  deleteChunk(userId: string, chunkId: string): Promise<boolean>;

  // Summarization
  generateL1Summary(userId: string, date?: string): Promise<L1Summary>;
  generateL2Summary(userId: string, weekStart?: string): Promise<L2Summary>;
  generateL3Summary(userId: string, month?: string): Promise<L3Summary>;
  getSummary(userId: string, level: 1 | 2 | 3, key: string): Promise<L1Summary | L2Summary | L3Summary | null>;

  // Recall
  recall(userId: string, query: string, options?: RecallOptions): Promise<RecallResult>;
  buildContext(userId: string, query: string, maxTokens?: number): Promise<MemoryContext>;

  // Tree operations
  maybeSeal(userId: string): Promise<{ sealed: boolean; level?: 1 | 2 | 3; summaryId?: string }>;
  getTree(userId: string, options?: GetTreeRequest): Promise<GetTreeResponse>;

  // Entities
  extractEntities(userId: string, content: string): Promise<MemoryEntity[]>;
  getEntities(userId: string, kind?: EntityKind): Promise<MemoryEntity[]>;
  searchEntities(userId: string, query: string): Promise<MemoryEntity[]>;

  // Relations
  addRelation(userId: string, relation: Omit<MemoryRelation, "id" | "createdAt">): Promise<MemoryRelation>;
  getRelations(userId: string, entityId?: string): Promise<MemoryRelation[]>;
}

// ============================================================================
// Utility Types
// ============================================================================

export function isL1Summary(obj: any): obj is L1Summary {
  return obj && typeof obj.date === "string" && obj.level === undefined;
}

export function isL2Summary(obj: any): obj is L2Summary {
  return obj && typeof obj.weekStart === "string" && obj.level === undefined;
}

export function isL3Summary(obj: any): obj is L3Summary {
  return obj && typeof obj.month === "string" && obj.level === undefined;
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, "0")}`;
}

export function getMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
