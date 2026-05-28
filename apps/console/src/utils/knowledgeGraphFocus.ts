export interface KnowledgeGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    filePath?: string;
    summary?: string;
    importance?: number;
    sources?: string[];
    size?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relation: string;
    strength?: number;
  }>;
  communities: Array<{
    id: string;
    label: string;
    nodes: string[];
    color?: string;
  }>;
}

export interface FocusedKnowledgeGraphData {
  graph: KnowledgeGraphData;
  sourcePath: string | null;
  hiddenCount: number;
}

function sourceCandidatesForNode(node: KnowledgeGraphData['nodes'][number]): string[] {
  const paths = [node.filePath, ...(node.sources || []), node.id].filter((path): path is string => Boolean(path));
  return paths.filter((path) => path.startsWith('raw/') || path.startsWith('wiki/sources/'));
}

function nodeBelongsToSource(node: KnowledgeGraphData['nodes'][number], sourcePath: string): boolean {
  if (node.id === sourcePath || node.filePath === sourcePath) return true;
  return Boolean(node.sources?.includes(sourcePath));
}

export function buildFocusedGraphData(graph: KnowledgeGraphData): FocusedKnowledgeGraphData {
  const sourceScores = new Map<string, number>();
  for (const node of graph.nodes) {
    for (const source of sourceCandidatesForNode(node)) {
      sourceScores.set(source, (sourceScores.get(source) || 0) + 1);
    }
  }
  const sourcePath = Array.from(sourceScores.entries()).sort((a, b) => {
    const rawBias = Number(b[0].startsWith('raw/')) - Number(a[0].startsWith('raw/'));
    if (rawBias !== 0) return rawBias;
    return b[1] - a[1];
  })[0]?.[0] || null;

  if (!sourcePath) return { graph, sourcePath: null, hiddenCount: 0 };

  const seedIds = new Set(
    graph.nodes
      .filter((node) => nodeBelongsToSource(node, sourcePath))
      .map((node) => node.id)
  );
  if (seedIds.size === 0) return { graph, sourcePath: null, hiddenCount: 0 };

  const visibleIds = new Set(seedIds);
  for (const edge of graph.edges) {
    if (seedIds.has(edge.source)) visibleIds.add(edge.target);
    if (seedIds.has(edge.target)) visibleIds.add(edge.source);
  }

  const nodes = graph.nodes.filter((node) => visibleIds.has(node.id));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const communities = graph.communities
    .map((community) => ({
      ...community,
      nodes: community.nodes.filter((nodeId) => visibleIds.has(nodeId)),
    }))
    .filter((community) => community.nodes.length > 0);

  return {
    graph: { nodes, edges, communities },
    sourcePath,
    hiddenCount: graph.nodes.length - nodes.length,
  };
}
