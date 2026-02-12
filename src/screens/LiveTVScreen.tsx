import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, RefreshCw, Tv2 } from 'lucide-react-native';
import {
  fetchChannels,
  fetchStreams,
  Channel,
  Stream,
} from '../services/iptvService';
import ApexEventInterstitial from '../components/ApexEventInterstitial';
import BackButton from '../components/BackButton';
import AppText from '../components/AppText';
import useGatedAction from '../components/useGatedAction';
import { useFlags } from '../hooks/featureFlags';
import { useAppClickStore } from '../components/HelperFunction';
import { useTranslation } from 'react-i18next';
import { IMAGES } from '../Images';
import ScreenGradient from '../components/ScreenGradient';

type Navigation = NativeStackNavigationProp<any>;

type ChannelEntry = {
  channel: Channel;
  stream: Stream;
};

const MIN_VISIBLE_CHANNELS = 10;
const TARGET_CHANNELS = 18;
const MAX_STREAM_SCAN = 15000;
const allowedExtensions = [
  '.m3u8',
  '.mp4',
  '.mp3',
  '.aac',
  '.flv',
  '.ogg',
  '.opus',
  '.ts',
];
const blockedExtensions = ['.mpd'];

const FALLBACK_CHANNELS: ChannelEntry[] = [
  {
    channel: {
      id: 'fallback-li-live',
      name: 'Li Live',
      country: 'US',
      categories: ['general'],
      logo: undefined,
    },
    stream: {
      channel: 'fallback-li-live',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-nasa',
      name: 'NASA Live',
      country: 'US',
      categories: ['science'],
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
    },
    stream: {
      channel: 'fallback-nasa',
      url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-Public/master.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-redbull',
      name: 'Red Bull TV',
      country: 'US',
      categories: ['sports'],
      logo: 'https://static.redbull.com/assets/redbulltv/redbulltv-logo.png',
    },
    stream: {
      channel: 'fallback-redbull',
      url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_3360.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-pluto-news',
      name: 'Pluto News',
      country: 'US',
      categories: ['news'],
    },
    stream: {
      channel: 'fallback-pluto-news',
      url: 'https://service-stitcher.clusters.pluto.tv/v1/stitch/embed/hls/channel/5ca672e8738d0421e15aabff/master.m3u8?deviceId=web&deviceMake=web&deviceModel=web',
    },
  },
  {
    channel: {
      id: 'fallback-dw',
      name: 'DW English',
      country: 'DE',
      categories: ['news'],
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Deutsche_Welle_symbol_2012.svg',
    },
    stream: {
      channel: 'fallback-dw',
      url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-bloomberg',
      name: 'Bloomberg Quicktake',
      country: 'US',
      categories: ['business'],
    },
    stream: {
      channel: 'fallback-bloomberg',
      url: 'https://d1e7h2jnv8ied5.cloudfront.net/out/v1/61c0b4b0a49e4a87908c4acdaa0a5f19/index.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-lofi',
      name: 'LoFi Chill Radio',
      country: 'INT',
      categories: ['music'],
    },
    stream: {
      channel: 'fallback-lofi',
      url: 'https://cdn2.justcast.com/codergmetal_1/playlist.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-bbc-learning',
      name: 'Learning English',
      country: 'UK',
      categories: ['education'],
    },
    stream: {
      channel: 'fallback-bbc-learning',
      url: 'https://llnw.live.bbc.co.uk/s1/live/bbc_news_uk/bbc_news_uk.isml/manifest.m3u8',
    },
  },
  {
    channel: {
      id: 'fallback-travelxp',
      name: 'Travel XP',
      country: 'IN',
      categories: ['travel'],
    },
    stream: {
      channel: 'fallback-travelxp',
      url: 'https://dai.google.com/linear/hls/event/ySpknsClS2O8QzrU5cLspQ/master.m3u8',
    },
  },

  {
    channel: {
      id: 'fallback-caribbean',
      name: 'Caribbean Hot',
      country: 'DO',
      categories: ['music'],
    },
    stream: {
      channel: 'fallback-caribbean',
      url: 'https://wowzaprod246-i.akamaihd.net/hls/live/1010938/9ce3fa35/playlist.m3u8',
    },
  },
] as ChannelEntry[];

const OVERRIDE_STREAM: Stream = {
  channel: 'fallback-redbull',
  url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_3360.m3u8',
};

const looksPlayable = (url?: string) => {
  if (!url) {
    return false;
  }
  const normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('http')) {
    return false;
  }
  if (blockedExtensions.some(ext => normalized.includes(ext))) {
    return false;
  }
  return allowedExtensions.some(ext => normalized.includes(ext));
};

const isStreamPlayable = (stream?: Stream) => {
  if (!stream || !looksPlayable(stream.url)) {
    return false;
  }
  if (stream.http_referrer || stream.user_agent) {
    return false;
  }
  if (
    stream.status &&
    ['error', 'blocked', 'timeout', 'geo-blocked', 'not-24/7'].includes(
      stream.status,
    )
  ) {
    return false;
  }
  return true;
};

const formatCategory = (category?: string) => {
  if (!category) {
    return undefined;
  }
  return category.replace(/[-_]/g, ' ');
};

const LiveTVScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { colors, dark } = useTheme();
  const palette = useMemo(() => createPalette(colors, dark), [colors, dark]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  console.log('channel data', channels);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const failSafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const [showAd, setShowAd] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState(false);
  const isFunctionsEnabled = useFlags(s => s.isFunctionsEnabled);
  const clickCount = useAppClickStore(s => s.clickCount);
  const incrementClick = useAppClickStore(s => s.incrementClick);
  const runGatedAction = useGatedAction({
    isFunctionsEnabled,
    clickCount,
    incrementClick,
    setShowAd,
    setShowLoadingAlert,
  });

  const loadChannels = useCallback(
    async (fromRefresh = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (fromRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);
      if (failSafeRef.current) {
        clearTimeout(failSafeRef.current);
      }
      failSafeRef.current = setTimeout(() => {
        controller.abort();
        if (!isMountedRef.current) {
          return;
        }
        setChannels(FALLBACK_CHANNELS);
        setErrorMessage(t('tv.error'));
        setLoading(false);
        setRefreshing(false);
      }, 10000);

      try {
        const [availableChannels, streamCatalog] = await Promise.all([
          fetchChannels(controller.signal),
          fetchStreams(controller.signal),
        ]);

        const channelMap = new Map<string, Channel>(
          availableChannels.map(channel => [channel.id, channel]),
        );

        const working: ChannelEntry[] = [];
        const usedChannelIds = new Set<string>();
        let inspected = 0;

        for (const stream of streamCatalog) {
          inspected += 1;
          if (!isStreamPlayable(stream)) {
            continue;
          }
          if (working.length >= TARGET_CHANNELS) {
            break;
          }
          const channel = channelMap.get(stream.channel);
          if (!channel || channel.is_nsfw || usedChannelIds.has(channel.id)) {
            continue;
          }
          working.push({ channel, stream });
          usedChannelIds.add(channel.id);

          if (
            inspected >= MAX_STREAM_SCAN &&
            working.length >= MIN_VISIBLE_CHANNELS
          ) {
            break;
          }
        }

        if (working.length === 0) {
          setChannels(FALLBACK_CHANNELS);
          setErrorMessage(null);
          return;
        }

        const supplemented =
          working.length >= MIN_VISIBLE_CHANNELS
            ? working
            : [...working, ...FALLBACK_CHANNELS].slice(0, TARGET_CHANNELS);

        setChannels(supplemented);
        if (working.length < MIN_VISIBLE_CHANNELS) {
          setErrorMessage(t('tv.noChannels'));
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Failed to load IPTV channels', err);
        setChannels(FALLBACK_CHANNELS);
        setErrorMessage(t('tv.error'));
      } finally {
        if (failSafeRef.current) {
          clearTimeout(failSafeRef.current);
          failSafeRef.current = null;
        }
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadChannels();
    return () => {
      isMountedRef.current = false;
      if (failSafeRef.current) {
        clearTimeout(failSafeRef.current);
      }
      abortRef.current?.abort();
    };
  }, [loadChannels]);

  const handleRefresh = useCallback(() => {
    loadChannels(true);
  }, [loadChannels]);

  const handlePlayChannel = useCallback(
    (entry: ChannelEntry) => {
      runGatedAction(() => {
        if (!entry?.stream?.url) {
          return;
        }
        navigation.navigate('PrismStreamTheater', {
          videoUri: OVERRIDE_STREAM.url,
          title: entry.channel.name,
          video: {
            id: OVERRIDE_STREAM.url,
            uri: OVERRIDE_STREAM.url,
            filename: entry.channel.name,
            thumbnailUri: entry.channel.logo,
          },
        });
      });
    },
    [navigation, runGatedAction],
  );

  const handleRetry = useCallback(() => {
    runGatedAction(() => {
      void loadChannels();
    });
  }, [loadChannels, runGatedAction]);

  const renderChannel = useCallback(
    ({ item }: { item: ChannelEntry }) => {
      const country = item.channel.country ?? t('tv.genericCategory');
      const category =
        formatCategory(item.channel.categories?.[0]) ?? t('tv.genericCategory');
      return (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed ? styles.cardPressed : undefined,
          ]}
          accessibilityRole="button"
          onPress={() => handlePlayChannel(item)}
        >
          <View style={styles.logoWrapper}>
            {item.channel.logo ? (
              <Image
                source={{ uri: item.channel.logo }}
                resizeMode="contain"
                style={styles.logo}
              />
            ) : (
              <View style={styles.logoFallback}>
                <Tv2 size={28} color={palette.accentGlow} />
              </View>
            )}
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <AppText
                variant="caption"
                style={styles.badgeText}
                numberOfLines={1}
              >
                {country}
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText
                variant="caption"
                style={styles.badgeTextAlt}
                numberOfLines={1}
              >
                {category}
              </AppText>
            </View>
          </View>
          <View style={styles.cardBody}>
            <AppText
              variant="subtitle"
              style={styles.cardTitle}
              numberOfLines={1}
            >
              {item.channel.name}
            </AppText>
            <AppText
              variant="caption"
              style={styles.cardMeta}
              numberOfLines={2}
            >
              {item.channel.languages?.join(', ') || item.channel.website || ''}
            </AppText>
          </View>
        </Pressable>
      );
    },
    [handlePlayChannel, palette.accentGlow, styles],
  );

  const listEmpty =
    !loading && !refreshing ? (
      <View style={styles.stateContainer}>
        <AlertTriangle size={28} color={palette.secondary} />
        <AppText variant="subtitle" style={styles.stateTitle}>
          {errorMessage ?? t('tv.noChannels')}
        </AppText>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <RefreshCw size={16} color={palette.textPrimary} />
          <AppText variant="body" style={styles.retryLabel}>
            {t('tv.retry')}
          </AppText>
        </Pressable>
      </View>
    ) : null;

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.header}>
          <BackButton
            style={styles.backButton}
            accessibilityLabel={t('common.back', 'Back')}
          />
          <View style={styles.headerIcon}>
            <Tv2 size={20} color={palette.accent} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="title" style={styles.headerTitle}>
              {t('tv.title')}
            </AppText>
            <AppText variant="caption" style={styles.headerSubtitle}>
              {t('tv.subtitle')}
            </AppText>
          </View>
        </View>
        <ImageBackground
          source={IMAGES.TvBanner}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroBadge}>
            <AppText variant="caption" style={styles.heroBadgeText}>
              {t('tv.heroBadge', { defaultValue: 'Live & Premium' })}
            </AppText>
          </View>
        </ImageBackground>
      </>
    ),
    [palette.accent, styles, t],
  );

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {loading && channels.length === 0 ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color={palette.accent} size="small" />
              <AppText variant="subtitle" style={styles.stateTitle}>
                {t('tv.loading')}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={channels}
              keyExtractor={item => item.channel.id}
              numColumns={2}
              columnWrapperStyle={styles.column}
              contentContainerStyle={[
                styles.listContent,
                channels.length === 0 ? styles.listEmpty : undefined,
              ]}
              renderItem={renderChannel}
              ListHeaderComponent={renderHeader}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={palette.accent}
                  colors={[palette.accent]}
                  progressBackgroundColor={palette.card}
                />
              }
              ListEmptyComponent={listEmpty}
            />
          )}
        </View>

        {showAd && (
          <ApexEventInterstitial
            onAdLoaded={ad => {
              setShowLoadingAlert(false);
              setTimeout(() => {
                ad.show().catch(e => {
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
                <AppText variant="body" style={styles.modalText}>
                  {t('common.adsLoading')}
                </AppText>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </ScreenGradient>
  );
};

type TvPalette = {
  background: string;
  card: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentGlow: string;
  primary: string;
  accentMuted: string;
  secondary: string;
  overlay: string;
  gradientStart: string;
  gradientEnd: string;
  border: string;
};

const createPalette = (
  themeColors: Theme['colors'],
  dark?: boolean,
): TvPalette => {
  const primary = themeColors?.primary ?? '#111827';
  const secondary = themeColors?.notification ?? '#0EA5E9';
  return {
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    accent: primary,
    accentGlow: secondary,
    primary,
    accentMuted: 'rgba(15,23,42,0.08)',
    secondary,
    overlay: 'rgba(15,23,42,0.25)',
    gradientStart: primary,
    gradientEnd: '#F8FAFC',
    border: 'rgba(148,163,184,0.35)',
  };
};

const createStyles = (palette: TvPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      marginRight: 12,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      color: '#fff',
    },
    headerSubtitle: {
      color: palette.textSecondary,
      marginTop: 4,
    },
    heroCard: {
      marginBottom: 18,
      borderRadius: 24,
      height: 190,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    heroImage: {
      borderRadius: 24,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: palette.textPrimary,
      paddingVertical: 6,
      borderRadius: 999,
      marginBottom: 12,
      marginHorizontal: 16,
      paddingHorizontal: 14,
      marginTop: 16,
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    heroTitle: {
      color: palette.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      paddingHorizontal: 14,
      marginTop: 10,
    },
    heroSubtitleText: {
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 18,
      paddingHorizontal: 14,
    },
    column: {
      justifyContent: 'space-between',
    },
    listContent: {
      paddingBottom: 40,
      gap: 16,
    },
    listEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    card: {
      flex: 1,
      backgroundColor: palette.card,
      borderRadius: 22,
      padding: 16,
      marginRight: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    cardPressed: {
      opacity: 0.9,
    },
    logoWrapper: {
      height: 80,
      borderRadius: 18,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    logo: {
      width: '80%',
      height: '80%',
    },
    logoFallback: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    badge: {
      backgroundColor: palette.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      marginRight: 8,
    },
    badgeText: {
      color: palette.textPrimary,
    },
    badgeTextAlt: {
      color: palette.textSecondary,
    },
    cardBody: {},
    cardTitle: {
      color: palette.textPrimary,
    },
    cardMeta: {
      color: palette.textSecondary,
      marginTop: 4,
    },
    stateContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    stateTitle: {
      textAlign: 'center',
      color: palette.textPrimary,
      marginTop: 12,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.textPrimary,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
      marginTop: 12,
    },
    retryLabel: {
      color: '#FFFFFF',
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      backgroundColor: palette.card,
      padding: 20,
      borderRadius: 16,
      width: '80%',
    },
    modalText: {
      fontSize: 16,
      color: palette.textPrimary,
      textAlign: 'center',
    },
  });

export default LiveTVScreen;
