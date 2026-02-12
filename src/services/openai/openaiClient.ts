import { OPENAI_API_KEY, OPENAI_API_URL, OPENAI_MODEL } from '../../config/openai';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionParams = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
};

const MODEL_ALIASES: Record<string, string> = {
  '3': OPENAI_MODEL,
};

const resolveModel = (model?: string) => MODEL_ALIASES[model ?? '3'] ?? model ?? OPENAI_MODEL;

export const createChatCompletion = async ({
  messages,
  temperature = 0.7,
  model = '3',
  signal,
}: ChatCompletionParams) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: resolveModel(model),
      temperature,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `OpenAI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('AI response did not include content');
  }
  return content;
};
