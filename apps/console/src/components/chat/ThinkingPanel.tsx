import { useState } from "react";
import { Spin } from "antd";
import { BulbOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

interface ThinkingPanelProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingPanel({ content, isStreaming }: ThinkingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // 统计思考内容的行数和字数
  const lineCount = content.split('\n').length;
  

  return (
    <div 
      style={{ 
        margin: '8px 16px',
        background: '#fafafa',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* 折叠状态栏 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isExpanded ? '#f0f0f0' : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined style={{ color: '#faad14', fontSize: 14 }} />
          <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>
            思考过程
          </span>
          {isStreaming && (
            <Spin size="small" style={{ marginLeft: 8 }} />
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>
            {isExpanded ? '收起' : `展开 (${lineCount}行)`}
          </span>
          {isExpanded ? (
            <EyeInvisibleOutlined style={{ color: '#999', fontSize: 14 }} />
          ) : (
            <EyeOutlined style={{ color: '#999', fontSize: 14 }} />
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div 
          style={{ 
            padding: '12px',
            background: '#fff',
            borderTop: '1px solid #e8e8e8',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <pre 
            style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#666',
              fontFamily: 'monospace',
            }}
          >
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
