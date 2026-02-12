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

type Props = NativeStackScreenProps<AppStackParamList, 'FolderImages'>;

type ImageItem = {
  id: string;
  uri: string;
  title: string;
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
const ALL_FOLDERS_NAME = 'All Folders';

const IMAGE_EMPTY_MESSAGE = 'No photos found on this device';
const PERMISSION_MESSAGE = 'Photo Library access is required to show your photos.';
const ERROR_MESSAGE = 'Unable to load photos. Please try again.';

const FolderImagesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { folderName } = route.params;
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('notDetermined');
  const [state, setState] = useState<FetchState>('idle');
  const [images, setImages] = useState<ImageItem[]>([]);
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

  const buildTitle = useCallback((node: PhotoIdentifier['node']) => {
    const filename = node.image.filename?.trim();
    if (filename) {
      return filename;
    }
    const uriParts = node.image.uri?.split('/') ?? [];
    return uriParts[uriParts.length - 1] || 'Untitled Photo';
  }, []);

  const mapPhotoToImage = useCallback(
    (edge: PhotoIdentifier): ImageItem => {
      const node = edge.node;
      return {
        id: node.image.uri,
        uri: node.image.uri,
        title: buildTitle(node),
      };
    },
    [buildTitle],
  );

  const fetchImages = useCallback(async () => {
    if (isMountedRef.current) {
      setState('loading');
    }
    try {
      const response = await CameraRoll.getPhotos({
        first: PAGE_SIZE,
        assetType: 'Photos',
        groupTypes: 'All',
        ...(folderName !== ALL_FOLDERS_NAME ? { groupName: folderName } : {}),
        include: ['filename'],
      });
      const mapped = response.edges.map(mapPhotoToImage);
      if (isMountedRef.current) {
        setImages(mapped);
        setState('ready');
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState('error');
      }
    }
  }, [mapPhotoToImage]);

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
        await fetchImages();
      } else if (isMountedRef.current) {
        setImages([]);
        setState('ready');
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState('error');
      }
    } finally {
      requestInFlightRef.current = false;
    }
  }, [fetchImages, requestPhotoPermission]);

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

  const keyExtractor = useCallback((item: ImageItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<ImageItem> | null | undefined, index: number) => ({
      length: ROW_HEIGHT + ROW_SPACING,
      offset: (ROW_HEIGHT + ROW_SPACING) * index,
      index,
    }),
    [],
  );

  const handlePressImage = useCallback(
    (item: ImageItem) => {
      runGatedAction(() => {
        navigation.navigate('FolderImageViewer', {
          uri: item.uri,
          title: item.title,
        });
      });
    },
    [navigation, runGatedAction],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ImageItem>) => (
      <Pressable style={styles.card} onPress={() => handlePressImage(item)}>
        <View style={styles.thumbnailWrapper}>
          {item.uri ? (
            <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailFallback} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.subtitle}>{folderName}</Text>
        </View>
      </Pressable>
    ),
    [folderName, handlePressImage],
  );

  const emptyState = useMemo(() => {
    if (state === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.emptyText}>Loading photos...</Text>
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
        <Text style={styles.emptyText}>{IMAGE_EMPTY_MESSAGE}</Text>
      </View>
    );
  }, [handleRetry, permissionStatus, state]);

  return (
    <ScreenGradient style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {folderName}
          </Text>
          <Text style={styles.headerSubtitle}>Images</Text>
        </View>
      </View>
      <FlatList
        data={images}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={[styles.listContent, images.length === 0 && styles.flexGrow]}
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

export default FolderImagesScreen;

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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
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
