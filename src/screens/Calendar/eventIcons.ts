import { EventIconKey } from '../../store/calendarStore';

export const EVENT_ICON_MAP: Record<EventIconKey, { emoji: string; label: string }> = {
  idea: { emoji: '💡', label: 'Idea' },
  instagram: { emoji: '📸', label: 'Instagram' },
  telegram: { emoji: '📨', label: 'Telegram' },
  x: { emoji: '✖️', label: 'X' },
  youtube: { emoji: '▶️', label: 'YouTube' },
  vk: { emoji: '🟦', label: 'VK' },
  compass: { emoji: '🧭', label: 'Compass' },
  facebook: { emoji: '📘', label: 'Facebook' },
  tiktok: { emoji: '🎬', label: 'TikTok' },
};

export const DEFAULT_EVENT_ICON: EventIconKey = 'idea';
