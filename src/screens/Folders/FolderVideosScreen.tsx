import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import {
  CameraRoll,
  iosRequestReadWriteGalleryPermission,
  type PhotoIdentifier,
} from '@react-native-camera-roll/camera-roll';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';

import ScreenGradient from '../../components/ScreenGradient';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import type { AppStackParamList } from '../../navigation/types';
import Icon from '../../components/Icon';
import { useFavoriteVideosStore } from '../../store/useFavoriteVideosStore';

type Props = NativeStackScreenProps<AppStackParamList, 'FolderVideos'> & {
  hideBackButton?: boolean;
};

type VideoItem = {
  id: string;
  uri: string;
  title: string;
  duration?: number;
  thumbnailUri?: string;
};

type FetchState = 'idle' | 'loading' | 'ready' | 'error';
type PermissionState =
  | 'granted'
  | 'limited'
  | 'denied'
  | 'restricted'
  | 'notDetermined';

type PermissionResponse =
  | PermissionState
  | {
      status?: PermissionState | 'blocked' | 'unavailable' | 'not-determined';
    }
  | 'blocked'
  | 'unavailable'
  | 'not-determined'
  | undefined;

const PAGE_SIZE = 80;
const ROW_HEIGHT = 88;
const ROW_SPACING = 12;
const THUMB_SIZE = 64;
const CARD_RADIUS = 16;
const LIST_HORIZONTAL_PADDING = 20;
const LIST_VERTICAL_PADDING = 16;
const TITLE_COLOR = '#FFFFFF';
const SUBTITLE_COLOR = 'rgba(255, 255, 255, 0.7)';
const EMPTY_TEXT_COLOR = 'rgba(255, 255, 255, 0.82)';
const RETRY_BUTTON_HEIGHT = 44;
const RETRY_BUTTON_RADIUS = 12;
const RETRY_TEXT_COLOR = '#1D1B1E';

const VIDEO_EMPTY_MESSAGE = 'No videos found in this folder';
const PERMISSION_MESSAGE = 'Photo Library access is required to show your videos.';
const ERROR_MESSAGE = 'Unable to load videos. Please try again.';

const FolderVideosScreen: React.FC<Props> = ({ navigation, route, hideBackButton = false }) => {
  const { folderName } = route.params;
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('notDetermined');
  const [state, setState] = useState<FetchState>('idle');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const favorites = useFavoriteVideosStore((s) => s.favorites);
  const toggleFavorite = useFavoriteVideosStore((s) => s.toggleFavorite);
  const hasRequestedRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const isFunctionsEnabled = useFlags((s) => s.isFunctionsEnabled);
  const clickCount = useAppClickStore((s) => s.clickCount);
  const incrementClick = useAppClickStore((s) => s.incrementClick);
  const [showAd, setShowAd] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState(false);
  const runGatedAction = useGatedAction({
    isFunctionsEnabled,
    clickCount,
    incrementClick,
    setShowAd,
    setShowLoadingAlert,
  });
  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const normalizePermissionStatus = useCallback((result: PermissionResponse): PermissionState => {
    const rawStatus = typeof result === 'string' ? result : result?.status ?? 'notDetermined';
    switch (rawStatus) {
      case 'granted':
        return 'granted';
      case 'limited':
        return 'limited';
      case 'denied':
        return 'denied';
      case 'restricted':
        return 'restricted';
      case 'notDetermined':
        return 'notDetermined';
      case 'not-determined':
        return 'notDetermined';
      case 'blocked':
      case 'unavailable':
        return 'restricted';
      default:
        return 'notDetermined';
    }
  }, []);

  const requestPhotoPermission = useCallback(async () => {
    const requestPermissions = (
      CameraRoll as unknown as {
        requestPermissions?: (args: { accessLevel: 'read' }) => Promise<unknown>;
      }
    ).requestPermissions;

    if (requestPermissions) {
      const result = await requestPermissions({ accessLevel: 'read' });
      return normalizePermissionStatus(result as PermissionResponse);
    }

    const result = await iosRequestReadWriteGalleryPermission();
    return normalizePermissionStatus(result as PermissionResponse);
  }, [normalizePermissionStatus]);

  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds || Number.isNaN(seconds) || seconds <= 0) {
      return '00:00';
    }
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  const buildTitle = useCallback((node: PhotoIdentifier['node']) => {
    const filename = node.image.filename?.trim();
    if (filename) {
      return filename;
    }
    const uriParts = node.image.uri?.split('/') ?? [];
    return uriParts[uriParts.length - 1] || 'Untitled Video';
  }, []);

  const mapPhotoToVideo = useCallback(
    (edge: PhotoIdentifier): VideoItem => {
      const node = edge.node;
      return {
        id: node.image.uri,
        uri: node.image.uri,
        title: buildTitle(node),
        duration: node.image.playableDuration,
        thumbnailUri: node.image.uri,
      };
    },
    [buildTitle],
  );

  const fetchVideos = useCallback(async () => {
    if (isMountedRef.current) {
      setState('loading');
    }
    try {
      const response = await CameraRoll.getPhotos({
        first: PAGE_SIZE,
        assetType: 'Videos',
        groupTypes: 'All',
        groupName: folderName,
        include: ['filename', 'playableDuration'],
      });
      const mapped = response.edges.map(mapPhotoToVideo);
      if (isMountedRef.current) {
        setVideos(mapped);
        setState('ready');
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState('error');
      }
    }
  }, [folderName, mapPhotoToVideo]);

  const requestPermissionAndLoad = useCallback(async () => {
    if (requestInFlightRef.current) {
      return;
    }
    requestInFlightRef.current = true;
    if (isMountedRef.current) {
      setState('loading');
    }
    try {
      const status = await requestPhotoPermission();
      if (isMountedRef.current) {
        setPermissionStatus(status);
      }
      if (status === 'granted' || status === 'limited') {
        await fetchVideos();
      } else if (isMountedRef.current) {
        setVideos([]);
        setState('ready');
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState('error');
      }
    } finally {
      requestInFlightRef.current = false;
    }
  }, [fetchVideos, requestPhotoPermission]);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;
    requestPermissionAndLoad();
  }, [requestPermissionAndLoad]);

  const handleRetry = useCallback(() => {
    requestPermissionAndLoad();
  }, [requestPermissionAndLoad]);

  const handlePressVideo = useCallback(
    (item: VideoItem) => {
      runGatedAction(() => {
        navigation.navigate('FolderVideoPlayer', {
          uri: item.uri,
          title: item.title,
        });
      });
    },
    [navigation, runGatedAction],
  );

  const keyExtractor = useCallback((item: VideoItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<VideoItem> | null | undefined, index: number) => ({
      length: ROW_HEIGHT + ROW_SPACING,
      offset: (ROW_HEIGHT + ROW_SPACING) * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
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
            toggleFavorite({
              id: item.id,
              uri: item.uri,
              title: item.title,
              duration: item.duration,
              thumbnailUri: item.thumbnailUri,
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Toggle favorite"
          hitSlop={8}
          style={styles.favoriteButton}
        >
          <Icon
            name={favoriteIds.has(item.id) ? 'heart' : 'heartOff'}
            color={favoriteIds.has(item.id) ? '#FF4D6D' : '#FFFFFF'}
            size={20}
          />
        </Pressable>
      </Pressable>
    ),
    [favoriteIds, formatDuration, handlePressVideo, toggleFavorite],
  );

  const emptyState = useMemo(() => {
    if (state === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.emptyText}>Loading videos...</Text>
        </View>
      );
    }

    if (state === 'error') {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{ERROR_MESSAGE}</Text>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (permissionStatus !== 'granted' && permissionStatus !== 'limited') {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{PERMISSION_MESSAGE}</Text>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Grant Access</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{VIDEO_EMPTY_MESSAGE}</Text>
      </View>
    );
  }, [handleRetry, permissionStatus, state]);

  return (
    <ScreenGradient style={styles.container}>
      <View style={styles.header}>
        {!hideBackButton ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {folderName}
          </Text>
          <Text style={styles.headerSubtitle}>Videos</Text>
        </View>
      </View>
      <FlatList
        data={videos}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={[styles.listContent, videos.length === 0 && styles.flexGrow]}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={7}
        maxToRenderPerBatch={12}
        removeClippedSubviews
      />

      {showAd && (
        <ApexEventInterstitial
          onAdLoaded={(ad) => {
            setShowLoadingAlert(false);
            setTimeout(() => {
              ad
                .show()
                .catch((e) => {
                  console.log('Ad Show Error:', e);
                  setShowLoadingAlert(false);
                  setShowAd(false);
                });
            }, 1000);
          }}
          onAdClosed={() => {
            setShowAd(false);
            setShowLoadingAlert(false);
          }}
        />
      )}

      {showLoadingAlert && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalText}>Loading ads...</Text>
            </View>
          </View>
        </Modal>
      )}
    </ScreenGradient>
  );
};

export default FolderVideosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: TITLE_COLOR,
    fontSize: 18,
    fontWeight: '600',
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
  retryButton: {
    marginTop: 16,
    height: RETRY_BUTTON_HEIGHT,
    paddingHorizontal: 18,
    borderRadius: RETRY_BUTTON_RADIUS,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: RETRY_TEXT_COLOR,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  modalText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
});
