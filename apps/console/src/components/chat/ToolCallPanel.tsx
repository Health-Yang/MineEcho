import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

interface ToolCall {
  name: string;
  arguments?: string;
  status: 'running' | 'done';
}

interface ToolCallPanelProps {
  toolCalls: ToolCall[];
}

const toolNameMap: Record<string, string> = {
  'hci-solution-generator': '生成超融合实施方案',
  'code-interpreter': '执行代码',
  'web-search': '搜索网络',
  'file-search': '搜索文件',
  'knowledge-retrieval': '检索知识库',
  'document-parser': '解析文档',
  'image-generator': '生成图片',
  'data-analysis': '分析数据',
};

export function ToolCallPanel({ toolCalls }: ToolCallPanelProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="tool-call-panel">
      {toolCalls.map((tc, idx) => (
        <div key={idx} className={`tool-call-item ${tc.status}`}>
          {tc.status === 'running' ? <LoadingOutlined /> : <CheckCircleOutlined />}
          <span className="tool-name">{toolNameMap[tc.name] || tc.name}</span>
        </div>
      ))}
    </div>
  );
}
