import {
  getActiveProvider,
  type EmbeddingProvider,
} from "../../knowledge-base/embedding.js";
import { buildSemanticVector, cosineSimilarity } from "./semantic-vector.js";

const MAX_EXTERNAL_RERANK_ITEMS = 30;

export interface MemoryEmbeddingOptions {
  provider?: EmbeddingProvider | null;
  maxExternalItems?: number;
}

export interface MemoryEmbeddingScores {
  providerName: string;
  scores: number[];
  cosine: typeof cosineSimilarity;
}

export interface RankableMemoryItem<T> {
  item: T;
  text: string;
}

export interface RankedMemoryItem<T> {
  item: T;
  score: number;
  providerName: string;
}

function localScores(query: string, texts: string[]): MemoryEmbeddingScores {
  const queryVector = buildSemanticVector(query);
  return {
    providerName: "local",
    scores: texts.map((text) => Math.max(0, cosineSimilarity(buildSemanticVector(text), queryVector))),
    cosine: cosineSimilarity,
  };
}

function hasConsistentDimensions(vectors: number[][], dimensions: number): boolean {
  return vectors.every((vector) => Array.isArray(vector) && vector.length === dimensions);
}

export async function scoreMemoryEmbeddingBatch(
  query: string,
  texts: string[],
  options?: MemoryEmbeddingOptions
): Promise<MemoryEmbeddingScores> {
  if (texts.length === 0) {
    return { providerName: "local", scores: [], cosine: cosineSimilarity };
  }

  const provider = options?.provider === undefined ? getActiveProvider() : options.provider;
  const maxExternalItems = options?.maxExternalItems ?? MAX_EXTERNAL_RERANK_ITEMS;
  if (!provider || provider.dimensions <= 0 || texts.length > maxExternalItems) {
    return localScores(query, texts);
  }

  const vectors = await provider.batchEmbeddings([query, ...texts]);
  if (!vectors || vectors.length !== texts.length + 1 || !hasConsistentDimensions(vectors, provider.dimensions)) {
    return localScores(query, texts);
  }

  const [queryVector, ...textVectors] = vectors;
  return {
    providerName: provider.name,
    scores: textVectors.map((vector) => Math.max(0, cosineSimilarity(vector, queryVector))),
    cosine: cosineSimilarity,
  };
}

export async function rankByMemoryEmbedding<T>(
  query: string,
  items: RankableMemoryItem<T>[],
  options?: MemoryEmbeddingOptions
): Promise<RankedMemoryItem<T>[]> {
  const scores = await scoreMemoryEmbeddingBatch(
    query,
    items.map((item) => item.text),
    options
  );

  return items
    .map((item, index) => ({
      item: item.item,
      score: scores.scores[index] ?? 0,
      providerName: scores.providerName,
    }))
    .sort((a, b) => b.score - a.score);
}
