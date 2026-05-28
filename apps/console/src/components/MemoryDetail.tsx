import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  message,
  Tooltip,
} from "antd";
import {
  CopyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FieldTimeOutlined,
  NumberOutlined,
  ApartmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { MemoryNode } from "./MemoryTree";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;

// ==================== Markdown Styles ====================

const markdownStyles = `
  .memory-markdown h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2329;
    margin: 0 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #eaecef;
  }
  .memory-markdown h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2329;
    margin: 24px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eaecef;
  }
  .memory-markdown h3 {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
    margin: 16px 0 8px;
  }
  .memory-markdown p {
    margin: 0 0 12px;
    line-height: 1.7;
    color: #3d444d;
  }
  .memory-markdown ul, .memory-markdown ol {
    margin: 0 0 12px;
    padding-left: 24px;
  }
  .memory-markdown li {
    margin: 4px 0;
    line-height: 1.7;
  }
  .memory-markdown code {
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #0066ff;
  }
  .memory-markdown pre {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 8px;
    overflow: auto;
    margin: 12px 0;
  }
  .memory-markdown pre code {
    background: none;
    padding: 0;
    color: #24292e;
    font-size: 13px;
    line-height: 1.5;
  }
  .memory-markdown blockquote {
    border-left: 4px solid #dfe2e5;
    padding-left: 16px;
    margin: 12px 0;
    color: #6a737d;
  }
  .memory-markdown table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
  }
  .memory-markdown th, .memory-markdown td {
    border: 1px solid #e1e4e8;
    padding: 8px 12px;
    text-align: left;
  }
  .memory-markdown th {
    background: #f6f8fa;
    font-weight: 600;
  }
  .memory-markdown a {
    color: #0066ff;
    text-decoration: none;
  }
  .memory-markdown a:hover {
    text-decoration: underline;
  }
  .memory-markdown hr {
    border: none;
    border-top: 1px solid #e8ecf1;
    margin: 16px 0;
  }
`;

// ==================== Component ====================

export interface MemoryDetailProps {
  memory: MemoryNode | null;
  loading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onOpenKnowledgeAlignment?: () => void;
}

export const MemoryDetail: React.FC<MemoryDetailProps> = ({
  memory,
  loading = false,
  onRefresh,
  onDelete,
  onOpenKnowledgeAlignment,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = () => {
    if (memory?.content) {
      navigator.clipboard.writeText(memory.content);
      setCopied(true);
      message.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
  };

  const formatRelativeTime = (timestamp: number) => {
    return dayjs(timestamp).fromNow();
  };

  const formatTokenCount = (value?: number) => {
    if (typeof value !== "number") return "未统计";
    return new Intl.NumberFormat("zh-CN").format(value);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "L0":
        return "#0066ff";
      case "L1":
        return "#52c41a";
      case "L2":
        return "#faad14";
      case "L3":
        return "#722ed1";
      default:
        return "#8c8c8c";
    }
  };

  const getSourceTypeLabel = (type?: string) => {
    switch (type) {
      case "user-profile":
        return "用户画像";
      case "skill-pattern":
        return "技能记忆";
      case "interaction":
        return "对话记忆";
      case "burnout":
        return "状态监测";
      case "daily":
        return "日常记录";
      case "knowledge":
        return "知识记忆";
      case "meeting":
        return "会议记忆";
      case "manual":
        return "手动记忆";
      case "summary":
        return "分层摘要";
      case "level-group":
        return "记忆层级";
      default:
        return "记忆记录";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "L0":
        return "记忆层级 L0 原始";
      case "L1":
        return "记忆层级 L1 日摘要";
      case "L2":
        return "记忆层级 L2 周摘要";
      case "L3":
        return "记忆层级 L3 月回顾";
      default:
        return `记忆层级 ${level}`;
    }
  };

  // Inject styles
  useEffect(() => {
    const styleId = "memory-detail-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = markdownStyles;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: 400,
        }}
      >
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!memory) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
          padding: 24,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#646a73", marginBottom: 4 }}>
                选择左侧记忆节点
              </div>
              <Text type="secondary">可查看来源、层级、内容，并将关键记忆沉淀到知识图谱</Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="memory-detail"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid #e8ecf1",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Tag
                color={getLevelColor(memory.level)}
                style={{ margin: 0, fontWeight: 600 }}
              >
                {getLevelLabel(memory.level)}
              </Tag>
              <Tag color="default" style={{ margin: 0, fontWeight: 600 }}>
                来源：{memory.sourceLabel || getSourceTypeLabel(memory.sourceType)}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {memory.sourceType === "meeting" ? "会议内容已进入记忆，可后续沉淀到知识图谱" : "来源与层级分开显示"}
              </Text>
            </div>
            <Title
              level={4}
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 650,
                color: "#1f2329",
                lineHeight: 1.35,
                wordBreak: "break-word",
              }}
            >
              {memory.title}
            </Title>
          </div>
          <Space size={4}>
            <Tooltip title={copied ? "已复制" : "复制内容"}>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopyContent}
                size="small"
              />
            </Tooltip>
            {onRefresh && (
              <Tooltip title="刷新">
                <Button
                  type="text"
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={onRefresh}
                  size="small"
                />
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="删除">
                <Button
                  type="text"
                  danger
                  icon={
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  }
                  onClick={() => onDelete(memory.id)}
                  size="small"
                />
              </Tooltip>
            )}
          </Space>
        </div>

        {/* Meta Info */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            color: "#8c8c8c",
          }}
        >
          <Tooltip title={`创建于 ${formatDate(memory.createdAt)}`}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarOutlined />
              {formatRelativeTime(memory.createdAt)}
            </span>
          </Tooltip>
          <Tooltip title={`更新于 ${formatDate(memory.updatedAt)}`}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FieldTimeOutlined />
              {formatRelativeTime(memory.updatedAt)}
            </span>
          </Tooltip>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NumberOutlined />
            {formatTokenCount(memory.tokenCount)} tokens
          </span>
          <Tooltip title={memory.source}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <FileTextOutlined />
              {memory.sourceLabel || getSourceTypeLabel(memory.sourceType)} · {memory.source.split("/").pop()}
            </span>
          </Tooltip>
        </div>

        {/* Tags */}
        {memory.tags.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {memory.tags.map((tag) => (
              <Tag key={tag} style={{ margin: 0, fontSize: 11 }}>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px 24px",
        }}
      >
        <div className="memory-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <pre
                    style={{
                      background: "#f6f8fa",
                      padding: 16,
                      borderRadius: 8,
                      overflow: "auto",
                    }}
                  >
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {memory.content}
          </ReactMarkdown>
        </div>

        {onOpenKnowledgeAlignment && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderTop: "1px solid #eef1f5",
              background: "#f7fbff",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 650, color: "#1f2329", marginBottom: 6 }}>
                  <ApartmentOutlined style={{ marginRight: 6, color: "#0066ff" }} />
                  知识沉淀
                </div>
                <Paragraph style={{ margin: 0, fontSize: 13, color: "#646a73", lineHeight: 1.7 }}>
                  这条记忆可以在知识库中与知识图谱节点对齐。系统会先给出候选关系和冲突提示，确认后再写入图谱。
                </Paragraph>
              </div>
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={onOpenKnowledgeAlignment}>
                去对齐
              </Button>
            </div>
          </div>
          )}
      </div>
    </div>
  );
};

export default MemoryDetail;
