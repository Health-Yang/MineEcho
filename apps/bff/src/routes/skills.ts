
import { Router } from "express";
import { isAbsolute, join, relative, resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import multer from "multer";
import { loadApps } from "../ai-apps/store.js";
import { loadSkillsState, saveSkillsState, loadCustomSkills, saveCustomSkills, type SkillsState, type CustomSkill } from "../skills/state.js";
import { parseSkillMdFrontmatter } from "../skills/parse-skill-md.js";
import { scanSkillEntries, runExternalSkillScanner, type ScanEntry } from "../skills/skill-scanner.js";
import {
  extractSkillArchiveEntries,
  findSkillPackageRoot,
  validateSkillArchiveEntries,
  type SkillArchiveEntry,
} from "../skills/import-package.js";
import { isEnterpriseMode, fetchEnterpriseSkills, getEnterpriseConfig } from "../account/client.js";
import { cachedRequest, invalidateCache, deleteCacheEntry } from "../utils/cache.js";
import { getLoadedSkills } from "../skills/sync.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { logger } from "../utils/logger.js";
import { buildSkillRegistry } from "../skills/registry.js";
import { routeSkillQuery } from "../skills/router.js";
import { buildSkillHealthEntryFromInfo, buildSkillHealthReport } from "../skills/health.js";
import { getSkillTriggerEntries, loadSkillTriggersFromDisk } from "../triggers/skill-loader.js";
import { getMineEchoHome } from "../utils/config-path.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Cache key generators
const getSkillsTreeCacheKey = () => {
  const cfg = getEnterpriseConfig();
  return `tree:${isEnterpriseMode() ? `enterprise:${cfg.userId || 'default'}` : 'local'}`;
};
const getSkillsAllCacheKey = () => {
  const cfg = getEnterpriseConfig();
  return `all-skills:${isEnterpriseMode() ? `enterprise:${cfg.userId || 'default'}` : 'local'}`;
};
const getSkillsListCacheKey = () => {
  const cfg = getEnterpriseConfig();
  return `list:${isEnterpriseMode() ? `enterprise:${cfg.userId || 'default'}` : 'local'}`;
};

// 检测是否为桌面版
const isDesktop = process.env.CONSOLE_DIST?.includes('.app/Contents');

// 桌面版：技能目录在 app contents 中
// 使用 OPENCLAW_HOME 环境变量（指向父目录 ~/Library/Application Support/MineEcho）
const desktopBaseDir = process.env.OPENCLAW_HOME || join(process.env.HOME || '', 'Library', 'Application Support', 'MineEcho');
const DESKTOP_OPENCLAW_SKILLS_DIR = process.env.CONSOLE_DIST
  ? join(process.env.CONSOLE_DIST.replace(/\/Contents\/.*/, '/Contents'), 'gateway', 'node_modules', 'openclaw', 'skills')
  : '';

// 桌面版扩展技能目录 - 使用 Gateway 工作目录
// OPENCLAW_HOME/.openclaw/workspace/skills
const DESKTOP_EXTENSIONS_DIR = process.env.OPENCLAW_HOME
  ? join(process.env.OPENCLAW_HOME, '.openclaw', 'workspace', 'skills')
  : join(desktopBaseDir, '.openclaw', 'workspace', 'skills');

// OpenClaw 内置技能目录（Docker 环境）
const OPENCLAW_BUILTIN_SKILLS_DIR = "/app/gateway/node_modules/openclaw/skills";
const DOCKER_EXTENSIONS_DIR = "/app/.openclaw/workspace/skills";
// MineEcho 扩展技能目录
function getMineEchoExtensionsDir(): string {
  if (isDesktop) return DESKTOP_EXTENSIONS_DIR;
  if (process.cwd().includes('bff')) return DEV_EXTENSIONS_DIR;
  return DOCKER_EXTENSIONS_DIR;
}
export function getMineEchoSkillsDir(): string {
  return getMineEchoExtensionsDir();
}
// 本地开发环境备选路径
const DEV_OPENCLAW_SKILLS_DIR = join(process.cwd(), "..", "gateway", "node_modules", "openclaw", "skills");
const DEV_EXTENSIONS_DIR = join(process.cwd(), ".openclaw", "workspace", "skills");

// 获取技能目录的函数
function getSkillsDirs() {
  if (isDesktop) {
    return {
      builtin: DESKTOP_OPENCLAW_SKILLS_DIR,
      extensions: DESKTOP_EXTENSIONS_DIR,
    };
  }
  // 开发环境
  if (process.cwd().includes('bff')) {
    return {
      builtin: DEV_OPENCLAW_SKILLS_DIR,
      extensions: DEV_EXTENSIONS_DIR,
    };
  }
  return {
    builtin: OPENCLAW_BUILTIN_SKILLS_DIR,
    extensions: getMineEchoExtensionsDir(),
  };
}

interface SkillInfo {
  id: string;
  name: string;
  description: string;
  source: "openclaw-builtin" | "mineecho-extension" | "custom" | "ai-app";
  enabled?: boolean;
  category?: string;
  tags?: string[];
  relatedSkillIds?: string[];
  type?: "skill" | "ai-app";
  appType?: "rag" | "workflow";
  triggers?: string[];
}

function mapAiAppsToSkillInfo(apps: Awaited<ReturnType<typeof loadApps>>): SkillInfo[] {
  return apps.map((app) => ({
    id: app.id,
    name: app.name || app.id,
    description: app.description || "",
    source: "ai-app",
    enabled: app.enabled !== false,
    category: "AI 应用",
    type: "ai-app",
    appType: app.type,
    tags: ["ai-app", app.type],
    triggers: [app.name, app.description].filter((item): item is string => Boolean(item?.trim())),
  }));
}

/**
 * 获取 OpenClaw 内置技能（从文件系统读取 SKILL.md）
 */
async function getOpenClawBuiltinSkills(): Promise<SkillInfo[]> {
  const dirs = getSkillsDirs();

  // 尝试多个可能的路径
  const possiblePaths = [
    dirs.builtin,  // 根据 isDesktop 自动选择
    OPENCLAW_BUILTIN_SKILLS_DIR,
    DEV_OPENCLAW_SKILLS_DIR,
    join(process.cwd(), "docker", "mineecho-with-gateway", "skills"), // 本地开发路径
  ];

  for (const skillsDir of possiblePaths) {
    if (!existsSync(skillsDir)) continue;

    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });
      const skills: SkillInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillMdPath = join(skillsDir, entry.name, "SKILL.md");
          try {
            const content = await readFile(skillMdPath, "utf8");
            // 解析 YAML frontmatter
            const nameMatch = content.match(/^name:\s*(.+)$/m);
            const descMatch = content.match(/^description:\s*(.+)$/m);
            skills.push({
              id: entry.name,
              name: nameMatch?.[1]?.trim() || entry.name,
              description: descMatch?.[1]?.trim() || "",
              source: "openclaw-builtin",
              enabled: true,
            });
          } catch {
            // 无 SKILL.md 跳过
          }
        }
      }
      return skills;
    } catch {
      continue;
    }
  }
  return [];
}

/**
 * 获取 MineEcho 扩展技能
 */
async function getMineEchoExtensionSkills(): Promise<SkillInfo[]> {
  const dirs = getSkillsDirs();
  const possiblePaths = [
    dirs.extensions,
    DESKTOP_EXTENSIONS_DIR,
    DEV_EXTENSIONS_DIR,
  ];

  for (const extDir of possiblePaths) {
    if (!existsSync(extDir)) continue;

    try {
      const entries = await readdir(extDir, { withFileTypes: true });
      const skills: SkillInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillMdPath = join(extDir, entry.name, "SKILL.md");
          try {
            const content = await readFile(skillMdPath, "utf8");
            const parsed = parseSkillMdFrontmatter(content);
            skills.push({
              id: entry.name,
              name: parsed.name || entry.name,
              description: parsed.description || "",
              source: "mineecho-extension",
              enabled: true,
            });
          } catch {
            // 无 SKILL.md 跳过
          }
        }
      }
      return skills;
    } catch {
      continue;
    }
  }
  return [];
}

export const skillsRouter = Router();

async function invalidateSkillViewsAndRefreshTriggers(): Promise<void> {
  invalidateCache("skillsTree");
  invalidateCache("skillsList");
  invalidateCache("skillsAll");
  try {
    await loadSkillTriggersFromDisk();
  } catch (e) {
    logger.warn("[Skills] 刷新触发词索引失败:", { error: (e as Error).message });
  }
}

async function getSkillRegistrySnapshot() {
  await loadSkillTriggersFromDisk();
  const [state, apps, customSkills] = await Promise.all([
    loadSkillsState(),
    loadApps(),
    loadCustomSkills(),
  ]);

  return buildSkillRegistry({
    triggerEntries: getSkillTriggerEntries(),
    customSkills,
    aiApps: apps,
    state,
  });
}

/**
 * 获取所有技能（OpenClaw 内置 + MineEcho 扩展 + 企业下发）
 */
skillsRouter.get("/all", async (_req, res) => {
  try {
    const result = await cachedRequest(
      "skillsAll",
      getSkillsAllCacheKey(),
      async () => {
        // 并行获取所有技能来源
        const [builtinSkills, extensionSkills, apps] = await Promise.all([
          getOpenClawBuiltinSkills(),
          getMineEchoExtensionSkills(),
          loadApps(),
        ]);

        return {
          builtin: builtinSkills,        // OpenClaw 原生技能
          extensions: extensionSkills,   // MineEcho 扩展
          aiApps: mapAiAppsToSkillInfo(apps), // AI 应用转换后的可路由技能
        };
      },
      { maxSize: 5, ttl: 60 * 1000 }
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

skillsRouter.get("/registry", async (_req, res) => {
  try {
    res.json({ registry: await getSkillRegistrySnapshot() });
  } catch (e) {
    logger.error("[SkillRegistry] Failed:", { error: (e as Error).message });
    res.status(500).json({ error: String((e as Error).message) });
  }
});

skillsRouter.post("/route", async (req, res) => {
  try {
    const body = req.body || {};
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return res.status(400).json({ error: "body.query is required" });
    }

    const limit = Number.isFinite(Number(body.limit))
      ? Math.max(1, Math.min(10, Number(body.limit)))
      : 3;
    const mode = typeof body.mode === "string" ? body.mode : undefined;
    const registry = await getSkillRegistrySnapshot();

    res.json({
      route: routeSkillQuery(query, registry, { limit, mode }),
      registryGeneratedAt: registry.generatedAt,
    });
  } catch (e) {
    logger.error("[SkillRouter] Failed:", { error: (e as Error).message });
    res.status(500).json({ error: String((e as Error).message) });
  }
});

export interface SkillNode {
  id: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  children?: SkillNode[];
  // 游戏化属性
  type?: "category" | "skill" | "advanced" | "ai-app";
  unlocked?: boolean;
  unlockable?: boolean;
  level?: number;
  icon?: string;
}

const staticSkillTree: SkillNode[] = [
  {
    id: "cat-basic",
    name: "基础能力",
    category: "category",
    enabled: true,
    type: "category",
    unlocked: true,
    children: [
      { id: "skill-summary", name: "内容摘要", description: "对长文本生成摘要", category: "基础能力", enabled: true, type: "skill", unlocked: true, level: 1 },
      { id: "skill-translate", name: "翻译", description: "多语言翻译", category: "基础能力", enabled: true, type: "skill", unlocked: true, level: 1 },
      { id: "skill-qa", name: "问答", description: "基于上下文的问答", category: "基础能力", enabled: true, type: "skill", unlocked: true, level: 1 },
    ],
  },
  {
    id: "cat-productivity",
    name: "效率工具",
    category: "category",
    enabled: true,
    type: "category",
    unlocked: true,
    children: [
      { id: "skill-email", name: "邮件处理", description: "读写与总结邮件", category: "效率工具", enabled: false, type: "advanced", unlocked: true, level: 2 },
      { id: "skill-calendar", name: "日历", description: "日程查询与提醒", category: "效率工具", enabled: false, type: "advanced", unlocked: true, level: 2 },
      { id: "skill-doc", name: "文档总结", description: "PDF/Office 摘要", category: "效率工具", enabled: false, type: "advanced", unlocked: true, level: 2 },
    ],
  },
  {
    id: "cat-domestic",
    name: "国内办公",
    category: "category",
    enabled: true,
    type: "category",
    unlocked: true,
    children: [
      { id: "skill-dingtalk", name: "钉钉待办", description: "同步钉钉待办与审批", category: "国内办公", enabled: false, type: "advanced", unlocked: true, level: 2 },
      { id: "skill-feishu", name: "飞书文档", description: "飞书文档摘要与协作", category: "国内办公", enabled: false, type: "advanced", unlocked: true, level: 2 },
    ],
  },
];

const STATIC_SKILL_IDS = new Set<string>();
function collectSkillIds(nodes: SkillNode[]) {
  for (const n of nodes) {
    if (n.category === "skill") STATIC_SKILL_IDS.add(n.id);
    if (n.children?.length) collectSkillIds(n.children);
  }
}
collectSkillIds(staticSkillTree);

function applyStateToTree(nodes: SkillNode[], state: SkillsState): SkillNode[] {
  return nodes.map((n) => {
    const out = { ...n };
    if (n.category === "skill" && state[n.id] !== undefined) out.enabled = state[n.id];
    if (n.children?.length) out.children = applyStateToTree(n.children, state);
    return out;
  });
}

function cloneTree(nodes: SkillNode[]): SkillNode[] {
  return nodes.map((n) => ({ ...n, children: n.children?.length ? cloneTree(n.children) : undefined }));
}

skillsRouter.get("/tree", async (_req, res) => {
  try {
    const result = await cachedRequest(
      "skillsTree",
      getSkillsTreeCacheKey(),
      async () => {
        const [state, apps, custom] = await Promise.all([loadSkillsState(), loadApps(), loadCustomSkills()]);
        const base = cloneTree(staticSkillTree);
        const treeWithState = applyStateToTree(base, state);

        const appNodes: SkillNode[] = apps.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          category: "AI 应用",
          enabled: a.enabled,
          type: "ai-app",
          unlocked: true,
          level: 3,
        }));
        const aiAppCategory: SkillNode = {
          id: "cat-ai-apps",
          name: "AI 应用",
          category: "category",
          enabled: true,
          type: "category",
          unlocked: true,
          children: appNodes.length ? appNodes : [{ id: "ai-apps-empty", name: "（暂无）", category: "AI 应用", enabled: false, type: "ai-app", unlocked: true }],
        };

        const customNodes: SkillNode[] = custom.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          category: "自定义",
          enabled: s.enabled ?? true,
          type: "skill",
          unlocked: true,
          level: 1,
        }));
        const customCategory: SkillNode = {
          id: "cat-custom",
          name: "自定义",
          category: "category",
          enabled: true,
          type: "category",
          unlocked: true,
          children: customNodes.length ? customNodes : [{ id: "custom-empty", name: "（暂无）", category: "自定义", enabled: false, type: "skill", unlocked: true }],
        };

        const tree = [...treeWithState, aiAppCategory, customCategory];
        return { tree };
      },
      { maxSize: 5, ttl: 60 * 1000 }
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

skillsRouter.get("/list", async (_req, res) => {
  try {
    const result = await cachedRequest(
      "skillsList",
      getSkillsListCacheKey(),
      async () => {
        const [state, apps, custom] = await Promise.all([loadSkillsState(), loadApps(), loadCustomSkills()]);
        const base = cloneTree(staticSkillTree);
        const treeWithState = applyStateToTree(base, state);
        const list: SkillNode[] = [];
        function walk(nodes: SkillNode[]) {
          for (const n of nodes) {
            if (n.category === "skill") list.push(n);
            if (n.children?.length) walk(n.children);
          }
        }
        walk(treeWithState);
        for (const a of apps) list.push({ id: a.id, name: a.name, description: a.description, category: "skill", enabled: a.enabled });
        for (const s of custom) list.push({ id: s.id, name: s.name, description: s.description, category: "skill", enabled: s.enabled ?? true });
        return { skills: list };
      },
      { maxSize: 5, ttl: 60 * 1000 }
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/**
 * 获取所有可用技能（供推荐引擎使用）
 */
async function getAllSkills(): Promise<SkillInfo[]> {
  const [builtinSkills, extensionSkills] = await Promise.all([
    getOpenClawBuiltinSkills(),
    getMineEchoExtensionSkills(),
  ]);

  return [...builtinSkills, ...extensionSkills];
}

skillsRouter.get("/recommendations", async (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "default-user";
  try {
    const profile = await longTermMemoryManager.getUserProfile(userId);
    const patterns = await longTermMemoryManager.getSkillPatterns(userId);

    // 获取所有可用 skills
    const allSkills = await getAllSkills();

    const recommendations = allSkills
      .map((skill) => {
        let score = 0;
        const reasons: string[] = [];

        // 技术栈匹配
        const allTech = [
          ...(profile?.technicalStack?.languages || []),
          ...(profile?.technicalStack?.frameworks || []),
          ...(profile?.technicalStack?.tools || []),
        ];
        for (const tech of allTech) {
          if (skill.description?.includes(tech) || (skill as any).tags?.includes(tech)) {
            score += 10;
            reasons.push(`匹配你的 ${tech} 技术栈`);
          }
        }

        // 领域匹配
        for (const domain of profile?.domainExpertise || []) {
          if (skill.category === domain.domain) {
            score += 15;
            reasons.push(`匹配你的 ${domain.domain} 领域`);
          }
        }

        // 使用模式关联（相似 skill）
        const userSkillIds = patterns?.patterns.map((p) => p.skillId) || [];
        if ((skill as any).relatedSkillIds?.some((id: string) => userSkillIds.includes(id))) {
          score += 5;
          reasons.push("与你常用技能相关");
        }

        return { skill, score, reasons };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      recommendations: recommendations.map((r) => ({
        ...r.skill,
        matchScore: r.score,
        matchReasons: r.reasons,
      })),
    });
  } catch (error) {
    logger.error("[SkillsRecommendations] Failed:", error);
    res.status(500).json({ error: "推荐生成失败" });
  }
});

function findExtensionSkillFiles(skillId: string): {
  extensionSkillRootPath?: string;
  skillMarkdownPath?: string;
  executablePath?: string;
} {
  const extensionsDir = resolve(getMineEchoExtensionsDir());
  const rootPath = resolve(extensionsDir, skillId);
  const rootRelative = relative(extensionsDir, rootPath);
  if (!rootRelative || rootRelative.startsWith("..") || isAbsolute(rootRelative)) {
    return {};
  }

  const skillMarkdownPath = join(rootPath, "SKILL.md");
  const executablePath = join(rootPath, "scripts", "call.js");

  return {
    extensionSkillRootPath: existsSync(rootPath) ? rootPath : undefined,
    skillMarkdownPath: existsSync(skillMarkdownPath) ? skillMarkdownPath : undefined,
    executablePath: existsSync(executablePath) ? executablePath : undefined,
  };
}

skillsRouter.get("/:id/health", async (req, res) => {
  try {
    const id = req.params.id;
    const registry = await getSkillRegistrySnapshot();
    let entry = registry.entries.find((item) => item.id === id);
    if (!entry) {
      const visibleSkill = (await getAllSkills()).find((item) => item.id === id);
      if (visibleSkill) {
        entry = buildSkillHealthEntryFromInfo(visibleSkill);
      }
    }
    if (!entry) {
      return res.status(404).json({ code: 404, message: "Skill not found" });
    }

    const query = typeof req.query.query === "string" ? req.query.query : undefined;
    const located = findExtensionSkillFiles(id);
    res.json({
      code: 0,
      message: "success",
      data: buildSkillHealthReport({
        entry,
        ...located,
        routeQuery: query,
      }),
    });
  } catch (e) {
    logger.error("[SkillHealth] Failed:", { error: (e as Error).message });
    res.status(500).json({ code: 500, message: String((e as Error).message) });
  }
});

skillsRouter.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!STATIC_SKILL_IDS.has(id)) {
      return res.status(400).json({ error: "仅支持启用/停用内置技能，或通过「导入技能」管理自定义技能" });
    }
    const body = req.body || {};
    const enabled = body.enabled;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "body.enabled 为必填（boolean）" });
    }
    const state = await loadSkillsState();
    state[id] = enabled;
    await saveSkillsState(state);
    // Invalidate caches after state change
    invalidateCache("skillsTree");
    invalidateCache("skillsList");
    res.json({ id, enabled });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

const CUSTOM_ID_PREFIX = "custom-";
skillsRouter.post("/import", async (req, res) => {
  try {
    const body = req.body || {};
    const raw = body.skills ?? body;
    const list = Array.isArray(raw) ? raw : [];
    const custom: CustomSkill[] = [];
    const seen = new Set(STATIC_SKILL_IDS);
    for (const s of list) {
      if (!s || typeof s !== "object") continue;
      const id = typeof s.id === "string" && s.id.trim() ? s.id.trim() : CUSTOM_ID_PREFIX + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      if (seen.has(id)) continue;
      seen.add(id);
      custom.push({
        id,
        name: typeof s.name === "string" ? s.name.trim() || id : id,
        description: typeof s.description === "string" ? s.description.trim() : undefined,
        category: "skill",
        enabled: typeof s.enabled === "boolean" ? s.enabled : true,
      });
    }
    const existing = await loadCustomSkills();
    const merged = [...existing];
    for (const s of custom) {
      const idx = merged.findIndex((x) => x.id === s.id);
      if (idx >= 0) merged[idx] = s;
      else merged.push(s);
    }
    await saveCustomSkills(merged);
    await invalidateSkillViewsAndRefreshTriggers();
    res.json({ ok: true, added: custom.length, total: merged.length });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

const CONTENT_SCAN_EXT = new Set([".md", ".txt", ".json", ".yaml", ".yml"]);
function buildScanEntriesFromZip(
  entries: SkillArchiveEntry[]
): ScanEntry[] {
  return entries.map((e) => {
    const base = e.entryName.replace(/\/$/, "").split("/").pop() || "";
    const i = base.lastIndexOf(".");
    const ext = i > 0 ? base.slice(i).toLowerCase() : "";
    const needData = !e.isDirectory && CONTENT_SCAN_EXT.has(ext);
    return {
      name: e.entryName,
      isDir: e.isDirectory,
      data: needData ? e.getData() : undefined,
    };
  });
}

/** 从 ZIP / .skill 文件导入：内置安全扫描通过后解压到 .mineecho/skills/<id>/，不通过则入隔离区 */
skillsRouter.post("/import-file", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: "请上传文件（ZIP 或 .skill）" });
    }
    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip(file.buffer);
    const entries = zip.getEntries();
    const archiveFindings = validateSkillArchiveEntries(entries);
    if (archiveFindings.length > 0) {
      return res.status(400).json({ error: "压缩包路径不安全", report: archiveFindings });
    }
    const rootPrefix = findSkillPackageRoot(entries);
    if (rootPrefix === null) {
      return res.status(400).json({ error: "压缩包内未找到 SKILL.md" });
    }
    const skillMd = entries.find((e: SkillArchiveEntry) => !e.isDirectory && e.entryName.replace(/\\/g, "/").toLowerCase() === `${rootPrefix}skill.md`.toLowerCase());
    if (!skillMd) {
      return res.status(400).json({ error: "压缩包内未找到 SKILL.md" });
    }
    const content = skillMd.getData().toString("utf8");
    const { name, description } = parseSkillMdFrontmatter(content);
    const id = "skill-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    const scanEntries = buildScanEntriesFromZip(entries);
    const scanResult = scanSkillEntries(scanEntries);
    const { mkdir } = await import("node:fs/promises");
    const base = getMineEchoHome();

    if (!scanResult.pass) {
      const quarantineDir = join(base, "skills-quarantine", id);
      await mkdir(quarantineDir, { recursive: true });
      await extractSkillArchiveEntries(entries, quarantineDir, rootPrefix);
      return res.status(400).json({
        ok: false,
        quarantined: true,
        id,
        message: "轻量安全扫描未通过，已放入隔离区",
        report: scanResult.findings,
      });
    }

    const tmpDir = join(base, ".tmp", `skill-${id}-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    await extractSkillArchiveEntries(entries, tmpDir, rootPrefix);
    const externalScan = await runExternalSkillScanner(tmpDir);
    const { rm } = await import("node:fs/promises");
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    if (externalScan.ran && !externalScan.pass) {
      const quarantineDir = join(base, "skills-quarantine", id);
      await mkdir(quarantineDir, { recursive: true });
      await extractSkillArchiveEntries(entries, quarantineDir, rootPrefix);
      return res.status(400).json({
        ok: false,
        quarantined: true,
        id,
        message: "深度扫描未通过（cisco skill-scanner），已放入隔离区",
        report: externalScan.raw
          ? [
              { code: "EXTERNAL_SCANNER", message: externalScan.message || "发现风险" },
              { code: "SCANNER_OUTPUT", message: externalScan.raw },
            ]
          : [{ code: "EXTERNAL_SCANNER", message: externalScan.message || "发现风险" }],
      });
    }

    const existing = await loadCustomSkills();
    existing.push({ id, name, description, category: "skill", enabled: true });
    await saveCustomSkills(existing);
    // Invalidate caches after file import
    invalidateCache("skillsTree");
    invalidateCache("skillsList");
    invalidateCache("skillsAll");
    // 保存到 Gateway 能读取的扩展目录（与 L2 下发技能同一路径）
    const skillsDir = join(getMineEchoExtensionsDir(), id);
    await mkdir(skillsDir, { recursive: true });
    await extractSkillArchiveEntries(entries, skillsDir, rootPrefix);
    await invalidateSkillViewsAndRefreshTriggers();
    res.json({
      ok: true,
      id,
      name,
      description,
      scanSummary: {
        atImport: true,
        lightPass: true,
        deepScanRan: externalScan.ran,
        deepScanPass: externalScan.ran ? externalScan.pass : undefined,
      },
      ...(externalScan.ran === false && externalScan.message ? { scannerHint: externalScan.message } : {}),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 从 URL 安装：下载 ZIP/.skill 后与 import-file 相同逻辑（含轻量扫描 + 可选 cisco skill-scanner） */
skillsRouter.post("/install-from-url", async (req, res) => {
  try {
    const url = req.body?.url;
    if (typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "url 为必填" });
    }
    const resp = await fetch(url.trim(), { redirect: "follow" });
    if (!resp.ok) {
      return res.status(400).json({ error: "下载失败: " + resp.status });
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const archiveFindings = validateSkillArchiveEntries(entries);
    if (archiveFindings.length > 0) {
      return res.status(400).json({ error: "压缩包路径不安全", report: archiveFindings });
    }
    const rootPrefix = findSkillPackageRoot(entries);
    if (rootPrefix === null) {
      return res.status(400).json({ error: "压缩包内未找到 SKILL.md" });
    }
    const skillMd = entries.find((e: SkillArchiveEntry) => !e.isDirectory && e.entryName.replace(/\\/g, "/").toLowerCase() === `${rootPrefix}skill.md`.toLowerCase());
    if (!skillMd) {
      return res.status(400).json({ error: "压缩包内未找到 SKILL.md" });
    }
    const content = skillMd.getData().toString("utf8");
    const { name, description } = parseSkillMdFrontmatter(content);
    const id = "skill-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    const scanEntries = buildScanEntriesFromZip(entries);
    const scanResult = scanSkillEntries(scanEntries);
    const { mkdir } = await import("node:fs/promises");
    const base = getMineEchoHome();

    if (!scanResult.pass) {
      const quarantineDir = join(base, "skills-quarantine", id);
      await mkdir(quarantineDir, { recursive: true });
      await extractSkillArchiveEntries(entries, quarantineDir, rootPrefix);
      return res.status(400).json({
        ok: false,
        quarantined: true,
        id,
        message: "轻量安全扫描未通过，已放入隔离区",
        report: scanResult.findings,
      });
    }

    const tmpDir = join(base, ".tmp", `skill-${id}-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    await extractSkillArchiveEntries(entries, tmpDir, rootPrefix);
    const externalScan = await runExternalSkillScanner(tmpDir);
    const { rm } = await import("node:fs/promises");
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    if (externalScan.ran && !externalScan.pass) {
      const quarantineDir = join(base, "skills-quarantine", id);
      await mkdir(quarantineDir, { recursive: true });
      await extractSkillArchiveEntries(entries, quarantineDir, rootPrefix);
      return res.status(400).json({
        ok: false,
        quarantined: true,
        id,
        message: "深度扫描未通过（cisco skill-scanner），已放入隔离区",
        report: externalScan.raw
          ? [
              { code: "EXTERNAL_SCANNER", message: externalScan.message || "发现风险" },
              { code: "SCANNER_OUTPUT", message: externalScan.raw },
            ]
          : [{ code: "EXTERNAL_SCANNER", message: externalScan.message || "发现风险" }],
      });
    }

    const existing = await loadCustomSkills();
    existing.push({ id, name, description, category: "skill", enabled: true });
    await saveCustomSkills(existing);
    // Invalidate caches after URL install
    invalidateCache("skillsTree");
    invalidateCache("skillsList");
    invalidateCache("skillsAll");
    // 保存到 Gateway 能读取的扩展目录（与 L2 下发技能同一路径）
    const skillsDir = join(getMineEchoExtensionsDir(), id);
    await mkdir(skillsDir, { recursive: true });
    await extractSkillArchiveEntries(entries, skillsDir, rootPrefix);
    await invalidateSkillViewsAndRefreshTriggers();
    res.json({
      ok: true,
      id,
      name,
      description,
      scanSummary: {
        atImport: true,
        lightPass: true,
        deepScanRan: externalScan.ran,
        deepScanPass: externalScan.ran ? externalScan.pass : undefined,
      },
      ...(externalScan.ran === false && externalScan.message ? { scannerHint: externalScan.message } : {}),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});
