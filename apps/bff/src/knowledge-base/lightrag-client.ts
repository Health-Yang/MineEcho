/**
 * LightRAG HTTP Client
 * Bridges the BFF to the LightRAG Python service running on port 3090.
 * All methods are defensive: errors are logged and re-thrown so callers
 * can decide whether to fall back to existing behaviour.
 */

const LIGHTRAG_BASE_URL = process.env.LIGHTRAG_URL || "http://localhost:3090";
const LIGHTRAG_TIMEOUT_MS = 600_000; // 10 minutes for large-file indexing

export interface LightRagQueryResult {
  answer: string;
  sources?: Array<{
    doc_id: string;
    content?: string;
    score?: number;
  }>;
}

export interface LightRagGraphResult {
  nodes: Array<{
    id: string;
    label?: string;
    type?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relation?: string;
  }>;
}

export interface LightRagHealthResult {
  status: string;
  version?: string;
}

async function lightragFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${LIGHTRAG_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIGHTRAG_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`LightRAG ${path} returned ${response.status}: ${body}`);
    }

    // Some endpoints may return empty body (e.g. delete)
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return {} as T;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`LightRAG ${path} timed out after ${LIGHTRAG_TIMEOUT_MS}ms`);
    }
    throw error;
  }
}

export const lightragClient = {
  /**
   * Insert text content into LightRAG.
   */
  async insert(content: string, docId?: string): Promise<void> {
    const payload: Record<string, string> = { content };
    if (docId) payload.doc_id = docId;
    await lightragFetch<void>("/insert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Query LightRAG with a user question.
   */
  async query(query: string, mode = "hybrid"): Promise<LightRagQueryResult> {
    return lightragFetch<LightRagQueryResult>("/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode }),
    });
  },

  /**
   * Retrieve the knowledge graph from LightRAG.
   */
  async getGraph(): Promise<LightRagGraphResult> {
    return lightragFetch<LightRagGraphResult>("/graph", {
      method: "GET",
    });
  },

  /**
   * Upload a file buffer to LightRAG for indexing.
   */
  async insertFile(fileBuffer: Buffer, docId: string): Promise<void> {
    const form = new FormData();
    // LightRAG expects a multipart upload; we send the buffer as a Blob
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    form.append("file", blob, docId);
    if (docId) form.append("doc_id", docId);

    await lightragFetch<void>("/insert-file", {
      method: "POST",
      body: form,
    });
  },

  /**
   * Delete a document from LightRAG by doc_id.
   */
  async deleteDoc(docId: string): Promise<void> {
    await lightragFetch<void>("/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: docId }),
    });
  },

  /**
   * Health-check the LightRAG service.
   */
  async health(): Promise<LightRagHealthResult> {
    return lightragFetch<LightRagHealthResult>("/health", {
      method: "GET",
    });
  },
};
