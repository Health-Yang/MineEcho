/**
 * Trigger API Routes
 *
 * Endpoints for managing personalized trigger learning:
 * - GET    /api/triggers              # List user's learned triggers
 * - POST   /api/triggers/learn        # Record a learning event
 * - DELETE /api/triggers/:id          # Remove a learned trigger
 * - POST   /api/triggers/match        # Match input to trigger
 * - GET    /api/triggers/suggestions  # Get trigger suggestions
 * - GET    /api/triggers/stats        # Get learning statistics
 */

import { Router, type Request } from 'express';
import { logger } from "../utils/logger.js";
import {
  getTriggerSuggestions,
  learnTrigger,
  removeTrigger,
  getLearningStats,
  matchTrigger,
  processMessageForTriggers,
  getMatchStats,
  recordTriggerUsage,
  getPersonalizedTriggers,
} from '../triggers/index.js';

export const triggersRouter = Router();

// Helper to get user ID from request (in production, extract from auth token)
function getUserId(req: Request): string {
  // TODO: Extract from JWT or session
  // For now, use a default user or header-based user ID
  const userId = (req.headers['x-user-id'] as string) || 'default-user';
  return userId;
}

/**
 * GET /api/triggers
 * List user's learned triggers
 *
 * Query params:
 * - minConfidence: number (0-1) - filter by minimum confidence
 * - limit: number - max results to return
 * - sort: 'confidence' | 'usage' | 'recent' - sort order
 */
triggersRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const minConfidence = req.query.minConfidence
      ? parseFloat(req.query.minConfidence as string)
      : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const sort = (req.query.sort as string) || 'confidence';

    let triggers = await getPersonalizedTriggers(userId, minConfidence);

    // Apply sorting
    switch (sort) {
      case 'usage':
        triggers.sort((a: { usageCount: number }, b: { usageCount: number }) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        triggers.sort((a: { lastUsed: number }, b: { lastUsed: number }) => b.lastUsed - a.lastUsed);
        break;
      case 'confidence':
      default:
        triggers.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);
        break;
    }

    // Apply limit
    if (limit) {
      triggers = triggers.slice(0, limit);
    }

    res.json({
      success: true,
      data: triggers,
      meta: {
        total: triggers.length,
        userId,
        sort,
        minConfidence,
      },
    });
  } catch (error) {
    logger.error('[Triggers] Error listing triggers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list triggers',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/triggers/learn
 * Record a learning event
 *
 * Body:
 * - message: string - User's message
 * - skillId: string - The skill that was used
 * - skillName: string - Human-readable skill name
 */
triggersRouter.post('/learn', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { message, skillId, skillName } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    if (!skillId || typeof skillId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'skillId is required',
      });
    }

    const event = await learnTrigger(userId, message, skillId, skillName || skillId);

    if (!event) {
      return res.json({
        success: true,
        data: null,
        message: 'No trigger candidates found in message',
      });
    }

    res.json({
      success: true,
      data: event,
      message: `Learned trigger "${event.triggerCandidate}" for skill "${skillName || skillId}"`,
    });
  } catch (error) {
    logger.error('[Triggers] Error learning trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to learn trigger',
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/triggers/:id
 * Remove a learned trigger
 */
triggersRouter.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const deleted = await removeTrigger(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found',
      });
    }

    res.json({
      success: true,
      message: 'Trigger deleted successfully',
    });
  } catch (error) {
    logger.error('[Triggers] Error deleting trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete trigger',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/triggers/match
 * Match input to trigger
 *
 * Body:
 * - message: string - User's message to match
 * - threshold: number (optional) - Confidence threshold (default: 0.7)
 * - autoInject: boolean (optional) - Whether to return processed message with skill context
 */
triggersRouter.post('/match', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { message, threshold, autoInject } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    if (autoInject) {
      const result = await processMessageForTriggers(userId, message, {
        autoInject: true,
        threshold: threshold ?? 0.7,
      });

      res.json({
        success: true,
        data: {
          originalMessage: result.originalMessage,
          processedMessage: result.processedMessage,
          matched: result.matchedTrigger !== null,
          trigger: result.matchedTrigger,
          skillInjected: result.skillInjected,
        },
      });
    } else {
      const match = await matchTrigger(userId, message, {
        threshold: threshold ?? 0.7,
      });

      res.json({
        success: true,
        data: {
          matched: match !== null,
          trigger: match,
        },
      });
    }
  } catch (error) {
    logger.error('[Triggers] Error matching trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to match trigger',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/triggers/suggestions
 * Get trigger suggestions based on usage
 *
 * Query params:
 * - limit: number - max suggestions (default: 5)
 */
triggersRouter.get('/suggestions', async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    const suggestions = await getTriggerSuggestions(userId, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error('[Triggers] Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/triggers/stats
 * Get learning statistics for the user
 */
triggersRouter.get('/stats', async (req, res) => {
  try {
    const userId = getUserId(req);

    const [learningStats, matchStatistics] = await Promise.all([
      getLearningStats(userId),
      getMatchStats(userId),
    ]);

    res.json({
      success: true,
      data: {
        learning: learningStats,
        matching: matchStatistics,
      },
    });
  } catch (error) {
    logger.error('[Triggers] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/triggers/:id/record-usage
 * Record a manual usage of a trigger (for explicit feedback)
 */
triggersRouter.post('/:id/record-usage', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const updated = await recordTriggerUsage(userId, id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found',
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Usage recorded successfully',
    });
  } catch (error) {
    logger.error('[Triggers] Error recording usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record usage',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/triggers/batch-learn
 * Batch learn from multiple examples
 *
 * Body:
 * - examples: Array<{ message: string; skillId: string; skillName: string }>
 */
triggersRouter.post('/batch-learn', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { examples } = req.body;

    if (!Array.isArray(examples)) {
      return res.status(400).json({
        success: false,
        error: 'examples must be an array',
      });
    }

    const { batchLearn } = await import('../triggers/learner.js');
    const events = await batchLearn(userId, examples);

    res.json({
      success: true,
      data: events,
      meta: {
        processed: examples.length,
        learned: events.length,
      },
    });
  } catch (error) {
    logger.error('[Triggers] Error batch learning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch learn',
      message: (error as Error).message,
    });
  }
});
