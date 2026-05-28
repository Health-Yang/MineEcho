import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Typography,
  Button,
  Drawer,
  Input,
  message,
  Alert,
  Skeleton,
  Modal,
  Empty,
  Progress,
  Tooltip,
  Spin,
} from "antd";
import { useApiCache } from "../hooks/useApiCache";
import { useDebouncedCallback } from "../hooks/useDebounce";
import { SkillUpdateModal } from "../components/SkillUpdateModal";
import { AiAppsPage } from "./AiAppsPage";
import { fetchSkillHealth, summarizeSkillHealth, type SkillHealthCheck, type SkillHealthCheckStatus, type SkillHealthReport } from "../utils/skillHealth";
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  SearchOutlined,
  TagOutlined,
  AppstoreOutlined,
  SyncOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  ExperimentOutlined,
} from "@ant-design/icons";


// 技能描述翻译映射 - 仅用于前端展示，不影响技能功能
const SKILL_DESCRIPTION_ZH: Record<string, string> = {
  // 1Password
  "1password": "1Password 密码管理工具，帮助您安全地存储和管理密码，支持 CLI 命令行操作",
  // Apple Notes
  "apple-notes": "苹果备忘录管理，使用 memo CLI 在 macOS 上创建、查看、编辑、搜索和管理备忘录",
  // Apple Reminders
  "apple-reminders": "苹果提醒事项管理，使用 remindctl CLI 列出、添加、编辑、完成和删除提醒",
  // Bear Notes
  "bear-notes": "Bear 笔记管理，通过 grizzly CLI 创建、搜索和管理 Bear 笔记",
  // Blogwatcher
  "blogwatcher": "博客和 RSS/Atom 订阅更新监控，使用 blogwatcher CLI 跟踪博客更新",
  // BluOS
  "blucli": "BluOS 音乐系统控制，通过 blu CLI 进行音箱发现、播放、分组和音量控制",
  // BlueBubbles
  "bluebubbles": "iMessage 消息管理，通过 BlueBubbles 发送和管理 iMessage 消息",
  // Camsnap
  "camsnap": "摄像头抓取，从 RTSP/ONVIF 摄像头捕获画面或视频片段",
  // Canvas
  "canvas": "Canvas 画布工具",
  // ClawHub
  "clawhub": "ClawHub 技能市场，搜索、安装、更新和发布 agent 技能",
  // Coding Agent
  "coding-agent": "编程任务委托，将编码任务委托给 Codex、Claude Code 或 Pi agent",
  // Discord
  "discord": "Discord 操作，通过消息工具控制 Discord",
  // Eight Sleep
  "eightctl": "Eight Sleep 智能床垫控制，查看状态、设置温度、闹钟和日程",
  // Gemini
  "gemini": "Gemini CLI，用于一次性问答、摘要和内容生成",
  // GitHub Issues
  "gh-issues": "GitHub 问题管理，获取 issue、生成修复 PR、监控 PR 审核评论",
  // GitHub
  "github": "GitHub 操作，通过 gh CLI 进行 issue、PR、CI 运行、代码审查和 API 查询",
  // Google Workspace
  "gog": "Google 工作区 CLI，支持 Gmail、日历、云端硬盘、通讯录、表格和文档",
  // Google Places
  "goplaces": "Google Places API 查询，进行人性化地点查找和 JSON 输出",
  // Healthcheck
  "healthcheck": "主机安全加固和风险配置，进行安全审计、防火墙/SSH/更新加固",
  // Himalaya
  "himalaya": "邮件管理 CLI，通过 IMAP/SMTP 管理邮件，支持多账户",
  // iMessage
  "imsg": "iMessage/SMS CLI，列出聊天记录、历史和发送消息",
  // MC Porter
  "mcporter": "MCP 服务器管理，列出、配置、认证和调用 MCP 服务器/工具",
  // Model Usage
  "model-usage": "模型使用统计，使用 CodexBar CLI 统计各模型的 API 使用量和费用",
  // Nano PDF
  "nano-pdf": "PDF 编辑，使用自然语言指令编辑 PDF 文件",
  // Node Connect
  "node-connect": "MineEcho 节点连接诊断，解决 Android、iOS 和 macOS 配对失败问题",
  // Notion
  "notion": "Notion API，用于创建和管理页面、数据库和区块",
  // Obsidian
  "obsidian": "Obsidian 笔记管理，处理纯 Markdown 笔记库",
  // OpenAI Whisper
  "openai-whisper": "本地语音转文字，使用 Whisper CLI（无需 API key）",
  // OpenAI Whisper API
  "openai-whisper-api": "语音转文字，通过 OpenAI 音频转录 API",
  // OpenHue
  "openhue": "飞利浦 Hue 灯光控制，通过 OpenHue CLI 控制灯光和场景",
  // Oracle
  "oracle": "Oracle CLI 最佳实践，提示工程、文件打包、引擎和会话模式",
  // OrderCLI
  "ordercli": "外卖订单查询，查看历史订单和当前订单状态",
  // Peekaboo
  "peekaboo": "macOS UI 自动化，使用 Peekaboo CLI 捕获和自动化界面操作",
  // SAG (ElevenLabs TTS)
  "sag": "ElevenLabs 文字转语音，mac 风格的语音合成",
  // Session Logs
  "session-logs": "会话日志搜索和分析，使用 jq 搜索历史会话",
  // Sherpa ONNX TTS
  "sherpa-onnx-tts": "本地文字转语音，离线语音合成无需网络",
  // Skill Creator
  "skill-creator": "技能创建器，创建、编辑、改进或审核 AgentSkills",
  // Slack
  "slack": "Slack 控制，通过 slack 工具控制 Slack",
  // Songsee
  "songsee": "音频可视化，生成频谱图和特征面板可视化",
  // Sonos
  "sonoscli": "Sonos 音箱控制，发现状态/播放/音量/分组",
  // Spotify
  "spotify-player": "Spotify 终端播放，通过 spogo 搜索和播放音乐",
  // Summarize
  "summarize": "内容摘要，从 URL、播客和本地文件提取或摘要文本",
  // Things
  "things-mac": "Things 3 任务管理，在 macOS 上管理项目和待办事项",
  // Tmux
  "tmux": "Tmux 会话控制，远程控制交互式 CLI",
  // Trello
  "trello": "Trello 看板管理，通过 Trello API 管理看板、列表和卡片",
  // Video Frames
  "video-frames": "视频帧提取，使用 ffmpeg 提取视频帧或短视频片段",
  // Voice Call
  "voice-call": "语音通话，通过 MineEcho 语音通话插件发起语音呼叫",
  // WhatsApp
  "wacli": "WhatsApp 消息，发送消息和同步历史记录",
  // Weather
  "weather": "天气查询，获取当前天气和天气预报",
  // X (Twitter)
  "xurl": "X (Twitter) API，发推特、回复、搜索、读取帖子和管理粉丝",
  // HCI
  "HCI技术原理": "HCI 超融合基础架构技术原理介绍，帮助了解 HCI 技术",
  // 深信服产品
  "app-1774227756925-3amf47u": "信服产品万事通 AI 小帮手，回答深信服云产品功能知识，包括 HCI、VDI、EDS、AICP 等",
  "app-1774229388620-hrvuqfs": "深信服产品万事通，深信服产品专家，回答关于 VGPU、AICP、云计算等产品问题",
  "app-1774230391819-xfvg7bu": "信服产品专家，深信服产品专家团队，处理 VGPU、AICP、云计算等产品咨询",
  "fastgpt-chat": "深信服产品助手，基于 FastGPT 的产品应用，用于询问产品功能支持情况",
  "hci-inspector-0309": "深信服产品巡检智能体，巡检深信服所有产品的智能体，包括 HCI、VDI、EDS、AD、AF、AC 等",
  "hci-solution-generator": "HCI 实施方案生成助手，帮助用户生成 HCI 实施方案文档",
  "深信服产品小助手": "深信服产品小助手，帮助用户查询深信服产品相关知识",
  // 扩展技能
  "autoplan": "自动审查流程，依次运行 CEO、设计和工程审查技能",
  "benchmark": "性能回归检测，使用浏览器守护进程建立页面加载时间基准",
  "browse": "无头浏览器，用于 QA 测试和网站验证，可导航 URL、与元素交互",
  "canary": "金丝雀部署检测",
  "careful": "谨慎模式，在执行操作前进行额外确认",
  "codex": "代码生成助手，使用 AI 生成和优化代码",
  "composition-patterns": "React 组合模式，可扩展的 React 组件设计模式",
  "connect-chrome": "Chrome 浏览器连接，控制和自动化 Chrome 浏览器",
  "cso": "首席安全官模式，安全审查和合规检查",
  "deploy-to-vercel": "Vercel 部署，将应用和网站部署到 Vercel 平台",
  "design-consultation": "设计咨询，提供 UI/UX 设计建议和评审",
  "design-review": "设计审查，审查设计稿和原型",
  "document-release": "文档发布，生成和发布项目文档",
  "docx": "Word 文档处理，创建/读取/编辑 Word 文档，支持表格、图片、样式等",
  "freeze": "冻结模式，锁定当前状态防止修改",
  "frontend-design": "前端设计，创建高质量的前端界面和组件",
  "gstack-upgrade": "技术栈升级，升级项目依赖和框架版本",
  "guard": "守护模式，监控和保护系统运行",
  "investigate": "问题调查，深入分析和诊断问题",
  "land-and-deploy": "合并并部署，将代码合并到主分支并自动部署",
  "office-hours": "办公时间模式，限制在工作时间内执行操作",
  "pdf": "PDF 处理工具，读取/提取 PDF 文本表格、合并/拆分 PDF、旋转页面、添加水印、创建新 PDF、填写表单、加密解密、OCR 识别",
  "plan-ceo-review": "CEO 审查计划，从高层视角审查项目计划",
  "plan-design-review": "设计审查计划，审查设计方案和架构",
  "plan-eng-review": "工程审查计划，审查技术实现和代码质量",
  "pptx": "PPT 演示文稿处理，创建/编辑 PPT、提取内容、模板和布局操作",
  "qa": "质量保证，执行测试和质量检查",
  "qa-only": "仅 QA 模式，只执行测试不修改代码",
  "react-best-practices": "React 和 Next.js 性能优化指南，来自 Vercel 工程团队的最佳实践",
  "react-native-skills": "React Native 和 Expo 最佳实践，构建高性能移动应用",
  "retro": "回顾会议，项目复盘和经验总结",
  "review": "代码审查，审查代码变更和 Pull Request",
  "setup-browser-cookies": "浏览器 Cookie 设置，配置浏览器认证信息",
  "setup-deploy": "部署配置，设置部署环境和流程",
  "ship": "发布模式，准备和执行产品发布",
  "unfreeze": "解冻模式，解除冻结状态恢复修改",
  "vercel-cli-with-tokens": "Vercel CLI 部署，使用访问令牌进行项目部署和环境变量管理",
  "web-design-guidelines": "Web 界面设计指南，检查 UI 代码是否符合 Web 界面指南和可访问性标准",
  "webapp-testing": "Web 应用测试工具包，使用 Playwright 验证前端功能、调试 UI、截图和查看日志",
  "xlsx": "Excel 表格处理，打开/读取/编辑/修复 Excel 文件、创建新表格、格式化和图表操作",
};

// 获取技能的中文描述（用于前端展示）
function getSkillDescriptionZh(skill: { id?: string; name?: string; description?: string }): string | undefined {
  const skillId = (skill.id || "").toLowerCase();
  const skillName = (skill.name || "").toLowerCase();

  // 优先通过 ID 匹配
  if (SKILL_DESCRIPTION_ZH[skillId]) {
    return SKILL_DESCRIPTION_ZH[skillId];
  }
  // 其次通过名称匹配
  if (SKILL_DESCRIPTION_ZH[skillName]) {
    return SKILL_DESCRIPTION_ZH[skillName];
  }
  // 如果没有翻译且原描述是英文，尝试智能翻译
  if (skill.description && /^[a-zA-Z]/.test(skill.description)) {
    // 对于没有翻译的英文描述，使用原文（因为可能是动态导入的技能）
    return undefined;
  }
  return skill.description;
}

// 技能信息类型（来自 API）
interface SkillInfo {
  id: string;
  name: string;
  description?: string;
  source?: "openclaw-builtin" | "mineecho-extension" | "custom" | "ai-app";
  enabled?: boolean;
  triggers?: string[];
  type?: "skill" | "ai-app";
  appType?: "rag" | "workflow";
  category?: string;
}

// 技能推荐项类型
interface SkillRecommendation {
  id: string;
  name: string;
  matchReasons: string[];
  matchScore: number;
}

// 技能同步状态
interface SkillSyncStatus {
  id: string;
  name: string;
  status: 'pending' | 'downloading' | 'verifying' | 'success' | 'failed';
  error?: string;
}

// 同步进度结果
interface SyncProgressResult {
  total: number;
  success: number;
  failed: number;
  skills: SkillSyncStatus[];
  error?: string;
}

// 技能节点类型
interface SkillNode {
  id: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  type?: "category" | "skill" | "advanced" | "ai-app" | "builtin" | "extension";
  parentId?: string;
  children?: SkillNode[];
  unlocked?: boolean;
  level?: number;
  isBuiltin?: boolean;
  isExtension?: boolean;
  isAiApp?: boolean;
  source?: "openclaw-builtin" | "mineecho-extension" | "custom" | "ai-app";
  triggers?: string[];
  appType?: "rag" | "workflow";
}

// 功能分类定义
interface CategoryDef {
  key: string;
  name: string;
  description: string; // 小白友好的描述
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  keywords: string[];
}

// 功能分类配置 - 按功能场景划分
const FUNCTION_CATEGORIES: CategoryDef[] = [
  {
    key: "document",
    name: "📄 文档处理",
    description: "处理各种文档格式：Word、Excel、PPT、PDF 等",
    icon: "📄",
    color: "#0066ff",
    bgColor: "#e6f7ff",
    keywords: ["文档", "word", "excel", "pdf", "ppt", "表格", "演示"],
  },
  {
    key: "development",
    name: "💻 开发工具",
    description: "代码开发、测试、部署和最佳实践",
    icon: "💻",
    color: "#13c2c2",
    bgColor: "#e6fffb",
    keywords: ["代码", "开发", "编程", "react", "测试", "部署", "git", "vercel"],
  },
  {
    key: "design",
    name: "🎨 设计工具",
    description: "UI/UX 设计、设计审查和界面优化",
    icon: "🎨",
    color: "#eb2f96",
    bgColor: "#fff0f6",
    keywords: ["设计", "ui", "ux", "界面", "前端", "样式"],
  },
  {
    key: "browser",
    name: "🌐 浏览器工具",
    description: "浏览器自动化、网页测试和抓取",
    icon: "🌐",
    color: "#fa8c16",
    bgColor: "#fff7e6",
    keywords: ["浏览器", "网页", "自动化", "playwright", "cookie"],
  },
  {
    key: "review",
    name: "🔍 审查流程",
    description: "代码审查、设计评审和质量保证",
    icon: "🔍",
    color: "#52c41a",
    bgColor: "#f6ffed",
    keywords: ["审查", "评审", "质量", "qa", "review", "检查"],
  },
  {
    key: "workflow",
    name: "⚡ 工作流",
    description: "自动化流程、部署和项目管理",
    icon: "⚡",
    color: "#722ed1",
    bgColor: "#f9f0ff",
    keywords: ["流程", "自动化", "部署", "发布", "管理", "计划"],
  },
  {
    key: "ai-apps",
    name: "AI 应用",
    description: "从外部 AI 应用导入并转换成可路由技能",
    icon: <StarOutlined />,
    color: "#eb2f96",
    bgColor: "#fff0f6",
    keywords: ["ai应用", "AI 应用", "rag", "workflow", "工作流"],
  },
  {
    key: "other",
    name: "🔧 其他工具",
    description: "其他实用工具和功能",
    icon: "🔧",
    color: "#595959",
    bgColor: "#f0f2f5",
    keywords: [],
  },
];

// 技能分类映射 - 精确匹配每个技能到合适的分类
const SKILL_CATEGORY_MAP: Record<string, string> = {
  // 📄 文档处理
  "docx": "document",
  "pdf": "document",
  "pptx": "document",
  "xlsx": "document",

  // 💻 开发工具
  "codex": "development",
  "composition-patterns": "development",
  "react-best-practices": "development",
  "react-native-skills": "development",
  "deploy-to-vercel": "development",
  "vercel-cli-with-tokens": "development",
  "webapp-testing": "development",
  "benchmark": "development",
  "gstack-upgrade": "development",

  // 🎨 设计工具
  "frontend-design": "design",
  "design-consultation": "design",
  "design-review": "design",
  "web-design-guidelines": "design",

  // 🌐 浏览器工具
  "browse": "browser",
  "connect-chrome": "browser",
  "setup-browser-cookies": "browser",

  // 🔍 审查流程
  "qa": "review",
  "qa-only": "review",
  "review": "review",
  "plan-ceo-review": "review",
  "plan-design-review": "review",
  "plan-eng-review": "review",
  "autoplan": "review",

  // ⚡ 工作流
  "ship": "workflow",
  "land-and-deploy": "workflow",
  "setup-deploy": "workflow",
  "document-release": "workflow",
  "retro": "workflow",
  "investigate": "workflow",
  "canary": "workflow",
  "freeze": "workflow",
  "unfreeze": "workflow",
  "guard": "workflow",
  "careful": "workflow",
  "office-hours": "workflow",

};

// 获取技能的功能分类
function getSkillCategory(skill: SkillInfo | SkillNode): CategoryDef {
  const skillId = (skill.id || "").toLowerCase();

  // 1. 优先使用精确匹配的分类映射
  if (SKILL_CATEGORY_MAP[skillId]) {
    const categoryKey = SKILL_CATEGORY_MAP[skillId];
    return FUNCTION_CATEGORIES.find(c => c.key === categoryKey) || FUNCTION_CATEGORIES[FUNCTION_CATEGORIES.length - 1];
  }

  // 2. 检查是否为 AI 应用
  if ((skill as SkillNode).isAiApp || skill.source === "ai-app") {
    return FUNCTION_CATEGORIES.find(c => c.key === "ai-apps")!;
  }

  // 3. 检查是否为扩展技能（通过文件导入的）
  if ((skill as SkillNode).isExtension || skill.source === "mineecho-extension") {
    // 扩展技能按名称关键词匹配
    const text = `${skill.name || ""} ${skill.description || ""}`.toLowerCase();

    for (const cat of FUNCTION_CATEGORIES) {
      if (cat.key === "other") continue;
      for (const keyword of cat.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return cat;
        }
      }
    }
  }

  // 4. 内置技能按关键词匹配
  const text = `${skill.name || ""} ${skill.description || ""}`.toLowerCase();
  for (const cat of FUNCTION_CATEGORIES) {
    if (cat.key === "other") continue;
    for (const keyword of cat.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return cat;
      }
    }
  }

  // 5. 默认归入其他工具
  return FUNCTION_CATEGORIES[FUNCTION_CATEGORIES.length - 1];
}

// 提取触发关键词
function extractTriggers(skill: SkillInfo | SkillNode): string[] {
  const triggers: string[] = [];

  // 技能名称本身作为触发词
  if (skill.name && skill.name.length <= 10) {
    triggers.push(skill.name);
  }

  // 从描述中提取关键词
  const desc = skill.description || "";
  const words = desc.split(/[\s,，。！？、]+/).filter(w => w.length >= 2 && w.length <= 8);

  // 取前3个有意义的词
  for (const word of words.slice(0, 3)) {
    if (!triggers.includes(word)) {
      triggers.push(word);
    }
  }

  return triggers.slice(0, 4); // 最多4个
}

const HEALTH_CHECK_LABELS: Record<keyof SkillHealthReport["checks"], string> = {
  metadata: "元数据",
  triggers: "触发词",
  executable: "执行入口",
  routing: "路由命中",
};

const HEALTH_STATUS_STYLE: Record<SkillHealthCheckStatus, { color: string; bg: string; text: string }> = {
  pass: { color: "#52c41a", bg: "#f6ffed", text: "通过" },
  warn: { color: "#fa8c16", bg: "#fff7e6", text: "关注" },
  fail: { color: "#ff4d4f", bg: "#fff2f0", text: "异常" },
};

function HealthCheckRow({ label, check }: { label: string; check: SkillHealthCheck }) {
  const style = HEALTH_STATUS_STYLE[check.status];
  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #eef1f5",
        display: "grid",
        gridTemplateColumns: "72px 58px minmax(0, 1fr)",
        gap: 10,
        alignItems: "start",
      }}
    >
      <span style={{ fontSize: 12, color: "#646a73", lineHeight: 1.6 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          color: style.color,
          background: style.bg,
          padding: "1px 6px",
          borderRadius: 4,
          textAlign: "center",
          fontWeight: 500,
          lineHeight: 1.6,
        }}
      >
        {style.text}
      </span>
      <span style={{ fontSize: 12, color: "#1f2329", lineHeight: 1.6 }}>{check.message}</span>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <div style={{ fontSize: 12, fontWeight: 600, color: "#646a73", letterSpacing: 0 }}>
          {title}
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailPill({
  children,
  color = "#0066ff",
  background,
}: {
  children: React.ReactNode;
  color?: string;
  background?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: "100%",
        minHeight: 24,
        padding: "2px 8px",
        borderRadius: 5,
        color,
        background: background || `${color}12`,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}

// 技能卡片组件
function SkillCard({
  skill,
  onToggle,
  onViewDetail,
}: {
  skill: SkillNode;
  onToggle: (skill: SkillNode) => void;
  onViewDetail: (skill: SkillNode) => void;
}) {
  const category = getSkillCategory(skill);
  // 获取中文描述（仅用于前端展示）
  const displayDescription = getSkillDescriptionZh(skill) || skill.description;

  return (
    <div
      className="sf-card"
      onClick={() => onViewDetail(skill)}
      style={{
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${category.color}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: category.color,
          }}
        >
          {category.icon}
        </div>
        {skill.enabled ? (
          <span style={{ fontSize: 10, background: '#f6ffed', color: '#52c41a', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
            运行中
          </span>
        ) : (
          <span style={{ fontSize: 10, background: '#f5f5f5', color: '#8c8c8c', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
            已停用
          </span>
        )}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2329', marginBottom: 2 }}>
        {skill.name}
      </div>

      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 10, lineHeight: 1.5 }}>
        {displayDescription || `属于"${category.name}"类别：${category.description}`}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: '#a8b8cc' }}>v1.0</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggle(skill);
          }}
          style={{ fontSize: 11, color: '#0066ff', fontWeight: 500, cursor: 'pointer' }}
        >
          配置
        </span>
      </div>
    </div>
  );
}

// 技能详情抽屉
function SkillDetailDrawer({
  skill,
  visible,
  onClose,
  onToggle,
}: {
  skill: SkillNode | null;
  visible: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const [healthQuery, setHealthQuery] = useState("");
  const [healthReport, setHealthReport] = useState<SkillHealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !skill) return;
    setHealthQuery(skill.name);
    setHealthReport(null);
    setHealthError(null);
  }, [visible, skill?.id]);

  const runHealthCheck = async (query = healthQuery) => {
    if (!skill) return;
    setHealthLoading(true);
    setHealthError(null);
    try {
      const report = await fetchSkillHealth(skill.id, { query: query.trim() || undefined });
      setHealthReport(report);
    } catch (error) {
      setHealthReport(null);
      setHealthError((error as Error).message || "健康检查失败");
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || !skill) return;
    void runHealthCheck(skill.name);
  }, [visible, skill?.id]);

  if (!skill) return null;

  const category = getSkillCategory(skill);
  const triggers = skill.triggers || extractTriggers(skill);
  const healthSummary = healthReport ? summarizeSkillHealth(healthReport) : null;
  // 获取中文描述
  const displayDescription = getSkillDescriptionZh(skill) || skill.description;

  const getSourceInfo = () => {
    if (skill.isBuiltin || skill.source === "openclaw-builtin") {
      return { text: "Gateway 内置", color: "#0066ff", icon: <ThunderboltOutlined /> };
    }
    if (skill.isExtension || skill.source === "mineecho-extension") {
      return { text: "MineEcho 扩展", color: "#52c41a", icon: <CheckCircleOutlined /> };
    }
    if (skill.isAiApp) {
      return { text: "AI 应用", color: "#eb2f96", icon: <StarOutlined /> };
    }
    return { text: "自定义技能", color: "#595959", icon: <SettingOutlined /> };
  };

  const sourceInfo = getSourceInfo();

  return (
    <Drawer
      title={<span style={{ fontSize: 15, fontWeight: 650, color: "#1f2329" }}>技能详情</span>}
      open={visible}
      onClose={onClose}
      width={460}
      extra={
        <Button type="primary" onClick={onToggle}>
          {skill.enabled ? "停用" : "启用"}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
        <div
          style={{
            paddingBottom: 18,
            borderBottom: "1px solid #eef1f5",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: `${category.color}12`,
                color: category.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {category.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 650, color: "#1f2329", lineHeight: 1.35, wordBreak: "break-word" }}>
                {skill.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                <DetailPill color={sourceInfo.color}>
                  {sourceInfo.icon}
                  {sourceInfo.text}
                </DetailPill>
                <DetailPill color={skill.enabled ? "#52c41a" : "#8c8c8c"} background={skill.enabled ? "#f6ffed" : "#f5f5f5"}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: skill.enabled ? "#52c41a" : "#bfbfbf",
                      display: "inline-block",
                    }}
                  />
                  {skill.enabled ? "已启用" : "已停用"}
                </DetailPill>
                <DetailPill color={category.color}>{category.name}</DetailPill>
              </div>
            </div>
          </div>
        </div>

        <DetailSection title="说明">
          <div style={{ fontSize: 14, lineHeight: 1.75, color: "#3d444d", wordBreak: "break-word" }}>
            {displayDescription || category.description}
          </div>
        </DetailSection>

        <DetailSection title="触发关键词" icon={<TagOutlined style={{ color: "#8c8c8c" }} />}>
          <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
            聊天中命中这些关键词时，MineEcho 会优先尝试路由到该技能。
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {triggers.map((trigger, idx) => (
              <DetailPill key={idx}>{trigger}</DetailPill>
            ))}
            {triggers.length === 0 && <span style={{ fontSize: 13, color: '#8c8c8c' }}>暂无触发词</span>}
          </div>
        </DetailSection>

        <DetailSection title="健康检查" icon={<ExperimentOutlined style={{ color: "#8c8c8c" }} />}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
              {healthSummary && (
                <DetailPill
                  color={HEALTH_STATUS_STYLE[healthSummary.status].color}
                  background={HEALTH_STATUS_STYLE[healthSummary.status].bg}
                >
                  {healthSummary.label}
                </DetailPill>
              )}
            </div>
            <Button size="small" loading={healthLoading} onClick={() => runHealthCheck()}>
              重新检查
            </Button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input
              size="small"
              value={healthQuery}
              onChange={(e) => setHealthQuery(e.target.value)}
              onPressEnter={() => runHealthCheck()}
              placeholder="输入一句用户问题，测试自动路由"
            />
            <Button size="small" type="primary" loading={healthLoading} onClick={() => runHealthCheck()}>
              测试
            </Button>
          </div>

          {healthLoading && !healthReport ? (
            <div style={{ padding: "18px 0", textAlign: "center" }}>
              <Spin size="small" />
            </div>
          ) : healthError ? (
            <Alert type="warning" showIcon message="健康检查不可用" description={healthError} />
          ) : healthReport ? (
            <div style={{ borderTop: "1px solid #f5f5f5" }}>
              {(Object.entries(healthReport.checks) as Array<[keyof SkillHealthReport["checks"], SkillHealthCheck]>).map(([key, check]) => (
                <HealthCheckRow key={key} label={HEALTH_CHECK_LABELS[key]} check={check} />
              ))}
              {healthReport.routeScore !== undefined && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                    <span>路由置信度</span>
                    <span>{Math.round(healthReport.routeScore * 100)}%</span>
                  </div>
                  <Progress
                    percent={Math.round(healthReport.routeScore * 100)}
                    showInfo={false}
                    size="small"
                    strokeColor={healthReport.checks.routing.status === "pass" ? "#52c41a" : "#fa8c16"}
                  />
                </div>
              )}
                  {healthReport.routeEvidence?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {healthReport.routeEvidence.slice(0, 5).map((item, idx) => (
                        <DetailPill key={`${item.type}-${item.value}-${idx}`}>
                          {item.type}: {item.value}
                        </DetailPill>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>打开详情后会自动检查技能状态。</div>
          )}
        </DetailSection>

        <DetailSection title="技术信息">
          <div>
            <code style={{ background: "#f5f7fa", color: "#3d444d", padding: "3px 8px", borderRadius: 5, fontSize: 12, lineHeight: 1.6, wordBreak: "break-all" }}>
              {skill.id}
            </code>
          </div>
        </DetailSection>

      </div>
    </Drawer>
  );
}

// 主组件
export function SkillsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "inspiration" | "ai-apps">("grid");
  const [inspirationDetailVisible, setInspirationDetailVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showRecommendations, setShowRecommendations] = useState(true);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [installUrl, setInstallUrl] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const focusedSkillRef = useRef<string | null>(null);

  // 文件上传进度
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "scanning" | "done" | "error">("idle");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");

  // 同步技能相关状态
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressResult | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [, setSyncTaskId] = useState<string | null>(null);
  const syncPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (syncPollRef.current) {
        clearInterval(syncPollRef.current);
        syncPollRef.current = null;
      }
    };
  }, []);

  // 技能更新检查
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const handleSyncSelectedSkills = (_skillIds: string[]) => {
    // 这里可以实现选择性同步逻辑
    // 目前先触发全量同步
    handleSyncSkills();
  };

  // 使用 API 缓存获取技能数据
  const {
    data: skillsData,
    isLoading: loading,
    refresh: refreshSkills,
  } = useApiCache(
    "skills:all",
    async () => {
      const res = await fetch("/api/skills/all");
      if (!res.ok) throw new Error("Failed to load skills");
      return await res.json();
    },
    { ttl: 60 * 1000 }
  );

  // 获取技能推荐数据
  const {
    data: recommendationsData,
    isLoading: recommendationsLoading,
  } = useApiCache(
    "skills:recommendations",
    async () => {
      const res = await fetch("/api/skills/recommendations");
      if (!res.ok) return null;
      return await res.json();
    },
    { ttl: 5 * 60 * 1000 }
  );

  // 将所有技能合并为扁平列表
  const allSkills = useMemo((): SkillNode[] => {
    if (!skillsData) return [];

    const skills: SkillNode[] = [];

    // 内置技能
    if (skillsData.builtin?.length > 0) {
      skills.push(...skillsData.builtin.map((s: SkillInfo) => ({
        ...s,
        isBuiltin: true,
        enabled: s.enabled ?? true,
      })));
    }

    // 扩展技能
    if (skillsData.extensions?.length > 0) {
      skills.push(...skillsData.extensions.map((s: SkillInfo) => ({
        ...s,
        isExtension: true,
        enabled: s.enabled ?? true,
      })));
    }

    // AI 应用转换后的技能
    if (skillsData.aiApps?.length > 0) {
      skills.push(...skillsData.aiApps.map((s: SkillInfo) => ({
        ...s,
        isAiApp: true,
        enabled: s.enabled ?? true,
      })));
    }

    // 为每个技能添加 triggers
    return skills.map(s => ({
      ...s,
      triggers: extractTriggers(s),
    }));
  }, [skillsData]);

  // 根据搜索文本过滤技能
  const filteredSkills = useMemo(() => {
    if (!searchText.trim()) return allSkills;

    const query = searchText.toLowerCase();
    return allSkills.filter(skill =>
      skill.name.toLowerCase().includes(query) ||
      (skill.description || "").toLowerCase().includes(query) ||
      skill.id.toLowerCase().includes(query)
    );
  }, [allSkills, searchText]);

  // 按功能分类分组
  const groupedSkills = useMemo(() => {
    const groups: Record<string, SkillNode[]> = {};

    // 初始化分组
    FUNCTION_CATEGORIES.forEach(cat => {
      groups[cat.key] = [];
    });

    // 分配技能到分组
    for (const skill of filteredSkills) {
      const category = getSkillCategory(skill);
      groups[category.key].push(skill);
    }

    return groups;
  }, [filteredSkills]);

  // 统计信息
  const stats = useMemo(() => {
    const total = allSkills.length;
    const enabled = allSkills.filter(s => s.enabled).length;
    const builtin = allSkills.filter(s => s.isBuiltin).length;
    const extension = allSkills.filter(s => s.isExtension).length;

    return { total, enabled, builtin, extension };
  }, [allSkills]);
  void stats;

  // 本地热门推荐（当 API 无数据时作为 fallback）
  const localRecommendations = useMemo((): SkillRecommendation[] => {
    if (recommendationsData?.recommendations?.length) return [];

    const recs: SkillRecommendation[] = [];
    const usedIds = new Set<string>();

    for (const cat of FUNCTION_CATEGORIES) {
      const skills = groupedSkills[cat.key] || [];
      // 优先推荐未启用的技能，其次任意技能
      const target = skills.find(s => !s.enabled && !usedIds.has(s.id))
        || skills.find(s => !usedIds.has(s.id));
      if (target) {
        usedIds.add(target.id);
        recs.push({
          id: target.id,
          name: target.name,
          matchReasons: [`${cat.name.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').trim()}热门`, '根据技能库推荐'],
          matchScore: 0.75,
        });
      }
    }
    return recs.slice(0, 5);
  }, [recommendationsData, groupedSkills]);

  // 当没有推荐时自动收起推荐区域
  useEffect(() => {
    const hasApiRecs = recommendationsData?.recommendations?.length > 0;
    const hasLocalRecs = localRecommendations.length > 0;
    if (!hasApiRecs && !hasLocalRecs && showRecommendations) {
      setShowRecommendations(false);
    }
  }, [recommendationsData, localRecommendations, showRecommendations]);


  const handleToggle = async (skill: SkillNode) => {
    const next = !skill.enabled;
    const res = await fetch(`/api/skills/${skill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      message.error(d.error || "操作失败");
      return;
    }

    message.success(next ? "已启用" : "已停用");
    refreshSkills();

    // 更新选中技能的状态
    if (selectedSkill?.id === skill.id) {
      setSelectedSkill({ ...skill, enabled: next });
    }
  };

  const handleViewDetail = (skill: SkillNode) => {
    setSelectedSkill(skill);
    setDetailVisible(true);
  };

  useEffect(() => {
    const focusSkillId = searchParams.get("focusSkill");
    if (!focusSkillId || focusedSkillRef.current === focusSkillId || allSkills.length === 0) {
      return;
    }

    focusedSkillRef.current = focusSkillId;
    const skill = allSkills.find((item) => item.id === focusSkillId);
    if (!skill) {
      setSearchParams({}, { replace: true });
      return;
    }

    setSelectedSkill(skill);
    setDetailVisible(true);
    setInspirationDetailVisible(false);
    setSearchText(skill.name);
    setViewMode("grid");
    setSearchParams({}, { replace: true });
  }, [allSkills, searchParams, setSearchParams]);

  const handleImport = async () => {
    let list: unknown[];
    try {
      list = JSON.parse(importJson || "[]");
    } catch {
      message.error("JSON 格式无效");
      return;
    }
    if (!Array.isArray(list)) {
      message.error('请传入数组，如 [{"name":"技能名","description":"描述"}]');
      return;
    }
    try {
      const res = await fetch("/api/skills/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: list }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "导入失败");
        return;
      }
      message.success(`已导入 ${data.added ?? 0} 项`);
      setImportModalOpen(false);
      setImportJson("");
      refreshSkills();
    } catch {
      message.error("请求失败");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStatus("uploading");
    setUploadModalOpen(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, data: response });
          } catch {
            resolve({ status: xhr.status, data: {} });
          }
        });

        xhr.addEventListener("error", () => reject(new Error("上传失败")));
        xhr.addEventListener("abort", () => reject(new Error("上传已取消")));

        xhr.open("POST", "/api/skills/import-file");
        xhr.send(form);
      });

      setUploadStatus("scanning");

      if (data.status < 200 || data.status >= 300) {
        setUploadStatus("error");
        const resp = data.data;
        if (resp.quarantined && resp.report?.length) {
          message.warning(
            `${resp.message ?? "安全扫描未通过"}，已放入隔离区。详情：${resp.report
              .map((r: { code?: string; message?: string }) => r.message || r.code)
              .join("；")}`
          );
        } else {
          message.error(resp.error || resp.message || "导入失败");
        }
        setTimeout(() => setUploadModalOpen(false), 2000);
        return;
      }

      setUploadProgress(100);
      setUploadStatus("done");
      message.success(`已导入：${data.data.name ?? "技能"}`);
      refreshSkills();
      setTimeout(() => setUploadModalOpen(false), 1500);
    } catch (err) {
      setUploadStatus("error");
      message.error("请求失败");
      setTimeout(() => setUploadModalOpen(false), 2000);
    } finally {
      e.target.value = "";
    }
  };

  const handleInstallFromUrl = async () => {
    if (!installUrl.trim()) {
      message.error("请输入 URL");
      return;
    }
    const hideLoading = message.loading("正在安装并做安全扫描…", 0);
    try {
      const res = await fetch("/api/skills/install-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: installUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      hideLoading();
      if (!res.ok) {
        if (data.quarantined && data.report?.length) {
          message.warning(
            `${data.message ?? "安全扫描未通过"}，已放入隔离区。详情：${data.report
              .map((r: { code?: string; message?: string }) => r.message || r.code)
              .join("；")}`
          );
        } else {
          message.error(data.error || data.message || "安装失败");
        }
        return;
      }
      message.success(`已安装：${data.name ?? "技能"}`);
      setUrlModalOpen(false);
      setInstallUrl("");
      refreshSkills();
    } catch {
      hideLoading();
      message.error("请求失败");
    }
  };

  const debouncedRefresh = useDebouncedCallback(
    () => {
      setRefreshing(true);
      refreshSkills();
      setTimeout(() => setRefreshing(false), 500);
    },
    300
  );

  // 同步技能处理函数
  const handleSyncSkills = async () => {
    setSyncModalOpen(true);
    setSyncLoading(true);
    setSyncProgress(null);
    setSyncTaskId(null);

    // 清理旧轮询
    if (syncPollRef.current) {
      clearInterval(syncPollRef.current);
      syncPollRef.current = null;
    }

    try {
      const res = await fetch("/api/skills-sync/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.ok || !data.taskId) {
        message.error(data.error || "启动同步失败");
        setSyncLoading(false);
        return;
      }

      setSyncTaskId(data.taskId);

      // 开始轮询进度
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/skills-sync/sync/status?taskId=${data.taskId}`);
          if (!statusRes.ok) {
            console.error("[SkillsSync] 轮询进度请求失败:", statusRes.status);
            return;
          }
          const statusData = await statusRes.json();

          if (!statusData || statusData.status === "idle") {
            return;
          }

          // 将 task 数据转换为 SyncProgressResult 格式
          const progress: SyncProgressResult = {
            total: statusData.total || 0,
            success: statusData.completed || 0,
            failed: statusData.failed || 0,
            skills: (statusData.skills || []).map((s: any) => ({
              id: s.id,
              name: s.name || s.id,
              status: s.status,
              error: s.error,
            })),
            error: statusData.status === "failed" ? statusData.error : undefined,
          };

          setSyncProgress(progress);

          if (statusData.status === "completed" || statusData.status === "failed") {
            if (syncPollRef.current) {
              clearInterval(syncPollRef.current);
              syncPollRef.current = null;
            }
            setSyncLoading(false);
            refreshSkills();
            if (statusData.failed > 0) {
              message.warning(`同步完成：成功 ${statusData.completed} 个，失败 ${statusData.failed} 个`);
            } else {
              message.success(`同步完成：成功 ${statusData.completed} 个`);
            }
          }
        } catch (e) {
          console.error("[SkillsSync] 轮询进度失败:", e);
        }
      }, 1000);

      syncPollRef.current = poll;
    } catch (error) {
      message.error("同步请求失败");
      setSyncLoading(false);
      setSyncProgress({
        total: 0,
        success: 0,
        failed: 0,
        skills: [],
        error: "请求失败",
      });
    }
  };

  // 关闭同步模态框时清理轮询
  const handleSyncModalClose = () => {
    if (syncPollRef.current) {
      clearInterval(syncPollRef.current);
      syncPollRef.current = null;
    }
    setSyncModalOpen(false);
    setSyncProgress(null);
    setSyncTaskId(null);
  };

  // 获取状态图标和颜色
  const getSyncStatusIcon = (status: SkillSyncStatus['status']) => {
    switch (status) {
      case 'pending':
        return <ClockCircleFilled style={{ color: '#8c8c8c' }} />;
      case 'downloading':
        return <LoadingOutlined style={{ color: '#0066ff' }} />;
      case 'verifying':
        return <LoadingOutlined style={{ color: '#fa8c16' }} />;
      case 'success':
        return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  // 获取状态文本
  const getSyncStatusText = (status: SkillSyncStatus['status']) => {
    switch (status) {
      case 'pending': return '等待中';
      case 'downloading': return '下载中';
      case 'verifying': return '验证中';
      case 'success': return '成功';
      case 'failed': return '失败';
      default: return '';
    }
  };

  return (
    <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", padding: "0 4px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2329', margin: 0, marginBottom: 4 }}>技能中心</h2>
        <p style={{ fontSize: 13, color: '#646a73', margin: 0 }}>管理和发现提升工作效率的AI技能</p>
      </div>

      {/* 技能推荐区域 */}
      {showRecommendations && (
        <div className="sf-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarOutlined style={{ color: '#faad14' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>为你推荐</span>
            </div>
            <Button
              type="text"
              size="small"
              onClick={() => setShowRecommendations(false)}
            >
              收起
            </Button>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {recommendationsLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <div>
                {((recommendationsData?.recommendations as SkillRecommendation[]) || localRecommendations).map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                        {item.matchReasons.join(" · ")}
                      </div>
                      <div style={{
                        height: 4,
                        borderRadius: 2,
                        background: '#f0f0f0',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(Math.round(item.matchScore * 2), 100)}%`,
                          background: '#faad14',
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        const skill = allSkills.find(s => s.id === item.id);
                        if (skill) {
                          setSelectedSkill(skill);
                          setDetailVisible(true);
                        }
                      }}
                    >
                      查看
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div className="sf-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
          <SearchOutlined style={{ color: '#8c8c8c' }} />
          <Input
            placeholder="搜索技能..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            variant="borderless"
            style={{ flex: 1 }}
          />
        </div>
        <button
          className="sf-card"
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: viewMode === 'grid' ? '1px solid #0066ff' : undefined,
            color: viewMode === 'grid' ? '#0066ff' : '#646a73',
            background: viewMode === 'grid' ? '#e6f0ff' : undefined,
          }}
          onClick={() => { setViewMode('grid'); setSelectedCategory('all'); }}
        >
          已安装
        </button>
        <button
          className="sf-card"
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: viewMode === 'inspiration' ? '1px solid #0066ff' : undefined,
            color: viewMode === 'inspiration' ? '#0066ff' : '#646a73',
            background: viewMode === 'inspiration' ? '#e6f0ff' : undefined,
          }}
          onClick={() => { setViewMode('inspiration'); setSelectedCategory('all'); }}
        >
          商店
        </button>
        <button
          className="sf-card"
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: viewMode === 'ai-apps' ? '1px solid #0066ff' : undefined,
            color: viewMode === 'ai-apps' ? '#0066ff' : '#646a73',
            background: viewMode === 'ai-apps' ? '#e6f0ff' : undefined,
          }}
          onClick={() => { setViewMode('ai-apps'); setSelectedCategory('all'); }}
        >
          AI应用管理
        </button>
        <button className="sf-card" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={debouncedRefresh}>
          <ReloadOutlined spin={refreshing} />
        </button>
        <Tooltip title="粘贴 JSON 导入技能">
          <button className="sf-card" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setImportModalOpen(true)}>
            <PlusOutlined />
          </button>
        </Tooltip>
        <Tooltip
          title={
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📦 上传技能文件</div>
              <div>支持格式：<b>.zip</b> 或 <b>.skill</b></div>
              <div style={{ marginTop: 4, color: '#bfbfbf' }}>压缩包根目录须包含 SKILL.md</div>
            </div>
          }
          placement="bottom"
        >
          <button className="sf-card" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => fileInputRef.current?.click()}>
            <UploadOutlined />
          </button>
        </Tooltip>
        <Tooltip
          title={
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>🔗 从 URL 安装技能</div>
              <div>支持：技能压缩包的直接下载链接</div>
              <div style={{ marginTop: 4, color: '#bfbfbf' }}>例：https://example.com/my-skill.zip</div>
            </div>
          }
          placement="bottom"
        >
          <button className="sf-card" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setUrlModalOpen(true)}>
            <LinkOutlined />
          </button>
        </Tooltip>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.skill,application/zip"
        style={{ display: "none" }}
        onChange={handleFileImport}
      />

      {/* 上传进度 Modal */}
      <Modal
        open={uploadModalOpen}
        closable={uploadStatus !== "uploading"}
        footer={null}
        onCancel={() => {
          if (uploadStatus !== "uploading") setUploadModalOpen(false);
        }}
        title="技能导入"
        width={400}
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 14, color: "#1f2329", marginBottom: 16 }}>
            {uploadFileName}
          </div>
          <Progress
            percent={uploadProgress}
            status={uploadStatus === "error" ? "exception" : uploadStatus === "done" ? "success" : "active"}
            strokeColor={uploadStatus === "scanning" ? "#fa8c16" : undefined}
          />
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 12 }}>
            {uploadStatus === "uploading" && "正在上传文件…"}
            {uploadStatus === "scanning" && "正在做安全扫描…"}
            {uploadStatus === "done" && "导入成功！"}
            {uploadStatus === "error" && "导入失败"}
          </div>
        </div>
      </Modal>

      {/* 技能列表 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <div className="sf-card" style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : allSkills.length === 0 ? (
          <Empty
            description="暂无技能"
            style={{ marginTop: 80 }}
          />
        ) : filteredSkills.length === 0 ? (
          <Empty
            description="未找到匹配的技能"
            style={{ marginTop: 80 }}
          />
        ) : viewMode === "ai-apps" ? (
          <AiAppsPage />
        ) : viewMode === "inspiration" ? (
          // 技能广场视图 - 简化显示，所有技能卡片
          <div>
            {/* 类别选择器 - 类似 QClaw 风格 */}
            <div className="sf-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedCategory("all")}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: selectedCategory === "all" ? '#0066ff' : '#f5f5f5',
                    color: selectedCategory === "all" ? '#fff' : '#646a73',
                  }}
                >
                  全部 ({filteredSkills.length})
                </button>
                {FUNCTION_CATEGORIES.map(cat => {
                  const count = groupedSkills[cat.key]?.length || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 4,
                        border: 'none',
                        fontSize: 12,
                        cursor: 'pointer',
                        background: selectedCategory === cat.key ? cat.color : '#f5f5f5',
                        color: selectedCategory === cat.key ? "#fff" : '#646a73',
                      }}
                    >
                      {cat.name.replace("💼 ", "").replace("📚 ", "").replace("📊 ", "").replace("✍️ ", "").replace("🤖 ", "").replace("💻 ", "").replace("🔧 ", "")} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 技能卡片网格 - 类似 QClaw 风格 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {(selectedCategory === "all" ? filteredSkills : groupedSkills[selectedCategory] || []).map(skill => {
                  const category = getSkillCategory(skill);
                  return (
                    <div
                      key={skill.id}
                      className="sf-card"
                      style={{
                        padding: 16,
                        cursor: 'pointer',
                        border: skill.enabled ? `1px solid ${category.color}` : "1px solid #e8ecf1",
                        background: skill.enabled ? `linear-gradient(135deg, ${category.bgColor} 0%, #fff 100%)` : "#fff",
                        boxShadow: skill.enabled ? `0 2px 8px ${category.color}20` : undefined,
                      }}
                      onClick={() => {
                        setSelectedSkill(skill);
                        setInspirationDetailVisible(true);
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: category.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 24,
                          flexShrink: 0,
                        }}>
                          {category.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {skill.name}
                          </div>
                          <span style={{
                            fontSize: 11,
                            marginTop: 4,
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: skill.enabled ? `${category.color}15` : '#f5f5f5',
                            color: skill.enabled ? category.color : '#8c8c8c',
                          }}>
                            {skill.enabled ? "已启用" : "未启用"}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {getSkillDescriptionZh(skill) || skill.description || category.description}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 技能详情弹窗 */}
            <Modal
              open={inspirationDetailVisible && !!selectedSkill}
              onCancel={() => setInspirationDetailVisible(false)}
              footer={null}
              width={480}
              centered
            >
              {selectedSkill && (
                <div style={{ padding: "8px 0" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 28, color: getSkillCategory(selectedSkill).color }}>
                      {getSkillCategory(selectedSkill).icon}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                      {selectedSkill.name}
                    </span>
                  </div>

                  <span style={{
                    fontSize: 12,
                    color: getSkillCategory(selectedSkill).color,
                    background: `${getSkillCategory(selectedSkill).color}15`,
                    padding: '2px 8px',
                    borderRadius: 4,
                    display: 'inline-block',
                    marginBottom: 16,
                  }}>
                    {getSkillCategory(selectedSkill).name}
                  </span>

                  <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    {getSkillDescriptionZh(selectedSkill) || selectedSkill.description || getSkillCategory(selectedSkill).description}
                  </div>

                  {selectedSkill.triggers && selectedSkill.triggers.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                        触发关键词：
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {selectedSkill.triggers.map((trigger, idx) => (
                          <span key={idx} style={{
                            fontSize: 13,
                            color: '#0066ff',
                            background: '#e6f0ff',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>{trigger}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 24, textAlign: "center" }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        // 纯英文格式
                        const skillInfo = selectedSkill.description
                          ? `${selectedSkill.name}: ${selectedSkill.description}`
                          : selectedSkill.name;
                        localStorage.setItem("pending_chat_message", skillInfo);
                        localStorage.setItem("pending_quote_skill", selectedSkill.name);
                        // 触发切换到聊天页面
                        localStorage.setItem("mineecho_switch_to_chat", "true");
                        // 刷新页面以触发 Layout 监听
                        window.location.href = "/";
                        setInspirationDetailVisible(false);
                      }}
                    >
                      开始使用
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        ) : (
          <div>
            {FUNCTION_CATEGORIES.map(category => {
              const skills = groupedSkills[category.key] || [];
              if (skills.length === 0) return null;

              return (
                <div key={category.key} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#646a73', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    {category.name.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim()}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {skills.map(skill => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onToggle={handleToggle}
                        onViewDetail={handleViewDetail}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 技能详情抽屉 */}
      <SkillDetailDrawer
        skill={selectedSkill}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onToggle={() => selectedSkill && handleToggle(selectedSkill)}
      />

      {/* 导入模态框 */}
      <Modal
        title="导入技能"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => {
          setImportModalOpen(false);
          setImportJson("");
        }}
        okText="导入"
      >
        <Typography.Paragraph type="secondary">
          {'粘贴 JSON 数组，每项至少包含 name。示例：[{"name":"技能名","description":"描述"}]'}
        </Typography.Paragraph>
        <Input.TextArea
          rows={6}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"name":"技能名","description":"描述"}]'
        />
      </Modal>

      {/* URL安装模态框 */}
      <Modal
        title="从 URL 安装"
        open={urlModalOpen}
        onOk={handleInstallFromUrl}
        onCancel={() => {
          setUrlModalOpen(false);
          setInstallUrl("");
        }}
        okText="安装"
      >
        <Typography.Paragraph type="secondary">
          输入指向 ZIP 或 .skill 的地址（如 skill.sh 或 GitHub 下载链接），将下载并解析 SKILL.md 后加入技能列表。
        </Typography.Paragraph>
        <Input
          placeholder="https://..."
          value={installUrl}
          onChange={(e) => setInstallUrl(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* 同步技能进度模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SyncOutlined />
            <span>同步技能</span>
          </div>
        }
        open={syncModalOpen}
        onCancel={handleSyncModalClose}
        footer={
          syncProgress ? [
            <Button
              key="close"
              type="primary"
              onClick={handleSyncModalClose}
            >
              关闭
            </Button>,
          ] : [
            <Button
              key="cancel"
              onClick={handleSyncModalClose}
            >
              取消
            </Button>,
          ]
        }
        width={600}
        maskClosable={!syncLoading}
        closable={!syncLoading}
      >
        {syncLoading && !syncProgress && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SyncOutlined spin style={{ fontSize: 32, color: '#0066ff', marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>正在同步技能...</div>
            <div style={{ fontSize: 13, color: '#8c8c8c' }}>
              正在从技能市场获取并下载技能
            </div>
          </div>
        )}

        {syncProgress && (
          <div>
            {/* 进度统计 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>总数量</div>
                <div style={{ fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined />
                  {syncProgress.total}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>成功</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleFilled />
                  {syncProgress.success}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>失败</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: syncProgress.failed > 0 ? '#ff4d4f' : '#8c8c8c', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CloseCircleFilled />
                  {syncProgress.failed}
                </div>
              </div>
            </div>

            {/* 总体进度条 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#f0f0f0',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${syncProgress.total > 0 ? Math.round(((syncProgress.success + syncProgress.failed) / syncProgress.total) * 100) : 0}%`,
                  background: syncProgress.failed > 0 ? '#ff4d4f' : '#0066ff',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {/* 错误提示 */}
            {syncProgress.error && (
              <Alert
                type="warning"
                message="同步完成但有错误"
                description={syncProgress.error}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 技能列表 */}
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
              同步详情：
            </div>
            <div style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              maxHeight: 300,
              overflow: 'auto',
            }}>
              {syncProgress.skills.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {getSyncStatusIcon(item.status)}
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{item.name || item.id}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background:
                      item.status === 'success' ? '#f6ffed' :
                      item.status === 'failed' ? '#fff2f0' :
                      item.status === 'downloading' ? '#e6f0ff' :
                      item.status === 'verifying' ? '#fff7e6' :
                      '#f5f5f5',
                    color:
                      item.status === 'success' ? '#52c41a' :
                      item.status === 'failed' ? '#ff4d4f' :
                      item.status === 'downloading' ? '#0066ff' :
                      item.status === 'verifying' ? '#fa8c16' :
                      '#8c8c8c',
                  }}>
                    {getSyncStatusText(item.status)}
                  </span>
                  {item.error && (
                    <span style={{ fontSize: 12, color: '#ff4d4f', marginLeft: 'auto' }}>
                      {item.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 技能更新详情弹窗 */}
      <SkillUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        onSync={handleSyncSelectedSkills}
      />
    </div>
  );
}

export default SkillsPage;
