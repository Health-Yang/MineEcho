import type { KnowledgeConsistencyReport } from "./consistency.js";

type TaskStatus = "pending" | "running" | "completed" | "failed" | "warning";
type TaskStage = "index" | "organize" | "graph" | "consistency";
type TaskAction = "retry-graph" | "repair-consistency" | "retry-organize" | "open-file";

export interface KnowledgeTask {
  id: string;
  stage: TaskStage;
  title: string;
  filePath?: string;
  status: TaskStatus;
  progress: number;
  message?: string;
  outputPaths?: string[];
  action?: TaskAction;
  updatedAt: number;
}

export interface KnowledgeTasksReport {
  summary: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    needsAttention: number;
  };
  tasks: KnowledgeTask[];
}

interface OrganizeStatusLike {
  rawPath: string;
  wikiPaths: string[];
  status: string;
  errorMessage?: string | null;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GraphExtractionStatusLike {
  filePath: string;
  status: string;
  nodeCount?: number;
  edgeCount?: number;
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
}

export function synthesizeGraphStatusesFromStore(input: {
  existingStatuses: GraphExtractionStatusLike[];
  graphNodes: Array<{ id: string; sourceFile?: string }>;
  graphEdges: Array<{ source: string; target: string }>;
  now?: number;
}): GraphExtractionStatusLike[] {
  const now = input.now ?? Date.now();
  const existingByPath = new Map(input.existingStatuses.map((status) => [status.filePath, status]));
  const nodeSourceById = new Map<string, string>();
  const nodeCountBySource = new Map<string, number>();
  const edgeCountBySource = new Map<string, number>();

  for (const node of input.graphNodes) {
    if (!node.sourceFile) continue;
    nodeSourceById.set(node.id, node.sourceFile);
    nodeCountBySource.set(node.sourceFile, (nodeCountBySource.get(node.sourceFile) || 0) + 1);
  }

  for (const edge of input.graphEdges) {
    const sources = new Set<string>();
    const sourceFile = nodeSourceById.get(edge.source);
    const targetFile = nodeSourceById.get(edge.target);
    if (sourceFile) sources.add(sourceFile);
    if (targetFile) sources.add(targetFile);
    for (const filePath of sources) {
      edgeCountBySource.set(filePath, (edgeCountBySource.get(filePath) || 0) + 1);
    }
  }

  const synthesized = Array.from(nodeCountBySource.entries())
    .filter(([filePath]) => !existingByPath.has(filePath))
    .map(([filePath, nodeCount]) => ({
      filePath,
      status: "completed",
      nodeCount,
      edgeCount: edgeCountBySource.get(filePath) || 0,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }));

  return [...input.existingStatuses, ...synthesized];
}

interface BuildKnowledgeTasksInput {
  indexJobs: Array<{
    docId: string;
    filePath: string;
    status: string;
    errorMessage?: string | null;
    note?: string | null;
    totalChunks?: number;
    processedChunks?: number;
    createdAt?: number;
    updatedAt?: number;
  }>;
  organizeStatuses: OrganizeStatusLike[];
  graphStatuses?: GraphExtractionStatusLike[];
  consistency: KnowledgeConsistencyReport;
}

function toIndexTask(job: BuildKnowledgeTasksInput["indexJobs"][number]): KnowledgeTask {
  const total = Number(job.totalChunks || 0);
  const processed = Number(job.processedChunks || 0);
  const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : job.status === "completed" ? 100 : 0;
  const rawStatus = String(job.status);
  const status: TaskStatus =
    rawStatus === "processing" || rawStatus === "running"
      ? "running"
      : rawStatus === "failed"
        ? "failed"
        : rawStatus === "skipped"
          ? "warning"
        : rawStatus === "pending"
          ? "pending"
          : "completed";

  return {
    id: `index:${job.filePath}`,
    stage: "index",
    title: `索引 ${job.filePath.split("/").pop() || job.filePath}`,
    filePath: job.filePath,
    status,
    progress,
    message: job.errorMessage || job.note || undefined,
    updatedAt: job.updatedAt || job.createdAt || 0,
  };
}

function toOrganizeTask(status: OrganizeStatusLike): KnowledgeTask {
  const completed = status.status === "completed";
  const failed = status.status === "failed";
  const outputPaths = status.wikiPaths.filter(Boolean);
  const outputPreview = outputPaths.slice(0, 3).join("、");
  const overflowCount = Math.max(0, outputPaths.length - 3);
  return {
    id: `organize:${status.rawPath}`,
    stage: "organize",
    title: `整理 ${status.rawPath.split("/").pop() || status.rawPath}`,
    filePath: status.rawPath,
    status: completed ? "completed" : failed ? "failed" : "running",
    progress: completed ? 100 : failed ? (status.progress ?? 0) : (status.progress ?? 50),
    message: failed
      ? status.errorMessage || "整理失败"
      : completed
      ? `已生成 ${outputPaths.length} 个 wiki 页面${outputPreview ? `：${outputPreview}${overflowCount ? ` 等 ${overflowCount} 个` : ""}` : ""}`
      : undefined,
    outputPaths,
    action: failed ? "retry-organize" : undefined,
    updatedAt: status.updatedAt || status.createdAt || 0,
  };
}

function toGraphTask(record: GraphExtractionStatusLike): KnowledgeTask {
  const rawStatus = String(record.status);
  const status: TaskStatus =
    rawStatus === "processing" || rawStatus === "running"
      ? "running"
      : rawStatus === "failed"
        ? "failed"
        : rawStatus === "skipped"
          ? "warning"
        : rawStatus === "pending"
          ? "pending"
          : "completed";
  const nodeCount = Number(record.nodeCount || 0);
  const edgeCount = Number(record.edgeCount || 0);
  return {
    id: `graph:${record.filePath}`,
    stage: "graph",
    title: `图谱 ${record.filePath.split("/").pop() || record.filePath}`,
    filePath: record.filePath,
    status,
    progress: status === "completed" ? 100 : status === "failed" ? 0 : 50,
    message: status === "failed"
      ? record.errorMessage || "图谱抽取失败"
      : rawStatus === "skipped"
        ? record.errorMessage || "图谱抽取已跳过"
      : status === "completed"
        ? `已写入 ${nodeCount} 个节点、${edgeCount} 条关系`
        : "正在抽取实体和关系",
    action: status === "failed" || status === "warning" ? "retry-graph" : undefined,
    updatedAt: record.updatedAt || record.createdAt || 0,
  };
}

function buildConsistencyTask(consistency: KnowledgeConsistencyReport): KnowledgeTask | null {
  if (consistency.staleGraphSources.length === 0) return null;
  const staleNodes = consistency.staleGraphSources.reduce((sum, item) => sum + item.nodeCount, 0);
  return {
    id: "consistency:stale-graph",
    stage: "consistency",
    title: "图谱一致性检查",
    status: "warning",
    progress: 0,
    message: `${consistency.staleGraphSources.length} 个来源缺失，${staleNodes} 个图谱节点需要清理`,
    action: "repair-consistency",
    updatedAt: Date.now(),
  };
}

function taskRank(task: KnowledgeTask): number {
  if (task.status === "failed" || task.status === "warning") return 0;
  if (task.status === "running" || task.status === "pending") return 1;
  return 2;
}

export function buildKnowledgeTasksReport(input: BuildKnowledgeTasksInput): KnowledgeTasksReport {
  const tasks: KnowledgeTask[] = [];
  const consistencyTask = buildConsistencyTask(input.consistency);
  if (consistencyTask) tasks.push(consistencyTask);
  tasks.push(...input.indexJobs.map(toIndexTask));
  tasks.push(...input.organizeStatuses.map(toOrganizeTask));
  tasks.push(...(input.graphStatuses || []).map(toGraphTask));

  tasks.sort((a, b) => {
    const rank = taskRank(a) - taskRank(b);
    if (rank !== 0) return rank;
    return b.updatedAt - a.updatedAt;
  });

  const summary = {
    total: tasks.length,
    running: tasks.filter((task) => task.status === "running" || task.status === "pending").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    needsAttention: tasks.filter((task) => task.status === "failed" || task.status === "warning").length,
  };

  return { summary, tasks };
}
