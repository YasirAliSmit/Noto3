import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenGradient from '../components/ScreenGradient';
import Icon from '../components/Icon';
import type { AppStackParamList } from '../navigation/types';
import { useFavoriteVideosStore, type FavoriteVideo } from '../store/useFavoriteVideosStore';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

const ROW_HEIGHT = 88;
const ROW_SPACING = 12;
const THUMB_SIZE = 64;
const CARD_RADIUS = 16;
const LIST_HORIZONTAL_PADDING = 20;
const LIST_VERTICAL_PADDING = 16;
const TITLE_COLOR = '#FFFFFF';
const SUBTITLE_COLOR = 'rgba(255, 255, 255, 0.7)';
const EMPTY_TEXT_COLOR = 'rgba(255, 255, 255, 0.82)';

const formatDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds) || seconds <= 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function FavoriteVideosScreen() {
  const navigation = useNavigation<Navigation>();
  const favorites = useFavoriteVideosStore((s) => s.favorites);
  const removeFavorite = useFavoriteVideosStore((s) => s.removeFavorite);

  const data = useMemo(() => favorites, [favorites]);

  const handlePressVideo = useCallback(
    (item: FavoriteVideo) => {
      navigation.navigate('FolderVideoPlayer', {
        uri: item.uri,
        title: item.title,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FavoriteVideo>) => (
      <Pressable style={styles.card} onPress={() => handlePressVideo(item)}>
        <View style={styles.thumbnailWrapper}>
          {item.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailFallback} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.subtitle}>{formatDuration(item.duration)}</Text>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            removeFavorite(item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel="Remove favorite"
          hitSlop={8}
          style={styles.favoriteButton}
        >
          <Icon name="heart" color="#FF4D6D" size={20} />
        </Pressable>
      </Pressable>
    ),
    [handlePressVideo, removeFavorite],
  );

  return (
    <ScreenGradient style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>Your saved videos</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, data.length === 0 && styles.flexGrow]}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No favorites yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={7}
        maxToRenderPerBatch={12}
        removeClippedSubviews
      />
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    color: TITLE_COLOR,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: SUBTITLE_COLOR,
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingVertical: LIST_VERTICAL_PADDING,
  },
  flexGrow: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: ROW_SPACING,
  },
  thumbnailWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 14,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: TITLE_COLOR,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontSize: 13,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: EMPTY_TEXT_COLOR,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
});
