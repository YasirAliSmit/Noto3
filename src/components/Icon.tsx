import React from 'react';
import type { SvgProps } from 'react-native-svg';
import {
  Home,
  Clapperboard,
  Headphones,
  Settings as SettingsIcon,
  Search,
  Play,
  Pause,
  Heart,
  HeartOff,
  Volume2,
  VolumeX,
  PlayCircle,
  Radio,
  ListMusic,
  Music2,
  Download,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  MoreVertical,
  Shuffle,
  SkipForward,
  SkipBack,
  List,
  Share2,
  Tv,
  CalendarDays,
  Plus,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';

type IconComponentProps = SvgProps & {
  color?: string;
  size?: number | string;
  strokeWidth?: number;
};

type IconComponent = React.ComponentType<IconComponentProps>;

const components = {
  home: Home,
  videos: Clapperboard,
  audio: Headphones,
  settings: SettingsIcon,
  search: Search,
  play: Play,
  pause: Pause,
  heart: Heart,
  heartOff: HeartOff,
  volume: Volume2,
  volumeMute: VolumeX,
  playCircle: PlayCircle,
  radio: Radio,
  listMusic: ListMusic,
  music: Music2,
  download: Download,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  shuffle: Shuffle,
  skipForward: SkipForward,
  skipBack: SkipBack,
  list: List,
  share: Share2,
  tv: Tv,
  calendar: CalendarDays,
  plus: Plus,
  bookmark: Bookmark,
  bookmarkCheck: BookmarkCheck,
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof components;

type Props = {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export default function Icon({
  name,
  color = COLORS.text,
  size = 24,
  strokeWidth = 1.75,
}: Props) {
  const LucideComponent = components[name];
  if (!LucideComponent) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`Icon "${name}" is not registered in components map`);
    }
    return null;
  }
  return <LucideComponent color={color} size={size} strokeWidth={strokeWidth} />;
}
