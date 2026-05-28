import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { KNOWLEDGE_GRAPH_REFRESH_EVENT } from '../utils/knowledgeGraphEvents';
import { fetchGraphNeighborhood, type GraphNeighborhood } from '../utils/graphNeighborhood';
import { Input, Empty, Spin, Tag, Divider, Progress, Badge, Segmented } from 'antd';
import { buildFocusedGraphData, type KnowledgeGraphData } from '../utils/knowledgeGraphFocus';
import { getKnowledgeGraphPerformanceMode } from '../utils/knowledgeGraphPerformance';
import {
  loadKnowledgeGraphScope,
  saveKnowledgeGraphScope,
  type KnowledgeGraphScope,
} from '../utils/knowledgeGraphScope';
import {
  SearchOutlined, FileTextOutlined, BulbOutlined,
  GlobalOutlined, TagOutlined, ThunderboltOutlined,
  ApartmentOutlined, BranchesOutlined, ShakeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PATTERNS, assignNodesToPattern } from './shape-patterns.js';

type GraphData = KnowledgeGraphData;

interface TypeMetaEntry {
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  minSize: number;
  fontSize: number;
}

const TYPE_META: Record<string, TypeMetaEntry> = {
  topic:   { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: BulbOutlined,    label: '核心概念', minSize: 80, fontSize: 14 },
  entity:  { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: GlobalOutlined,  label: '实体',     minSize: 55, fontSize: 12 },
  insight: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: ThunderboltOutlined, label: '洞察',   minSize: 40, fontSize: 11 },
  source:  { color: '#4b5563', bg: '#f9fafb', border: '#e5e7eb', icon: FileTextOutlined, label: '来源',    minSize: 30, fontSize: 10 },
  tag:     { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: TagOutlined,     label: '标签',    minSize: 20, fontSize: 10 },
};

const FALLBACK_META: TypeMetaEntry = {
  color: '#567a9c', bg: '#f5f7fa', border: '#d1d9e3', icon: FileTextOutlined, label: '节点', minSize: 40, fontSize: 11,
};

function getMeta(type: string): TypeMetaEntry {
  return TYPE_META[type] || FALLBACK_META;
}

// Memoized meta lookup to avoid recreating icon references on every node render
const metaCache = new Map<string, TypeMetaEntry>();
function getMemoizedMeta(type: string): TypeMetaEntry {
  if (!metaCache.has(type)) {
    metaCache.set(type, getMeta(type));
  }
  return metaCache.get(type)!;
}

interface EdgeStyleDef {
  color: string;
  strokeWidth: number;
  opacity: number;
  dashed?: boolean;
  directional?: boolean;
  label?: string;
}

const EDGE_STYLES: Record<string, EdgeStyleDef> = {
  relates_to:  { color: '#94a3b8', strokeWidth: 1.5, opacity: 0.5, directional: true, label: '关联' },
  contains:    { color: '#64748b', strokeWidth: 1.5, opacity: 0.55, directional: true, label: '包含' },
  references:  { color: '#94a3b8', strokeWidth: 1.5, opacity: 0.5, directional: true, label: '引用' },
  related:     { color: '#cbd5e1', strokeWidth: 1,   opacity: 0.35, label: '相关' },
  tagged:      { color: '#c4b5fd', strokeWidth: 1,   opacity: 0.3,  dashed: true, label: '标签' },
  supports:    { color: '#10b981', strokeWidth: 2,   opacity: 0.65, directional: true, label: '支持' },
  contradicts: { color: '#f97316', strokeWidth: 2,   opacity: 0.65, directional: true, label: '冲突' },
};

function getEdgeStyle(relation: string): EdgeStyleDef {
  return EDGE_STYLES[relation] || EDGE_STYLES.related;
}

// ── Node Position Persistence (localStorage) ────────────────────────────────

const KG_NODE_POSITIONS_KEY = 'kg-node-positions';

function getNodePositionsFingerprint(nodeIds: string[]): string {
  return [...nodeIds].sort().join(',');
}

function saveNodePositions(nodes: Node[]): void {
  const data = {
    fingerprint: getNodePositionsFingerprint(nodes.map((n) => n.id)),
    positions: Object.fromEntries(
      nodes.map((n) => [n.id, { x: Math.round(n.position.x), y: Math.round(n.position.y) }])
    ),
  };
  try {
    localStorage.setItem(KG_NODE_POSITIONS_KEY, JSON.stringify(data));
  } catch {
    // storage full or disabled
  }
}

function loadNodePositions(nodeIds: string[]): Record<string, { x: number; y: number }> | null {
  try {
    const raw = localStorage.getItem(KG_NODE_POSITIONS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.fingerprint !== getNodePositionsFingerprint(nodeIds)) return null;
    return data.positions;
  } catch {
    return null;
  }
}

function clearNodePositions(): void {
  localStorage.removeItem(KG_NODE_POSITIONS_KEY);
}

// ── Seeded Random (deterministic layout → no hydration mismatch) ────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Custom Node ─────────────────────────────────────────────────────────────

const GraphNode = React.memo(function GraphNode({ data, selected }: { data: any; selected?: boolean }) {
  const meta = getMemoizedMeta(data.type);
  const Icon = meta.icon;
  const isDimmed = data.dimmed;
  const hideLabel = data.hideLabel;
  const size = data.actualSize || meta.minSize;
  const isSmall = size < 35;
  const isTag = data.type === 'tag';

  const mainBoxShadow = useMemo(() =>
    selected
      ? `0 0 0 3px ${meta.color}18, 0 2px 6px ${meta.color}20`
      : `0 1px 3px rgba(0,0,0,0.06)`,
    [selected, meta.color]
  );

  // Tag node: colored dot with label below
  if (isTag) {
    return (
      <>
        <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
        <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            opacity: isDimmed ? 0.1 : 1,
            transition: 'opacity 0.25s ease',
            pointerEvents: isDimmed ? 'none' : 'auto',
            transform: selected ? 'scale(1.3)' : 'scale(1)',
            willChange: 'transform',
          }}
          title={`${data.label} · ${meta.label} · ${data.degree} 个连接`}
        >
          <div
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: '50%',
              background: meta.color,
              boxShadow: selected ? `0 0 0 2px ${meta.color}` : 'none',
            }}
          />
          {!hideLabel && (
            <span style={{ fontSize: 9, color: meta.color, marginTop: 2, fontWeight: 500, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.label}
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isDimmed ? 0.1 : 1,
          transition: 'opacity 0.25s ease, transform 0.2s ease',
          pointerEvents: isDimmed ? 'none' : 'auto',
          transform: selected ? 'scale(1.12)' : 'scale(1)',
          willChange: 'transform',
          width: size,
          height: size,
        }}
        title={`${data.label} · ${meta.label} · 重要性 ${data.importance ?? 0} · ${data.degree} 个连接`}
      >
        <div
          style={{
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
            maxWidth: size,
            maxHeight: size,
            borderRadius: size >= 55 ? size * 0.5 : 8,
            background: meta.bg,
            border: `${selected ? 2.5 : 1.5}px solid ${selected ? meta.color : meta.border}`,
            color: meta.color,
            fontSize: isSmall ? 9 : meta.fontSize,
            fontWeight: data.importance >= 60 ? 700 : data.importance >= 30 ? 600 : 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            boxShadow: mainBoxShadow,
            overflow: 'hidden',
            textAlign: 'center',
            padding: isSmall ? 2 : 4,
            lineHeight: 1.2,
          }}
        >
          {!isSmall && <Icon style={{ fontSize: Math.max(10, size * 0.18), opacity: 0.8 }} />}
          {!hideLabel && (
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', maxWidth: '100%', padding: '0 2px' }}>
              {data.label}
            </span>
          )}
        </div>
        {data.degree >= 3 && size >= 40 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: Math.max(14, size * 0.22), height: Math.max(14, size * 0.22), borderRadius: '50%', background: meta.color, color: '#fff', fontSize: Math.max(8, size * 0.12), fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
            {data.degree}
          </div>
        )}
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render when data actually changes
  if (prevProps.selected !== nextProps.selected) return false;
  const p = prevProps.data;
  const n = nextProps.data;
  return (
    p.dimmed === n.dimmed &&
    p.hideLabel === n.hideLabel &&
    p.label === n.label &&
    p.actualSize === n.actualSize &&
    p.importance === n.importance &&
    p.degree === n.degree &&
    p.type === n.type
  );
});

const nodeTypes = { graphNode: GraphNode };

// ── Force-Directed Layout ───────────────────────────────────────────────────

async function forceLayout(
  nodes: Array<{ id: string; label: string; type: string; importance?: number }>,
  edges: Array<{ source: string; target: string }>,
  communities: Array<{ id: string; nodes: string[] }>,
  onProgress?: (pct: number) => void
): Promise<Map<string, { x: number; y: number }>> {
  const N = nodes.length;
  if (N === 0) return new Map();

  const nodeCommunity = new Map<string, string>();
  for (const comm of communities) {
    for (const nodeId of comm.nodes) {
      nodeCommunity.set(nodeId, comm.id);
    }
  }

  const nodeSize = new Map<string, number>();
  for (const n of nodes) {
    const meta = getMeta(n.type);
    const importance = n.importance ?? 50;
    nodeSize.set(n.id, meta.minSize + Math.sqrt(importance / 100) * 50);
  }

  const rand = seededRandom(42); // deterministic seed
  const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N + (rand() - 0.5) * 0.5;
    const r = 500 + rand() * 300;
    pos.set(nodes[i].id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r, vx: 0, vy: 0 });
  }

  // Scale iterations by graph size to avoid excessive compute on large graphs
  const ITERATIONS = N > 300 ? 200 : N > 100 ? 200 : 400;
  const REPULSE_BASE = 50000;
  const ATTRACT = 0.004;
  const DAMPING = 0.88;
  const CENTER_GRAVITY = 0.03;
  const IDEAL_DIST = Math.min(380, 1800 / Math.sqrt(N + 10));
  const COMMUNITY_ATTRACT = 0.06;
  const COMMUNITY_IDEAL_DIST = IDEAL_DIST * 0.3;
  const MIN_DIST_FACTOR = 0.55;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Yield every 50 iterations for large graphs to keep UI responsive
    if (N > 100 && iter % 50 === 0 && iter > 0) {
      onProgress?.(iter / ITERATIONS);
      await new Promise((r) => requestAnimationFrame(r));
    }

    const cooling = 1 - iter / ITERATIONS;
    const repulse = REPULSE_BASE * cooling;

    // Repulsion: O(n²) — only compute every 2nd iteration for large graphs to speed up
    if (N <= 300 || iter % 2 === 0) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const pa = pos.get(nodes[i].id)!;
          const pb = pos.get(nodes[j].id)!;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const rawDist = Math.sqrt(dx * dx + dy * dy) || 1;
          const sizeA = nodeSize.get(nodes[i].id) || 40;
          const sizeB = nodeSize.get(nodes[j].id) || 40;
          const minDist = (sizeA + sizeB) * MIN_DIST_FACTOR + 30;
          const dist = Math.max(rawDist, minDist * 0.3);
          const sizeFactor = (sizeA + sizeB) / 80;
          const distFactor = dist < minDist ? Math.pow(minDist / dist, 2) : 1;
          const force = (repulse * sizeFactor * distFactor) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          pa.vx += fx;
          pa.vy += fy;
          pb.vx -= fx;
          pb.vy -= fy;
        }
      }
    }

    for (const e of edges) {
      const pa = pos.get(e.source);
      const pb = pos.get(e.target);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - IDEAL_DIST) * ATTRACT * cooling;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      pa.vx += fx;
      pa.vy += fy;
      pb.vx -= fx;
      pb.vy -= fy;
    }

    if (N <= 300 || iter % 2 === 0) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const commA = nodeCommunity.get(nodes[i].id);
          const commB = nodeCommunity.get(nodes[j].id);
          if (!commA || !commB || commA !== commB) continue;
          const pa = pos.get(nodes[i].id)!;
          const pb = pos.get(nodes[j].id)!;
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - COMMUNITY_IDEAL_DIST) * COMMUNITY_ATTRACT * cooling;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          pa.vx += fx;
          pa.vy += fy;
          pb.vx -= fx;
          pb.vy -= fy;
        }
      }
    }

    for (const n of nodes) {
      const p = pos.get(n.id)!;
      p.vx -= p.x * CENTER_GRAVITY;
      p.vy -= p.y * CENTER_GRAVITY;
    }

    for (const n of nodes) {
      const p = pos.get(n.id)!;
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    }

    // Collision resolution every 3rd iteration for large graphs
    if (iter % 3 === 0 || N <= 200) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const pa = pos.get(nodes[i].id)!;
          const pb = pos.get(nodes[j].id)!;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const sizeA = nodeSize.get(nodes[i].id) || 40;
          const sizeB = nodeSize.get(nodes[j].id) || 40;
          const minDist = (sizeA + sizeB) * MIN_DIST_FACTOR + 30;
          if (dist < minDist) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            pa.vx += nx * overlap * 0.3;
            pa.vy += ny * overlap * 0.3;
            pb.vx -= nx * overlap * 0.3;
            pb.vy -= ny * overlap * 0.3;
          }
        }
      }
    }
  }

  for (let iter = 0; iter < 15; iter++) {
    let moved = false;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const pa = pos.get(nodes[i].id)!;
        const pb = pos.get(nodes[j].id)!;
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const sizeA = nodeSize.get(nodes[i].id) || 40;
        const sizeB = nodeSize.get(nodes[j].id) || 40;
        const minDist = (sizeA + sizeB) * MIN_DIST_FACTOR + 30;
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          pa.x += nx * overlap;
          pa.y += ny * overlap;
          pb.x -= nx * overlap;
          pb.y -= ny * overlap;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const p = pos.get(n.id)!;
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY) || 1;

  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const p = pos.get(n.id)!;
    result.set(n.id, {
      x: ((p.x - cx) / scale) * 2800,
      y: ((p.y - cy) / scale) * 2800,
    });
  }
  return result;
}

// ── Main Component ─────────────────────────────────────────────────────────

const LIGHT_RAG_TYPE_MAP: Record<string, string> = {
  topic: 'topic',
  entity: 'entity',
  insight: 'insight',
  source: 'source',
  tag: 'tag',
  concept: 'topic',
  person: 'entity',
  organization: 'entity',
  event: 'insight',
  document: 'source',
};

// 与后端 graph.ts 统一的 12 色社区调色板
const COMMUNITY_COLORS = [
  '#4A90D9', // blue
  '#50C878', // green
  '#E8A838', // amber
  '#C75B9B', // magenta
  '#5BC0BE', // teal
  '#E27D60', // coral
  '#8E7CC3', // lavender
  '#D4A373', // tan
  '#6A994E', // olive
  '#BC4B51', // rose
  '#2A9D8F', // sea green
  '#E9C46A', // yellow
];

interface LightRAGNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  filePath?: string;
  sources?: string[];
  importance?: number;
}

interface LightRAGEdge {
  source: string;
  target: string;
  relation: string;
  weight?: number;
}

interface LightRAGResponse {
  nodes: LightRAGNode[];
  edges: LightRAGEdge[];
}

function transformLightRAGToGraphData(data: LightRAGResponse): GraphData {
  const nodes = data.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    type: LIGHT_RAG_TYPE_MAP[n.type] || 'entity',
    summary: n.description,
    filePath: n.filePath,
    sources: n.sources,
    importance: n.importance ?? 50,
  }));

  const edges = data.edges.map((e) => ({
    source: e.source,
    target: e.target,
    relation: e.relation,
    strength: e.weight,
  }));

  // Compute degree-based importance and max degree
  const degrees = new Map<string, number>();
  for (const n of nodes) degrees.set(n.id, 0);
  for (const e of edges) {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  }
  const maxDegree = Math.max(1, ...degrees.values());

  for (const n of nodes) {
    const deg = degrees.get(n.id) || 0;
    n.importance = n.importance ?? Math.round((deg / maxDegree) * 100);
  }

  // Build communities by type
  const typeGroups = new Map<string, string[]>();
  for (const n of nodes) {
    if (!typeGroups.has(n.type)) typeGroups.set(n.type, []);
    typeGroups.get(n.type)!.push(n.id);
  }

  const communities: GraphData['communities'] = [];
  let colorIdx = 0;
  for (const [type, nodeIds] of typeGroups) {
    communities.push({
      id: `lightrag-${type}`,
      label: TYPE_META[type]?.label || type,
      nodes: nodeIds,
      color: COMMUNITY_COLORS[colorIdx % COMMUNITY_COLORS.length],
    });
    colorIdx++;
  }

  return { nodes, edges, communities };
}

// ── Flow Canvas (wrapped by ReactFlowProvider) ──────────────────────────────

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onNodeClick: (_: React.MouseEvent, node: Node) => void;
  onNodeMouseEnter: (_: React.MouseEvent, node: Node) => void;
  onNodeMouseLeave: () => void;
  onNodeDragStop?: (_: React.MouseEvent, node: Node) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onNodeDragStop,
  onMoveStart,
  onMoveEnd,
}: FlowCanvasProps) {
  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);

  // Programmatically fit view once nodes are populated
  useEffect(() => {
    if (nodes.length > 0 && !hasFitted.current) {
      hasFitted.current = true;
      // Small delay to ensure ReactFlow has measured node sizes
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 600 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onNodeMouseEnter={onNodeMouseEnter}
      onNodeMouseLeave={onNodeMouseLeave}
      onNodeDragStop={onNodeDragStop}
      onMoveStart={onMoveStart}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
      minZoom={0.05}
      maxZoom={2.5}
      nodeExtent={[[-3000, -3000], [3000, 3000]]}
      elevateNodesOnSelect
    >
      <Background gap={40} size={1} color="#e8e8e8" />
      <Controls />
    </ReactFlow>
  );
}

// ── KnowledgeGraphView (state + UI) ─────────────────────────────────────────

function KnowledgeGraphViewInner() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutProgress, setLayoutProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<GraphNeighborhood | null>(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [prunedCount, setPrunedCount] = useState(0);
  const [graphScope, setGraphScope] = useState<KnowledgeGraphScope>(() => loadKnowledgeGraphScope());
  const [isPatternMode, setIsPatternMode] = useState(false);
  const [currentPatternName, setCurrentPatternName] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const originalPositionsRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const loadGraphData = useCallback(async (retryCount = 0, isCancelled?: () => boolean): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setPrunedCount(0);

      const r = await fetch('/api/knowledge-base/lightrag-graph');
      const result = await r.json();
      if (result.code !== 0) throw new Error(result.message || '加载失败');
      const transformed = transformLightRAGToGraphData(result.data as LightRAGResponse);
      if (!isCancelled?.()) setGraphData(transformed);
    } catch (err: any) {
      if (isCancelled?.()) return;
      if (retryCount < 5) {
        window.setTimeout(() => {
          loadGraphData(retryCount + 1, isCancelled);
        }, 3000);
        return;
      }
      setError(err?.message || '加载图谱失败，请刷新页面重试');
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, []);

  // Fetch graph data with auto-retry
  useEffect(() => {
    let cancelled = false;
    loadGraphData(0, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadGraphData]);

  useEffect(() => {
    const handler = () => {
      loadGraphData(0);
    };
    window.addEventListener(KNOWLEDGE_GRAPH_REFRESH_EVENT, handler);
    return () => window.removeEventListener(KNOWLEDGE_GRAPH_REFRESH_EVENT, handler);
  }, [loadGraphData]);

  const communityColorMap = useMemo(() => {
    if (!graphData) return new Map<string, string>();
    const map = new Map<string, string>();
    for (let i = 0; i < graphData.communities.length; i++) {
      map.set(graphData.communities[i].id, graphData.communities[i].color || COMMUNITY_COLORS[i % COMMUNITY_COLORS.length]);
    }
    return map;
  }, [graphData]);

  const nodeCommunityMap = useMemo(() => {
    if (!graphData) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const comm of graphData.communities) {
      for (const nodeId of comm.nodes) {
        map.set(nodeId, comm.id);
      }
    }
    return map;
  }, [graphData]);

  const focusedView = useMemo(() => {
    if (!graphData) return null;
    return buildFocusedGraphData(graphData);
  }, [graphData]);

  const visibleGraphData = useMemo(() => {
    if (!graphData) return null;
    if (graphScope === 'all') return graphData;
    return focusedView?.graph || graphData;
  }, [graphData, graphScope, focusedView]);
  const performanceMode = useMemo(() => (
    getKnowledgeGraphPerformanceMode({
      nodes: visibleGraphData?.nodes.length || 0,
      edges: visibleGraphData?.edges.length || 0,
    })
  ), [visibleGraphData]);

  // Build nodes/edges with async layout to avoid blocking main thread
  useEffect(() => {
    if (!visibleGraphData) return;

    setLayoutLoading(true);
    setLayoutProgress(0);
    setPrunedCount(0);

    const g = visibleGraphData;
    let cancelled = false;

    async function buildLayout() {
      let allNodes = g.nodes;
      let allEdges = g.edges;

      // Node pruning for large graphs: keep high-degree nodes + their 1-hop neighbors
      const NODE_LIMIT = performanceMode.renderBudget.maxRenderedNodes;
      let pruned = 0;
      if (allNodes.length > NODE_LIMIT) {
        const degrees = new Map<string, number>();
        for (const n of allNodes) degrees.set(n.id, 0);
        for (const e of allEdges) {
          degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
          degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
        }
        // Sort by degree descending, keep top NODE_LIMIT * 0.6 nodes
        const sorted = allNodes.slice().sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0));
        const keepCount = Math.floor(NODE_LIMIT * 0.6);
        const keptIds = new Set(sorted.slice(0, keepCount).map((n) => n.id));

        // Always keep tag nodes that link to kept nodes
        const tagIds = new Set(allNodes.filter((n) => n.type === 'tag').map((n) => n.id));
        for (const e of allEdges) {
          if (keptIds.has(e.source) && tagIds.has(e.target)) keptIds.add(e.target);
          if (keptIds.has(e.target) && tagIds.has(e.source)) keptIds.add(e.source);
        }

        allNodes = allNodes.filter((n) => keptIds.has(n.id));
        allEdges = allEdges.filter(
          (e) => keptIds.has(e.source) && keptIds.has(e.target)
        );
        pruned = g.nodes.length - allNodes.length;
        if (!cancelled) setPrunedCount(pruned);
      }

      const allNodeIds = new Set(allNodes.map((n) => n.id));
      allEdges = allEdges.filter(
        (e) => allNodeIds.has(e.source) && allNodeIds.has(e.target)
      );

      const degrees = new Map<string, number>();
      for (const n of allNodes) degrees.set(n.id, 0);
      for (const e of allEdges) {
        degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
        degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
      }
      const maxDegree = Math.max(1, ...degrees.values());

      // Try restore saved positions (user manually dragged nodes)
      const savedPositions = loadNodePositions(allNodes.map((n) => n.id));
      if (savedPositions) {
        const rfNodes: Node[] = allNodes.map((n) => {
          const pos = savedPositions[n.id] || { x: 0, y: 0 };
          const deg = degrees.get(n.id) || 0;
          const meta = getMeta(n.type);
          const importance = n.importance ?? 50;
          const actualSize = meta.minSize + Math.sqrt(importance / 100) * 50;
          const commId = nodeCommunityMap.get(n.id);
          const commColor = commId ? communityColorMap.get(commId) : undefined;

          return {
            id: n.id,
            type: 'graphNode',
            position: pos,
            data: {
              label: n.label,
              type: n.type,
              degree: deg,
              maxDegree,
              importance,
              actualSize,
              filePath: n.filePath,
              summary: n.summary,
              sources: n.sources,
              communityColor: commColor,
              dimmed: false,
              hideLabel: false,
            },
          };
        });

        const rfEdges: Edge[] = allEdges.map((e, idx) => {
          const styleDef = getEdgeStyle(e.relation);
          return {
            id: `e-${idx}`,
            source: e.source,
            target: e.target,
            type: 'default',
            data: { relation: e.relation },
            style: {
              stroke: styleDef.color,
              strokeWidth: Math.max(styleDef.strokeWidth, 1.5),
              opacity: styleDef.opacity,
              strokeDasharray: styleDef.dashed ? '5,5' : undefined,
            },
            markerEnd: styleDef.directional ? {
              type: 'arrowclosed' as any,
              width: 8,
              height: 8,
              color: styleDef.color,
            } : undefined,
          };
        });

        if (!cancelled) {
          setNodes(rfNodes);
          setEdges(rfEdges);
          setLayoutLoading(false);
          setLayoutProgress(0);
          const orig = new Map<string, { x: number; y: number }>();
          for (const n of rfNodes) {
            orig.set(n.id, { ...n.position });
          }
          originalPositionsRef.current = orig;
        }
        return;
      }

      const positions = await forceLayout(
        allNodes,
        allEdges,
        g.communities,
        (pct) => {
          if (!cancelled) setLayoutProgress(pct);
        }
      );

      if (cancelled) return;

      const rfNodes: Node[] = allNodes.map((n) => {
        const pos = positions.get(n.id) || { x: 0, y: 0 };
        const deg = degrees.get(n.id) || 0;
        const meta = getMeta(n.type);
        const importance = n.importance ?? 50;
        const actualSize = meta.minSize + Math.sqrt(importance / 100) * 50;
        const commId = nodeCommunityMap.get(n.id);
        const commColor = commId ? communityColorMap.get(commId) : undefined;

        return {
          id: n.id,
          type: 'graphNode',
          position: pos,
          data: {
            label: n.label,
            type: n.type,
            degree: deg,
            maxDegree,
            importance,
            actualSize,
            filePath: n.filePath,
            summary: n.summary,
            sources: n.sources,
            communityColor: commColor,
            dimmed: false,
            hideLabel: false,
          },
        };
      });

      const rfEdges: Edge[] = allEdges.map((e, idx) => {
        const styleDef = getEdgeStyle(e.relation);
        return {
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          type: 'default',
          data: { relation: e.relation },
          style: {
            stroke: styleDef.color,
            strokeWidth: Math.max(styleDef.strokeWidth, 1.5),
            opacity: styleDef.opacity,
            strokeDasharray: styleDef.dashed ? '5,5' : undefined,
          },
          markerEnd: styleDef.directional ? {
            type: 'arrowclosed' as any,
            width: 8,
            height: 8,
            color: styleDef.color,
          } : undefined,
        };
      });

      setNodes(rfNodes);
      setEdges(rfEdges);
      setLayoutLoading(false);
      setLayoutProgress(0);

      // Save original positions for pattern restore
      const orig = new Map<string, { x: number; y: number }>();
      for (const n of rfNodes) {
        orig.set(n.id, { ...n.position });
      }
      originalPositionsRef.current = orig;
    }

    buildLayout();
    return () => {
      cancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    visibleGraphData,
    performanceMode.renderBudget.maxRenderedNodes,
    setNodes,
    setEdges,
    communityColorMap,
    nodeCommunityMap,
  ]);

  useEffect(() => {
    const hideLabel = isInteracting && performanceMode.hideLabelsOnMove;
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        if (n.data?.hideLabel === hideLabel) return n;
        changed = true;
        return { ...n, data: { ...n.data, hideLabel } };
      });
      return changed ? next : prev;
    });

    if (!performanceMode.softenEdgesOnMove) return;
    setEdges((prev) => prev.map((e) => {
      const relation = (e.data as any)?.relation;
      const styleDef = getEdgeStyle(relation);
      const targetOpacity = isInteracting ? performanceMode.renderBudget.edgeOpacityOnMove : styleDef.opacity;
      if ((e.style as any)?.opacity === targetOpacity) return e;
      return {
        ...e,
        style: {
          ...e.style,
          opacity: targetOpacity,
        },
      };
    }));
  }, [
    isInteracting,
    performanceMode.hideLabelsOnMove,
    performanceMode.renderBudget.edgeOpacityOnMove,
    performanceMode.softenEdgesOnMove,
    setNodes,
    setEdges,
  ]);

  // Debounce search term to avoid re-rendering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search highlight
  useEffect(() => {
    if (!visibleGraphData) return;
    const term = debouncedSearch.trim().toLowerCase();

    if (!term) {
      setNodes((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (n.data?.dimmed !== false) {
            changed = true;
            return { ...n, data: { ...n.data, dimmed: false } };
          }
          return n;
        });
        return changed ? next : prev;
      });
      setEdges((prev) => prev.map((e) => {
        const r = (e.data as any)?.relation;
        const styleDef = getEdgeStyle(r);
        const targetOpacity = Math.max(styleDef.opacity, 0.7);
        if ((e.style as any)?.opacity === targetOpacity) return e;
        return {
          ...e,
          style: { ...e.style, opacity: targetOpacity },
        };
      }));
      return;
    }

    const matched = new Set<string>();
    for (const n of nodes) {
      if ((n.data?.label as string)?.toLowerCase().includes(term)) matched.add(n.id);
    }

    const neighborMatched = new Set<string>(matched);
    for (const e of edges) {
      if (matched.has(e.source)) neighborMatched.add(e.target);
      if (matched.has(e.target)) neighborMatched.add(e.source);
    }

    setNodes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        const shouldDim = !neighborMatched.has(n.id);
        if (n.data?.dimmed !== shouldDim) {
          changed = true;
          return { ...n, data: { ...n.data, dimmed: shouldDim } };
        }
        return n;
      });
      return changed ? next : prev;
    });
    setEdges((prev) => prev.map((e) => {
      const relevant = neighborMatched.has(e.source) && neighborMatched.has(e.target);
      const targetOpacity = relevant ? Math.max((e.style as any)?.opacity || 0.7, 0.7) : 0.06;
      if ((e.style as any)?.opacity === targetOpacity) return e;
      return {
        ...e,
        style: {
          ...e.style,
          opacity: targetOpacity,
        },
      };
    }));
  }, [debouncedSearch, visibleGraphData, edges, nodes, setNodes, setEdges]);

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, hoveredNode: Node) => {
      const connected = new Set<string>([hoveredNode.id]);
      for (const e of edges) {
        if (e.source === hoveredNode.id) connected.add(e.target);
        if (e.target === hoveredNode.id) connected.add(e.source);
      }
      setNodes((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          const shouldDim = !connected.has(n.id);
          if (n.data?.dimmed !== shouldDim) {
            changed = true;
            return { ...n, data: { ...n.data, dimmed: shouldDim } };
          }
          return n;
        });
        return changed ? next : prev;
      });
    },
    [edges, setNodes]
  );

  const onNodeMouseLeave = useCallback(() => {
    if (searchTerm) return;
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        if (n.data?.dimmed !== false) {
          changed = true;
          return { ...n, data: { ...n.data, dimmed: false } };
        }
        return n;
      });
      return changed ? next : prev;
    });
  }, [searchTerm, setNodes]);

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node) => {
      setIsInteracting(false);
      if (isPatternMode) return;
      saveNodePositions(nodesRef.current);
    },
    [isPatternMode]
  );

  const handleMoveStart = useCallback(() => {
    if (performanceMode.hideLabelsOnMove || performanceMode.softenEdgesOnMove) {
      setIsInteracting(true);
    }
  }, [performanceMode.hideLabelsOnMove, performanceMode.softenEdgesOnMove]);

  const handleMoveEnd = useCallback(() => {
    setIsInteracting(false);
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      setSelectedNeighborhood(null);
      setNeighborhoodError(null);
      setNeighborhoodLoading(false);
      return;
    }

    const controller = new AbortController();
    setNeighborhoodLoading(true);
    setNeighborhoodError(null);

    fetchGraphNeighborhood({ nodeId: selectedNode, limit: 12, signal: controller.signal })
      .then((neighborhood) => {
        setSelectedNeighborhood(neighborhood);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setSelectedNeighborhood(null);
        setNeighborhoodError(err?.message || '一跳关系加载失败');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setNeighborhoodLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedNode]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNode || !visibleGraphData) return null;
    const neighborhoodNodeMap = new Map((selectedNeighborhood?.nodes || []).map((n) => [n.id, n]));
    const graphNodeMap = new Map(visibleGraphData.nodes.map((n) => [n.id, n]));
    const findNode = (id: string) => neighborhoodNodeMap.get(id) || graphNodeMap.get(id);
    const node = findNode(selectedNode);
    if (!node) return null;
    const relatedEdges = selectedNeighborhood?.edges || visibleGraphData.edges.filter(
      (e) => e.source === selectedNode || e.target === selectedNode
    );
    const inDegree = relatedEdges.filter((e) => e.target === selectedNode).length;
    const outDegree = relatedEdges.filter((e) => e.source === selectedNode).length;
    return {
      node,
      relatedEdges,
      inDegree,
      outDegree,
      findNode,
      neighborhood: selectedNeighborhood,
    };
  }, [selectedNode, visibleGraphData, selectedNeighborhood]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode((prev) => (prev === node.id ? null : node.id));
  }, []);

  const handleOpenFile = useCallback((filePath: string) => {
    window.dispatchEvent(new CustomEvent('knowledge-graph:open-file', { detail: { filePath } }));
  }, []);

  // ── Pattern Animation ──────────────────────────────────────────────────────

  const animateToPositions = useCallback((
    targetPositions: Map<string, { x: number; y: number }>,
    duration: number = 600
  ) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startPositions = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      startPositions.set(n.id, { ...n.position });
    }

    const startTime = performance.now();
    setIsAnimating(true);

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setNodes((prev) =>
        prev.map((n) => {
          const start = startPositions.get(n.id);
          const target = targetPositions.get(n.id);
          if (!start || !target) return n;
          return {
            ...n,
            position: {
              x: start.x + (target.x - start.x) * eased,
              y: start.y + (target.y - start.y) * eased,
            },
          };
        })
      );

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
        animFrameRef.current = null;
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [nodes, setNodes]);

  // Auto-restore pattern mode after layout completes (e.g., when switching tabs back)
  useEffect(() => {
    if (layoutLoading || !visibleGraphData || nodes.length === 0 || isAnimating) return;
    if (restoredRef.current) return;
    if (isPatternMode) return;

    const savedPattern = sessionStorage.getItem('kg-pattern-name');
    const savedMode = sessionStorage.getItem('kg-pattern-mode') === 'true';

    if (savedMode && savedPattern) {
      restoredRef.current = true;
      const pattern = PATTERNS.find((p) => p.nameCn === savedPattern);
      if (pattern) {
        setIsPatternMode(true);
        setCurrentPatternName(savedPattern);

        const importanceMap = new Map<string, number>();
        for (const n of visibleGraphData.nodes) {
          importanceMap.set(n.id, n.importance ?? 50);
        }
        const targetPositions = assignNodesToPattern(
          nodes.map((n) => n.id),
          importanceMap,
          pattern,
          1300
        );
        animateToPositions(targetPositions, 500);
      }
    }
  }, [layoutLoading, visibleGraphData, nodes.length, isPatternMode, isAnimating, animateToPositions]);

  const applyRandomPattern = useCallback(() => {
    if (!visibleGraphData || nodes.length === 0 || isAnimating) return;

    const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const importanceMap = new Map<string, number>();
    for (const n of visibleGraphData.nodes) {
      importanceMap.set(n.id, n.importance ?? 50);
    }

    const targetPositions = assignNodesToPattern(
      nodes.map((n) => n.id),
      importanceMap,
      pattern,
      1300
    );

    setIsPatternMode(true);
    setCurrentPatternName(pattern.nameCn);
    sessionStorage.setItem('kg-pattern-mode', 'true');
    sessionStorage.setItem('kg-pattern-name', pattern.nameCn);
    animateToPositions(targetPositions, 700);
  }, [visibleGraphData, nodes, isAnimating, animateToPositions]);

  const handleScopeChange = useCallback((scope: KnowledgeGraphScope) => {
    if (scope === graphScope) return;
    setGraphScope(scope);
    saveKnowledgeGraphScope(scope);
    setSelectedNode(null);
    setSearchTerm('');
    setDebouncedSearch('');
    setIsPatternMode(false);
    setCurrentPatternName(null);
    sessionStorage.removeItem('kg-pattern-mode');
    sessionStorage.removeItem('kg-pattern-name');
    clearNodePositions();
    restoredRef.current = false;
  }, [graphScope]);

  const restoreForceLayout = useCallback(() => {
    if (!originalPositionsRef.current || isAnimating) return;
    setIsPatternMode(false);
    setCurrentPatternName(null);
    sessionStorage.removeItem('kg-pattern-mode');
    sessionStorage.removeItem('kg-pattern-name');
    clearNodePositions();
    restoredRef.current = false;
    animateToPositions(originalPositionsRef.current, 600);
  }, [isAnimating, animateToPositions]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="构建知识图谱..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ color: '#ff4d4f', fontSize: 14 }}>加载失败: {error}</div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#1f2329', fontWeight: 500, marginBottom: 6 }}>
                暂无知识图谱数据
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                上传文件后，系统将自动提取实体和关系构建知识图谱<br />
                知识越丰富，图谱越精彩
              </div>
            </div>
          }
        />
      </div>
    );
  }

  const nodeCount = visibleGraphData?.nodes.length ?? graphData.nodes.length;
  const edgeCount = visibleGraphData?.edges.length ?? graphData.edges.length;
  const communityCount = visibleGraphData?.communities.length ?? graphData.communities.length;
  const focusedHiddenCount = graphScope === 'focused' ? focusedView?.hiddenCount ?? 0 : 0;
  const focusSourceName = focusedView?.sourcePath?.split('/').pop() || focusedView?.sourcePath || '';

  return (
    <div style={{ height: '100%', display: 'flex', background: '#f5f7fa' }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid #e8ecf1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e8ecf1', background: '#fafbfc' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2329', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ApartmentOutlined style={{ color: '#0066ff' }} />
            知识图谱
            {prunedCount > 0 && (
              <Badge count={`-${prunedCount}`} style={{ backgroundColor: '#faad14' }} title={`已隐藏 ${prunedCount} 个低关联节点以优化性能`} />
            )}
          </div>
          <Input
            placeholder="搜索节点..."
            prefix={<SearchOutlined style={{ color: '#a8b8cc' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            size="small"
          />
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #e8ecf1', flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            节点信息
          </div>
          {selectedNodeData ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#262626', marginBottom: 6 }}>
                {selectedNodeData.node.label}
              </div>
              <div style={{ marginBottom: 12 }}>
                {(() => {
                  const meta = getMeta(selectedNodeData.node.type);
                  const Icon = meta.icon;
                  return (
                    <Tag color={meta.border} style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}>
                      <Icon style={{ fontSize: 11, marginRight: 3 }} />
                      {meta.label}
                    </Tag>
                  );
                })()}
              </div>
              {selectedNodeData.node.summary && (
                <div style={{ fontSize: 12, color: '#595959', background: '#e6ffed', padding: 8, borderRadius: 4, marginBottom: 12, lineHeight: 1.5 }}>
                  {selectedNodeData.node.summary}
                </div>
              )}
              {selectedNodeData.node.importance !== undefined && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>重要性</div>
                  <Progress percent={selectedNodeData.node.importance} size="small" showInfo={false} strokeColor={getMeta(selectedNodeData.node.type).color} />
                </div>
              )}
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>
                连接数: <b>{selectedNodeData.relatedEdges.length}</b>{' '}
                <span style={{ color: '#8c8c8c' }}>(入 {selectedNodeData.inDegree} / 出 {selectedNodeData.outDegree})</span>
              </div>
              {selectedNodeData.neighborhood && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Tag color="blue">一跳 {selectedNodeData.neighborhood.summary.totalNeighbors}</Tag>
                  {selectedNodeData.neighborhood.summary.memoryLinks > 0 && (
                    <Tag color="green">记忆 {selectedNodeData.neighborhood.summary.memoryLinks}</Tag>
                  )}
                  {selectedNodeData.neighborhood.summary.topRelation && (
                    <Tag>{selectedNodeData.neighborhood.summary.topRelation}</Tag>
                  )}
                </div>
              )}
              {neighborhoodLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                  <Spin size="small" />
                  加载一跳关系...
                </div>
              )}
              {neighborhoodError && (
                <div style={{ fontSize: 12, color: '#fa8c16', marginBottom: 8 }}>
                  {neighborhoodError}
                </div>
              )}
              {selectedNodeData.node.filePath && (
                <div style={{ marginBottom: 12 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleOpenFile(selectedNodeData.node.filePath!); }} style={{ fontSize: 12 }}>
                    打开文件
                  </a>
                </div>
              )}
              {selectedNodeData.relatedEdges.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  {selectedNodeData.neighborhood?.explanations.length ? (
                    <>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6, fontWeight: 500 }}>关系解释</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {selectedNodeData.neighborhood.explanations.slice(0, 3).map((text, idx) => (
                          <div
                            key={`${selectedNodeData.node.id}-explanation-${idx}`}
                            style={{ fontSize: 11, lineHeight: 1.5, color: '#595959', background: '#f7f9fc', borderRadius: 6, padding: '6px 8px' }}
                          >
                            {text}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6, fontWeight: 500 }}>关联节点</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {selectedNodeData.relatedEdges.slice(0, 12).map((e, i) => {
                      const otherId = e.source === selectedNode ? e.target : e.source;
                      const otherNode = selectedNodeData.findNode(otherId);
                      const meta = getMeta(otherNode?.type || 'source');
                      const Icon = meta.icon;
                      const relationLabel = getEdgeStyle(e.relation).label || e.relation;
                      return (
                        <div key={i} style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon style={{ fontSize: 11, color: meta.color }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {otherNode?.label || otherId}
                          </span>
                          <Tag style={{ fontSize: 10, margin: 0, padding: '0 4px', height: 18, lineHeight: '16px' }}>
                            {relationLabel}
                          </Tag>
                        </div>
                      );
                    })}
                    {selectedNodeData.relatedEdges.length > 12 && (
                      <div style={{ fontSize: 11, color: '#a8b8cc', marginTop: 4 }}>
                        还有 {selectedNodeData.relatedEdges.length - 12} 个关联...
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#a8b8cc', fontStyle: 'italic' }}>
              点击节点查看详情
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e8ecf1' }}>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            图例
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(TYPE_META).map(([type, meta]) => {
              const Icon = meta.icon;
              const isTag = type === 'tag';
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#595959' }}>
                  <div style={{
                    width: isTag ? 10 : 12,
                    height: isTag ? 10 : 12,
                    borderRadius: isTag || type === 'topic' || type === 'entity' ? '50%' : 4,
                    background: meta.color,
                  }} />
                  <Icon style={{ fontSize: 12, color: meta.color }} />
                  <span>{meta.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 6, marginTop: 10, fontWeight: 500 }}>关联类型</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(EDGE_STYLES).map(([rel, styleDef]) => (
              <div key={rel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#595959' }}>
                <div style={{
                  width: 24,
                  height: styleDef.strokeWidth,
                  background: styleDef.color,
                  borderRadius: 1,
                  opacity: styleDef.opacity,
                }} />
                <span>{styleDef.label || rel}</span>
                {styleDef.directional && <span style={{ fontSize: 9, color: '#a8b8cc' }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #e8ecf1', fontSize: 11, color: '#8c8c8c' }}>
          {nodeCount} 节点 · {edgeCount} 关联 · {communityCount} 社区
          {focusedHiddenCount > 0 && (
            <div style={{ marginTop: 4, color: '#fa8c16' }}>
              聚焦视图已隐藏 {focusedHiddenCount} 个非当前来源节点
            </div>
          )}
        </div>
      </div>

      {/* Graph Canvas */}
      <div style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
        {/* Top stats bar */}
        <div style={{
          position: 'absolute',
          top: 12, left: 12, zIndex: 5,
          display: 'flex', gap: 12,
          background: 'rgba(255,255,255,0.92)',
          padding: '6px 14px',
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          fontSize: 12,
          color: '#595959',
          alignItems: 'center',
          flexWrap: 'wrap',
          maxWidth: 'calc(100% - 24px)',
        }}>
          <Segmented
            size="small"
            value={graphScope}
            onChange={(value) => handleScopeChange(value as KnowledgeGraphScope)}
            options={[
              { label: '聚焦来源', value: 'focused' },
              { label: '全部图谱', value: 'all' },
            ]}
          />
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BranchesOutlined style={{ fontSize: 13, color: '#0066ff' }} />
            <b style={{ color: '#262626' }}>{nodeCount}</b> 节点
          </span>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <b style={{ color: '#262626' }}>{edgeCount}</b> 关联
          </span>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <b style={{ color: '#262626' }}>{communityCount}</b> 社区
          </span>
          {graphScope === 'focused' && focusSourceName && (
            <>
              <span style={{ color: '#d9d9d9' }}>|</span>
              <span
                title={focusedView?.sourcePath || undefined}
                style={{
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#4b5563',
                }}
              >
                来源: {focusSourceName}
              </span>
              {focusedHiddenCount > 0 && (
                <Badge
                  count={`隐藏 ${focusedHiddenCount}`}
                  style={{ backgroundColor: '#faad14' }}
                  title={`已隐藏 ${focusedHiddenCount} 个非当前来源节点`}
                />
              )}
            </>
          )}
          <span style={{ color: '#d9d9d9' }}>|</span>
          {(performanceMode.large || performanceMode.dense) && (
            <>
              <Tag color="blue" style={{ margin: 0 }}>
                性能模式
              </Tag>
              {prunedCount > 0 && (
                <Badge
                  count={`显示 ${performanceMode.renderBudget.maxRenderedNodes}+`}
                  style={{ backgroundColor: '#1677ff' }}
                  title={`已优先展示高连接节点，隐藏 ${prunedCount} 个低连接节点`}
                />
              )}
              <span style={{ color: '#d9d9d9' }}>|</span>
            </>
          )}
          <button
            onClick={applyRandomPattern}
            disabled={isAnimating}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: isAnimating ? 'not-allowed' : 'pointer',
              fontSize: 12, color: isAnimating ? '#a8b8cc' : '#0066ff', padding: 0,
              opacity: isAnimating ? 0.5 : 1,
            }}
            title="随机生成图案"
          >
            <ShakeOutlined style={{ fontSize: 13 }} />
            随机图案
          </button>
          {isPatternMode && (
            <>
              <span style={{ color: '#d9d9d9' }}>|</span>
              <button
                onClick={restoreForceLayout}
                disabled={isAnimating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: isAnimating ? 'not-allowed' : 'pointer',
                  fontSize: 12, color: isAnimating ? '#a8b8cc' : '#595959', padding: 0,
                  opacity: isAnimating ? 0.5 : 1,
                }}
                title="还原力导向布局"
              >
                <ReloadOutlined style={{ fontSize: 13 }} />
                还原
              </button>
              <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 500 }}>
                {currentPatternName}
              </span>
            </>
          )}
        </div>

        <style>{`
          .react-flow__edges { z-index: 0 !important; }
          .react-flow__edge { opacity: 1 !important; }
          .react-flow__edge-path { stroke-opacity: 1 !important; }
          .react-flow__edge-text { display: none; }
          /* NOTE: Do NOT add transition to .react-flow__viewport.
             CSS transitions on the viewport force every zoom/pan to animate
             over 300ms, making the graph feel extremely laggy. */
        `}</style>
        {layoutLoading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(245, 247, 250, 0.85)',
            zIndex: 10,
          }}>
            <Spin size="large" tip={`布局计算中 (${nodeCount} 节点)${layoutProgress > 0 ? ` ${Math.round(layoutProgress * 100)}%` : ''}...`} />
          </div>
        )}
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeDragStop={handleNodeDragStop}
            onMoveStart={handleMoveStart}
            onMoveEnd={handleMoveEnd}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export function KnowledgeGraphView() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphViewInner />
    </ReactFlowProvider>
  );
}
