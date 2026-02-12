import React, { useMemo, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Play } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';

import AppText from './AppText';

export interface VideoNode {
  type?: string;
  group_name?: string | string[];
  image: { uri: string; filename?: string; width?: number; height?: number };
  id?: string;
  playableDuration?: number;
  fileSize?: number;
  thumb?: string;
  timestamp?: number;
  modificationTimestamp?: number;
}

const fmtTime = (secs?: number) => {
  if (!secs || !isFinite(secs) || secs < 0) {
    return '00:00';
  }
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((secs / 60) % 60)
    .toString()
    .padStart(2, '0');
  const h = Math.floor(secs / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const fmtBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[idx]}`;
};

export type VideoCardVariant = 'default' | 'videos';

type VideoCardProps = {
  video: VideoNode;
  onPress: (video: VideoNode) => void;
  variant?: VideoCardVariant;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VideoCard: React.FC<VideoCardProps> = ({ video, onPress, variant = 'default' }) => {
  const { colors, dark } = useTheme();
  const palette = useMemo(() => createPalette(colors, dark), [colors, dark]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const uri = video.thumb ?? video.image?.uri;
  const title = video.image?.filename ?? video.image?.uri?.split('/')?.pop() ?? 'Video';
  const isVideosVariant = variant === 'videos';
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isVideosVariant) {
      return;
    }
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    if (!isVideosVariant) {
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={() => onPress(video)}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title}`}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={
        Platform.OS === 'android' && !isVideosVariant
          ? { color: 'rgba(255,255,255,0.1)' }
          : undefined
      }
      style={({ pressed }) => [
        styles.card,
        isVideosVariant ? styles.videosCard : undefined,
        pressed && Platform.OS === 'ios' && !isVideosVariant ? styles.cardPressed : undefined,
        isVideosVariant ? { transform: [{ scale }] } : undefined,
      ]}
    >
      <View
        style={[
          styles.thumbnailWrapper,
          isVideosVariant ? styles.videosThumbWrapper : styles.defaultThumbWrapper,
        ]}
      >
        <ImageBackground
          source={uri ? { uri } : undefined}
          style={styles.thumbnailImage}
          imageStyle={[
            styles.thumbnailImageStyle,
            isVideosVariant ? styles.videosThumbnailImage : styles.defaultThumbnailImage,
          ]}
        >
          {isVideosVariant ? (
            <LinearGradient
              colors={palette.overlayGradient}
              style={styles.videosOverlay}
              pointerEvents="none"
            />
          ) : (
            <View style={styles.overlay} pointerEvents="none" />
          )}
          <View style={styles.playBadgeWrapper}>
            <View style={[styles.playBadge, isVideosVariant ? styles.videosPlayBadge : undefined]}>
              <Play size={isVideosVariant ? 16 : 14} color={palette.iconOnAccent} />
            </View>
          </View>
        </ImageBackground>
      </View>
      <View style={[styles.metaSection, isVideosVariant ? styles.videosMeta : undefined]}>
        <AppText
          variant="body"
          style={[styles.title, isVideosVariant ? styles.videosTitle : undefined]}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {isVideosVariant ? (
          <View style={styles.videosMetaRow}>
            <AppText variant="caption" style={[styles.subtitle, styles.videosSubtitle]}>
              {fmtTime(video.playableDuration)}
            </AppText>
            <View style={styles.dot} />
            <AppText variant="caption" style={[styles.subtitle, styles.videosSubtitle]}>
              {fmtBytes(video.fileSize)}
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" style={styles.subtitle}>
            {fmtTime(video.playableDuration)} • {fmtBytes(video.fileSize)}
          </AppText>
        )}
      </View>
    </AnimatedPressable>
  );
};

type Palette = {
  accent: string;
  accentMuted: string;
  cardBackground: string;
  surface: string;
  overlay: string;
  overlayGradient: string[];
  textPrimary: string;
  textSecondary: string;
  iconOnAccent: string;
  border: string;
};

const createPalette = (themeColors: Record<string, string>, dark?: boolean): Palette => {
  const accent = themeColors?.primary ?? '#FE2B54';
  const textPrimary = themeColors?.text ?? '#FFFFFF';
  const overlay = dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';

  return {
    accent,
    accentMuted: themeColors?.notification ?? '#28F4EB',
    cardBackground: themeColors?.card ?? (dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
    surface: themeColors?.border ?? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    overlay,
    overlayGradient: ['rgba(4,4,4,0.05)', overlay],
    textPrimary,
    textSecondary: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
    iconOnAccent: themeColors?.background ?? '#050505',
    border: themeColors?.border ?? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
  };
};

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    card: {
      width: 140,
    },
    cardPressed: {
      opacity: 0.8,
    },
    thumbnailWrapper: {
      overflow: 'hidden',
      backgroundColor: palette.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    defaultThumbWrapper: {
      width: 140,
      height: 90,
      borderRadius: 16,
    },
    videosThumbWrapper: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 14,
    },
    thumbnailImage: {
      flex: 1,
      width: '100%',
    },
    thumbnailImageStyle: {
      resizeMode: 'cover',
    },
    defaultThumbnailImage: {
      borderRadius: 16,
    },
    videosThumbnailImage: {
      borderRadius: 14,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.overlay,
    },
    videosOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    playBadgeWrapper: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videosPlayBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.accentMuted,
    },
    metaSection: {
      marginTop: 8,
    },
    videosMeta: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      marginTop: 0,
    },
    title: {
      color: palette.textPrimary,
    },
    videosTitle: {
      fontWeight: '600',
      marginBottom: 8,
    },
    subtitle: {
      color: palette.textSecondary,
      marginTop: 4,
    },
    videosSubtitle: {
      marginTop: 0,
    },
    videosMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.textSecondary,
      opacity: 0.6,
      marginHorizontal: 6,
    },
    videosCard: {
      width: '100%',
      borderRadius: 14,
      backgroundColor: palette.cardBackground,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: Platform.OS === 'android' ? 4 : 0,
      overflow: 'hidden',
    },
  });

export default VideoCard;
