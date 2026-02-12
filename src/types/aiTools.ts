export type AiToolCategory = 'work' | 'business' | 'communication' | 'health' | 'fun';

export type AiToolKind = 'default' | 'taskReminder';

export type AiToolDefinition = {
  id: string;
  category: AiToolCategory;
  titleKey: string;
  subtitleKey: string;
  emoji: string;
  locked?: boolean;
  systemPrompt: string;
  kind?: AiToolKind;
};
