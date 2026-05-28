/**
 * MineEcho Memory System - Type Definitions
 * Three-tier memory architecture for AI Companion
 */

// ============================================================================
// Working Memory - Current session (in-memory only)
// ============================================================================

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  skillId?: string;
  skillName?: string;
  attachments?: Attachment[];
  latencyMs?: number;
  tokensUsed?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Context {
  taskType?: string;
  topic?: string;
  urgency?: "low" | "medium" | "high";
  relatedSkills?: string[];
  entities?: Entity[];
}

export interface Entity {
  type: "person" | "project" | "technology" | "skill" | "other";
  name: string;
  confidence: number;
}

export interface WorkingMemory {
  sessionId: string;
  recentMessages: Message[];  // Last 20 messages for context
  currentContext: Context;    // Current task/context
  activeSkills: string[];     // Currently active skills
  createdAt: number;
  lastActivity: number;
}

// ============================================================================
// Short-term Memory - Daily (persisted to localStorage on frontend)
// ============================================================================

export interface Interaction {
  id: string;
  timestamp: number;
  type: "chat" | "skill_invocation" | "preference_indicated" | "task_created";
  content: string;
  skillId?: string;
  skillName?: string;
  outcome?: "success" | "failure" | "partial";
  userFeedback?: "positive" | "negative" | "neutral";
  importance: number; // 0-1, higher = more significant
}

export interface Preference {
  id: string;
  category: PreferenceCategory;
  key: string;
  value: string | number | boolean;
  confidence: number;  // 0-1, how sure we are about this preference
  source: "explicit" | "inferred";
  timestamp: number;
  context?: string;    // What conversation led to this preference
}

export type PreferenceCategory =
  | "response_length"
  | "communication_tone"
  | "technical_depth"
  | "code_style"
  | "output_format"
  | "notification"
  | "other";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  createdAt: number;
  dueAt?: number;
  completedAt?: number;
  relatedSkillId?: string;
}

export interface ShortTermMemory {
  date: string;  // YYYY-MM-DD
  userId: string;
  dailyInteractions: Interaction[];
  learnedPreferences: Preference[];
  pendingTasks: Task[];
  summary?: string;  // AI-generated summary of the day
  lastUpdated: number;
  /** Burnout detection metrics - optional for backward compatibility */
  burnoutMetrics?: DailyBurnoutMetrics;
}

/**
 * Daily burnout metrics for work intensity tracking
 * All fields optional for backward compatibility
 */
export interface DailyBurnoutMetrics {
  /** Total active session duration in minutes */
  totalActiveMinutes: number;
  /** Number of interactions during night hours (22:00-06:00) */
  nightInteractions: number;
  /** Number of interactions on weekend */
  weekendInteractions: number;
  /** Count of high-urgency content detected */
  urgentContentCount: number;
  /** Stress indicators detected in content */
  stressIndicators: string[];
  /** Last updated timestamp */
  lastCalculated: number;
}

// ============================================================================
// Long-term Memory - Cross-session (persisted to backend)
// ============================================================================

export interface UserProfile {
  userId: string;
  workStyle: WorkStyle;
  technicalStack: TechnicalStack;
  domainExpertise: DomainExpertise[];
  frequentlyUsedSkills: SkillUsage[];
  customShortcuts: Shortcut[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface WorkStyle {
  preferredResponseLength: "concise" | "detailed" | "adaptive";
  communicationTone: "formal" | "casual" | "friendly" | "professional";
  peakProductivityHours: number[];  // Hours of day (0-23)
  decisionMakingStyle: "analytical" | "intuitive" | "collaborative";
  codeExplanationStyle?: "step_by_step" | "overview_first" | "direct";
  learningPreference?: "hands_on" | "theory_first" | "mixed";
}

export interface TechnicalStack {
  languages: string[];       // e.g., ["TypeScript", "Python", "Go"]
  frameworks: string[];      // e.g., ["React", "Express", "FastAPI"]
  tools: string[];           // e.g., ["Docker", "Kubernetes", "Git"]
  databases: string[];       // e.g., ["PostgreSQL", "MongoDB", "Redis"]
  platforms: string[];       // e.g., ["AWS", "Azure", "Vercel"]
  // Extended categories for delivery engineers (backward compatible - new fields are optional)
  cloud_products?: string[]; // e.g., ["私有云", "VDI", "OpenStack"]
  storage?: string[];        // e.g., ["分布式存储", "Ceph", "对象存储"]
  networking?: string[];     // e.g., ["负载均衡", "SDN", "专线"]
  ai_ml?: string[];          // e.g., ["GPU集群", "大模型", "MLOps"]
  security_products?: string[]; // e.g., ["防火墙", "堡垒机", "SIEM"]
  delivery_ops?: string[];   // e.g., ["方案设计", "自动化运维"]
  proficiency: Record<string, "beginner" | "intermediate" | "advanced" | "expert">;
}

export interface DomainExpertise {
  domain: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  topics: string[];
  evidence: string[];  // Conversation snippets that demonstrate this
}

export interface SkillUsage {
  skillId: string;
  skillName: string;
  totalUses: number;
  lastUsedAt: number;
  averageSuccessRate: number;
  favoriteParameters?: Record<string, unknown>;
  usageByHour: Record<number, number>;  // Hour -> count
  usageByDay: Record<string, number>;   // Day of week -> count
  failureReasons?: string[];
  averageLatencyMs?: number;
  averageTokensPerCall?: number;
  userFeedbackSummary?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface Shortcut {
  id: string;
  trigger: string;         // e.g., "/daily"
  action: string;          // e.g., "Generate daily report"
  skillId?: string;
  parameters?: Record<string, unknown>;
  createdAt: number;
  useCount: number;
}

export interface SkillPattern {
  userId: string;
  patterns: SkillUsage[];
  preferredCategories: string[];
  commonWorkflows: Workflow[];
  peakUsageHours: number[];
  updatedAt: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  frequency: number;  // How often this workflow is used
  lastUsedAt: number;
}

export interface WorkflowStep {
  skillId: string;
  skillName: string;
  parameters?: Record<string, unknown>;
}

export interface KnowledgeNode {
  id: string;
  type: "concept" | "skill" | "project" | "person" | "technology" | "document";
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

export interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  relation: "uses" | "related_to" | "part_of" | "depends_on" | "similar_to" | "learned_from";
  strength: number;  // 0-1
  evidence: string[];
  createdAt: number;
}

export interface KnowledgeGraph {
  userId: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  lastUpdated: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "paused" | "archived";
  startDate: number;
  endDate?: number;
  technologies: string[];
  skillsUsed: string[];
  keyOutcomes?: string[];
  relatedConversations: string[];  // Session IDs
}

export interface LongTermMemory {
  userId: string;
  userProfile: UserProfile;
  skillUsagePatterns: SkillPattern;
  knowledgeGraph: KnowledgeGraph;
  projectHistory: Project[];
  lastUpdated: number;
  /** Burnout risk history - optional for backward compatibility */
  burnoutHistory?: BurnoutHistory;
  /** Background review insights - optional for backward compatibility */
  insights?: Array<{ content: string; source: string; timestamp: number }>;
}

/**
 * Burnout risk tracking history
 * Stored in long-term memory for trend analysis
 */
export interface BurnoutHistory {
  /** Daily risk scores (0-100, higher = more risk) */
  dailyScores: Array<{
    date: string;
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
  }>;
  /** Consecutive high-risk days count */
  consecutiveHighRiskDays: number;
  /** Last care message sent timestamp */
  lastCareMessageAt?: number;
  /** User's preferred care message frequency */
  careFrequency: "daily" | "weekly" | "only_critical";
  /** Whether user has opted out of burnout detection */
  optedOut: boolean;
  lastUpdated: number;
}

// ============================================================================
// Learning Data
// ============================================================================

export interface LearningData {
  type: "feedback" | "behavior" | "correction" | "preference_explicit";
  category: PreferenceCategory;
  content: string;
  context?: string;
  timestamp: number;
  sessionId?: string;
  messageId?: string;
}

export interface ProfileUpdate {
  field: string;
  oldValue?: unknown;
  newValue: unknown;
  confidence: number;
  source: "explicit" | "inferred";
  timestamp: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GetProfileResponse {
  profile: UserProfile;
  suggestions?: string[];
}

export interface UpdateProfileRequest {
  workStyle?: Partial<WorkStyle>;
  technicalStack?: Partial<TechnicalStack>;
  customShortcuts?: Shortcut[];
}

export interface GetShortTermMemoryResponse {
  memory: ShortTermMemory;
  stats: {
    totalInteractions: number;
    preferencesLearned: number;
    pendingTasks: number;
  };
}

export interface LearnRequest {
  data: LearningData;
}

export interface LearnResponse {
  success: boolean;
  updates?: ProfileUpdate[];
  message?: string;
}

export interface GetSkillPatternsResponse {
  patterns: SkillUsage[];
  workflows: Workflow[];
  insights: string[];
  recommendations: string[];
}

// ============================================================================
// Memory Manager Interfaces
// ============================================================================

export interface IWorkingMemoryManager {
  getSession(sessionId: string): WorkingMemory | undefined;
  createSession(sessionId: string): WorkingMemory;
  addMessage(sessionId: string, message: Omit<Message, "id" | "timestamp">): Message;
  updateContext(sessionId: string, context: Partial<Context>): void;
  setActiveSkills(sessionId: string, skillIds: string[]): void;
  clearSession(sessionId: string): void;
  getRecentMessages(sessionId: string, count?: number): Message[];
  cleanupInactiveSessions(maxInactiveMs?: number): void;
}

export interface IShortTermMemoryManager {
  getTodayMemory(userId: string): Promise<ShortTermMemory>;
  addInteraction(userId: string, interaction: Omit<Interaction, "id" | "timestamp" | "importance">, context?: { isCorrection?: boolean; isComplexTask?: boolean; isFirstTimeSkill?: boolean; hasNegativeFeedback?: boolean }): Promise<Interaction>;
  addPreference(userId: string, preference: Omit<Preference, "id" | "timestamp">): Promise<Preference>;
  addTask(userId: string, task: Omit<Task, "id" | "createdAt">): Promise<Task>;
  updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null>;
  completeTask(userId: string, taskId: string): Promise<Task | null>;
  clearDay(userId: string, date?: string): Promise<void>;
  getStats(userId: string): Promise<{ totalInteractions: number; preferencesLearned: number; pendingTasks: number }>;
}

export interface ILongTermMemoryManager {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  getSkillPatterns(userId: string): Promise<SkillPattern | null>;
  recordSkillUsage(
    userId: string,
    skillId: string,
    skillName: string,
    success: boolean,
    details?: {
      failureReason?: string;
      latencyMs?: number;
      tokens?: number;
      feedback?: "positive" | "negative" | "neutral";
    }
  ): Promise<void>;
  getKnowledgeGraph(userId: string): Promise<KnowledgeGraph | null>;
  addKnowledgeNode(userId: string, node: Omit<KnowledgeNode, "id" | "createdAt">): Promise<KnowledgeNode>;
  addKnowledgeEdge(userId: string, edge: Omit<KnowledgeEdge, "createdAt">): Promise<void>;
  getProjects(userId: string): Promise<Project[]>;
  addProject(userId: string, project: Omit<Project, "id">): Promise<Project>;
  updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<Project>;
  /** Burnout history methods */
  getBurnoutHistory(userId: string): Promise<BurnoutHistory | null>;
  updateBurnoutHistory(userId: string, updates: Partial<BurnoutHistory>): Promise<BurnoutHistory>;
}

export interface IUserProfileLearner {
  learnFromInteraction(userId: string, interaction: Interaction): Promise<ProfileUpdate[]>;
  learnFromFeedback(userId: string, feedback: LearningData): Promise<ProfileUpdate[]>;
  analyzeTechnicalStack(userId: string, messages: Message[]): Promise<string[]>;
  detectDomainExpertise(userId: string, messages: Message[]): Promise<DomainExpertise[]>;
  generateInsights(userId: string): Promise<string[]>;
}
