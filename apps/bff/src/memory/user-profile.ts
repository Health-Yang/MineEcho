/**
 * User Profile Learner
 * Automatically learns user preferences and profile from interactions
 * - Detects work style preferences
 * - Identifies technical stack
 * - Discovers domain expertise
 * - Analyzes skill usage patterns
 */

import type {
  Message,
  Interaction,
  LearningData,
  UserProfile,
  ProfileUpdate,
  DomainExpertise,
  IUserProfileLearner,
} from "./types.js";
import { longTermMemoryManager } from "./long-term-memory.js";
import { shortTermMemoryManager } from "./short-term-memory.js";

// Technical keywords for stack detection
const TECH_KEYWORDS: Record<string, string[]> = {
  languages: [
    "javascript", "typescript", "python", "go", "golang", "rust", "java",
    "cpp", "c++", "c#", "csharp", "ruby", "php", "swift", "kotlin",
    "scala", "elixir", "clojure", "haskell", "lua", "perl", "r", "matlab",
    "shell", "bash", "powershell", "sql", "html", "css", "sass", "less",
  ],
  frameworks: [
    "react", "vue", "angular", "svelte", "solidjs", "nextjs", "next.js",
    "nuxt", "nuxtjs", "express", "fastapi", "django", "flask", "spring",
    "laravel", "rails", "aspnet", "blazor", "flutter", "react native",
    "electron", "tauri", "nestjs", "nestjs", "hapi", "koa", "fastify",
  ],
  tools: [
    "docker", "kubernetes", "k8s", "git", "github", "gitlab", "bitbucket",
    "jenkins", "gitlab ci", "github actions", "circleci", "travis",
    "webpack", "vite", "rollup", "parcel", "esbuild", "turbopack",
    "npm", "yarn", "pnpm", "bun", "make", "cmake", "ninja",
  ],
  databases: [
    "postgresql", "postgres", "mysql", "mariadb", "mongodb", "mongo",
    "redis", "sqlite", "elasticsearch", "cassandra", "dynamodb",
    "firebase", "supabase", "prisma", "typeorm", "sequelize",
    "clickhouse", "influxdb", "timescaledb", "neo4j", "couchdb",
  ],
  platforms: [
    "aws", "amazon web services", "azure", "gcp", "google cloud",
    "vercel", "netlify", "heroku", "digitalocean", "linode",
    "cloudflare", "fastly", "akamai", "terraform", "pulumi",
  ],
  // Delivery engineer focused - Cloud Products
  cloud_products: [
    "私有云", "private cloud", "公有云", "public cloud", "混合云", "hybrid cloud",
    "超融合", "hci", "hyper-converged", "虚拟化", "virtualization",
    "桌面云", "vdi", "桌面虚拟化", "云桌面", "桌面即服务", "daas",
    "容器云", "容器平台", "openshift", "rancher", "vmware", "vsphere",
    "openstack", "华为云", "阿里云", "腾讯云", "天翼云", "移动云",
  ],
  // Delivery engineer focused - Storage
  storage: [
    "存储", "storage", "对象存储", "object storage", "oss", "s3",
    "块存储", "block storage", "文件存储", "nas", "san", "分布式存储",
    "ceph", "minio", "glusterfs", "hdfs", "数据湖", "data lake",
    "备份", "backup", "容灾", "dr", "灾难恢复", "snapshot", "快照",
    "数据迁移", "data migration", "存储池", "lun", "volume", "卷",
  ],
  // Delivery engineer focused - Networking
  networking: [
    "负载均衡", "load balancer", "lb", "slb", "nginx", "lvs", "haproxy",
    "sdn", "软件定义网络", "software defined network", "vpc", "虚拟私有云",
    "子网", "subnet", "路由", "router", "防火墙", "firewall", "waf",
    "vpn", "专线", "direct connect", "cdn", "dns", "dhcp", "nat",
    "网络虚拟化", "overlay", "underlay", "vxlan", "gre", "ipsec",
    "sdn控制器", "网络策略", "安全组", "security group", "acl",
  ],
  // Delivery engineer focused - AI/ML Infrastructure
  ai_ml: [
    "ai", "人工智能", "artificial intelligence", "机器学习", "machine learning",
    "深度学习", "deep learning", "大模型", "llm", "大语言模型",
    "gpu", "cuda", "nvidia", "tesla", "a100", "h100", "v100",
    "模型训练", "model training", "推理", "inference", "模型部署",
    "tensorflow", "pytorch", "paddlepaddle", "mindspore", "onnx",
    "kubernetes gpu", "gpu调度", "算力平台", "ai平台", "模型服务",
    "向量数据库", "vector database", "milvus", "faiss", "pinecone",
  ],
  // Delivery engineer focused - Security Products
  security_products: [
    "防火墙", "firewall", "ngfw", "下一代防火墙", "utm", "入侵检测", "ids",
    "入侵防御", "ips", "堡垒机", "bastion", "跳板机", "运维审计",
    "日志审计", "siem", "soc", "安全运营中心", "漏洞扫描", "漏扫",
    "edr", "终端检测响应", "杀毒软件", "防病毒", "antivirus",
    "数据加密", "加密机", "hsm", "kms", "密钥管理", "证书管理",
    "零信任", "zero trust", "sase", "安全访问服务边缘", "态势感知",
    "等保", "等级保护", "密评", "密码评测", "合规", "compliance",
    "身份认证", "iam", "4a", "统一认证", "sso", "多因素认证", "mfa",
  ],
  // Delivery engineer focused - Delivery & Operations
  delivery_ops: [
    "交付", "delivery", "实施", "implementation", "部署", "deployment",
    "方案设计", "solution design", "架构设计", "architecture design",
    "lld", "详细设计", "详细设计文档", "low level design",
    "hld", "概要设计", "high level design", "poc", "概念验证",
    "割接", "migration", "升级", "upgrade", "回滚", "rollback",
    "巡检", "inspection", "监控", "monitoring", "告警", "alerting",
    "运维", "operations", "devops", "sre", "自动化运维", "智能运维",
    "配置管理", "configuration management", "cmdb", "变更管理", "change management",
  ],
};

// Feature flag for precompiled regex optimization
const ENABLE_PRECOMPILED_REGEX = process.env.ENABLE_PRECOMPILED_REGEX !== "false";

// Maximum cache size to prevent memory leaks
const MAX_REGEX_CACHE_SIZE = 1000;

/**
 * Check if a keyword contains Chinese characters
 */
function isChineseKeyword(keyword: string): boolean {
  return /[\u4e00-\u9fa5]/.test(keyword);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(keyword: string): string {
  return keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Precompiled regex pattern for a keyword
 */
interface PrecompiledPattern {
  keyword: string;
  regex: RegExp;
  isChinese: boolean;
}

/**
 * Precompiled category with all its patterns
 */
interface PrecompiledCategory {
  category: string;
  patterns: PrecompiledPattern[];
}

/**
 * LRU Cache entry for dynamic regex compilation
 */
interface RegexCacheEntry {
  regex: RegExp;
  lastUsed: number;
}

// Precompile all regex patterns at module load time (if enabled)
const PRECOMPILED_PATTERNS: PrecompiledCategory[] = ENABLE_PRECOMPILED_REGEX
  ? Object.entries(TECH_KEYWORDS).map(([category, keywords]) => ({
      category,
      patterns: keywords.map((keyword) => {
        const isChinese = isChineseKeyword(keyword);
        const escapedKeyword = escapeRegex(keyword);
        const pattern = isChinese ? escapedKeyword : `\\b${escapedKeyword}\\b`;
        return {
          keyword,
          regex: new RegExp(pattern, "i"),
          isChinese,
        };
      }),
    }))
  : [];

// LRU Cache for dynamic regex compilation (when precompilation is disabled)
class RegexCache {
  private cache = new Map<string, RegexCacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(keyword: string): RegExp | undefined {
    const entry = this.cache.get(keyword);
    if (entry) {
      entry.lastUsed = Date.now();
      return entry.regex;
    }
    return undefined;
  }

  set(keyword: string, regex: RegExp): void {
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used entry
      let lruKey: string | undefined;
      let lruTime = Infinity;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastUsed < lruTime) {
          lruTime = entry.lastUsed;
          lruKey = key;
        }
      }
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    this.cache.set(keyword, { regex, lastUsed: Date.now() });
  }
}

// Global regex cache instance (only used when precompilation is disabled)
const regexCache = new RegexCache(MAX_REGEX_CACHE_SIZE);

/**
 * Get or create a regex for keyword matching
 * Uses precompiled patterns if enabled, otherwise uses LRU cache
 */
function getKeywordRegex(keyword: string): RegExp {
  if (ENABLE_PRECOMPILED_REGEX) {
    // This should not happen if precompilation is enabled,
    // but we keep it as a fallback
    const isChinese = isChineseKeyword(keyword);
    const escapedKeyword = escapeRegex(keyword);
    const pattern = isChinese ? escapedKeyword : `\\b${escapedKeyword}\\b`;
    return new RegExp(pattern, "i");
  }

  // Check cache first
  const cached = regexCache.get(keyword);
  if (cached) {
    return cached;
  }

  // Compile new regex and cache it
  const isChinese = isChineseKeyword(keyword);
  const escapedKeyword = escapeRegex(keyword);
  const pattern = isChinese ? escapedKeyword : `\\b${escapedKeyword}\\b`;
  const regex = new RegExp(pattern, "i");
  regexCache.set(keyword, regex);
  return regex;
}

// Domain keywords for expertise detection
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "frontend": ["react", "vue", "angular", "css", "ui", "ux", "dom", "browser", "responsive"],
  "backend": ["api", "server", "database", "rest", "graphql", "microservices"],
  "devops": ["docker", "kubernetes", "ci/cd", "deployment", "infrastructure", "terraform"],
  "machine-learning": ["ml", "ai", "model", "training", "neural", "tensorflow", "pytorch"],
  "data-engineering": ["etl", "pipeline", "data warehouse", "spark", "hadoop", "kafka"],
  "security": ["security", "auth", "oauth", "jwt", "encryption", "vulnerability"],
  "mobile": ["ios", "android", "react native", "flutter", "swift", "kotlin"],
  "cloud": ["aws", "azure", "gcp", "serverless", "lambda", "cloud functions"],
  // Delivery engineer domains - Cloud Products
  "cloud-delivery": [
    "私有云", "公有云", "混合云", "超融合", "虚拟化", "容器云", "openstack",
    "vmware", "vsphere", "桌面云", "vdi", "云桌面", "云迁移", "上云",
    "交付", "部署", "实施", "cloud delivery", "云交付",
  ],
  // Delivery engineer domains - Network Infrastructure
  "network-delivery": [
    "负载均衡", "网络架构", "sdn", "网络虚拟化", "vpc", "专线", "cdn",
    "网络交付", "网络部署", "网络割接", "网络迁移", "网络优化",
    "网络方案", "网络设计", "network delivery", "lb", "防火墙部署",
  ],
  // Delivery engineer domains - Storage Solutions
  "storage-delivery": [
    "存储架构", "分布式存储", "对象存储", "块存储", "文件存储",
    "存储交付", "存储迁移", "数据迁移", "存储部署", "备份方案",
    "容灾方案", "存储设计", "ceph", "san", "nas", "data lake",
  ],
  // Delivery engineer domains - AI Infrastructure
  "ai-infrastructure": [
    "ai平台", "gpu集群", "算力平台", "大模型部署", "模型训练",
    "ai交付", "aiops", "智能运维", "推理平台", "模型服务",
    "向量数据库", "ai基础设施", "mlops", "ai platform",
  ],
  // Delivery engineer domains - Enterprise Security
  "security-delivery": [
    "安全架构", "安全交付", "等保", "密评", "合规", "安全加固",
    "防火墙部署", "堡垒机", "安全审计", "零信任", "sase",
    "态势感知", "soc", "siem", "edr", "安全方案设计", "security architecture",
  ],
  // Delivery engineer domains - Project & Consulting
  "solution-consulting": [
    "方案设计", "架构设计", "lld", "详细设计", "hld", "概要设计",
    "poc", "概念验证", "技术咨询", "售前", "需求分析", "solution design",
    "技术方案", "实施方案", "交付方案", "咨询", "consulting",
  ],
};

class UserProfileLearner implements IUserProfileLearner {
  /**
   * Learn from a single interaction
   * 降低触发门槛，让纯Q&A对话也能触发学习
   */
  async learnFromInteraction(
    userId: string,
    interaction: Interaction
  ): Promise<ProfileUpdate[]> {
    const updates: ProfileUpdate[] = [];

    // Learn from chat messages (包括纯Q&A对话，不只是技能调用)
    if (interaction.type === "chat" || interaction.type === "skill_invocation") {
      // Analyze content for technical stack
      const techStack = await this.analyzeTechnicalStackFromContent(userId, interaction.content);
      if (techStack.length > 0) {
        updates.push({
          field: "technicalStack",
          newValue: techStack,
          // 降低置信度门槛，让更多内容能触发学习
          confidence: 0.4,
          source: "inferred",
          timestamp: Date.now(),
        });

        // 同时添加到短期记忆，修复统计bug
        await shortTermMemoryManager.addPreference(userId, {
          category: "technical_depth",
          key: "detected_tech_stack",
          value: techStack.join(", "),
          confidence: 0.4,
          source: "inferred",
          context: `从对话中检测到技术栈: ${techStack.join(", ")}`,
        });
      }

      // Detect domain expertise
      const domains = await this.detectDomainExpertiseFromContent(userId, interaction.content);
      if (domains.length > 0) {
        updates.push({
          field: "domainExpertise",
          newValue: domains,
          // 降低置信度门槛
          confidence: 0.35,
          source: "inferred",
          timestamp: Date.now(),
        });

        // 保存到长期记忆
        for (const domain of domains) {
          const profile = await longTermMemoryManager.getUserProfile(userId);
          if (profile) {
            const existing = profile.domainExpertise.find(d => d.domain === domain.domain);
            if (!existing) {
              profile.domainExpertise.push(domain);
              await longTermMemoryManager.updateUserProfile(userId, { domainExpertise: profile.domainExpertise });
            }
          }
        }

        // 同时添加到短期记忆，修复统计bug
        for (const domain of domains) {
          await shortTermMemoryManager.addPreference(userId, {
            category: "other",
            key: `domain_${domain.domain}`,
            value: domain.level,
            confidence: 0.35,
            source: "inferred",
            context: `检测到领域专业知识: ${domain.domain} (${domain.level})`,
          });
        }
      }
    }

    // Learn from explicit preference indication
    if (interaction.type === "preference_indicated") {
      // This would be more specific based on the content
      const preference = this.parsePreferenceFromContent(interaction.content);
      if (preference) {
        await shortTermMemoryManager.addPreference(userId, preference);
      }
    }

    return updates;
  }

  /**
   * Learn from explicit feedback
   */
  async learnFromFeedback(
    userId: string,
    feedback: LearningData
  ): Promise<ProfileUpdate[]> {
    const updates: ProfileUpdate[] = [];

    switch (feedback.type) {
      case "feedback":
        // User gave explicit feedback on a response
        if (feedback.category === "response_length") {
          const length = this.inferResponseLengthPreference(feedback.content);
          if (length) {
            const profile = await longTermMemoryManager.updateWorkStyle(userId, {
              preferredResponseLength: length,
            });
            updates.push({
              field: "workStyle.preferredResponseLength",
              newValue: length,
              confidence: 0.9,
              source: "explicit",
              timestamp: Date.now(),
            });
          }
        }
        break;

      case "correction":
        // User corrected something - high confidence learning
        if (feedback.category === "technical_depth") {
          const depth = this.inferTechnicalDepth(feedback.content);
          // Store as preference
          await shortTermMemoryManager.addPreference(userId, {
            category: "technical_depth",
            key: "preferred_depth",
            value: depth,
            confidence: 0.9,
            source: "explicit",
            context: feedback.context,
          });
        }
        break;

      case "preference_explicit":
        // User explicitly stated a preference
        const explicitUpdate = await this.handleExplicitPreference(userId, feedback);
        if (explicitUpdate) {
          updates.push(explicitUpdate);
        }
        break;

      case "behavior":
        // Learn from observed behavior
        const behaviorUpdates = await this.learnFromBehavior(userId, feedback);
        updates.push(...behaviorUpdates);
        break;
    }

    return updates;
  }

  /**
   * Analyze messages to detect technical stack
   */
  async analyzeTechnicalStack(userId: string, messages: Message[]): Promise<string[]> {
    const detectedTech = new Set<string>();

    for (const message of messages) {
      const content = message.content.toLowerCase();

      if (ENABLE_PRECOMPILED_REGEX) {
        // Use precompiled patterns for better performance
        for (const { category, patterns } of PRECOMPILED_PATTERNS) {
          for (const { keyword, regex } of patterns) {
            if (regex.test(content)) {
              detectedTech.add(keyword);

              // Add to user's technical stack
              await longTermMemoryManager.addTechnicalSkill(
                userId,
                category as keyof UserProfile["technicalStack"],
                keyword
              );
            }
          }
        }
      } else {
        // Fallback to dynamic regex compilation with LRU cache
        for (const [category, keywords] of Object.entries(TECH_KEYWORDS)) {
          for (const keyword of keywords) {
            const regex = getKeywordRegex(keyword);
            if (regex.test(content)) {
              detectedTech.add(keyword);

              // Add to user's technical stack
              await longTermMemoryManager.addTechnicalSkill(
                userId,
                category as keyof UserProfile["technicalStack"],
                keyword
              );
            }
          }
        }
      }
    }

    return Array.from(detectedTech);
  }

  /**
   * Analyze content for technical stack (single message version)
   */
  private async analyzeTechnicalStackFromContent(
    userId: string,
    content: string
  ): Promise<string[]> {
    const detectedTech = new Set<string>();
    const lowerContent = content.toLowerCase();

    if (ENABLE_PRECOMPILED_REGEX) {
      // Use precompiled patterns for better performance
      for (const { category, patterns } of PRECOMPILED_PATTERNS) {
        for (const { keyword, regex } of patterns) {
          if (regex.test(lowerContent)) {
            detectedTech.add(keyword);
            await longTermMemoryManager.addTechnicalSkill(
              userId,
              category as keyof UserProfile["technicalStack"],
              keyword
            );
          }
        }
      }
    } else {
      // Fallback to dynamic regex compilation with LRU cache
      for (const [category, keywords] of Object.entries(TECH_KEYWORDS)) {
        for (const keyword of keywords) {
          const regex = getKeywordRegex(keyword);
          if (regex.test(lowerContent)) {
            detectedTech.add(keyword);
            await longTermMemoryManager.addTechnicalSkill(
              userId,
              category as keyof UserProfile["technicalStack"],
              keyword
            );
          }
        }
      }
    }

    return Array.from(detectedTech);
  }

  /**
   * Detect domain expertise from messages
   */
  async detectDomainExpertise(userId: string, messages: Message[]): Promise<DomainExpertise[]> {
    const domainScores: Record<string, { score: number; topics: Set<string>; evidence: string[] }> = {};

    for (const message of messages) {
      if (message.role !== "user") continue;

      const content = message.content.toLowerCase();

      for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            if (!domainScores[domain]) {
              domainScores[domain] = { score: 0, topics: new Set(), evidence: [] };
            }
            domainScores[domain].score += 1;
            domainScores[domain].topics.add(keyword);
            if (domainScores[domain].evidence.length < 3) {
              domainScores[domain].evidence.push(message.content.slice(0, 200));
            }
          }
        }
      }
    }

    // Convert to expertise records
    const expertise: DomainExpertise[] = [];
    for (const [domain, data] of Object.entries(domainScores)) {
      if (data.score >= 2) {
        let level: DomainExpertise["level"] = "beginner";
        if (data.score >= 10) level = "expert";
        else if (data.score >= 6) level = "advanced";
        else if (data.score >= 3) level = "intermediate";

        expertise.push({
          domain,
          level,
          topics: Array.from(data.topics),
          evidence: data.evidence,
        });
      }
    }

    return expertise;
  }

  /**
   * Detect domain expertise from single content
   */
  private async detectDomainExpertiseFromContent(
    userId: string,
    content: string
  ): Promise<DomainExpertise[]> {
    const lowerContent = content.toLowerCase();
    const matchedDomains: Record<string, { topics: Set<string>; evidence: string }> = {};

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          if (!matchedDomains[domain]) {
            matchedDomains[domain] = { topics: new Set(), evidence: content.slice(0, 200) };
          }
          matchedDomains[domain].topics.add(keyword);
        }
      }
    }

    return Object.entries(matchedDomains).map(([domain, data]) => ({
      domain,
      level: "beginner" as const,
      topics: Array.from(data.topics),
      evidence: [data.evidence],
    }));
  }

  /**
   * Generate insights about the user based on their profile
   */
  async generateInsights(userId: string): Promise<string[]> {
    const insights: string[] = [];
    const profile = await longTermMemoryManager.getUserProfile(userId);
    const skillPatterns = await longTermMemoryManager.getSkillPatterns(userId);

    if (!profile) return insights;

    // Work style insights
    if (profile.workStyle.preferredResponseLength === "concise") {
      insights.push("User prefers concise, to-the-point responses");
    } else if (profile.workStyle.preferredResponseLength === "detailed") {
      insights.push("User appreciates detailed, comprehensive explanations");
    }

    if (profile.workStyle.communicationTone === "casual") {
      insights.push("User prefers a casual, friendly communication style");
    } else if (profile.workStyle.communicationTone === "formal") {
      insights.push("User prefers formal, professional communication");
    }

    // Technical stack insights
    const totalTech =
      profile.technicalStack.languages.length +
      profile.technicalStack.frameworks.length +
      profile.technicalStack.tools.length;

    if (totalTech > 10) {
      insights.push(`User has a diverse technical stack with ${totalTech}+ technologies`);
    }

    if (profile.technicalStack.languages.length > 0) {
      insights.push(`Primary languages: ${profile.technicalStack.languages.slice(0, 3).join(", ")}`);
    }

    // Skill usage insights
    if (skillPatterns) {
      const totalUses = skillPatterns.patterns.reduce((sum, p) => sum + p.totalUses, 0);
      if (totalUses > 50) {
        insights.push(`Heavy skill user with ${totalUses} total invocations`);
      }

      const topSkills = skillPatterns.patterns
        .sort((a, b) => b.totalUses - a.totalUses)
        .slice(0, 3);

      if (topSkills.length > 0) {
        insights.push(`Most used skills: ${topSkills.map((s) => s.skillName).join(", ")}`);
      }
    }

    // Domain expertise insights
    const advancedDomains = profile.domainExpertise.filter(
      (d) => d.level === "advanced" || d.level === "expert"
    );
    if (advancedDomains.length > 0) {
      insights.push(`Expertise areas: ${advancedDomains.map((d) => d.domain).join(", ")}`);
    }

    // Peak productivity insights
    if (profile.workStyle.peakProductivityHours.length > 0) {
      const hours = profile.workStyle.peakProductivityHours;
      insights.push(`Peak productivity hours: ${hours.join(", ")}:00`);
    }

    return insights;
  }

  /**
   * Parse preference from content
   */
  private parsePreferenceFromContent(content: string) {
    const lowerContent = content.toLowerCase();

    // Response length preferences
    if (/short|brief|concise|quick|tl;dr/.test(lowerContent)) {
      return {
        category: "response_length" as const,
        key: "preferred_length",
        value: "concise",
        confidence: 0.7,
        source: "explicit" as const,
        context: content.slice(0, 100),
      };
    }

    if (/detailed|in-depth|comprehensive|thorough/.test(lowerContent)) {
      return {
        category: "response_length" as const,
        key: "preferred_length",
        value: "detailed",
        confidence: 0.7,
        source: "explicit" as const,
        context: content.slice(0, 100),
      };
    }

    // Communication tone
    if (/casual|friendly|relaxed|informal/.test(lowerContent)) {
      return {
        category: "communication_tone" as const,
        key: "preferred_tone",
        value: "casual",
        confidence: 0.7,
        source: "explicit" as const,
        context: content.slice(0, 100),
      };
    }

    if (/formal|professional|business/.test(lowerContent)) {
      return {
        category: "communication_tone" as const,
        key: "preferred_tone",
        value: "formal",
        confidence: 0.7,
        source: "explicit" as const,
        context: content.slice(0, 100),
      };
    }

    return null;
  }

  /**
   * Infer response length preference from feedback
   */
  private inferResponseLengthPreference(content: string): "concise" | "detailed" | "adaptive" | null {
    const lowerContent = content.toLowerCase();

    if (/too long|verbose|wordy|shorter|brief|concise/.test(lowerContent)) {
      return "concise";
    }

    if (/too short|more detail|expand|elaborate|comprehensive/.test(lowerContent)) {
      return "detailed";
    }

    return null;
  }

  /**
   * Infer technical depth preference
   */
  private inferTechnicalDepth(content: string): "basic" | "intermediate" | "advanced" {
    const lowerContent = content.toLowerCase();

    if (/simple|basic|beginner|easy|high.level/.test(lowerContent)) {
      return "basic";
    }

    if (/advanced|expert|deep|low.level|implementation/.test(lowerContent)) {
      return "advanced";
    }

    return "intermediate";
  }

  /**
   * Handle explicit preference statement
   */
  private async handleExplicitPreference(
    userId: string,
    feedback: LearningData
  ): Promise<ProfileUpdate | null> {
    const content = feedback.content.toLowerCase();

    // Check for response length preference
    if (content.includes("response") || content.includes("answer")) {
      if (content.includes("short") || content.includes("brief")) {
        await longTermMemoryManager.updateWorkStyle(userId, {
          preferredResponseLength: "concise",
        });
        return {
          field: "workStyle.preferredResponseLength",
          newValue: "concise",
          confidence: 0.95,
          source: "explicit",
          timestamp: Date.now(),
        };
      }

      if (content.includes("detailed") || content.includes("long")) {
        await longTermMemoryManager.updateWorkStyle(userId, {
          preferredResponseLength: "detailed",
        });
        return {
          field: "workStyle.preferredResponseLength",
          newValue: "detailed",
          confidence: 0.95,
          source: "explicit",
          timestamp: Date.now(),
        };
      }
    }

    // Check for tone preference
    if (content.includes("tone") || content.includes("style")) {
      if (content.includes("casual") || content.includes("friendly")) {
        await longTermMemoryManager.updateWorkStyle(userId, {
          communicationTone: "casual",
        });
        return {
          field: "workStyle.communicationTone",
          newValue: "casual",
          confidence: 0.95,
          source: "explicit",
          timestamp: Date.now(),
        };
      }

      if (content.includes("formal") || content.includes("professional")) {
        await longTermMemoryManager.updateWorkStyle(userId, {
          communicationTone: "formal",
        });
        return {
          field: "workStyle.communicationTone",
          newValue: "formal",
          confidence: 0.95,
          source: "explicit",
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  /**
   * Learn from observed behavior
   */
  private async learnFromBehavior(
    userId: string,
    feedback: LearningData
  ): Promise<ProfileUpdate[]> {
    const updates: ProfileUpdate[] = [];

    // Detect peak productivity hours from usage patterns
    if (feedback.category === "notification") {
      const hour = new Date(feedback.timestamp).getHours();
      const profile = await longTermMemoryManager.getUserProfile(userId);

      if (profile) {
        const currentHours = new Set(profile.workStyle.peakProductivityHours);
        currentHours.add(hour);

        // Keep only top 6 most frequent hours
        const sortedHours = Array.from(currentHours).sort((a, b) => a - b);

        if (sortedHours.length > 6) {
          // This is simplified - in reality we'd track frequency
          await longTermMemoryManager.updateWorkStyle(userId, {
            peakProductivityHours: sortedHours.slice(0, 6),
          });
          updates.push({
            field: "workStyle.peakProductivityHours",
            newValue: sortedHours.slice(0, 6),
            confidence: 0.5,
            source: "inferred",
            timestamp: Date.now(),
          });
        }
      }
    }

    return updates;
  }
}

// Export singleton instance
export const userProfileLearner = new UserProfileLearner();

// Export class for testing
export { UserProfileLearner };
