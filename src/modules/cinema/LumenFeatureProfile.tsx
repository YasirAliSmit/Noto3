import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import BackButton from '../../components/BackButton';
import { TMDB_API_KEY } from '../../services/constant';
import useGatedAction from '../../components/useGatedAction';
import { useFlags } from '../../hooks/featureFlags';
import { useAppClickStore } from '../../components/HelperFunction';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';


type Navigation = NativeStackNavigationProp<any>;
type Route = RouteProp<any, 'LumenFeatureProfile'>;

type TmdbVideoResponse = {
  results: Array<{ key: string; site: string; type: string }>;
};

const LumenFeatureProfile: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { movie } = route.params;
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const palette = useMemo(() => createDetailPalette(colors, dark), [colors, dark]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
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

  const posterUri = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined;
  const releaseLabel = movie.release_date
    ? new Date(movie.release_date).getFullYear().toString()
    : t('media.moviesUnknownDate', 'TBA');
  const languageLabel =
    typeof movie.original_language === 'string'
      ? movie.original_language.toUpperCase()
      : null;
  const ratingLabel =
    typeof movie.vote_average === 'number'
      ? `${movie.vote_average.toFixed(1)}/10`
      : null;

  const metadata = [
    releaseLabel
      ? { label: t('media.moviesReleaseLabel', 'Release'), value: releaseLabel }
      : null,
    languageLabel
      ? { label: t('media.moviesLanguageLabel', 'Language'), value: languageLabel }
      : null,
    ratingLabel
      ? { label: t('media.moviesRatingLabel', 'Rating'), value: ratingLabel }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const fetchVideo = useCallback(async () => {
    if (!TMDB_API_KEY) {
      setVideoError(t('media.moviesMissingKey', 'TMDB API key is missing.'));
      return;
    }

    setLoadingVideo(true);
    setVideoError(null);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`,
      );
      if (!response.ok) {
        throw new Error(`TMDB videos error: ${response.status}`);
      }
      const payload = (await response.json()) as TmdbVideoResponse;
      const official = payload.results.find(entry => entry.site === 'YouTube' && entry.type === 'Trailer');
      const fallback = payload.results.find(entry => entry.site === 'YouTube');
      setVideoKey((official || fallback)?.key ?? null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load movie video', error);
      setVideoError(t('media.moviesVideoError', 'Unable to load video preview.'));
    } finally {
      setLoadingVideo(false);
    }
  }, [movie.id, t]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleGoBack = useCallback(() => {
    runGatedAction(() => {
      navigation.goBack();
    });
  }, [navigation, runGatedAction]);

  const handleRetry = useCallback(() => {
    runGatedAction(() => {
      void fetchVideo();
    });
  }, [fetchVideo, runGatedAction]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F2027', '#203A43', '#2C5364']}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      <View style={styles.headerRow}>
        <BackButton
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel={t('common.back', 'Back')}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={styles.headerSubtitle}>{t('media.moviesSubtitle', 'Browse trending movies powered by TMDB.')}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.posterWrapper}>
            {posterUri ? (
              <>
                <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                {/* <LinearGradient
                  colors={palette.heroGradient}
                  style={styles.posterGradient}
                /> */}
              </>
            ) : (
              <View style={styles.posterPlaceholder}>
                <Text style={styles.posterPlaceholderText}>{t('media.moviesNoPoster', 'No Image')}</Text>
              </View>
            )}
          </View>
          <View style={styles.heroText}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{t('media.moviesHeroBadge', 'Now Trending')}</Text>
            </View>
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieMeta}>{movie.release_date || t('media.moviesUnknownDate', 'TBA')}</Text>
            {metadata.length ? (
              <View style={styles.metadataRow}>
                {metadata.map(item => (
                  <View key={item.label} style={styles.metadataChip}>
                    <Text style={styles.metadataLabel}>{item.label}</Text>
                    <Text style={styles.metadataValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.sectionCard, styles.playerSection]}>
          <Text style={styles.sectionTitle}>{t('media.moviesTrailer', 'Trailer')}</Text>
          <View style={styles.videoShell}>
            {loadingVideo ? (
              <View style={styles.videoPlaceholder}>
                <ActivityIndicator color={palette.accent} />
              </View>
            ) : videoKey ? (
              <YoutubePlayer height={220} play={false} videoId={videoKey} webViewStyle={styles.youtubePlayer} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>
                  {videoError || t('media.moviesNoTrailer', 'Trailer not available.')}
                </Text>
                {videoError ? (
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryLabel}>{t('common.retry', 'Retry')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {movie.overview ? (
          <View style={[styles.sectionCard, styles.aboutSection]}>
            <Text style={styles.sectionTitle}>{t('media.moviesOverview', 'Overview')}</Text>
            <Text style={styles.overviewText}>{movie.overview}</Text>
          </View>
        ) : null}
      </ScrollView>
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
          <View
            style={{
              flex: 1,
              backgroundColor: '#00000099',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
              <Text style={{ fontSize: 16 }}>{t('common.adsLoading')}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

type DetailPalette = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  cardBorder: string;
  accent: string;
  accentMuted: string;
  accentSubtle: string;
  textPrimary: string;
  textSecondary: string;
  overlay: string;
  heroGradient: string[];
};

const createDetailPalette = (themeColors: Theme['colors'], dark?: boolean): DetailPalette => {
  const accent = themeColors?.primary ?? '#02C39A';
  return {
    background: '#F3F6FB',
    backgroundAlt: '#FFFFFF',
    surface: '#F7F9FC',
    surfaceElevated: '#FFFFFF',
    border: '#E6ECF3',
    cardBorder: '#E6ECF3',
    accent: '#F43F5E',
    accentMuted: 'rgba(244,63,94,0.12)',
    accentSubtle: 'rgba(244,63,94,0.06)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    overlay: 'rgba(0,0,0,0.45)',
    heroGradient: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.88)', '#FFFFFF'],
  };
};

const createStyles = (palette: DetailPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F3F6FB',
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },
    backButton: {
      marginRight: 4,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#fff',
    },
    headerSubtitle: {
      fontSize: 13,
      color: palette.textSecondary,
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 24,
    },
    heroCard: {
      borderRadius: 28,
      backgroundColor: palette.surfaceElevated,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      overflow: 'hidden',
    },
    posterWrapper: {
      width: '100%',
      height: 280,
    },
    poster: {
      width: '100%',
      height: '100%',
    },
    posterGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    posterPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSubtle,
    },
    posterPlaceholderText: {
      color: palette.textSecondary,
    },
    heroText: {
      padding: 20,
      gap: 8,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      backgroundColor: '#0B1220',
    },
    heroBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 0.4,
    },
    movieTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    movieMeta: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    metadataRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    metadataChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    metadataLabel: {
      fontSize: 11,
      color: palette.textSecondary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    metadataValue: {
      fontSize: 14,
      color: palette.textPrimary,
      fontWeight: '600',
    },
    sectionCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.surfaceElevated,
      padding: 20,
      gap: 14,
    },
    playerSection: {
      gap: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    videoShell: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.surface,
    },
    videoPlaceholder: {
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 10,
    },
    videoPlaceholderText: {
      color: palette.textSecondary,
      textAlign: 'center',
    },
    youtubePlayer: {
      backgroundColor: palette.surface,
    },
    aboutSection: {
      gap: 10,
    },
    overviewText: {
      fontSize: 15,
      color: palette.textSecondary,
      lineHeight: 22,
    },
    retryButton: {
      alignSelf: 'center',
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: palette.accent,
    },
    retryLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default LumenFeatureProfile;
