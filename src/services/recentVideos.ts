import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecentVideo = {
  id: string;
  uri: string;
  thumbnailUri?: string | null;
  filename: string;
  duration?: number;
  lastPlayedAt: number;
};

const STORAGE_KEY = '@turn-player/recent-videos';
const MAX_RECENT = 20;

const normalizeVideo = (video: any): RecentVideo | null => {
  if (!video?.id && !video?.uri) {
    return null;
  }
  const identifier = String(video?.id ?? video?.uri);
  return {
    id: identifier,
    uri: String(video?.uri ?? ''),
    thumbnailUri: video?.thumbnailUri ?? null,
    filename: video?.filename ?? 'Untitled video',
    duration: typeof video?.duration === 'number' ? video.duration : undefined,
    lastPlayedAt: Date.now(),
  };
};

export const saveRecentVideo = async (rawVideo: any): Promise<void> => {
  const normalized = normalizeVideo(rawVideo);
  if (!normalized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const list: RecentVideo[] = stored ? JSON.parse(stored) : [];
    const filtered = Array.isArray(list)
      ? list.filter((item) => item.id !== normalized.id)
      : [];
    const updated = [normalized, ...filtered].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('[recent-videos] Unable to save recent video', error);
  }
};

export const getRecentVideos = async (): Promise<RecentVideo[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const list: RecentVideo[] = JSON.parse(stored);
    if (!Array.isArray(list)) {
      return [];
    }
    return list;
  } catch (error) {
    console.warn('[recent-videos] Unable to read storage', error);
    return [];
  }
};

export const clearRecentVideos = () => AsyncStorage.removeItem(STORAGE_KEY);
