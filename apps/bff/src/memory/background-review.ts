/**
 * Background Review Agent
 *
 * Periodically analyzes completed conversations (after the user receives the
 * response) and extracts high-value insights to write into long-term memory.
 * Solves the critical gap where short-term memories are lost after each day ends.
 *
 * Fire-and-forget: never blocks the user response.
 */

import { chatSend } from "../gateway/client.js";
import { longTermMemoryManager } from "./long-term-memory.js";
import { logger } from "../utils/logger.js";

export interface ReviewableTurn {
  userMessage: string;
  assistantContent: string;
  mode: string;
  timestamp: number;
}

const REVIEW_INTERVAL_TURNS = 10;
const sessionTurnCounts = new Map<string, number>();

/**
 * Call this after each completed turn (fire-and-forget).
 * It counts turns and triggers a background review every N turns.
 */
export async function onTurnCompleted(
  sessionId: string,
  userId: string,
  _turn: ReviewableTurn,
  recentTurns: ReviewableTurn[]
): Promise<void> {
  const count = (sessionTurnCounts.get(sessionId) || 0) + 1;
  sessionTurnCounts.set(sessionId, count);

  // Only review every N turns
  if (count % REVIEW_INTERVAL_TURNS !== 0) return;

  try {
    await runBackgroundReview(userId, recentTurns);
  } catch (error) {
    logger.error("[BackgroundReview] Review failed:", { error });
  }
}

export function clearSessionTurnCount(sessionId: string): void {
  sessionTurnCounts.delete(sessionId);
}

async function runBackgroundReview(
  userId: string,
  turns: ReviewableTurn[]
): Promise<void> {
  const conversation = turns
    .map(
      (t, i) =>
        `Turn ${i + 1}:\nUser: ${t.userMessage.slice(0, 300)}\nAssistant: ${t.assistantContent.slice(0, 300)}`
    )
    .join("\n\n");

  const reviewPrompt = `
You are a memory extraction system. Review the conversation below and identify facts worth remembering about the user.

Only extract facts that are:
1. Likely to be useful in future conversations
2. About the user's preferences, habits, technical background, or work style
3. Not trivial or one-time questions

Format each fact as a single declarative sentence starting with "User ".
If nothing stands out, respond with "NONE".

Conversation:
${conversation}

Facts to remember:
`;

  // Use a temporary session for the review to avoid polluting user history
  const reviewSessionId = `review-${Date.now()}`;
  const result = await chatSend(reviewSessionId, reviewPrompt, undefined, undefined);

  if (!result.content || result.content.trim() === "NONE") return;

  const insights = result.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 10 && !line.startsWith("Facts"));

  if (insights.length === 0) return;

  // Write insights to long-term memory
  for (const insight of insights.slice(0, 5)) {
    await longTermMemoryManager.addInsight(userId, {
      content: insight,
      source: "background_review",
      timestamp: Date.now(),
    });
  }

  logger.info(
    `[BackgroundReview] Extracted ${insights.length} insights for ${userId}`
  );
}
