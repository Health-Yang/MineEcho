/**
 * useMemoryRecall Hook
 * Provides memory recall functionality for the chat system
 * Retrieves relevant memories based on user input and injects them as context
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "./useDebounce";

// ============================================================================
// Type Definitions (from BFF memory-tree types)
// ============================================================================

export type MemorySource = "conversation" | "document" | "skill" | "knowledge" | "manual" | "meeting";

export interface TimeRange {
  start?: number;
  end?: number;
}

export interface RecallOptions {
  maxTokens?: number;
  timeRange?: TimeRange;
  sources?: MemorySource[];
  minImportance?: number;
  includeEntities?: boolean;
}

export interface L0Chunk {
  id: string;
  userId: string;
  source: MemorySource;
  content: string;
  tokenCount: number;
  createdAt: number;
  entityTags: string[];
  importance: number;
}

export interface L1Summary {
  id: string;
  userId: string;
  date: string;
  summary: string;
  tokenCount: number;
  childIds: string[];
  createdAt: number;
}

export interface MemoryEntity {
  id: string;
  userId: string;
  name: string;
  kind: string;
  mentions: number;
  lastSeen: number;
  createdAt: number;
}

export interface RecallResult {
  text: string;
  l0Chunks?: L0Chunk[];
  l1Summaries?: L1Summary[];
  entities: MemoryEntity[];
  totalTokens: number;
  scores: {
    l0: number;
    l1: number;
    l2: number;
    l3: number;
    entity: number;
  };
}

export interface MemoryRecallState {
  recalling: boolean;
  result: RecallResult | null;
  error: string | null;
  formattedContext: string;
  memorySources: Array<{ id: string; type: MemorySource; preview: string; date: string }>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseMemoryRecallOptions {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Maximum number of memories to return (default: 3) */
  maxMemories?: number;
  /** Maximum tokens for context injection (default: 2000) */
  maxTokens?: number;
  /** Enable auto-recall on query change (default: true) */
  autoRecall?: boolean;
  /** Time range filter */
  timeRange?: TimeRange;
  /** Source filter */
  sources?: MemorySource[];
}

/**
 * useMemoryRecall Hook
 * Provides memory recall with debounced API calls and context formatting
 *
 * @param query - The user's input query to search memories against
 * @param options - Configuration options for the recall behavior
 * @returns Memory recall state and control functions
 *
 * @example
 * ```tsx
 * const { recalling, formattedContext, recall, clear } = useMemoryRecall(input, {
 *   debounceMs: 300,
 *   maxMemories: 3,
 * });
 *
 * // When sending a message
 * const context = await recall(input);
 * ```
 */
export function useMemoryRecall(
  query: string,
  options: UseMemoryRecallOptions = {}
) {
  const {
    debounceMs = 300,
    maxMemories = 3,
    maxTokens = 2000,
    autoRecall = true,
    timeRange,
    sources,
  } = options;

  const [state, setState] = useState<MemoryRecallState>({
    recalling: false,
    result: null,
    error: null,
    formattedContext: "",
    memorySources: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  // Debounce the query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, debounceMs);

  /**
   * Format recall result into a context string for injection into system prompt
   */
  const formatContext = useCallback(
    (result: RecallResult | null): { context: string; sources: MemoryRecallState["memorySources"] } => {
      if (!result || !result.text) {
        return { context: "", sources: [] };
      }

      const sources: MemoryRecallState["memorySources"] = [];

      // Collect sources from L0 chunks
      const chunks = (result.l0Chunks || []).slice(0, maxMemories);
      for (const chunk of chunks) {
        sources.push({
          id: chunk.id,
          type: chunk.source,
          preview: chunk.content.slice(0, 100) + (chunk.content.length > 100 ? "..." : ""),
          date: new Date(chunk.createdAt).toLocaleDateString("zh-CN"),
        });
      }

      // Collect sources from L1 summaries
      const summaries = (result.l1Summaries || []).slice(0, maxMemories - chunks.length);
      for (const summary of summaries) {
        sources.push({
          id: summary.id,
          type: "conversation" as MemorySource,
          preview: summary.summary.slice(0, 100) + (summary.summary.length > 100 ? "..." : ""),
          date: summary.date,
        });
      }

      // Format context text
      let contextText = "";

      // Add relevant entities if available
      if (result.entities && result.entities.length > 0) {
        const entityNames = result.entities.slice(0, 5).map((e) => e.name).join("、");
        contextText += `【相关实体】${entityNames}\n\n`;
      }

      // Add the main recalled text (truncated to maxTokens)
      let remainingTokens = maxTokens - contextText.length / 2; // Rough token estimate
      if (result.text.length / 2 > remainingTokens) {
        contextText += result.text.slice(0, remainingTokens * 2) + "...";
      } else {
        contextText += result.text;
      }

      return { context: contextText.trim(), sources };
    },
    [maxMemories, maxTokens]
  );

  /**
   * Perform memory recall
   */
  const recall = useCallback(
    async (searchQuery?: string): Promise<RecallResult | null> => {
      const q = searchQuery ?? debouncedQuery;

      // Skip empty or very short queries
      if (!q || q.trim().length < 2) {
        setState((prev) => ({
          ...prev,
          recalling: false,
          result: null,
          error: null,
          formattedContext: "",
          memorySources: [],
        }));
        return null;
      }

      // Skip if same query as last time
      if (q === lastQueryRef.current && state.result) {
        return state.result;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, recalling: true, error: null }));

      try {
        const controller = abortControllerRef.current;
        const recallOptions: RecallOptions = {
          maxTokens,
          ...(timeRange && { timeRange }),
          ...(sources && { sources }),
        };

        const response = await fetch("/api/memory/tree/recall", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: q,
            options: recallOptions,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Recall failed: ${response.status}`);
        }

        const data = await response.json();
        const result = data.result as RecallResult;

        lastQueryRef.current = q;

        // Format the context
        const { context, sources: memorySources } = formatContext(result);

        setState({
          recalling: false,
          result,
          error: null,
          formattedContext: context,
          memorySources,
        });

        return result;
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }

        console.error("[useMemoryRecall] Recall error:", error);

        setState((prev) => ({
          ...prev,
          recalling: false,
          error: error instanceof Error ? error.message : "Recall failed",
        }));

        return null;
      }
    },
    [debouncedQuery, maxTokens, timeRange, sources, formatContext, state.result]
  );

  /**
   * Clear recall state
   */
  const clear = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    lastQueryRef.current = "";
    setState({
      recalling: false,
      result: null,
      error: null,
      formattedContext: "",
      memorySources: [],
    });
  }, []);

  /**
   * Get formatted system prompt segment with memory context
   * This can be injected into the system prompt
   */
  const getMemoryContextForPrompt = useCallback((): string => {
    if (!state.formattedContext) {
      return "";
    }

    return `
【相关记忆上下文】
${state.formattedContext}

请根据以上记忆上下文，在回答中自然融入相关信息，保持回答的连贯性和上下文一致性。
`.trim();
  }, [state.formattedContext]);

  // Auto-recall when debounced query changes
  useEffect(() => {
    if (autoRecall && debouncedQuery && debouncedQuery.trim().length >= 2) {
      recall(debouncedQuery);
    } else if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      clear();
    }
  }, [debouncedQuery, autoRecall, recall, clear]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    recalling: state.recalling,
    result: state.result,
    error: state.error,
    formattedContext: state.formattedContext,
    memorySources: state.memorySources,

    // Computed
    hasMemories: state.result !== null && state.result.text.length > 0,
    relevanceScore: state.result?.scores
      ? (state.result.scores.l0 +
          state.result.scores.l1 +
          state.result.scores.l2 +
          state.result.scores.l3 +
          state.result.scores.entity) /
        5
      : 0,

    // Actions
    recall,
    clear,
    getMemoryContextForPrompt,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get human-readable source label
 */
export function getSourceLabel(source: MemorySource): string {
  const labels: Record<MemorySource, string> = {
    conversation: "对话",
    document: "文档",
    skill: "技能",
    knowledge: "知识",
    manual: "手动记忆",
    meeting: "会议",
  };
  return labels[source] || source;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString("zh-CN");
}
