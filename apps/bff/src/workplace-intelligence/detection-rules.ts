/**
 * Workplace Intelligence System - Detection Rules
 * 职场敏感场景检测规则库
 *
 * 基于关键词和语义规则识别四类敏感场景：
 * 1. 数据安全/合规类
 * 2. 责任边界类
 * 3. 人际关系类
 * 4. 职业发展类
 */

import type { DetectionRule, SensitiveScenarioType } from "./types.js";

// ============================================================================
// 1. 数据安全/合规类规则
// ============================================================================

const dataSecurityRules: DetectionRule[] = [
  {
    id: "ds-001",
    type: "data_security",
    subtype: "customer_data_exposure",
    severity: "critical",
    keywords: ["客户", "数据", "泄露", "暴露"],
    optionalKeywords: ["敏感", "隐私", "个人信息", "PII", "数据库", "导出", "下载", "外发"],
    minConfidence: 0.7,
    weight: 1.0,
  },
  {
    id: "ds-002",
    type: "data_security",
    subtype: "production_data_access",
    severity: "high",
    keywords: ["生产环境", "数据"],
    optionalKeywords: ["直接", "查询", "修改", "删除", "操作", "数据库", "表", "dump", "导出"],
    minConfidence: 0.65,
    weight: 0.9,
  },
  {
    id: "ds-003",
    type: "data_security",
    subtype: "credential_exposure",
    severity: "critical",
    keywords: ["密码", "密钥", "token", "密钥"],
    optionalKeywords: ["明文", "硬编码", "github", "提交", "代码", "泄露", "暴露", "提交"],
    excludeKeywords: ["加密", "哈希", "脱敏"],
    minConfidence: 0.7,
    weight: 1.0,
  },
  {
    id: "ds-004",
    type: "data_security",
    subtype: "compliance_violation",
    severity: "high",
    keywords: ["等保", "合规", "审计"],
    optionalKeywords: ["绕过", "规避", "不符合", "违规", "要求", "检查", "整改"],
    minConfidence: 0.6,
    weight: 0.85,
  },
  {
    id: "ds-005",
    type: "data_security",
    subtype: "unauthorized_access",
    severity: "high",
    keywords: ["越权", "未授权", "权限"],
    optionalKeywords: ["访问", "查看", "操作", "管理员", "超级用户", "root", "sudo"],
    minConfidence: 0.65,
    weight: 0.9,
  },
  {
    id: "ds-006",
    type: "data_security",
    subtype: "data_residency",
    severity: "medium",
    keywords: ["数据", "跨境", "境外"],
    optionalKeywords: ["传输", "存储", "服务器", "国外", "海外", "aws", "azure", "gcp"],
    minConfidence: 0.6,
    weight: 0.75,
  },
];

// ============================================================================
// 2. 责任边界类规则
// ============================================================================

const responsibilityRules: DetectionRule[] = [
  {
    id: "rb-001",
    type: "responsibility",
    subtype: "solo_high_risk_operation",
    severity: "high",
    keywords: ["一个人"],
    optionalKeywords: ["独自", "单独", "生产", "上线", "发布", "部署", "变更", "割接", "高风险", "核心", "关键"],
    minConfidence: 0.5,
    weight: 0.9,
  },
  {
    id: "rb-002",
    type: "responsibility",
    subtype: "bypassing_process",
    severity: "medium",
    keywords: ["跳过", "绕过", "不走"],
    optionalKeywords: ["流程", "审批", "测试", "评审", "code review", "直接", "快速", "紧急"],
    minConfidence: 0.6,
    weight: 0.8,
  },
  {
    id: "rb-003",
    type: "responsibility",
    subtype: "verbal_agreement",
    severity: "medium",
    keywords: ["口头", "微信", "私聊"],
    optionalKeywords: ["确认", "同意", "批准", "授权", "领导", "经理", "说可以"],
    minConfidence: 0.6,
    weight: 0.75,
  },
  {
    id: "rb-004",
    type: "responsibility",
    subtype: "taking_blame",
    severity: "medium",
    keywords: ["背锅", "担责", "扛下来"],
    optionalKeywords: ["帮我", "替我", "问题", "故障", "事故", "责任", "追究"],
    minConfidence: 0.65,
    weight: 0.8,
  },
  {
    id: "rb-005",
    type: "responsibility",
    subtype: "off_hours_operation",
    severity: "medium",
    keywords: ["晚上", "周末", "凌晨", "节假日"],
    optionalKeywords: ["操作", "变更", "发布", "上线", "维护", "值班", "一个人", "独自"],
    minConfidence: 0.6,
    weight: 0.7,
  },
  {
    id: "rb-006",
    type: "responsibility",
    subtype: "unclear_requirement",
    severity: "low",
    keywords: ["需求", "不清楚", "不明确"],
    optionalKeywords: ["模糊", "口头", "没有文档", "没确认", "先做", "边做边改", "试试"],
    minConfidence: 0.55,
    weight: 0.6,
  },
];

// ============================================================================
// 3. 人际关系类规则
// ============================================================================

const interpersonalRules: DetectionRule[] = [
  {
    id: "ip-001",
    type: "interpersonal",
    subtype: "cross_department_conflict",
    severity: "medium",
    keywords: ["跨部门"],
    optionalKeywords: ["其他部门", "协作", "不配合", "难沟通", "扯皮", "推不动", "阻力", "障碍", "冲突"],
    minConfidence: 0.5,
    weight: 0.75,
  },
  {
    id: "ip-002",
    type: "interpersonal",
    subtype: "unreasonable_demand",
    severity: "medium",
    keywords: ["需求", "不合理", "变态"],
    optionalKeywords: ["产品", "业务", "运营", "PM", "老板", "领导", "改来改去", "反复", "临时"],
    minConfidence: 0.6,
    weight: 0.7,
  },
  {
    id: "ip-003",
    type: "interpersonal",
    subtype: "credit_taking",
    severity: "medium",
    keywords: ["抢功劳", "署名", "汇报"],
    optionalKeywords: ["我的", "成果", "工作", "被拿走", "领导", "上级", "邀功"],
    minConfidence: 0.65,
    weight: 0.75,
  },
  {
    id: "ip-004",
    type: "interpersonal",
    subtype: "being_excluded",
    severity: "low",
    keywords: ["会议", "没叫", "没邀请"],
    optionalKeywords: ["重要", "决策", "讨论", "项目", "信息", "不知道", "被排除"],
    minConfidence: 0.55,
    weight: 0.6,
  },
  {
    id: "ip-005",
    type: "interpersonal",
    subtype: "peer_competition",
    severity: "low",
    keywords: ["同事", "竞争", "对比"],
    optionalKeywords: ["绩效", "晋升", "名额", "抢", "打压", "排挤", "关系紧张"],
    minConfidence: 0.6,
    weight: 0.65,
  },
  {
    id: "ip-006",
    type: "interpersonal",
    subtype: "manager_conflict",
    severity: "high",
    keywords: ["领导", "经理", "主管", "老板"],
    optionalKeywords: ["不对付", "不合", "冲突", "打压", "针对", "穿小鞋", "不信任"],
    minConfidence: 0.65,
    weight: 0.85,
  },
];

// ============================================================================
// 4. 职业发展类规则
// ============================================================================

const careerDevelopmentRules: DetectionRule[] = [
  {
    id: "cd-001",
    type: "career_development",
    subtype: "job_hopping_consideration",
    severity: "low",
    keywords: ["跳槽"],
    optionalKeywords: ["离职", "换工作", "机会", "offer", "面试", "薪资", "涨薪", "发展", "瓶颈", "想走", "看看"],
    excludeKeywords: ["不要", "别", "劝退"],
    minConfidence: 0.5,
    weight: 0.7,
  },
  {
    id: "cd-002",
    type: "career_development",
    subtype: "promotion_preparation",
    severity: "low",
    keywords: ["晋升", "升职", "答辩"],
    optionalKeywords: [ "准备", "PPT", "材料", "述职", "评审", "答辩", "高级", "专家", "管理"],
    minConfidence: 0.55,
    weight: 0.65,
  },
  {
    id: "cd-003",
    type: "career_development",
    subtype: "skill_growth",
    severity: "low",
    keywords: ["学习", "提升", "成长"],
    optionalKeywords: ["技术", "技能", "方向", "转型", "迷茫", "不知道", "焦虑", "瓶颈"],
    minConfidence: 0.55,
    weight: 0.6,
  },
  {
    id: "cd-004",
    type: "career_development",
    subtype: "work_life_balance",
    severity: "low",
    keywords: ["加班", "996", "工作", "生活"],
    optionalKeywords: [ "平衡", "太累", "身体", "健康", "家庭", "孩子", " burnout", "倦怠"],
    minConfidence: 0.55,
    weight: 0.6,
  },
  {
    id: "cd-005",
    type: "career_development",
    subtype: "salary_negotiation",
    severity: "medium",
    keywords: ["加薪", "涨薪", "薪资"],
    optionalKeywords: [ "谈", "申请", "要求", "调整", "低于", "市场", "倒挂", "不公平"],
    minConfidence: 0.6,
    weight: 0.7,
  },
  {
    id: "cd-006",
    type: "career_development",
    subtype: "performance_review",
    severity: "medium",
    keywords: ["绩效", "考核", "review"],
    optionalKeywords: [ "低", "差", "不公平", "不认可", "申诉", "argue", "不服", "质疑"],
    minConfidence: 0.6,
    weight: 0.75,
  },
];

// ============================================================================
// 规则汇总
// ============================================================================

/** 所有检测规则 */
export const ALL_DETECTION_RULES: DetectionRule[] = [
  ...dataSecurityRules,
  ...responsibilityRules,
  ...interpersonalRules,
  ...careerDevelopmentRules,
];

/** 按类型分组的规则 */
export const RULES_BY_TYPE: Record<SensitiveScenarioType, DetectionRule[]> = {
  data_security: dataSecurityRules,
  responsibility: responsibilityRules,
  interpersonal: interpersonalRules,
  career_development: careerDevelopmentRules,
};

/** 获取规则统计信息 */
export function getRulesStats(): {
  total: number;
  byType: Record<SensitiveScenarioType, number>;
  bySeverity: Record<string, number>;
} {
  const byType: Record<string, number> = {
    data_security: 0,
    responsibility: 0,
    interpersonal: 0,
    career_development: 0,
  };
  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const rule of ALL_DETECTION_RULES) {
    byType[rule.type] = (byType[rule.type] || 0) + 1;
    bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1;
  }

  return {
    total: ALL_DETECTION_RULES.length,
    byType: byType as Record<SensitiveScenarioType, number>,
    bySeverity,
  };
}
