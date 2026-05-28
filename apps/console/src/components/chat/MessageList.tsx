import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button } from "antd";
import { UserOutlined, FileImageOutlined, FileOutlined, BulbOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FoxLogo } from "../FoxLogo";
import { MessageContent, MessageActions } from "./MessageContent";
import { ToolCallPanel } from "./ToolCallPanel";
import type { ChatContextEvidence } from "../../utils/chatContextEvidence";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
  thinkingContent?: string;
  toolCalls?: Array<{ name: string; arguments?: string; status: 'running' | 'done' }>;
  contextEvidence?: ChatContextEvidence;
  /** 系统提醒消息（如每日提醒） */
  isSystemReminder?: boolean;
  createdAt?: string | number | Date;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  streamingRunId?: string | null;
  onQuoteMessage?: (content: string) => void;
  onSendExample?: (text: string) => void;
  thinkingPhase?: "analyzing" | "retrieving" | "reasoning" | "synthesizing" | "thinking" | "tool_calling";
  statusMessage?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

function ContextEvidenceBar({ evidence }: { evidence?: ChatContextEvidence }) {
  if (!evidence) return null;
  const hasMemories = evidence.memories.length > 0;
  const hasKnowledge = evidence.knowledge.length > 0;
  const hasSkill = !!evidence.skill;
  if (!hasMemories && !hasKnowledge && !hasSkill) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
        maxWidth: 560,
      }}
    >
      {hasMemories && (
        <span className="context-evidence-pill" title={evidence.memories.map((m) => `${m.label}: ${m.preview}`).join("\n")}>
          记忆 {evidence.memories.length}
        </span>
      )}
      {hasKnowledge && (
        <span className="context-evidence-pill" title={evidence.knowledge.map((k) => `${k.label}: ${k.path}`).join("\n")}>
          知识库 {evidence.knowledge.length}
        </span>
      )}
      {hasSkill && (
        <span className="context-evidence-pill" title={evidence.skill?.id}>
          Skill: {evidence.skill?.name}
        </span>
      )}
    </div>
  );
}

// 提取思考内容（暂时注释）
// function extractThinkingContent(content: string): { thinking: string; answer: string } {
//   const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
//   if (thinkingMatch) {
//     return {
//       thinking: thinkingMatch[1].trim(),
//       answer: content.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()
//     };
//   }
//   return { thinking: "", answer: content };
// }

// 可折叠思考气泡（默认折叠）
const ThinkingBubble = memo(function ThinkingBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开，流式过程中用户能看到思考内容
  const lineCount = content.split('\n').length;

  return (
    <div
      style={{
        marginBottom: 8,
        background: "rgba(250, 173, 20, 0.08)",
        border: "1px solid rgba(250, 173, 20, 0.2)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isExpanded ? "rgba(250, 173, 20, 0.12)" : "transparent",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BulbOutlined style={{ color: "#faad14", fontSize: 12 }} />
          <span style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>思考过程</span>
          {isStreaming && (
            <span style={{ display: "flex", gap: 2 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#faad14", animation: "pulse 1s infinite" }} />
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#faad14", animation: "pulse 1s infinite 0.2s" }} />
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#faad14", animation: "pulse 1s infinite 0.4s" }} />
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>
            {isExpanded ? "收起" : `展开 (${lineCount}行)`}
          </span>
          {isExpanded ? (
            <EyeInvisibleOutlined style={{ color: "#bbb", fontSize: 12 }} />
          ) : (
            <EyeOutlined style={{ color: "#bbb", fontSize: 12 }} />
          )}
        </div>
      </div>
      {isExpanded && (
        <div
          style={{
            padding: 10,
            background: "#fff",
            borderTop: "1px solid rgba(250, 173, 20, 0.15)",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 11,
              lineHeight: 1.5,
              color: "#888",
              fontFamily: "SF Mono, Monaco, monospace",
            }}
          >
            {content}
          </pre>
        </div>
      )}
    </div>
  );
});

// 提取并清理思考内容用于分离显示
function extractAndStripThinking(rawContent: string): { displayContent: string; thinkingContent: string } {
  const thinkingMatch = rawContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim();
    const display = rawContent.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();
    return { displayContent: display, thinkingContent: thinking };
  }
  return { displayContent: rawContent, thinkingContent: "" };
}

// 统一的消息项组件
const MessageItem = memo(function MessageItem({
  msg,
  onQuoteMessage,
}: {
  msg: Message;
  onQuoteMessage?: (content: string) => void;
}) {
  const isUser = msg.role === "user";
  // 优先使用 SSE thinking 事件存入的 thinkingContent；若无则从正文中提取
  // 去重：如果 thinkingContent 同时存在于 SSE 和正文，对 displayContent 做减法避免双显
  const { displayContent, thinkingContent } = (() => {
    const extracted = extractAndStripThinking(msg.content);
    const thinking = msg.thinkingContent || extracted.thinkingContent;
    let display = extracted.displayContent;
    // 如果 SSE 和正文都有相同 thinking 内容，从正文中扣除
    if (msg.thinkingContent && extracted.thinkingContent && msg.thinkingContent.trim() === extracted.thinkingContent.trim()) {
      // displayContent 已由 extractAndStripThinking 去掉 <thinking> 标签，无须额外处理
    }
    return { displayContent: display, thinkingContent: thinking };
  })();
  const hasThinking = !!thinkingContent;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 10,
        marginBottom: 16,
        alignItems: "flex-start",
      }}
    >
      {/* 头像 */}
      {isUser ? (
        <Avatar
          icon={<UserOutlined />}
          className="avatar user"
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
          }}
        />
      ) : (
        <div
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#0066ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            color: "#fff",
          }}
        >
          S
        </div>
      )}

      {/* 消息内容区 */}
      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        {/* 附件 */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div style={{ marginBottom: 8, width: "100%" }}>
            {msg.attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: isUser ? "rgba(255,255,255,0.2)" : "#f5f5f5",
                  borderRadius: 12,
                  marginBottom: 6,
                  cursor: att.url ? "pointer" : "default",
                  maxWidth: 280,
                }}
                onClick={() => att.url && window.open(att.url, "_blank")}
              >
                {isImage(att.type) ? (
                  <FileImageOutlined style={{ fontSize: 20, color: isUser ? "#fff" : "#0066ff" }} />
                ) : (
                  <FileOutlined style={{ fontSize: 20, color: isUser ? "#fff" : "#666" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: isUser ? "#fff" : "#333",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {att.name}
                  </div>
                  <div style={{ fontSize: 11, color: isUser ? "rgba(255,255,255,0.7)" : "#999" }}>
                    {formatFileSize(att.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 工具调用面板（流式中或已完成的消息都显示） */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <ToolCallPanel toolCalls={msg.toolCalls} />
        )}

        {/* 思考内容（AI消息，有思考内容时显示为可折叠区块） */}
        {hasThinking && (
          <ThinkingBubble content={thinkingContent} isStreaming={msg.isStreaming} />
        )}

        {/* 消息气泡 */}
        {displayContent && (
          <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
            <MessageContent content={displayContent} isStreaming={msg.isStreaming} isUser={isUser} showCursor={msg.isStreaming} />
          </div>
        )}

        {!isUser && <ContextEvidenceBar evidence={msg.contextEvidence} />}

        {/* 时间戳 */}
        <div
          style={{
            fontSize: 10,
            color: "#a8b8cc",
            marginTop: 4,
            paddingLeft: isUser ? 0 : 4,
            paddingRight: isUser ? 4 : 0,
          }}
        >
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>

        {/* 操作按钮 */}
        {!isUser && displayContent && (
          <MessageActions content={displayContent} isUser={isUser} onQuote={() => onQuoteMessage?.(displayContent)} />
        )}
      </div>
    </div>
  );
});

// 底部 AI 正在回复的指示器（仅在流式输出时显示思考内容）
// 注意：不使用 memo，确保内部定时器能正常工作
function AIResponseIndicator({
  thinkingPhase = "thinking",
  customMessage,
}: {
  thinkingPhase?: "analyzing" | "retrieving" | "reasoning" | "synthesizing" | "thinking" | "tool_calling";
  customMessage?: string | null;
}) {
  // 直接由 thinkingPhase 驱动，无轮播，无定时器，状态即真相
  const phaseInfo = useMemo(() => {
    const map: Record<string, { text: string; emoji: string }> = {
      analyzing: { text: "正在分析问题", emoji: "🔍" },
      retrieving: { text: "正在检索知识库", emoji: "📚" },
      reasoning: { text: "正在深度思考", emoji: "🧠" },
      synthesizing: { text: "正在生成回答", emoji: "✨" },
      tool_calling: { text: "正在调用工具", emoji: "🔧" },
      thinking: { text: "正在思考", emoji: "💭" },
    };
    return map[thinkingPhase] ?? { text: "正在思考", emoji: "💭" };
  }, [thinkingPhase]);

  const current = customMessage
    ? { text: customMessage, emoji: "" }
    : phaseInfo;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#0066ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 12,
          color: "#fff",
        }}
      >
        S
      </div>
      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* 打字指示器 */}
        <div
          className="message-bubble assistant loading"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {current.emoji && <span style={{ fontSize: 14 }}>{current.emoji}</span>}
          <span
            style={{
              fontSize: 14,
              color: "#666",
              minWidth: 100, // 固定最小宽度，避免抖动
            }}
          >
            {current.text}
          </span>
          <span style={{ display: "flex", gap: 3, marginLeft: 4 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#999",
                animation: "bounce 1.4s infinite ease-in-out both",
              }}
            />
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#999",
                animation: "bounce 1.4s infinite ease-in-out both 0.16s",
              }}
            />
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#999",
                animation: "bounce 1.4s infinite ease-in-out both 0.32s",
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

// 欢迎界面
const WelcomeScreen = memo(function WelcomeScreen({ onSendExample }: { onSendExample?: (text: string) => void }) {
  const examples = [
    "你好，请介绍一下自己",
    "帮我写一段 Python 代码",
    "解释一下 React Hooks",
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "#f5f7fa",
      }}
    >
      {/* App Icon */}
      <div style={{ marginBottom: 24 }}>
        <FoxLogo size={48} />
      </div>

      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 24,
          fontWeight: 600,
          color: "#1d1d1f",
          letterSpacing: "-0.5px",
        }}
      >
        MineEcho
      </h2>

      <p
        style={{
          margin: 0,
          marginBottom: 32,
          fontSize: 15,
          color: "#86868b",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        你的 AI 智能助手，随时为你解答问题
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 300,
        }}
      >
        {examples.map((text) => (
          <Button
            key={text}
            onClick={() => onSendExample?.(text)}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid #e8ecf1",
              background: "#fff",
              color: "#333",
              fontSize: 14,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f5f7fa";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
});

// 主组件
export const MessageList = memo(function MessageList({
  messages,
  loading,
  streamingRunId,
  onQuoteMessage,
  onSendExample,
  thinkingPhase = "thinking",
  statusMessage,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 判断是否正在等待 AI 回复
  const isWaitingForAI = loading || streamingRunId;

  // 过滤掉空的正在流式传输的 AI 消息（占位符），由 AIResponseIndicator 统一显示
  const visibleMessages = messages.filter(
    (msg) => !(msg.role === "assistant" && msg.isStreaming && !msg.content && !msg.attachments?.length)
  );

  // 虚拟化配置（始终启用，避免 Hooks 规则违反）
  const shouldVirtualize = visibleMessages.length > 50;

  const virtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 预估每条消息高度
    overscan: 5, // 预渲染5条
  });

  // 自动滚动到底部（处理所有情况：新消息、历史加载、流式输出、内容填充）
  // 使用 setTimeout 替代 requestAnimationFrame，确保 React 渲染完成后再滚动
  useEffect(() => {
    if (!parentRef.current) return;
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ block: "end", inline: "nearest" });
      }
      if (shouldVirtualize && virtualizer) {
        virtualizer.scrollToIndex(visibleMessages.length - 1, { align: "end" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, messages[messages.length - 1]?.isStreaming, messages[messages.length - 1]?.content?.length, shouldVirtualize]);

  // 欢迎界面（在所有 Hooks 之后判断）
  if (messages.length === 0) {
    return <WelcomeScreen onSendExample={onSendExample} />;
  }

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        ref={parentRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 20px",
          background: "#fafafa",
        }}
      >
        {shouldVirtualize ? (
          // 虚拟化渲染（超过50条消息）
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const msg = visibleMessages[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <MessageItem msg={msg} onQuoteMessage={onQuoteMessage} />
                </div>
              );
            })}
          </div>
        ) : (
          // 普通渲染（50条以内）
          visibleMessages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} onQuoteMessage={onQuoteMessage} />
          ))
        )}

        {/* AI 正在回复的指示器 */}
        {isWaitingForAI && (
          <AIResponseIndicator thinkingPhase={thinkingPhase} customMessage={statusMessage} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </>
  );
});
