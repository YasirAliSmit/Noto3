import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createThumbnail } from 'react-native-create-thumbnail'
import LinearGradient from 'react-native-linear-gradient';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
} from 'react-native-permissions';
import { Play, Settings as SettingsIcon } from 'lucide-react-native';
import BackButton from '../../components/BackButton';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';


const THUMB_AVAILABLE = !!(require('react-native').NativeModules?.CreateThumbnail);

type FetchOptions = {
  isRefresh?: boolean;
};
type VideoNode = {
  id: string;
  type: 'video' | string;
  group_name?: string[] | string;
  subTypes?: any[];
  location?: any | null;
  sourceType?: string;
  timestamp: number; // seconds
  modificationTimestamp?: number; // seconds (may be float)
  image: {
    uri: string; // e.g., ph://...
    filename?: string; // e.g., IMG_0619.MOV
    fileSize?: number; // bytes
    width?: number;
    height?: number;
    playableDuration?: number; // seconds
    extension?: string; // e.g., mov
  };
  thumb?: string; // generated local thumbnail path
};
 
 
 
const AuroraVideoGallery: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, dark } = theme;
  const secondaryTextColor = dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [videos, setVideos] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState(false);
  const isFunctionsEnabled = useFlags((s) => s.isFunctionsEnabled);
  const clickCount = useAppClickStore((s) => s.clickCount);
  const incrementClick = useAppClickStore((s) => s.incrementClick);
  const runGatedAction = useGatedAction({
    isFunctionsEnabled,
    clickCount,
    incrementClick,
    setShowAd,
    setShowLoadingAlert,
  });

  // Function to handle sharing the app
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const granted = await checkAndRequestFilePermissions();
      if (granted) await fetchVideos()
      setLoading(false);
    };
    init();
  }, []);

  const checkAndRequestFilePermissions = async () => {
    console.log('Platform.Version!!', typeof Platform.Version);

    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
        android:
          Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      });

      if (!permission) {
        console.log('Permission not applicable for this platform.');
        return false;
      }

      const currentStatus = await check(permission);

      console.log('Current Permission Status:', currentStatus); // Debugging log

      switch (currentStatus) {
        case RESULTS.GRANTED:
          console.log('Permission already granted.');
          return true;
        case RESULTS.DENIED:
          console.log('Permission denied. Requesting permission...');
          return await requestFilePermissions(permission);

        case RESULTS.BLOCKED:
          console.log('Permission is blocked.');
          Alert.alert(
            t('permissions.blockedTitle'),
            t('permissions.blockedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.openSettings'),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
          return false;

        case RESULTS.LIMITED:
          console.log('Limited permission granted.');
          Alert.alert(
            t('permissions.limitedTitle'),
            t('permissions.limitedMessage'),
          );
          return true;

        case RESULTS.UNAVAILABLE:
          console.log('Permission is unavailable on this device.');
          return false;

        default:
          console.log('Unknown permission status.');
          return false;
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const requestFilePermissions = async (permission: any) => {
    try {
      const result = await request(permission);

      console.log('Permission Request Result:', result); // Debugging log

      switch (result) {
        case RESULTS.GRANTED:
          console.log('Permission granted.');
          return true;

        case RESULTS.DENIED:
          Alert.alert(
            t('permissions.deniedTitle'),
            t('permissions.deniedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.openSettings'),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
          return false;

        case RESULTS.BLOCKED:
          Alert.alert(
            t('permissions.blockedTitle'),
            t('permissions.blockedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.openSettings'),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
          return false;

        case RESULTS.LIMITED:
          Alert.alert(
            t('permissions.limitedTitle'),
            t('permissions.limitedMessage'),
          );
          return true;

        case RESULTS.UNAVAILABLE:
          return false;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  };
  const normalizeThumbSource = (uri?: string): string | undefined => {
    if (!uri) return undefined;
    // Android accepts content:// or file://
    if (Platform.OS === 'android') {
      if (uri.startsWith('content://') || uri.startsWith('file://')) return uri;
      // If it's a raw path, prefix with file://
      return `file://${uri}`;
    }
    // iOS: library often returns ph:// which many libs can't read directly.
    // create-thumbnail sometimes handles ph://, but if not, prefer file:// when available.
    if (uri.startsWith('file://')) return uri;
    if (uri.startsWith('ph://')) return uri; // try as-is; if it fails we'll catch and skip
    return uri;
  };

  const makeNodeThumbnail = async (node: VideoNode): Promise<string | undefined> => {
    if (!THUMB_AVAILABLE) {
      // Library not linked / not available (avoid crash)
      return undefined;
    }
    try {
      const src = normalizeThumbSource(node?.image?.uri || node?.id);
      if (!src) return undefined;
      const result = await createThumbnail({
        url: src,
        timeStamp: 3000,
      });
      return result?.path || result?.uri || undefined;
    } catch (e) {
      // Some iOS ph:// assets may fail. Silently ignore; we'll fall back to Photos preview
      console.log('Thumbnail generation skipped/failed for', node?.image?.filename, e?.message);
      return undefined;
    }
  };
  const mapNodeToany = (node: VideoNode): any | null => {
    const rawUri =
      typeof node?.image?.uri === 'string' && node.image.uri.length > 0
        ? node.image.uri
        : undefined;
    const fallbackUri =
      Platform.OS === 'ios' &&
        typeof node?.id === 'string' &&
        node.id.length > 0 &&
        !rawUri
        ? `ph://${node.id}`
        : undefined;
    const assetUri = rawUri ?? fallbackUri;
    if (!assetUri) {
      return null;
    }

    const normalizedThumb =
      normalizeThumbSource(node.thumb) ?? normalizeThumbSource(rawUri);

    const filenameCandidate =
      typeof node?.image?.filename === 'string' && node.image.filename.length > 0
        ? node.image.filename
        : assetUri.split('/').pop() ?? 'video.mp4';

    const playableDuration = Number(node?.image?.playableDuration);
    const duration = Number.isFinite(playableDuration)
      ? Math.max(0, Math.round(playableDuration))
      : 0;

    const iosLocalIdentifier =
      Platform.OS === 'ios' &&
        typeof node?.id === 'string' &&
        node.id.length > 0
        ? node.id
        : undefined;
    const iosFilename =
      Platform.OS === 'ios' &&
        typeof node?.image?.filename === 'string' &&
        node.image.filename.length > 0
        ? node.image.filename
        : undefined;
    const iosMetadata =
      iosLocalIdentifier || iosFilename
        ? {
          ...(iosLocalIdentifier ? { localIdentifier: iosLocalIdentifier } : {}),
          ...(iosFilename ? { filename: iosFilename } : {}),
        }
        : undefined;

    return {
      id: iosLocalIdentifier ?? assetUri,
      uri: assetUri,
      thumbnailUri: normalizedThumb ?? null,
      filename: filenameCandidate,
      duration,
      ...(iosMetadata ? { ios: iosMetadata } : {}),
    };
  };
  const fetchVideos = async ({ isRefresh }: FetchOptions = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const phoneGalleryVideos = await CameraRoll.getPhotos({
        first: 700,
        assetType: 'Videos',
        include: ['filename', 'fileSize', 'playableDuration', 'imageSize', 'location'],
      });
      const nodes: VideoNode[] = (phoneGalleryVideos?.edges || []).map((edge: any) => edge?.node as VideoNode).filter(Boolean);

      // Render list immediately (without thumbs) so UI doesn't stall
      const normalized = nodes
        .map(mapNodeToany)
        .filter((item): item is any => Boolean(item));
      setVideos(normalized);

      let withThumbs: VideoNode[] = nodes;
      if (THUMB_AVAILABLE) {
        // Begin thumbnail generation with progress overlay
        setIsGenerating(true);
        const results = await Promise.allSettled(
          nodes.map(async (n) => {
            const t = await makeNodeThumbnail(n);
            return { ...n, thumb: t } as VideoNode;
          })
        );

        withThumbs = results.map((r, i) => (r.status === 'fulfilled' && r.value ? r.value : nodes[i]));
      }

      const normalizedWithThumbs = withThumbs
        .map(mapNodeToany)
        .filter((item): item is any => Boolean(item));

      setVideos(normalizedWithThumbs);
      console.log('Loaded local videos', normalizedWithThumbs.length);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsGenerating(false);
      setRefreshing(false);
    }
  };


  const handleRefresh = () => {
    fetchVideos({ isRefresh: true });
  };

 

  const navigateToVideo = useCallback(
    async (video: any) => {
      runGatedAction(() => {
        navigation.navigate('PrismStreamTheater', {
          videoUri: video.uri,
          title: video.filename,
          video,
        });
      });
    },
    [navigation, runGatedAction],
  );

  

  const formatDuration = useCallback((seconds: number = 0) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, '0');
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }, []);

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
          {t('videos.empty')}
        </Text>
      </View>
    ),
    [secondaryTextColor, t],
  );

  const videoCardBackground = colors.card ?? 'rgba(255,255,255,0.03)';

  const allVideos = useMemo(() => videos || [], [videos]);

  const renderVideoItem = useCallback(
    ({ item }: { item: any }) => {
      if (!item?.uri) return null;

      const thumbnailUri = item?.thumbnailUri || item?.uri;

      return (
        <TouchableOpacity
          style={styles.videoItem}
          onPress={() => navigateToVideo(item)}
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel={item?.filename}
        >
          <ImageBackground
            source={{ uri: thumbnailUri }}
            style={styles.thumbnail}
            imageStyle={styles.thumbnailImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
              style={styles.gradient}
            />

            <View style={styles.playIconContainer}>
              <View style={[styles.playIcon, { backgroundColor: colors.primary }]}>
                <Play size={20} color="#FFF" fill="#FFF" />
              </View>
            </View>

            <View style={styles.durationBadgeContainer}>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(item?.duration)}</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.videoInfo}>
            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
              {item?.filename}
            </Text>
            <Text style={[styles.videoMeta, { color: secondaryTextColor }]}>
              Tap to play
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [
      colors.primary,
      colors.text,
      formatDuration,
      navigateToVideo,
      secondaryTextColor,
    ],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => String(item?.id ?? item?.uri ?? `video-${index}`),
    [],
  );

  const shouldShowLoader = loading || refreshing;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
           <BackButton
            style={styles.backButton}
            accessibilityLabel={t('common.back', 'Back')}
          />
          <Text style={[styles.title, { color: colors.text }]}>{t('videos.title')}</Text>
        </View>
        <Text
          style={[styles.subtitle, { color: secondaryTextColor }]}
          numberOfLines={2}
        >
          {t('videos.subtitle')}
        </Text>
      </View>

      {shouldShowLoader ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loaderText, { color: secondaryTextColor }]}>
            {t('videos.loading')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={allVideos}
          keyExtractor={keyExtractor}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={!loading && !refreshing ? emptyComponent : null}
        />
      )}

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
              <Text style={styles.modalText}>{t('common.adsLoading')}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    opacity: 0.7,
  },
  backButton: {
    marginRight: 12,
    marginBottom: 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  videoItem: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  thumbnail: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  durationBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  videoInfo: {
    padding: 16,
    gap: 6,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  videoMeta: {
    fontSize: 13,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
});

export default AuroraVideoGallery;
