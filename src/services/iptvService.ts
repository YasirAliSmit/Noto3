const CHANNELS_ENDPOINT = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_ENDPOINT = 'https://iptv-org.github.io/api/streams.json';

export type Channel = {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  subdivision?: string;
  city?: string;
  is_nsfw?: boolean;
  categories?: string[];
  languages?: string[];
  broadcast_area?: string[];
  website?: string;
};

export type Stream = {
  channel: string;
  url: string;
  status?: string;
  http_referrer?: string;
  user_agent?: string;
  headers?: Record<string, string>;
  bitrate?: number;
  codec?: string;
};

const loadJson = async <T>(endpoint: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`IPTV request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const fetchChannels = async (signal?: AbortSignal): Promise<Channel[]> =>
  loadJson<Channel[]>(CHANNELS_ENDPOINT, signal);

export const fetchStreams = async (signal?: AbortSignal): Promise<Stream[]> =>
  loadJson<Stream[]>(STREAMS_ENDPOINT, signal);

export const fetchChannelStreams = async (channelId: string, signal?: AbortSignal): Promise<Stream[]> => {
  if (!channelId) {
    return [];
  }
  const streams = await fetchStreams(signal);
  return streams.filter((stream) => stream.channel === channelId);
};
