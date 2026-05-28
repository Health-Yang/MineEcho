export interface KnowledgeConsistencyInput {
  filePaths: string[];
  graphNodes: Array<{
    id: string;
    label?: string;
    sourceFile?: string;
  }>;
  graphEdges: Array<{
    source: string;
    target: string;
    relation?: string;
  }>;
}

export interface StaleGraphSource {
  sourceFile: string;
  nodeCount: number;
  edgeCount: number;
}

export interface KnowledgeConsistencyReport {
  status: "ok" | "warning";
  fileCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  staleGraphSources: StaleGraphSource[];
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

function isKnowledgeFileSource(sourceFile: string | undefined): sourceFile is string {
  if (!sourceFile) return false;
  const normalized = normalizePath(sourceFile);
  return normalized.startsWith("raw/") || normalized.startsWith("wiki/");
}

export function buildKnowledgeConsistencyReport(input: KnowledgeConsistencyInput): KnowledgeConsistencyReport {
  const fileSet = new Set(input.filePaths.map(normalizePath));
  const staleNodeIds = new Set<string>();
  const staleBySource = new Map<string, { sourceFile: string; nodeCount: number; edgeCount: number }>();

  for (const node of input.graphNodes) {
    if (!isKnowledgeFileSource(node.sourceFile)) continue;
    const sourceFile = normalizePath(node.sourceFile);
    if (fileSet.has(sourceFile)) continue;

    staleNodeIds.add(node.id);
    const existing = staleBySource.get(sourceFile) ?? { sourceFile, nodeCount: 0, edgeCount: 0 };
    existing.nodeCount += 1;
    staleBySource.set(sourceFile, existing);
  }

  for (const edge of input.graphEdges) {
    const touchesStale = staleNodeIds.has(edge.source) || staleNodeIds.has(edge.target);
    if (!touchesStale) continue;

    const countedSources = new Set<string>();
    for (const node of input.graphNodes) {
      if (node.id !== edge.source && node.id !== edge.target) continue;
      if (!isKnowledgeFileSource(node.sourceFile)) continue;
      const sourceFile = normalizePath(node.sourceFile);
      if (countedSources.has(sourceFile)) continue;
      const existing = staleBySource.get(sourceFile);
      if (existing) {
        existing.edgeCount += 1;
        countedSources.add(sourceFile);
      }
    }
  }

  const staleGraphSources = Array.from(staleBySource.values()).sort((a, b) => {
    if (b.nodeCount !== a.nodeCount) return b.nodeCount - a.nodeCount;
    return a.sourceFile.localeCompare(b.sourceFile);
  });

  return {
    status: staleGraphSources.length > 0 ? "warning" : "ok",
    fileCount: fileSet.size,
    graphNodeCount: input.graphNodes.length,
    graphEdgeCount: input.graphEdges.length,
    staleGraphSources,
  };
}
