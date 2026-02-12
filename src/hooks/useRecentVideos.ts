import { useCallback, useEffect, useState } from 'react';

import { RecentVideo, getRecentVideos } from '../services/recentVideos';

export const useRecentVideos = () => {
  const [videos, setVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    const list = await getRecentVideos();
    setVideos(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return { videos, loading, refresh: loadVideos };
};
