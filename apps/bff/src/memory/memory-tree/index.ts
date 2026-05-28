/**
 * Memory Tree Module
 * Hierarchical memory with automatic summarization
 */

export * from "./types.js";
export * from "./tree-db.js";
export * from "./content-store.js";
export * from "./summarizer.js";
export * from "./tree-manager.js";
export * from "./routes.js";

// Re-export tree manager singleton
import { memoryTreeManager, MemoryTreeManager } from "./tree-manager.js";

export { memoryTreeManager, MemoryTreeManager };
