const env = typeof process !== 'undefined' ? process.env : undefined;
const OPENAI_API_URL = env?.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = env?.OPENAI_MODEL ?? 'gpt-3.5-turbo';
const OPENAI_API_KEY = "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"
export { OPENAI_API_KEY, OPENAI_API_URL, OPENAI_MODEL };
