import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { logger } from "../utils/logger.js";
import { getKbBasePath, resolveKbPath } from "./paths.js";
import { getGraphStore } from "./graph-store.js";

export interface KnowledgeGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: "topic" | "entity" | "insight" | "source" | "tag";
    filePath?: string;
    summary?: string;        // definition/abstract from file content
    importance?: number;     // 0-100 based on connectivity
    sources?: string[];      // for semantic nodes, which files they come from
    size?: number; // importance = degree
  }>;
  edges: Array<{
    source: string;
    target: string;
    relation: "references" | "tagged" | "related" | "contains" | "relates_to" | "supports";
    strength?: number;
  }>;
  communities: Array<{
    id: string;
    label: string;
    nodes: string[]; // node ids
    color?: string;  // theme color for the community
  }>;
}

interface ParsedFrontmatter {
  title?: string;
  type?: string;
  tags?: string[];
}

let graphCache: KnowledgeGraph | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function parseFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlText = match[1];
  const body = match[2];
  const frontmatter: ParsedFrontmatter = {};

  const titleMatch = yamlText.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
  if (titleMatch) frontmatter.title = titleMatch[1].trim();

  const typeMatch = yamlText.match(/^type:\s*(\S+)\s*$/m);
  if (typeMatch) frontmatter.type = typeMatch[1].trim();

  const tagsMatch = yamlText.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    frontmatter.tags = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter((t) => t.length > 0);
  } else {
    const tagsListMatch = yamlText.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (tagsListMatch) {
      frontmatter.tags = tagsListMatch[1]
        .split("\n")
        .map((l) => l.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, ""))
        .filter((t) => t.length > 0);
    }
  }

  return { frontmatter, body };
}

function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    // Obsidian-style: [[alias|display text]] -> use alias for matching
    const raw = match[1].trim();
    const link = raw.split("|")[0].trim();
    if (link) links.push(link);
  }
  return [...new Set(links)];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function toNodeType(type: string): KnowledgeGraph["nodes"][number]["type"] {
  switch (type) {
    case "concept":
      return "topic";
    case "entity":
      return "entity";
    case "source":
      return "source";
    case "comparison":
    case "synthesis":
      return "source";
    default:
      return "source";
  }
}

function extractSummary(body: string): string {
  // Remove code blocks, inline code, headings, lists, blockquotes, links
  const cleaned = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")      // remove blockquote markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();

  // Find first meaningful paragraph (non-empty, at least 20 chars)
  const paragraphs = cleaned.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const text = para.replace(/\s+/g, " ").trim();
    if (text.length >= 20 && !text.startsWith("---")) {
      return text.slice(0, 200) + (text.length > 200 ? "..." : "");
    }
  }

  // Fallback: return first non-empty line if no paragraph meets threshold
  const firstLine = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("---"))[0];
  if (firstLine) {
    return firstLine.slice(0, 200) + (firstLine.length > 200 ? "..." : "");
  }
  return "";
}

function computeImportance(nodeId: string, edges: KnowledgeGraph["edges"], type: string): number {
  let degree = 0;
  for (const edge of edges) {
    if (edge.source === nodeId || edge.target === nodeId) {
      degree++;
    }
  }
  let boost = 0;
  if (type === "topic") boost = 20;
  else if (type === "entity") boost = 10;

  const raw = degree + boost;
  // Scale to 0-100: cap at 100, but keep linear up to that point
  // A node with degree 80+boost would already be very important
  return Math.min(100, Math.round(raw * 1.25));
}

function assignCommunityColors(communities: KnowledgeGraph["communities"], nodes: KnowledgeGraph["nodes"]): void {
  // Predefined distinct palette (12 colors), cycles if more communities
  const palette = [
    "#4A90D9", // blue
    "#50C878", // green
    "#E8A838", // amber
    "#C75B9B", // magenta
    "#5BC0BE", // teal
    "#E27D60", // coral
    "#8E7CC3", // lavender
    "#D4A373", // tan
    "#6A994E", // olive
    "#BC4B51", // rose
    "#2A9D8F", // sea green
    "#E9C46A", // yellow
  ];

  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    const color = palette[i % palette.length];
    community.color = color;
  }
}

async function listMdFiles(dirPath: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await listMdFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(relative(basePath, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch {
    // ignore
  }
  return files;
}

export async function buildKnowledgeGraph(): Promise<KnowledgeGraph> {
  const basePath = getKbBasePath();
  const wikiDir = join(basePath, "wiki");

  const nodes: KnowledgeGraph["nodes"] = [];
  const edges: KnowledgeGraph["edges"] = [];
  const nodeMap = new Map<string, number>(); // id -> index in nodes
  const edgeSet = new Set<string>(); // dedup edges

  // 1. Collect all wiki .md files
  let mdFiles: string[] = [];
  try {
    mdFiles = await listMdFiles(wikiDir, basePath);
  } catch {
    // wiki dir may not exist
  }

  // 2. Create document nodes from each file
  for (const filePath of mdFiles) {
    let content = "";
    try {
      content = await readFile(resolveKbPath(filePath), "utf-8");
    } catch {
      continue;
    }

    const { frontmatter, body } = parseFrontmatter(content);
    const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || filePath;
    const label = frontmatter.title || fileName;
    const type = toNodeType(frontmatter.type || "document");
    const summary = extractSummary(body);

    const nodeId = filePath;
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, nodes.length);
      nodes.push({ id: nodeId, label, type, filePath, summary });
    }

    // 3. Extract tags -> tag nodes + tagged edges
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      for (const tag of frontmatter.tags) {
        const tagId = `tag:${tag}`;
        if (!nodeMap.has(tagId)) {
          nodeMap.set(tagId, nodes.length);
          nodes.push({ id: tagId, label: tag, type: "tag" });
        }
        const edgeKey = `${nodeId}--tagged--${tagId}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({ source: nodeId, target: tagId, relation: "tagged" });
        }
      }
    }

    // 4. Extract [[wiki links]] -> references edges
    const wikiLinks = extractWikiLinks(body);
    for (const link of wikiLinks) {
      // Try to resolve the link to an existing wiki page by label/title match.
      // Priority: topic (was concept) > entity > source > document; never match tag nodes.
      let targetId: string | null = null;
      let bestPriority = Infinity;
      const typePriority: Record<string, number> = {
        topic: 0,
        entity: 1,
        source: 2,
        document: 3,
      };
      for (const [existingId, idx] of nodeMap.entries()) {
        const node = nodes[idx];
        if (!node || node.type === "tag") continue;
        if (node.label === link) {
          const priority = typePriority[node.type] ?? 4;
          if (priority < bestPriority) {
            bestPriority = priority;
            targetId = existingId;
          }
        }
      }
      // Fallback: create a new link node if no existing page matches
      if (!targetId) {
        targetId = `link:${link}`;
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, nodes.length);
          nodes.push({ id: targetId, label: link, type: "source" });
        }
      }
      const edgeKey = `${nodeId}--references--${targetId}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        // Semantic: concept-to-concept (now topic-to-topic) references -> "relates_to"
        const sourceNode = nodes[nodeMap.get(nodeId)!];
        const targetNode = nodes[nodeMap.get(targetId)!];
        let relation: KnowledgeGraph["edges"][number]["relation"] = "references";
        if (sourceNode?.type === "topic" && targetNode?.type === "topic") {
          relation = "relates_to";
        }
        edges.push({ source: nodeId, target: targetId, relation });
      }
    }
  }

  // 5. Generate "related" edges based on shared tag co-occurrence
  const tagToNodes = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.relation === "tagged") {
      const tagId = edge.target;
      const nodeId = edge.source;
      if (!tagToNodes.has(tagId)) tagToNodes.set(tagId, []);
      tagToNodes.get(tagId)?.push(nodeId);
    }
  }
  // Track shared tag counts for strength boosting
  const nodePairSharedTags = new Map<string, number>();
  for (const [tagId, connectedNodes] of tagToNodes) {
    for (let i = 0; i < connectedNodes.length; i++) {
      for (let j = i + 1; j < connectedNodes.length; j++) {
        const a = connectedNodes[i];
        const b = connectedNodes[j];
        if (a === b) continue;
        const pairKey = a < b ? `${a}||${b}` : `${b}||${a}`;
        nodePairSharedTags.set(pairKey, (nodePairSharedTags.get(pairKey) || 0) + 1);

        const edgeKey = `${a}--related--${b}`;
        const reverseKey = `${b}--related--${a}`;
        if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseKey)) {
          edgeSet.add(edgeKey);
          edges.push({ source: a, target: b, relation: "related", strength: 1 });
        }
      }
    }
  }
  // Boost strength for pairs sharing 2+ tags
  for (const edge of edges) {
    if (edge.relation === "related") {
      const pairKey = edge.source < edge.target
        ? `${edge.source}||${edge.target}`
        : `${edge.target}||${edge.source}`;
      const sharedCount = nodePairSharedTags.get(pairKey) || 0;
      if (sharedCount >= 2) {
        edge.strength = 2 + Math.min(sharedCount - 2, 3); // cap at strength 5
      }
    }
  }

  // 5.5. Merge graph-store entities (from LLM extraction)
  try {
    const graphStore = getGraphStore();
    if (graphStore.isAvailable()) {
      const storeData = graphStore.getAll();

      for (const storeNode of storeData.nodes) {
        if (!nodeMap.has(storeNode.id)) {
          nodeMap.set(storeNode.id, nodes.length);
          nodes.push({
            id: storeNode.id,
            label: storeNode.label,
            type: storeNode.type === "entity" ? "entity" : "topic",
            summary: storeNode.description,
            importance: storeNode.importance ?? 50,
            filePath: storeNode.sourceFile,
            sources: storeNode.sourceFile ? [storeNode.sourceFile] : undefined,
          });
        }
      }

      for (const storeEdge of storeData.edges) {
        const edgeKey = `${storeEdge.source}--${storeEdge.relation}--${storeEdge.target}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            source: storeEdge.source,
            target: storeEdge.target,
            relation: "relates_to",
            strength: storeEdge.strength,
          });
        }
      }

      if (storeData.nodes.length > 0) {
        logger.info(`[KnowledgeBase] Merged ${storeData.nodes.length} graph-store nodes, ${storeData.edges.length} edges`);
      }
    }
  } catch (err) {
    logger.warn("[KnowledgeBase] Failed to merge graph-store data:", err);
  }

  // 6. Compute node sizes and semantic enrichment (degree = in-degree + out-degree)
  const degrees = new Map<string, number>();
  for (const node of nodes) {
    degrees.set(node.id, 0);
  }
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  }
  for (const node of nodes) {
    node.size = degrees.get(node.id) || 0;
    node.importance = computeImportance(node.id, edges, node.type);
    // For semantic nodes, populate sources (which files they come from)
    if (node.filePath) {
      node.sources = [node.filePath];
    }
  }

  // 7. Community detection via connected components (BFS on undirected graph)
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    // Skip tag-to-tag connections to prevent tags from gluing communities together
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode?.type === "tag" && targetNode?.type === "tag") continue;
    adj.get(edge.source)?.push(edge.target);
    adj.get(edge.target)?.push(edge.source);
  }

  const visited = new Set<string>();
  const communities: KnowledgeGraph["communities"] = [];
  let communityIndex = 0;

  for (const nodeId of nodeMap.keys()) {
    if (visited.has(nodeId)) continue;

    const component: string[] = [];
    const queue: string[] = [nodeId];
    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Community label = non-tag node with max degree (prefer topic > entity > source)
    const typePriority: Record<string, number> = {
      topic: 0,
      entity: 1,
      source: 2,
      document: 3,
    };
    let bestNode = null as typeof nodes[number] | null;
    let bestScore = -1;
    for (const id of component) {
      const node = nodes.find((n) => n.id === id);
      if (!node || node.type === "tag") continue;
      const deg = degrees.get(id) || 0;
      const priority = typePriority[node.type] ?? 4;
      // score = degree * 10 + priority (higher degree wins; tie-break by type priority)
      const score = deg * 10 - priority;
      if (score > bestScore) {
        bestScore = score;
        bestNode = node;
      }
    }
    // Fallback: if all nodes in component are tags, use the first one
    const labelNode = bestNode || nodes.find((n) => n.id === component[0]);

    communities.push({
      id: `community-${communityIndex++}`,
      label: labelNode?.label || component[0],
      nodes: component,
    });
  }

  // 8. Assign community colors
  assignCommunityColors(communities, nodes);

  logger.info(`[KnowledgeBase] Semantic enrichment complete: ${nodes.length} nodes, ${edges.length} edges, ${communities.length} communities`);

  return { nodes, edges, communities };
}

export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
  const now = Date.now();
  if (graphCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return graphCache;
  }

  logger.info("[KnowledgeBase] Building knowledge graph...");
  const graph = await buildKnowledgeGraph();
  graphCache = graph;
  cacheTimestamp = now;
  logger.info(`[KnowledgeBase] Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.communities.length} communities`);
  return graph;
}

export function invalidateGraphCache(): void {
  graphCache = null;
  cacheTimestamp = 0;
  logger.info("[KnowledgeBase] Graph cache invalidated");
}
