export type ChatMode = 'general' | 'auto' | 'agent-team' | 'coding' | 'brainstorming';

export interface ModeConfig {
  id: ChatMode;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}
