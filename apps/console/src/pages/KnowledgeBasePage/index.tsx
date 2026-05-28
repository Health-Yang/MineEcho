import { lazy, Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Alert, Empty, Button, Upload, Dropdown, message, Spin, Modal, Input, Tag, Checkbox, Tooltip, Badge, Drawer } from 'antd';
import {
  UploadOutlined,
  SyncOutlined,
  DeleteOutlined,
  LinkOutlined,
  ArrowLeftOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type { FileNode } from '../../types/knowledge-base';
import {
  autoCommitMemoryAlignment,
  commitMemoryAlignment,
  fetchMemoryAlignmentHistory,
  fetchMemoryAlignmentPreview,
  fetchMemoryAlignmentStatus,
  type MemoryAlignmentHistoryRecord,
  type MemoryAlignmentPreview,
  type MemoryAlignmentStatus,
} from '../../utils/knowledgeAlignment';
import { createKnowledgeGraphRefreshEvent } from '../../utils/knowledgeGraphEvents';

const MarkdownPreview = lazy(() => import('../../components/MarkdownPreview').then((module) => ({ default: module.MarkdownPreview })));
const KnowledgeGraphView = lazy(() => import('../../components/KnowledgeGraphView').then((module) => ({ default: module.KnowledgeGraphView })));

function LazyPanelFallback({ label }: { label: string }) {
  return (
    <div style={{ height: '100%', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin tip={label} />
    </div>
  );
}

const kbApi = {
  async getDirectoryTree(relativePath?: string): Promise<FileNode[]> {
    if (window.electronAPI?.kb) {
      return window.electronAPI.kb.getDirectoryTree(relativePath);
    }
    const r = await fetch('/api/knowledge-base/tree');
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as FileNode[];
  },
  async readFile(filePath: string): Promise<string> {
    if (window.electronAPI?.kb) {
      return window.electronAPI.kb.readFile(filePath);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(`/api/knowledge-base/file?path=${encodeURIComponent(filePath)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const result = await r.json();
      if (result.code !== 0) throw new Error(result.message);
      return result.data as string;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('文件读取超时（15秒），请稍后重试或检查文件是否过大');
      }
      throw err;
    }
  },
  async uploadFile(params: { name: string; content: ArrayBuffer | Uint8Array | Buffer | string; targetPath?: string }) {
    if (window.electronAPI?.kb) {
      return window.electronAPI.kb.uploadFile(params);
    }
    const formData = new FormData();
    const blob = new Blob([params.content as BlobPart]);
    formData.append('file', blob, params.name);
    const r = await fetch('/api/knowledge-base/upload', { method: 'POST', body: formData });
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as { path: string; sourcePath?: string; jobId?: string; indexStatus?: string };
  },
  async deleteFile(filePath: string) {
    if (window.electronAPI?.kb) {
      return window.electronAPI.kb.deleteFile(filePath);
    }
    const r = await fetch('/api/knowledge-base/file', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return { success: true };
  },
  async importUrl(params: { url: string; name?: string }) {
    if (window.electronAPI?.kb) {
      // Fallback for electron mode: fetch via renderer and save as a file upload
      const response = await fetch(params.url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MineEchoKB/1.0)' },
      });
      if (!response.ok) throw new Error(`请求失败: ${response.status}`);
      const text = await response.text();
      const fileName = params.name ? `${params.name.replace(/\.md$/i, '')}.md` : `url_import_${Date.now()}.md`;
      const blob = new Blob([text], { type: 'text/markdown' });
      const arrayBuffer = await blob.arrayBuffer();
      return kbApi.uploadFile({ name: fileName, content: arrayBuffer, targetPath: 'raw/' });
    }
    const r = await fetch('/api/knowledge-base/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as {
      path: string;
      jobId?: string;
      indexStatus?: string;
      sourcePath?: string;
      cleanup?: {
        rawChars: number;
        cleanedChars: number;
        tokenJuiceChars: number;
        reductionRatio: number;
      };
    };
  },
  async getAllIndexStatus(): Promise<IndexJob[]> {
    const r = await fetch('/api/knowledge-base/index-status');
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as IndexJob[];
  },
  async getOrganizeStatuses(): Promise<OrganizeStatus[]> {
    const r = await fetch('/api/knowledge-base/organize-status');
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as OrganizeStatus[];
  },
  async getConsistency(): Promise<KnowledgeConsistencyReport> {
    const r = await fetch('/api/knowledge-base/consistency');
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as KnowledgeConsistencyReport;
  },
  async repairConsistency(action: 'prune-stale-graph'): Promise<{ before: KnowledgeConsistencyReport; after: KnowledgeConsistencyReport }> {
    const r = await fetch('/api/knowledge-base/consistency/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as { before: KnowledgeConsistencyReport; after: KnowledgeConsistencyReport };
  },
  async getTasks(): Promise<KnowledgeTasksReport> {
    const r = await fetch('/api/knowledge-base/tasks');
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as KnowledgeTasksReport;
  },
  async retryGraphExtraction(filePath: string): Promise<{ filePath: string; status: string }> {
    const r = await fetch('/api/knowledge-base/graph-extraction/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    const result = await r.json();
    if (result.code !== 0) throw new Error(result.message);
    return result.data as { filePath: string; status: string };
  },
};

interface IndexJob {
  docId: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  errorMessage: string | null;
}

interface OrganizeStatus {
  rawPath: string;
  wikiPaths: string[];
  status: string;
  errorMessage?: string | null;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

interface KnowledgeConsistencyReport {
  status: 'ok' | 'warning';
  fileCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  staleGraphSources: Array<{
    sourceFile: string;
    nodeCount: number;
    edgeCount: number;
  }>;
}

interface KnowledgeTask {
  id: string;
  stage: 'index' | 'organize' | 'graph' | 'consistency';
  title: string;
  filePath?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  progress: number;
  message?: string;
  outputPaths?: string[];
  action?: 'retry-graph' | 'repair-consistency' | 'retry-organize' | 'open-file';
  updatedAt: number;
}

interface KnowledgeTasksReport {
  summary: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    needsAttention: number;
  };
  tasks: KnowledgeTask[];
}

function getFileEmoji(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (['md', 'txt', 'doc', 'docx'].includes(ext)) return '📄';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📽️';
  if (['pdf'].includes(ext)) return '📑';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return '🖼️';
  if (['zip', 'rar', '7z'].includes(ext)) return '📦';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs'].includes(ext)) return '💻';
  return '📝';
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIndexStatusText(status?: IndexJob['status'] | null): string {
  if (status === 'processing') return '索引中';
  if (status === 'pending') return '等待索引';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  if (status === 'skipped') return '已跳过';
  return '未记录';
}

function getOrganizeStatusText(node: FileNode, status?: OrganizeStatus | null, isOrganizing?: boolean): string {
  if (isOrganizing) return '整理中';
  if (node.path.startsWith('wiki/')) return '已是 wiki 页面';
  if (status?.status === 'completed') return `已生成 ${status.wikiPaths.length} 个 wiki 页面`;
  if (status?.status === 'failed') return status.errorMessage || '整理失败';
  if (status?.status === 'processing') return `整理中${status.progress !== undefined ? ` ${status.progress}%` : ''}`;
  if (node.path.startsWith('raw/')) return '未整理';
  return '不适用';
}

function getGraphStatusText(task?: KnowledgeTask | null): string {
  if (!task) return '未记录';
  if (task.status === 'running') return task.message || '抽取中';
  if (task.status === 'failed') return task.message || '抽取失败';
  if (task.status === 'warning') return task.message || '需处理';
  if (task.status === 'completed') return task.message || '已完成';
  return task.message || '等待中';
}

function getStatusTag(
  node: FileNode,
  indexStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped' | null,
  organizeStatus?: OrganizeStatus | null,
  isOrganizing?: boolean,
  graphTask?: KnowledgeTask | null
): React.ReactNode | null {
  if (node.isDirectory) return null;
  const isRaw = node.path.startsWith('raw/');
  const isWiki = node.path.startsWith('wiki/');
  const wrapStatus = (tag: React.ReactNode) => (
    <Tooltip
      title={
        <div style={{ fontSize: 12, lineHeight: 1.7 }}>
          <div>索引：{getIndexStatusText(indexStatus)}</div>
          <div>整理：{getOrganizeStatusText(node, organizeStatus, isOrganizing)}</div>
          <div>图谱：{getGraphStatusText(graphTask)}</div>
        </div>
      }
      placement="right"
    >
      <span style={{ flexShrink: 0 }}>{tag}</span>
    </Tooltip>
  );

  // All files go through vector index now
  if (isRaw) {
    // Priority: organizing > organized > indexing > indexed > unindexed
    if (isOrganizing) {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#e6f0ff',
          color: '#0066ff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <SyncOutlined spin style={{ fontSize: 9 }} />
          整理中...
        </span>
      );
    }
    if (organizeStatus?.status === 'completed') {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#e6f0ff',
          color: '#0066ff',
          fontWeight: 500,
        }}>
          已整理
        </span>
      );
    }
    if (indexStatus === 'processing') {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#e6f0ff',
          color: '#0066ff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <SyncOutlined spin style={{ fontSize: 9 }} />
          索引中...
        </span>
      );
    }
    if (indexStatus === 'pending') {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#fff7e6',
          color: '#fa8c16',
          fontWeight: 500,
        }}>
          等待索引
        </span>
      );
    }
    if (indexStatus === 'failed') {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#fff1f0',
          color: '#ff4d4f',
          fontWeight: 500,
        }}>
          索引失败
        </span>
      );
    }
    if (indexStatus === 'completed') {
      return wrapStatus(
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 4,
          background: '#e6ffed',
          color: '#00b365',
          fontWeight: 500,
        }}>
          已索引
        </span>
      );
    }
    return wrapStatus(
      <span style={{
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 4,
        background: '#f5f5f5',
        color: '#a8a8a8',
        fontWeight: 500,
      }}>
        未索引
      </span>
    );
  }
  if (isWiki) {
    return wrapStatus(
      <span style={{
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 4,
        background: '#e6ffed',
        color: '#00b365',
        fontWeight: 500,
      }}>
        已整理
      </span>
    );
  }
  return null;
}

function getTaskStatusLabel(status: KnowledgeTask['status']): { text: string; color: string } {
  if (status === 'failed') return { text: '失败', color: 'error' };
  if (status === 'warning') return { text: '需处理', color: 'warning' };
  if (status === 'running') return { text: '进行中', color: 'processing' };
  if (status === 'pending') return { text: '等待中', color: 'default' };
  return { text: '完成', color: 'success' };
}

function getTaskStageLabel(stage: KnowledgeTask['stage']): string {
  if (stage === 'index') return '索引';
  if (stage === 'organize') return '整理';
  if (stage === 'graph') return '图谱';
  return '一致性';
}

function selectVisibleKnowledgeTasks(report: KnowledgeTasksReport): KnowledgeTask[] {
  const activeTasks = report.tasks.filter((task) => task.status !== 'completed');
  if (activeTasks.length > 0) return activeTasks.slice(0, 6);

  const selected: KnowledgeTask[] = [];
  const stages: KnowledgeTask['stage'][] = ['organize', 'graph', 'index', 'consistency'];
  for (const stage of stages) {
    selected.push(...report.tasks.filter((task) => task.stage === stage).slice(0, 2));
  }
  return selected.slice(0, 6);
}

function KnowledgeTaskCenter({
  report,
  onOpenPath,
  onRepairConsistency,
  onOrganizePath,
  onRetryGraph,
  repairingConsistency,
  organizingPath,
  retryingGraphPath,
  compact = false,
}: {
  report: KnowledgeTasksReport | null;
  onOpenPath?: (path: string) => void;
  onRepairConsistency?: () => void;
  onOrganizePath?: (path: string) => void;
  onRetryGraph?: (path: string) => void;
  repairingConsistency?: boolean;
  organizingPath?: string | null;
  retryingGraphPath?: string | null;
  compact?: boolean;
}) {
  if (!report || report.summary.total === 0) return null;
  const activeTasks = report.tasks.filter((task) => task.status !== 'completed');
  const visibleTasks = selectVisibleKnowledgeTasks(report);

  return (
    <div
      style={{
        border: '1px solid #e8ecf1',
        borderRadius: 8,
        padding: compact ? 0 : 10,
        marginBottom: compact ? 0 : 12,
        background: compact ? 'transparent' : '#fbfcff',
        borderColor: compact ? 'transparent' : '#e8ecf1',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2329' }}>任务中心</span>
        <Tag color={report.summary.needsAttention > 0 ? 'warning' : report.summary.running > 0 ? 'processing' : 'success'}>
          {report.summary.needsAttention > 0 ? `${report.summary.needsAttention} 项需处理` : report.summary.running > 0 ? `${report.summary.running} 项进行中` : '全部完成'}
        </Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: visibleTasks.length ? 8 : 0 }}>
        <div style={{ fontSize: 11, color: '#646a73' }}>运行 {report.summary.running}</div>
        <div style={{ fontSize: 11, color: '#646a73' }}>异常 {report.summary.needsAttention}</div>
        <div style={{ fontSize: 11, color: '#646a73' }}>完成 {report.summary.completed}</div>
      </div>
      {activeTasks.length === 0 && (
        <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 6 }}>
          最近完成
        </div>
      )}
      {visibleTasks.map((task) => {
        const status = getTaskStatusLabel(task.status);
        const firstOutputPath = task.outputPaths?.[0];
        const canRepairConsistency = task.stage === 'consistency' && task.status === 'warning' && onRepairConsistency;
        const canOrganize = task.stage === 'organize' && task.filePath?.startsWith('raw/') && onOrganizePath;
        const canRetryGraph = task.action === 'retry-graph' && task.filePath && onRetryGraph;
        const canOpenFile = task.filePath && onOpenPath;
        return (
          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
            <Tag color={status.color} style={{ margin: 0 }}>{status.text}</Tag>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: '#1f2329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: '#8c8c8c' }}>{getTaskStageLabel(task.stage)} · </span>{task.title}
              </div>
              {task.message && (
                <div style={{ fontSize: 10, color: '#8c8c8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.message}
                </div>
              )}
              {firstOutputPath && onOpenPath && (
                <Button
                  type="link"
                  size="small"
                  style={{ height: 18, padding: 0, fontSize: 10 }}
                  onClick={() => onOpenPath(firstOutputPath)}
                >
                  打开生成页面
                </Button>
              )}
              {!firstOutputPath && canOpenFile && (
                <Button
                  type="link"
                  size="small"
                  style={{ height: 18, padding: 0, fontSize: 10 }}
                  onClick={() => onOpenPath(task.filePath!)}
                >
                  打开文件
                </Button>
              )}
              {canOrganize && task.status !== 'completed' && (
                <Button
                  type="link"
                  size="small"
                  loading={organizingPath === task.filePath}
                  style={{ height: 18, padding: 0, fontSize: 10, marginLeft: 8 }}
                  onClick={() => onOrganizePath(task.filePath!)}
                >
                  重新整理
                </Button>
              )}
              {canRepairConsistency && (
                <Button
                  type="link"
                  size="small"
                  loading={repairingConsistency}
                  style={{ height: 18, padding: 0, fontSize: 10, marginLeft: 8 }}
                  onClick={onRepairConsistency}
                >
                  清理失效图谱
                </Button>
              )}
              {canRetryGraph && (
                <Button
                  type="link"
                  size="small"
                  loading={retryingGraphPath === task.filePath}
                  style={{ height: 18, padding: 0, fontSize: 10, marginLeft: 8 }}
                  onClick={() => onRetryGraph(task.filePath!)}
                >
                  重新抽取图谱
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KnowledgeBasePage() {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [organizing, setOrganizing] = useState<string | null>(null);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlFileName, setUrlFileName] = useState('');
  const [urlImporting, setUrlImporting] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [kbReady, setKbReady] = useState<boolean | null>(null);
  const [indexStatusMap, setIndexStatusMap] = useState<Map<string, IndexJob>>(new Map());
  const [organizeStatusMap, setOrganizeStatusMap] = useState<Map<string, OrganizeStatus>>(new Map());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['raw', 'wiki']));
  const [alignmentPreview, setAlignmentPreview] = useState<MemoryAlignmentPreview | null>(null);
  const [alignmentModalOpen, setAlignmentModalOpen] = useState(false);
  const [alignmentLoading, setAlignmentLoading] = useState(false);
  const [alignmentCommitting, setAlignmentCommitting] = useState(false);
  const [alignmentAutoCommitting, setAlignmentAutoCommitting] = useState(false);
  const [alignmentStatus, setAlignmentStatus] = useState<MemoryAlignmentStatus | null>(null);
  const [selectedAlignmentKeys, setSelectedAlignmentKeys] = useState<Set<string>>(new Set());
  const [alignmentHistoryOpen, setAlignmentHistoryOpen] = useState(false);
  const [alignmentHistoryLoading, setAlignmentHistoryLoading] = useState(false);
  const [alignmentHistory, setAlignmentHistory] = useState<MemoryAlignmentHistoryRecord[]>([]);
  const [consistency, setConsistency] = useState<KnowledgeConsistencyReport | null>(null);
  const [repairingConsistency, setRepairingConsistency] = useState(false);
  const [retryingGraphPath, setRetryingGraphPath] = useState<string | null>(null);
  const [taskReport, setTaskReport] = useState<KnowledgeTasksReport | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  // Track which organize statuses we've already handled to avoid duplicate refreshes
  const processedOrganizeStatusesRef = useRef<Set<string>>(new Set());
  const organizeStatusesInitializedRef = useRef(false);
  const graphTaskMap = useMemo(() => {
    const next = new Map<string, KnowledgeTask>();
    for (const task of taskReport?.tasks || []) {
      if (task.stage === 'graph' && task.filePath) {
        next.set(task.filePath, task);
      }
    }
    return next;
  }, [taskReport]);
  const taskStatusLabel = useMemo(() => {
    if (!taskReport || taskReport.summary.total === 0) return '任务';
    if (taskReport.summary.needsAttention > 0) return `${taskReport.summary.needsAttention} 项需处理`;
    if (taskReport.summary.running > 0) return `${taskReport.summary.running} 项进行中`;
    return '任务完成';
  }, [taskReport]);
  const taskBadgeCount = taskReport?.summary.needsAttention || taskReport?.summary.running || 0;

  const loadDirectoryTree = useCallback(async (retryCount = 0) => {
    try {
      const [tree, consistencyReport, tasks] = await Promise.all([
        kbApi.getDirectoryTree(),
        kbApi.getConsistency().catch(() => null),
        kbApi.getTasks().catch(() => null),
      ]);
      setTreeData(tree || []);
      if (consistencyReport) setConsistency(consistencyReport);
      if (tasks) setTaskReport(tasks);
      fetchMemoryAlignmentStatus({ days: 30, limit: 20, minConfidence: 0.72 })
        .then(setAlignmentStatus)
        .catch(() => {});
    } catch (error) {
      if (retryCount < 10) {
        // Auto-retry with exponential backoff: 2s, 4s, 6s... up to 10s
        const delay = Math.min(2000 + retryCount * 2000, 10000);
        setTimeout(() => loadDirectoryTree(retryCount + 1), delay);
      } else {
        message.error('加载目录失败，请刷新页面重试');
      }
    }
  }, []);

  useEffect(() => {
    loadDirectoryTree();
  }, [loadDirectoryTree]);

  const handleRepairConsistency = useCallback(async () => {
    setRepairingConsistency(true);
    try {
      const result = await kbApi.repairConsistency('prune-stale-graph');
      setConsistency(result.after);
      message.success(`已清理 ${result.before.staleGraphSources.length} 个失效图谱来源`);
      window.dispatchEvent(createKnowledgeGraphRefreshEvent('manual'));
      loadDirectoryTree();
    } catch (err: any) {
      message.error(err?.message || '一致性修复失败');
    } finally {
      setRepairingConsistency(false);
    }
  }, [loadDirectoryTree]);

  const handleRetryGraphExtraction = useCallback(async (filePath: string) => {
    setRetryingGraphPath(filePath);
    try {
      await kbApi.retryGraphExtraction(filePath);
      message.success('已开始重新抽取图谱');
      loadDirectoryTree();
      window.dispatchEvent(createKnowledgeGraphRefreshEvent('manual'));
    } catch (err: any) {
      message.error(err?.message || '图谱抽取重试失败');
    } finally {
      setRetryingGraphPath(null);
    }
  }, [loadDirectoryTree]);

  const handleAlignmentPreview = useCallback(async () => {
    setAlignmentLoading(true);
    try {
      const preview = await fetchMemoryAlignmentPreview({ days: 30, limit: 20, minConfidence: 0.72 });
      setAlignmentPreview(preview);
      setSelectedAlignmentKeys(new Set(
        preview.candidates
          .filter((candidate) => candidate.status !== 'conflict')
          .slice(0, 10)
          .map((candidate) => `${candidate.memoryId}-${candidate.knowledgeNodeId}`)
      ));
      setAlignmentModalOpen(true);
    } catch (err: any) {
      message.error(err?.message || '记忆对齐预览失败');
    } finally {
      setAlignmentLoading(false);
    }
  }, []);

  const handleAlignmentCommit = useCallback(async () => {
    if (!alignmentPreview) return;
    const candidates = alignmentPreview.candidates
      .slice(0, 10)
      .filter((candidate) => selectedAlignmentKeys.has(`${candidate.memoryId}-${candidate.knowledgeNodeId}`));

    if (candidates.length === 0) {
      message.warning('请先选择要沉淀的候选');
      return;
    }

    setAlignmentCommitting(true);
    try {
      const includeConflicts = candidates.some((candidate) => candidate.status === 'conflict');
      const result = await commitMemoryAlignment({ candidates, includeConflicts });
      message.success(`已沉淀 ${result.committedNodes} 个节点，${result.committedEdges} 条关系`);
      if (result.historyRecord) {
        setAlignmentHistory((prev) => [result.historyRecord!, ...prev].slice(0, 20));
      }
      fetchMemoryAlignmentStatus({ days: 30, limit: 20, minConfidence: 0.72 })
        .then(setAlignmentStatus)
        .catch(() => {});
      window.dispatchEvent(createKnowledgeGraphRefreshEvent('memory-alignment'));
      setAlignmentModalOpen(false);
      setAlignmentPreview(null);
      setSelectedAlignmentKeys(new Set());
    } catch (err: any) {
      message.error(err?.message || '记忆对齐沉淀失败');
    } finally {
      setAlignmentCommitting(false);
    }
  }, [alignmentPreview, selectedAlignmentKeys]);

  const handleAlignmentAutoCommit = useCallback(async () => {
    setAlignmentAutoCommitting(true);
    try {
      const result = await autoCommitMemoryAlignment({
        days: 30,
        previewLimit: 100,
        commitLimit: 20,
        minConfidence: 0.88,
      });
      message.success(`已自动沉淀 ${result.committedNodes} 个节点，${result.committedEdges} 条关系`);
      if (result.historyRecord) {
        setAlignmentHistory((prev) => [result.historyRecord!, ...prev].slice(0, 20));
      }
      const status = await fetchMemoryAlignmentStatus({ days: 30, limit: 20, minConfidence: 0.72 });
      setAlignmentStatus(status);
      window.dispatchEvent(createKnowledgeGraphRefreshEvent('memory-alignment'));
      loadDirectoryTree();
    } catch (err: any) {
      message.error(err?.message || '自动记忆对齐失败');
    } finally {
      setAlignmentAutoCommitting(false);
    }
  }, [loadDirectoryTree]);

  const handleAlignmentHistory = useCallback(async () => {
    setAlignmentHistoryOpen(true);
    setAlignmentHistoryLoading(true);
    try {
      const result = await fetchMemoryAlignmentHistory({ limit: 20 });
      setAlignmentHistory(result.records);
    } catch (err: any) {
      message.error(err?.message || '记忆对齐历史读取失败');
    } finally {
      setAlignmentHistoryLoading(false);
    }
  }, []);

  const revealKnowledgePath = useCallback((filePath: string) => {
    const dirsToExpand = new Set<string>();
    const parts = filePath.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      dirsToExpand.add(parts.slice(0, i).join('/'));
    }
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      dirsToExpand.forEach((dir) => next.add(dir));
      return next;
    });
    setSelectedFile(filePath);
    setLoading(true);
    kbApi.readFile(filePath)
      .then((content) => setFileContent(content || ''))
      .catch((err) => message.error(err?.message || '读取文件失败'))
      .finally(() => setLoading(false));
  }, []);

  // Check knowledge base readiness — poll until ready, then stop
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function checkKB() {
      try {
        const r = await fetch('/api/knowledge-base/tree', { method: 'HEAD' });
        if (!cancelled) {
          setKbReady(r.ok);
          if (!r.ok) {
            // Not ready yet, retry in 3s
            timer = setTimeout(checkKB, 3000);
          }
        }
      } catch {
        if (!cancelled) {
          setKbReady(false);
          // Network error, retry in 3s
          timer = setTimeout(checkKB, 3000);
        }
      }
    }

    checkKB();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Poll index + organize status
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const [jobs, organizeStatuses, tasks] = await Promise.all([
          kbApi.getAllIndexStatus(),
          kbApi.getOrganizeStatuses(),
          kbApi.getTasks().catch(() => null),
        ]);
        if (cancelled) return;
        if (tasks) setTaskReport(tasks);

        setOrganizeStatusMap(() => {
          const next = new Map<string, OrganizeStatus>();
          for (const s of organizeStatuses) {
            next.set(s.rawPath, s);
            if (!organizeStatusesInitializedRef.current && s.status === 'completed') {
              processedOrganizeStatusesRef.current.add(s.rawPath);
            }
          }
          organizeStatusesInitializedRef.current = true;
          return next;
        });

        setIndexStatusMap((prev) => {
          const next = new Map(prev);
          for (const job of jobs) {
            const key = job.filePath;
            const prevJob = prev.get(key);
            next.set(key, job);

            // Toast notifications for state transitions
            if (prevJob?.status === 'processing' && job.status === 'completed') {
              const fileName = job.filePath.split('/').pop() || job.docId;
              message.success(`「${fileName}」索引完成`);
            }
            if (prevJob?.status === 'processing' && job.status === 'failed') {
              const fileName = job.filePath.split('/').pop() || job.docId;
              message.error(`「${fileName}」索引失败: ${job.errorMessage || '未知错误'}`);
            }
          }
          return next;
        });
      } catch (err) {
        // Silently ignore polling errors
      }
    };

    poll(); // initial
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Auto-refresh tree when organize completes
  useEffect(() => {
    // Find files that just completed organizing (not yet processed)
    const newlyCompleted: { rawPath: string; wikiPaths: string[] }[] = [];

    organizeStatusMap.forEach((status, rawPath) => {
      if (status.status === 'completed' && status.wikiPaths && status.wikiPaths.length > 0) {
        // Skip if we've already processed this status
        if (!processedOrganizeStatusesRef.current.has(rawPath)) {
          processedOrganizeStatusesRef.current.add(rawPath);
          newlyCompleted.push({ rawPath, wikiPaths: status.wikiPaths });
        }
      }
    });

    if (newlyCompleted.length > 0) {
      // Refresh the directory tree
      loadDirectoryTree();

      // Auto-expand wiki subdirectories where new files were created
      const dirsToExpand = new Set<string>();
      for (const { wikiPaths } of newlyCompleted) {
        for (const wikiPath of wikiPaths) {
          // Extract the parent directory, e.g., "wiki/concepts" from "wiki/concepts/xxx.md"
          const parts = wikiPath.split('/');
          if (parts.length >= 2) {
            dirsToExpand.add(`${parts.slice(0, 2).join('/')}`);
          }
        }
      }

      if (dirsToExpand.size > 0) {
        setExpandedDirs(prev => {
          const next = new Set(prev);
          dirsToExpand.forEach(d => next.add(d));
          return next;
        });
      }

      // Show notification
      const fileName = newlyCompleted[0].rawPath.split('/').pop() || '文件';
      message.success({
        content: (
          <span>
            「{fileName}」整理完成，已生成 {newlyCompleted[0].wikiPaths.length} 个 wiki 页面
            <a onClick={() => {
              const firstWikiPath = newlyCompleted[0].wikiPaths[0];
              if (firstWikiPath) {
                revealKnowledgePath(firstWikiPath);
              } else {
                setExpandedDirs(prev => {
                  const next = new Set(prev);
                  dirsToExpand.forEach(d => next.add(d));
                  return next;
                });
              }
            }} style={{ marginLeft: 8 }}>查看</a>
          </span>
        ),
        duration: 5,
      });
    }
  }, [organizeStatusMap, loadDirectoryTree, revealKnowledgePath]);

  // Listen for graph view file open events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { filePath: string };
      if (detail?.filePath) {
        setSelectedFile(detail.filePath);
        setLoading(true);
        kbApi.readFile(detail.filePath)
          .then((content) => setFileContent(content || ''))
          .catch((err) => message.error(err?.message || '读取文件失败'))
          .finally(() => setLoading(false));
      }
    };
    window.addEventListener('knowledge-graph:open-file', handler);
    return () => window.removeEventListener('knowledge-graph:open-file', handler);
  }, []);

  const isBinaryFile = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['doc', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', '7z', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mp3'].includes(ext || '');
  };

  const handleSelect = async (path: string, isDirectory: boolean) => {
    if (!path || isDirectory) return;

    setLoading(true);
    setSelectedFile(path);
    try {
      if (isBinaryFile(path)) {
        setFileContent(`该文件类型（.${path.split('.').pop()}）暂不支持文本预览。\n\n如需查看内容，建议先转换为 Markdown 或纯文本格式后上传。`);
        return;
      }
      const content = await kbApi.readFile(path);
      setFileContent(content || '');
    } catch (error: any) {
      message.error(error?.message || '读取文件失败');
      setFileContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await kbApi.uploadFile({
        name: file.name,
        content: arrayBuffer,
        targetPath: 'raw/',
      });
      message.success(`已导入 raw 文档：${result.path}，索引任务已创建`);
      setExpandedDirs(prev => new Set(prev).add('raw'));
      loadDirectoryTree();
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  const handleUrlImport = async () => {
    if (!urlValue.trim()) {
      message.error('请输入 URL');
      return;
    }
    setUrlImporting(true);
    try {
      const result = await kbApi.importUrl({ url: urlValue.trim(), name: urlFileName.trim() || undefined });
      const resultMeta = result as unknown as {
        sourcePath?: unknown;
        cleanup?: { reductionRatio?: unknown };
      };
      const sourcePath = typeof resultMeta.sourcePath === 'string' ? resultMeta.sourcePath : undefined;
      const reductionRatio = typeof resultMeta.cleanup?.reductionRatio === 'number'
        ? resultMeta.cleanup.reductionRatio
        : undefined;
      const cleanupText = reductionRatio !== undefined
        ? `，已过滤 ${Math.max(0, Math.round((1 - reductionRatio) * 100))}% 网页噪声`
        : '';
      message.success({
        content: (
          <span>
            URL 已导入：{result.path}{cleanupText}
            {sourcePath && (
              <a onClick={() => revealKnowledgePath(sourcePath)} style={{ marginLeft: 8 }}>打开来源页</a>
            )}
          </span>
        ),
        duration: 5,
      });
      setUrlModalOpen(false);
      setUrlValue('');
      setUrlFileName('');
      setExpandedDirs(prev => {
        const next = new Set(prev);
        next.add('raw');
        next.add('wiki');
        next.add('wiki/sources');
        return next;
      });
      loadDirectoryTree();
    } catch (error: any) {
      message.error(error?.message || '导入失败');
    } finally {
      setUrlImporting(false);
    }
  };

  const handleOrganize = async (filePath: string) => {
    setOrganizing(filePath);
    try {
      const result = await fetch('/api/knowledge-base/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      }).then(r => r.json());

      if (result.code === 0 && result.data?.success) {
        const firstWikiPath = result.data.wikiPath;
        message.success({
          content: (
            <span>
              已整理为 {result.data.pages?.length ?? 1} 个 wiki 页面
              {firstWikiPath && (
                <a onClick={() => revealKnowledgePath(firstWikiPath)} style={{ marginLeft: 8 }}>打开</a>
              )}
            </span>
          ),
          duration: 5,
        });
        loadDirectoryTree();
      } else {
        message.error(result.message || '整理失败');
      }
    } catch (error) {
      message.error('整理请求失败');
    } finally {
      setOrganizing(null);
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      await kbApi.deleteFile(filePath);
      message.success('删除成功');
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setFileContent('');
      }
      loadDirectoryTree();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTreeNode = (node: FileNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;
    const paddingLeft = 8 + depth * 16;

    if (node.isDirectory) {
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleDir(node.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: `6px 8px 6px ${paddingLeft}px`,
              borderRadius: 8,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = '#f5f7fa';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {isExpanded ? (
              <CaretDownOutlined style={{ fontSize: 10, color: '#a8b8cc', flexShrink: 0 }} />
            ) : (
              <CaretRightOutlined style={{ fontSize: 10, color: '#a8b8cc', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 14, flexShrink: 0 }}>📁</span>
            <span style={{ fontSize: 12, color: '#1f2329', fontWeight: 500 }}>
              {node.title}
            </span>
            {node.children && node.children.length > 0 && (
              <span style={{ fontSize: 10, color: '#a8b8cc', marginLeft: 4 }}>
                ({node.children.length})
              </span>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    const isRaw = node.path.startsWith('raw/');
    const canOrganize = isRaw;
    const indexJob = indexStatusMap.get(node.path);

    const menuItems: any[] = [];
    menuItems.push({
      key: 'organize',
      label: 'AI 整理',
      icon: <SyncOutlined spin={organizing === node.path} />,
      disabled: !canOrganize || !!organizing,
      onClick: () => handleOrganize(node.path),
    });
    menuItems.push({
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: node.path === 'claude.md' || node.path === 'wiki/index.md',
      onClick: () => handleDelete(node.path),
    });

    return (
      <Dropdown
        key={node.path}
        menu={{ items: menuItems }}
        trigger={['contextMenu']}
      >
        <div
          onClick={() => handleSelect(node.path, false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: `6px 8px 6px ${paddingLeft}px`,
            borderRadius: 8,
            cursor: 'pointer',
            background: isSelected ? '#f5f7fa' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              (e.currentTarget as HTMLDivElement).style.background = '#f5f7fa';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0, width: 16, textAlign: 'center' }}>
            {getFileEmoji(node.path)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              color: '#1f2329',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {node.title}
            </div>
            {node.size !== undefined && (
              <div style={{ fontSize: 10, color: '#a8b8cc' }}>
                {formatSize(node.size)}
              </div>
            )}
          </div>
          {getStatusTag(node, indexJob?.status, organizeStatusMap.get(node.path), organizing === node.path, graphTaskMap.get(node.path))}
        </div>
      </Dropdown>
    );
  };

  const filterPills = ['全部', '产品', '技术', '业务'];

  const legendItems = [
    { color: '#1a75ff', label: '产品' },
    { color: '#00b365', label: '技术' },
    { color: '#f5a623', label: '业务' },
    { color: '#a855f7', label: '市场' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2329', margin: 0 }}>知识库</h2>
            {kbReady !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: kbReady ? '#00b365' : '#a8b8cc' }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: kbReady ? '#00b365' : '#a8b8cc',
                  display: 'inline-block',
                }} />
                {kbReady ? 'Wiki++ 已就绪' : 'Wiki++ 未就绪'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#646a73', margin: 0 }}>管理和组织你的文档与知识</p>
        </div>
        <Badge count={taskBadgeCount} size="small">
          <Button
            icon={<SyncOutlined />}
            onClick={() => setTaskDrawerOpen(true)}
            style={{ borderRadius: 8 }}
          >
            {taskStatusLabel}
          </Button>
        </Badge>
      </div>

      {consistency?.status === 'warning' && consistency.staleGraphSources.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`发现 ${consistency.staleGraphSources.length} 个图谱来源对应的文件已缺失`}
          description={`图谱中还有 ${consistency.staleGraphSources.reduce((sum, item) => sum + item.nodeCount, 0)} 个节点引用了不存在的 raw/wiki 文件。可以清理失效引用，让目录、索引和图谱重新一致。`}
          action={
            <Button size="small" loading={repairingConsistency} onClick={handleRepairConsistency}>
              清理失效图谱
            </Button>
          }
        />
      )}

      {alignmentStatus && (
        <div
          className="sf-card"
          style={{
            marginBottom: 12,
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 12,
            alignItems: 'center',
            background: alignmentStatus.hasActionableCandidates ? '#f7fbff' : '#fff',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <ApartmentOutlined style={{ color: alignmentStatus.hasActionableCandidates ? '#0066ff' : '#8c96a3' }} />
              <span style={{ fontSize: 13, fontWeight: 650, color: '#1f2329' }}>记忆与知识图谱对齐</span>
              <Tag color={alignmentStatus.hasActionableCandidates ? 'blue' : 'default'}>
                {alignmentStatus.candidateCount} 个候选
              </Tag>
              {alignmentStatus.conflictCount > 0 && <Tag color="orange">{alignmentStatus.conflictCount} 个需确认</Tag>}
              {alignmentStatus.historyCount > 0 && <Tag>{alignmentStatus.historyCount} 次沉淀</Tag>}
            </div>
            <div style={{ fontSize: 12, color: '#646a73', lineHeight: 1.6 }}>
              已扫描 {alignmentStatus.memoryCount} 条记忆和 {alignmentStatus.graphNodeCount} 个图谱节点。
              {alignmentStatus.hasActionableCandidates
                ? ` 可将 ${alignmentStatus.alignedCount} 条记忆沉淀为图谱关系。`
                : ' 暂无可自动沉淀的高置信候选。'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={handleAlignmentHistory}>
              历史
            </Button>
            <Button
              size="small"
              loading={alignmentAutoCommitting}
              disabled={!alignmentStatus.hasActionableCandidates}
              onClick={handleAlignmentAutoCommit}
            >
              自动沉淀
            </Button>
            <Button
              size="small"
              type={alignmentStatus.hasActionableCandidates ? 'primary' : 'default'}
              loading={alignmentLoading}
              onClick={handleAlignmentPreview}
            >
              预览对齐
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{
          width: 256,
          borderRight: '1px solid #e8ecf1',
          background: '#fff',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#646a73',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              目录
            </div>
            <span style={{ fontSize: 11, color: '#a8b8cc' }}>{treeData.length} 项</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <Upload beforeUpload={handleUpload} showUploadList={false} multiple>
              <Button
                icon={<UploadOutlined />}
                block
                style={{ borderRadius: 8, height: 34, fontSize: 12 }}
              >
                导入文件
              </Button>
            </Upload>
            <Button
              icon={<LinkOutlined />}
              block
              style={{ borderRadius: 8, height: 34, fontSize: 12 }}
              onClick={() => setUrlModalOpen(true)}
            >
              导入 URL
            </Button>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {treeData.length === 0 ? (
              <Empty description="暂无文件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              treeData.map((node) => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedFile ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#646a73',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  文档预览
                </div>
                <Button
                  icon={<ArrowLeftOutlined />}
                  size="small"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent('');
                  }}
                >
                  返回图谱
                </Button>
              </div>
              <div className="sf-card" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <Suspense fallback={<LazyPanelFallback label="加载文档预览..." />}>
                    <MarkdownPreview content={fileContent} path={selectedFile} />
                  </Suspense>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#646a73',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  知识图谱
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button
                    size="small"
                    icon={<ApartmentOutlined />}
                    loading={alignmentLoading}
                    onClick={handleAlignmentPreview}
                    style={{ fontSize: 12, marginRight: 8 }}
                  >
                    记忆对齐预览
                  </Button>
                  <Button
                    size="small"
                    onClick={handleAlignmentHistory}
                    style={{ fontSize: 12, marginRight: 8 }}
                  >
                    对齐历史
                  </Button>
                  {filterPills.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => setFilter(pill)}
                      style={{
                        fontSize: 11,
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        background: filter === pill ? '#e6f0ff' : 'transparent',
                        color: filter === pill ? '#0066ff' : '#a8b8cc',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== pill) {
                          (e.currentTarget as HTMLButtonElement).style.background = '#f5f7fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== pill) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sf-card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Suspense fallback={<LazyPanelFallback label="加载知识图谱..." />}>
                  <KnowledgeGraphView />
                </Suspense>
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  display: 'flex',
                  gap: 16,
                }}>
                  {legendItems.map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: item.color,
                      }} />
                      <span style={{ fontSize: 10, color: '#a8b8cc' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title="URL 导入"
        open={urlModalOpen}
        onOk={handleUrlImport}
        onCancel={() => {
          if (!urlImporting) {
            setUrlModalOpen(false);
            setUrlValue('');
            setUrlFileName('');
          }
        }}
        confirmLoading={urlImporting}
        okText="导入"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Input
            placeholder="https://example.com/article"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            disabled={urlImporting}
          />
          <Input
            placeholder="自定义文件名（可选，默认从 URL 提取）"
            value={urlFileName}
            onChange={(e) => setUrlFileName(e.target.value)}
            disabled={urlImporting}
          />
        </div>
      </Modal>

      <Drawer
        title="知识库任务中心"
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        width={420}
      >
        <KnowledgeTaskCenter
          report={taskReport}
          onOpenPath={(path) => {
            setTaskDrawerOpen(false);
            revealKnowledgePath(path);
          }}
          onRepairConsistency={handleRepairConsistency}
          onOrganizePath={handleOrganize}
          onRetryGraph={handleRetryGraphExtraction}
          repairingConsistency={repairingConsistency}
          organizingPath={organizing}
          retryingGraphPath={retryingGraphPath}
          compact
        />
        {!taskReport || taskReport.summary.total === 0 ? (
          <Empty description="暂无知识库任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : null}
      </Drawer>

      <Modal
        title="记忆对齐预览"
        open={alignmentModalOpen}
        footer={[
          <Button
            key="commit"
            type="primary"
            loading={alignmentCommitting}
            disabled={!alignmentPreview || selectedAlignmentKeys.size === 0}
            onClick={handleAlignmentCommit}
          >
            沉淀选中项
          </Button>,
          <Button key="close" onClick={() => setAlignmentModalOpen(false)}>
            关闭
          </Button>,
        ]}
        onCancel={() => setAlignmentModalOpen(false)}
        width={720}
      >
        {!alignmentPreview ? (
          <Empty description="暂无预览结果" />
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Tag color="blue">{alignmentPreview.candidates.length} 个候选</Tag>
              <Tag color="orange">
                {alignmentPreview.candidates.filter((item) => item.status === 'conflict').length} 个冲突
              </Tag>
              <Tag>{alignmentPreview.memoryCount} 条记忆</Tag>
              <Tag>{alignmentPreview.graphNodeCount} 个图谱节点</Tag>
              <Tag color="green">只读预览</Tag>
            </div>
            {alignmentPreview.candidates.length === 0 ? (
              <Empty description="暂无可对齐候选" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflow: 'auto' }}>
                {alignmentPreview.candidates.slice(0, 10).map((candidate) => (
                  (() => {
                    const candidateKey = `${candidate.memoryId}-${candidate.knowledgeNodeId}`;
                    const checked = selectedAlignmentKeys.has(candidateKey);
                    return (
                  <div
                    key={candidateKey}
                    style={{
                      border: '1px solid #e8ecf1',
                      borderRadius: 8,
                      padding: 12,
                      background: candidate.status === 'conflict' ? '#fff7ed' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <Checkbox
                          checked={checked}
                          onChange={(event) => {
                            setSelectedAlignmentKeys((prev) => {
                              const next = new Set(prev);
                              if (event.target.checked) {
                                next.add(candidateKey);
                              } else {
                                next.delete(candidateKey);
                              }
                              return next;
                            });
                          }}
                        />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2329' }}>
                          {candidate.knowledgeLabel}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Tag color={candidate.status === 'conflict' ? 'orange' : 'blue'}>
                          {candidate.status === 'conflict' ? '需确认' : '可对齐'}
                        </Tag>
                        <Tag>{Math.round(candidate.confidence * 100)}%</Tag>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#646a73', lineHeight: 1.6 }}>
                      {candidate.memoryExcerpt}
                    </div>
                    {candidate.evidence.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {candidate.evidence.slice(0, 4).map((item, idx) => (
                          <Tag key={`${item.type}-${idx}`} style={{ marginRight: 0 }}>
                            {item.type}: {item.value}
                          </Tag>
                        ))}
                      </div>
                    )}
                    {candidate.score && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag color="blue" style={{ marginRight: 0 }}>标签 {Math.round(candidate.score.labelMatch * 100)}%</Tag>
                        <Tag style={{ marginRight: 0 }}>描述 {Math.round(candidate.score.descriptionMatch * 100)}%</Tag>
                        {candidate.score.conflictPenalty > 0 && (
                          <Tag color="orange" style={{ marginRight: 0 }}>冲突惩罚 {Math.round(candidate.score.conflictPenalty * 100)}%</Tag>
                        )}
                      </div>
                    )}
                    {candidate.sourceSpans && candidate.sourceSpans.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {candidate.sourceSpans.slice(0, 2).map((span, idx) => (
                          <div
                            key={`${span.kind}-${idx}`}
                            style={{
                              fontSize: 11,
                              lineHeight: 1.5,
                              color: '#646a73',
                              background: '#f7f9fc',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <strong>{span.kind === 'memory' ? '记忆来源' : '知识来源'}</strong>
                            {span.source ? <span style={{ color: '#8f959e' }}> · {span.source}</span> : null}
                            <div>{span.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="记忆对齐历史"
        open={alignmentHistoryOpen}
        onCancel={() => setAlignmentHistoryOpen(false)}
        footer={<Button onClick={() => setAlignmentHistoryOpen(false)}>关闭</Button>}
        width={720}
      >
        {alignmentHistoryLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : alignmentHistory.length === 0 ? (
          <Empty description="暂无对齐提交记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflow: 'auto' }}>
            {alignmentHistory.map((record) => (
              <div
                key={record.id}
                style={{
                  border: '1px solid #e8ecf1',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2329' }}>
                    {new Date(record.createdAt).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Tag color="blue">{record.committedNodes} 节点</Tag>
                    <Tag>{record.committedEdges} 关系</Tag>
                    {record.skipped > 0 && <Tag color="orange">跳过 {record.skipped}</Tag>}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#646a73', marginBottom: 8 }}>
                  已选择 {record.selectedCount} 项
                  {record.includedConflicts ? '，包含冲突项' : ''}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {record.candidateRefs.slice(0, 6).map((candidate) => (
                    <Tag
                      key={`${record.id}-${candidate.memoryId}-${candidate.knowledgeNodeId}`}
                      color={candidate.status === 'conflict' ? 'orange' : 'default'}
                      style={{ marginRight: 0 }}
                    >
                      {candidate.knowledgeLabel} {Math.round(candidate.confidence * 100)}%
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
