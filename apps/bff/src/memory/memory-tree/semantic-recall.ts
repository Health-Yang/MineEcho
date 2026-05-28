const SEMANTIC_ALIASES: string[][] = [
  ["hci", "人机交互", "交互", "用户体验", "ux", "界面", "认知负荷", "费茨定律", "反馈"],
  ["记忆", "长期记忆", "记住", "记得", "回忆", "召回", "旧记忆", "之前", "前几天"],
  ["知识库", "知识", "知识图谱", "图谱", "知识卡片", "资料", "引用"],
  ["mineecho", "mine echo", "产品", "平台", "助手", "ai助手"],
  ["任务", "执行", "做过", "操作", "命令", "工具", "工作流"],
  ["代码", "编程", "开发", "bug", "报错", "排查", "调试", "修复"],
  ["文档", "材料", "报告", "总结", "汇报", "ppt"],
  ["成本", "token", "tokenjuice", "压缩", "降本", "预算"],
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

function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const tokens = new Set<string>();
  for (const part of normalized.split(/\s+/).filter(Boolean)) {
    if (!STOP_WORDS.has(part)) tokens.add(part);
  }

  for (const match of normalized.matchAll(/[\p{Script=Han}]{2,}/gu)) {
    const word = match[0];
    if (!STOP_WORDS.has(word)) tokens.add(word);
    for (let size = 2; size <= Math.min(4, word.length); size++) {
      for (let i = 0; i <= word.length - size; i++) {
        const gram = word.slice(i, i + size);
        if (!STOP_WORDS.has(gram)) tokens.add(gram);
      }
    }
  }

  for (const group of SEMANTIC_ALIASES) {
    if (group.some((alias) => normalized.includes(alias.toLowerCase()))) {
      for (const alias of group) tokens.add(alias.toLowerCase());
    }
  }

  return tokens;
}

export function scoreSemanticMemory(content: string, query: string): number {
  const contentTokens = tokenize(content);
  const queryTokens = tokenize(query);
  if (contentTokens.size === 0 || queryTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) overlap += token.length > 2 ? 1.25 : 1;
  }

  const precision = overlap / Math.max(queryTokens.size, 1);
  const recall = overlap / Math.max(contentTokens.size, 1);
  const exactBonus = normalizeText(content).includes(normalizeText(query)) ? 0.2 : 0;
  return Math.min(1, precision * 0.75 + recall * 0.25 + exactBonus);
}
