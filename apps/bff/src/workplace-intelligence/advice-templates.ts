/**
 * Workplace Intelligence System - Advice Templates
 * 职场建议模板库
 *
 * 为不同敏感场景提供温和、非评判性的建议模板
 */

import type {
  AdviceTemplate,
  SensitiveScenarioType,
  UserRoleInfo,
  WorkplaceAdvice,
  DetectedScenario,
} from "./types.js";

// ============================================================================
// 1. 数据安全/合规类建议模板
// ============================================================================

const dataSecurityTemplates: AdviceTemplate[] = [
  {
    id: "ds-advice-001",
    scenarioType: "data_security",
    scenarioSubtype: "customer_data_exposure",
    template: `💡 **职场建议：数据安全红线**

涉及客户敏感数据的操作需要格外谨慎。建议：
1. 立即向直属上级和安全团队同步情况
2. 保留操作日志和相关证据
3. 配合进行影响评估和补救措施

数据安全无小事，主动上报是保护自己和公司的最佳方式。`,
    tone: "urgent",
    priority: 100,
  },
  {
    id: "ds-advice-002",
    scenarioType: "data_security",
    scenarioSubtype: "production_data_access",
    template: `💡 **职场建议：生产数据操作规范**

直接操作生产环境数据是高风险行为。建议：
1. 确认是否有审批流程，补齐相关手续
2. 操作前在测试环境验证脚本
3. 双人复核，保留完整操作记录
4. {{#if userRole.isManager}}作为管理者，建议建立双人操作机制{{else}}如有疑虑，请寻求资深同事协助{{/if}}

宁可慢一步，不要错一步。`,
    tone: "professional",
    priority: 90,
  },
  {
    id: "ds-advice-003",
    scenarioType: "data_security",
    scenarioSubtype: "credential_exposure",
    template: `⚠️ **职场建议：凭证安全紧急处理**

密钥/密码泄露可能造成严重后果。建议立即：
1. 撤销已泄露的凭证
2. 轮换所有相关密钥
3. 检查访问日志确认影响范围
4. 按公司安全事件流程上报

快速响应能将损失降到最低。`,
    tone: "urgent",
    priority: 100,
  },
  {
    id: "ds-advice-004",
    scenarioType: "data_security",
    scenarioSubtype: "compliance_violation",
    template: `💡 **职场建议：合规风险意识**

等保和合规要求是企业的生命线。建议：
1. 与合规/法务团队确认具体要求
2. 不要擅自绕过安全控制措施
3. 文档化所有例外情况的审批流程
4. 寻求合规团队的专业指导

合规不是障碍，而是保护。`,
    tone: "professional",
    priority: 85,
  },
  {
    id: "ds-advice-005",
    scenarioType: "data_security",
    scenarioSubtype: "unauthorized_access",
    template: `💡 **职场建议：权限边界意识**

越权访问可能带来法律和职业风险。建议：
1. 明确自己的权限范围
2. 如需额外权限，走正式申请流程
3. 不要借用他人账号或使用共享账号
4. 发现权限异常及时报告

权限最小化原则是保护自己也是保护团队。`,
    tone: "professional",
    priority: 90,
  },
];

// ============================================================================
// 2. 责任边界类建议模板
// ============================================================================

const responsibilityTemplates: AdviceTemplate[] = [
  {
    id: "rb-advice-001",
    scenarioType: "responsibility",
    scenarioSubtype: "solo_high_risk_operation",
    template: `💡 **职场建议：高风险操作需要 backup**

独自承担高风险操作对个人和团队都不负责。建议：
1. 确保有同事在场或随时可联系
2. 准备完整的回滚方案
3. 在维护窗口期执行，避免业务高峰
4. {{#if userRole.yearsOfExperience}}< 3}}建议寻求资深同事指导{{/if}}

没有人应该独自面对高风险。`,
    tone: "gentle",
    priority: 85,
  },
  {
    id: "rb-advice-002",
    scenarioType: "responsibility",
    scenarioSubtype: "bypassing_process",
    template: `💡 **职场建议：流程是保护不是障碍**

跳过流程可能带来不可预见的风险。建议：
1. 评估"走捷径"的真实成本和收益
2. 与相关方沟通，看是否能加速流程而非跳过
3. 如果确实紧急，获得书面授权后再行动
4. 事后补齐文档，避免下次重蹈覆辙

流程的存在往往有其历史原因。`,
    tone: "gentle",
    priority: 80,
  },
  {
    id: "rb-advice-003",
    scenarioType: "responsibility",
    scenarioSubtype: "verbal_agreement",
    template: `💡 **职场建议：口头确认需要留痕**

职场中的口头承诺容易产生误解。建议：
1. 重要决策通过邮件或 IM 确认
2. 会议纪要中明确 action items 和责任人
3. 涉及资源或权限的承诺，抄送相关方
4. 善意地提醒对方"我整理一下发邮件确认"

书面确认是对所有人的保护。`,
    tone: "gentle",
    priority: 75,
  },
  {
    id: "rb-advice-004",
    scenarioType: "responsibility",
    scenarioSubtype: "taking_blame",
    template: `💡 **职场建议：责任边界要清晰**

替他人承担责任需要慎重考虑。建议：
1. 了解事情全貌，不要贸然承诺
2. 区分"帮助解决问题"和"承担全部责任"
3. 如果决定帮忙，明确范围和预期
4. 保护自己的职业声誉和心理健康

善良不等于无条件付出。`,
    tone: "gentle",
    priority: 80,
  },
  {
    id: "rb-advice-005",
    scenarioType: "responsibility",
    scenarioSubtype: "off_hours_operation",
    template: `💡 **职场建议：非工作时间操作需谨慎**

非工作时间独自操作风险倍增。建议：
1. 确保有值班同事知晓你的操作
2. 准备详细的操作手册和回滚方案
3. 设定明确的止损点，及时升级
4. 考虑是否可以推迟到工作时间

你的健康和安全同样重要。`,
    tone: "gentle",
    priority: 75,
  },
];

// ============================================================================
// 3. 人际关系类建议模板
// ============================================================================

const interpersonalTemplates: AdviceTemplate[] = [
  {
    id: "ip-advice-001",
    scenarioType: "interpersonal",
    scenarioSubtype: "cross_department_conflict",
    template: `💡 **职场建议：跨部门协作的艺术**

跨部门协作困难是常见挑战。建议：
1. 找到对方团队的共同目标和利益点
2. 通过正式渠道（如项目例会）推进
3. 寻求双方上级的支持和协调
4. 建立个人层面的良好关系

共赢思维比对抗更有效。`,
    tone: "gentle",
    priority: 70,
  },
  {
    id: "ip-advice-002",
    scenarioType: "interpersonal",
    scenarioSubtype: "unreasonable_demand",
    template: `💡 **职场建议：管理不合理需求**

面对不合理需求，沟通比抱怨更有效。建议：
1. 用数据说明当前资源和时间限制
2. 提供替代方案："不能做 A，但可以做 B"
3. 明确优先级，询问是否可以延后其他任务
4. 必要时请双方上级协调资源

专业地 say no 是职场必修课。`,
    tone: "gentle",
    priority: 75,
  },
  {
    id: "ip-advice-003",
    scenarioType: "interpersonal",
    scenarioSubtype: "credit_taking",
    template: `💡 **职场建议：成果归属与 visibility**

工作成果被他人占用令人沮丧。建议：
1. 在项目初期明确角色和分工
2. 定期向相关方同步进展（周报/站会）
3. 关键里程碑及时记录和汇报
4. {{#if userRole.isManager}}作为管理者，注意公平分配认可{{/if}}

visibility 和实际产出同样重要。`,
    tone: "gentle",
    priority: 75,
  },
  {
    id: "ip-advice-004",
    scenarioType: "interpersonal",
    scenarioSubtype: "manager_conflict",
    template: `💡 **职场建议：向上管理困境**

与直属上级关系紧张是重大职业挑战。建议：
1. 客观评估：是风格差异还是原则冲突？
2. 尝试理解对方的管理风格和压力来源
3. 寻求 HR 或导师的中立建议
4. 如果长期无法改善，考虑内部转岗

你的职业发展不应被一段不健康的关系束缚。`,
    tone: "gentle",
    priority: 85,
  },
];

// ============================================================================
// 4. 职业发展类建议模板
// ============================================================================

const careerDevelopmentTemplates: AdviceTemplate[] = [
  {
    id: "cd-advice-001",
    scenarioType: "career_development",
    scenarioSubtype: "job_hopping_consideration",
    template: `💡 **职场建议：跳槽决策框架**

考虑跳槽是职业发展的重要时刻。建议：
1. 列出留下和离开的 pros/cons
2. 评估当前公司是否还有成长空间
3. 了解市场行情，明确自己的价值
4. 如果决定离开，做好交接，保持职业声誉

跳槽是手段，不是目的。`,
    tone: "gentle",
    priority: 70,
  },
  {
    id: "cd-advice-002",
    scenarioType: "career_development",
    scenarioSubtype: "promotion_preparation",
    template: `💡 **职场建议：晋升准备策略**

晋升是对过去贡献的认可，也是对未来的期待。建议：
1. 提前与上级沟通晋升标准和预期
2. 用数据和案例展示你的 impact
3. 准备应对挑战性问题
4. 展示你具备下一层级的能力和视野

晋升是结果，持续成长才是目标。`,
    tone: "gentle",
    priority: 75,
  },
  {
    id: "cd-advice-003",
    scenarioType: "career_development",
    scenarioSubtype: "skill_growth",
    template: `💡 **职场建议：技术成长路径**

技术成长焦虑是很多工程师的共同体验。建议：
1. 明确你的职业目标：技术专家 vs 管理路线
2. 选择与目标匹配的技术方向深入学习
3. 通过项目实践而非单纯学习来成长
4. 寻找导师和志同道合的伙伴

深度往往比广度更有价值。`,
    tone: "gentle",
    priority: 65,
  },
  {
    id: "cd-advice-004",
    scenarioType: "career_development",
    scenarioSubtype: "salary_negotiation",
    template: `💡 **职场建议：薪资谈判技巧**

谈薪资是正当的职业行为。建议：
1. 用市场数据支撑你的期望
2. 强调你的贡献和价值，而非个人需求
3. 了解公司的薪资结构和调薪周期
4. 如果当前无法满足，协商其他补偿（假期、股票等）

你的价值值得被公平对待。`,
    tone: "professional",
    priority: 80,
  },
  {
    id: "cd-advice-005",
    scenarioType: "career_development",
    scenarioSubtype: "performance_review",
    template: `💡 **职场建议：绩效申诉策略**

对绩效结果有异议是正常现象。建议：
1. 冷静分析反馈，区分事实和观点
2. 准备具体的数据和案例支持你的观点
3. 以成长的心态沟通，而非对抗
4. 如果结果无法改变，制定改进计划

一次绩效不能定义你的价值。`,
    tone: "gentle",
    priority: 80,
  },
];

// ============================================================================
// 模板汇总与查询
// ============================================================================

/** 所有建议模板 */
export const ALL_ADVICE_TEMPLATES: AdviceTemplate[] = [
  ...dataSecurityTemplates,
  ...responsibilityTemplates,
  ...interpersonalTemplates,
  ...careerDevelopmentTemplates,
];

/**
 * 根据场景查找最佳匹配模板
 */
export function findBestTemplate(
  scenario: DetectedScenario,
  userRole?: UserRoleInfo
): AdviceTemplate | undefined {
  // 首先精确匹配 subtype
  let candidates = ALL_ADVICE_TEMPLATES.filter(
    (t) =>
      t.scenarioType === scenario.type &&
      t.scenarioSubtype === scenario.subtype
  );

  // 如果没有精确匹配，退回到类型匹配
  if (candidates.length === 0) {
    candidates = ALL_ADVICE_TEMPLATES.filter(
      (t) => t.scenarioType === scenario.type
    );
  }

  // 如果用户角色指定，过滤适用角色
  if (userRole?.title && candidates.length > 0) {
    const roleMatched = candidates.filter(
      (t) =>
        !t.applicableRoles ||
        t.applicableRoles.length === 0 ||
        t.applicableRoles.some((r) => userRole.title?.includes(r))
    );
    if (roleMatched.length > 0) {
      candidates = roleMatched;
    }
  }

  // 按优先级排序，返回最高优先级的模板
  return candidates.sort((a, b) => b.priority - a.priority)[0];
}

/**
 * 简单的模板变量替换
 * 支持 {{variable}} 和 {{#if condition}}...{{/if}} 语法
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  let result = template;

  // 处理 {{#if condition}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (match, condition, content) => {
    const value = getNestedValue(variables, condition);
    return value ? content : "";
  });

  // 处理简单变量 {{variable}}
  const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  result = result.replace(varRegex, (match, path) => {
    const value = getNestedValue(variables, path);
    return value !== undefined ? String(value) : match;
  });

  return result;
}

/**
 * 获取嵌套对象值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

/**
 * 生成职场建议
 */
export function generateAdvice(
  scenario: DetectedScenario,
  userRole?: UserRoleInfo
): WorkplaceAdvice | undefined {
  const template = findBestTemplate(scenario, userRole);
  if (!template) return undefined;

  const content = renderTemplate(template.template, {
    userRole,
    scenario,
  });

  return {
    id: `advice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scenario,
    content,
    tone: template.tone,
    isWorkplaceAdvice: true,
    tags: [scenario.type, scenario.subtype, template.tone],
    generatedAt: Date.now(),
  };
}
