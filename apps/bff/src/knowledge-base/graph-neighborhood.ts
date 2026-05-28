import type { KnowledgeGraph } from "./graph.js";

type GraphNode = KnowledgeGraph["nodes"][number];
type GraphEdge = KnowledgeGraph["edges"][number];

export interface GraphNeighborhood {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  explanations: string[];
  summary: {
    totalNeighbors: number;
    incoming: number;
    outgoing: number;
    memoryLinks: number;
    topRelation?: string;
  };
}

interface GraphNeighborhoodOptions {
  limit?: number;
}

const RELATION_LABELS: Record<string, string> = {
  supports: "记忆支持",
  contradicts: "记忆冲突",
  references: "引用",
  tagged: "标签",
  related: "相关",
  contains: "包含",
  relates_to: "关联",
};

function isMemoryNode(node: GraphNode | undefined): boolean {
  return Boolean(node?.id.startsWith("memalign:") || node?.filePath?.startsWith("memory://"));
}

function edgeRank(edge: GraphEdge, centerId: string, nodeById: Map<string, GraphNode>): number {
  const otherId = edge.source === centerId ? edge.target : edge.source;
  const other = nodeById.get(otherId);
  const relation = String(edge.relation);
  const relationBoost = relation === "supports" || relation === "contradicts" ? 40 : 0;
  const memoryBoost = isMemoryNode(other) ? 20 : 0;
  return relationBoost + memoryBoost + (edge.strength ?? 1) * 5 + (other?.importance ?? 0) / 10;
}

export function buildGraphNeighborhood(
  graph: KnowledgeGraph,
  nodeId: string,
  options: GraphNeighborhoodOptions = {}
): GraphNeighborhood {
  const center = graph.nodes.find((node) => node.id === nodeId);
  if (!center) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const limit = Math.min(50, Math.max(1, Number(options.limit) || 12));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relatedEdges = graph.edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .sort((a, b) => edgeRank(b, nodeId, nodeById) - edgeRank(a, nodeId, nodeById))
    .slice(0, limit);

  const nodeIds = new Set<string>([nodeId]);
  for (const edge of relatedEdges) {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  }

  const nodes = Array.from(nodeIds)
    .map((id) => nodeById.get(id))
    .filter((node): node is GraphNode => Boolean(node));
  const incoming = relatedEdges.filter((edge) => edge.target === nodeId).length;
  const outgoing = relatedEdges.filter((edge) => edge.source === nodeId).length;
  const memoryLinks = relatedEdges.filter((edge) => {
    const otherId = edge.source === nodeId ? edge.target : edge.source;
    return isMemoryNode(nodeById.get(otherId));
  }).length;

  const relationCounts = new Map<string, number>();
  for (const edge of relatedEdges) {
    relationCounts.set(edge.relation, (relationCounts.get(edge.relation) || 0) + 1);
  }
  const topRelation = [...relationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const explanations = relatedEdges.slice(0, 6).map((edge) => {
    const otherId = edge.source === nodeId ? edge.target : edge.source;
    const other = nodeById.get(otherId);
    const direction = edge.target === nodeId ? "指向该节点" : "从该节点指向";
    const relation = RELATION_LABELS[edge.relation] || edge.relation;
    return `${relation}: ${other?.label || otherId} ${direction}`;
  });

  return {
    center,
    nodes,
    edges: relatedEdges,
    explanations,
    summary: {
      totalNeighbors: Math.max(0, nodes.length - 1),
      incoming,
      outgoing,
      memoryLinks,
      topRelation,
    },
  };
}
