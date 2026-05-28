import { lazy, Suspense, useState, memo } from "react";
import { Typography, Tooltip } from "antd";
import { CheckOutlined, CopyOutlined, FormOutlined } from "@ant-design/icons";

const MarkdownMessageRenderer = lazy(() => import("./MarkdownMessageRenderer").then((module) => ({ default: module.MarkdownMessageRenderer })));

// 消息操作按钮
export function MessageActions({ content, isUser, onQuote }: { content: string; isUser: boolean; onQuote: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message-actions ${isUser ? 'user' : 'assistant'}`}>
      <Tooltip title={copied ? "已复制" : "复制"}>
        <button onClick={handleCopy} className="action-btn">
          {copied ? <CheckOutlined style={{ fontSize: 13 }} /> : <CopyOutlined style={{ fontSize: 13 }} />}
        </button>
      </Tooltip>
      <Tooltip title="引用">
        <button onClick={onQuote} className="action-btn">
          <FormOutlined style={{ fontSize: 13 }} />
        </button>
      </Tooltip>
    </div>
  );
}

// Markdown 消息内容组件 - 使用 React.memo 避免不必要的重渲染
interface MessageContentProps {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
  showCursor?: boolean;
}

export const MessageContent = memo(function MessageContent({
  content,
  isUser,
  isStreaming,
  showCursor,
}: MessageContentProps) {
  if (!isStreaming && !content) {
    return (
      <Typography.Text style={{ color: isUser ? "#fff" : undefined, lineHeight: 1.7, fontSize: "0.95em" }}>
        …
      </Typography.Text>
    );
  }

  return (
    <Suspense fallback={<Typography.Text style={{ color: isUser ? "#fff" : undefined, lineHeight: 1.7, fontSize: "0.95em", whiteSpace: "pre-wrap" }}>{content}</Typography.Text>}>
      <MarkdownMessageRenderer content={content} isUser={isUser} showCursor={showCursor} />
    </Suspense>
  );
});
