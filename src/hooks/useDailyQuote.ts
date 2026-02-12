import { useCallback, useEffect, useState } from 'react';

import { DailyQuote, getDailyQuote } from '../services/quoteService';

type DailyQuoteState = {
  quote: DailyQuote | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useDailyQuote = (): DailyQuoteState => {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuote = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const nextQuote = await getDailyQuote(forceRefresh);
      setQuote(nextQuote);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch daily quote';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const refresh = useCallback(async () => {
    await loadQuote(true);
  }, [loadQuote]);

  return {
    quote,
    loading,
    error,
    refresh,
  };
};
