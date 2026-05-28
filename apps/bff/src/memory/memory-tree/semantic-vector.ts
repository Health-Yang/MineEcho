const VECTOR_DIMENSIONS = 512;

const SEMANTIC_ALIASES: string[][] = [
  ["hci", "人机交互", "交互设计", "交互", "用户体验", "ux", "界面", "认知负荷", "费茨定律", "反馈"],
  ["记忆", "长期记忆", "记住", "记得", "回忆", "召回", "旧记忆", "之前", "前几天"],
  ["知识库", "知识", "知识图谱", "图谱", "知识卡片", "资料", "引用"],
  ["mineecho", "mine echo", "产品", "平台", "助手", "ai助手"],
  ["任务", "执行", "做过", "操作", "命令", "工具", "工作流"],
  ["代码", "编程", "开发", "bug", "报错", "排查", "调试", "修复"],
  ["文档", "材料", "报告", "总结", "汇报", "ppt"],
  ["成本", "token", "tokenless", "tokenjuice", "压缩", "降本", "预算"],
];

const STOP_WORDS = new Set([
  "我",
  "你",
  "他",
  "她",
  "它",
  "的",
  "了",
  "呢",
  "吗",
  "吧",
  "啊",
  "和",
  "与",
  "或",
  "在",
  "是",
  "有",
  "哪些",
  "什么",
  "之前",
  "前几天",
  "今天",
  "这个",
  "那个",
  "一下",
]);

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function addFeature(vector: number[], token: string, weight: number): void {
  if (!token || STOP_WORDS.has(token)) return;
  const hash = hashToken(token);
  const index = hash % VECTOR_DIMENSIONS;
  const sign = (hash & 1) === 0 ? 1 : -1;
  vector[index] += sign * weight;
}

function addTokens(vector: number[], text: string): void {
  const normalized = normalizeText(text);
  for (const part of normalized.split(/\s+/).filter(Boolean)) {
    addFeature(vector, part, part.length > 2 ? 1.2 : 1);
  }

  for (const match of normalized.matchAll(/[\p{Script=Han}]{2,}/gu)) {
    const word = match[0];
    addFeature(vector, word, 1.2);
    for (let size = 2; size <= Math.min(4, word.length); size++) {
      for (let i = 0; i <= word.length - size; i++) {
        addFeature(vector, word.slice(i, i + size), size === 2 ? 0.65 : 0.85);
      }
    }
  }

  for (const [groupIndex, group] of SEMANTIC_ALIASES.entries()) {
    if (group.some((alias) => normalized.includes(alias.toLowerCase()))) {
      addFeature(vector, `semantic-group:${groupIndex}`, 3);
      for (const alias of group) addFeature(vector, alias.toLowerCase(), 0.8);
    }
  }
}

export function buildSemanticVector(text: string): number[] {
  const vector = Array.from({ length: VECTOR_DIMENSIONS }, () => 0);
  addTokens(vector, text);

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
