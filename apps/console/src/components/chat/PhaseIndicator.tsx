import { Spin } from 'antd';

export type ConversationPhase = 'received' | 'thinking' | 'tool_calling' | 'waiting_result' | 'generating' | 'completed';

interface PhaseIndicatorProps {
  phase: ConversationPhase;
}

const phaseLabels: Record<ConversationPhase, string> = {
  received: '已接收请求',
  thinking: '模型正在处理',
  tool_calling: '正在调用工具',
  waiting_result: '正在整理结果',
  generating: '正在整理输出',
  completed: '输出完成',
};

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  return (
    <div className="phase-indicator">
      <Spin size="small" />
      <span className="phase-label">{phaseLabels[phase]}</span>
    </div>
  );
}
