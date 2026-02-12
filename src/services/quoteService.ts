import AsyncStorage from '@react-native-async-storage/async-storage';

import { OPENAI_API_KEY, OPENAI_API_URL, OPENAI_MODEL } from '../config/openai';
import { quoteData, QuoteEntry } from '../data/localData';

const STORAGE_KEY = '@turn-player/daily-quote';
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export type DailyQuote = {
  id: string;
  quoteName: string;
  text: string;
  author: string;
  category: string;
  source: 'openai' | 'local';
  fetchedAt: number;
};

const sanitizeText = (value: string): string =>
  value?.replace(/^['"\s]+|['"\s]+$/g, '').trim();

const pickLocalQuote = (): DailyQuote => {
  const fallback: QuoteEntry = quoteData[Math.floor(Math.random() * quoteData.length)];
  const fetchedAt = Date.now();
  return {
    id: fallback.id,
    quoteName: fallback.quoteName,
    text: fallback.text,
    author: fallback.author,
    category: fallback.category,
    source: 'local',
    fetchedAt,
  };
};

const parseOpenAIContent = (content: string) => {
  const trimmed = content?.trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return { text: sanitizeText(trimmed) };
  }
};

const fetchQuoteFromOpenAI = async (): Promise<DailyQuote> => {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY.');
  }

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.7,
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content:
          'You return uplifting quotes formatted strictly as JSON with keys quoteName, text, author, and category. Keep answers concise.',
      },
      {
        role: 'user',
        content:
          'Return one fresh motivational quote. Use unique wording and respond only with JSON in the requested shape.',
      },
    ],
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `OpenAI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new Error('OpenAI response did not include content.');
  }

  const parsed = parseOpenAIContent(content);
  const fetchedAt = Date.now();

  return {
    id: `openai-${fetchedAt}`,
    quoteName: parsed.quoteName || parsed.quoteTitle || 'Daily Inspiration',
    text: sanitizeText(parsed.text || parsed.quote || content),
    author: parsed.author || 'Unknown',
    category: parsed.category || 'Daily',
    source: 'openai',
    fetchedAt,
  };
};

const getCachedQuote = async (): Promise<DailyQuote | null> => {
  const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!cachedRaw) {
    return null;
  }

  try {
    const parsed: DailyQuote = JSON.parse(cachedRaw);
    if (!parsed?.fetchedAt || Date.now() - parsed.fetchedAt > ONE_DAY_IN_MS) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

export const getDailyQuote = async (forceRefresh = false): Promise<DailyQuote> => {
  if (!forceRefresh) {
    const cached = await getCachedQuote();
    if (cached) {
      return cached;
    }
  }

  try {
    const fresh = await fetchQuoteFromOpenAI();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[daily-quote] Falling back to local quote', message);
    const fallback = pickLocalQuote();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

export const clearDailyQuoteCache = () => AsyncStorage.removeItem(STORAGE_KEY);
