import { apiFetch } from "./api";

export interface GraphNeighborhoodNode {
  id: string;
  label: string;
  type: string;
  filePath?: string;
  summary?: string;
  importance?: number;
  sources?: string[];
  size?: number;
}

export interface GraphNeighborhoodEdge {
  source: string;
  target: string;
  relation: string;
  strength?: number;
}

export interface GraphNeighborhood {
  center: GraphNeighborhoodNode;
  nodes: GraphNeighborhoodNode[];
  edges: GraphNeighborhoodEdge[];
  explanations: string[];
  summary: {
    totalNeighbors: number;
    incoming: number;
    outgoing: number;
    memoryLinks: number;
    topRelation?: string;
  };
}

interface FetchGraphNeighborhoodOptions {
  nodeId: string;
  limit?: number;
  signal?: AbortSignal;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchGraphNeighborhood(
  options: FetchGraphNeighborhoodOptions
): Promise<GraphNeighborhood> {
  const fetcher = options.fetcher || apiFetch;
  const params = new URLSearchParams({
    nodeId: options.nodeId,
    limit: String(options.limit ?? 12),
  });
  const response = await fetcher(`/api/knowledge-base/graph-neighborhood?${params.toString()}`, {
    signal: options.signal,
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "图谱邻域读取失败");
  }

  return result.data as GraphNeighborhood;
}
