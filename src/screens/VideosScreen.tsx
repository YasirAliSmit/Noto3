import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Vibration,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import BackButton from '../components/BackButton';
import Icon from '../components/Icon';
import ScreenGradient from '../components/ScreenGradient';
import { TMDB_API_KEY } from '../services/constant';
import ApexEventInterstitial from '../components/ApexEventInterstitial';
import { useAppClickStore } from '../components/HelperFunction';
import { useFlags } from '../hooks/featureFlags';
import useGatedAction from '../components/useGatedAction';
import { useMovieWatchlistStore } from '../store/useMovieWatchlistStore';

const TMDB_ENDPOINT = 'https://api.themoviedb.org/3/movie/popular?language=en-US&page=1';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

type Movie = {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
};

type MoviesResponse = {
    results: Movie[];
};

type Navigation = NativeStackNavigationProp<any, 'Videos'>;

const VideosScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { t } = useTranslation();
    const { colors, dark } = useTheme();
    const palette = useMemo(() => createPalette(colors, dark), [colors, dark]);
    const styles = useMemo(() => createStyles(palette), [palette]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAd, setShowAd] = useState(false);
    const [showLoadingAlert, setShowLoadingAlert] = useState(false);
    // NEW CODE: watchlist filter + preview modal state
    const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'watchlist'>('all');
    const [showPreview, setShowPreview] = useState(false);
    const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
    const isFunctionsEnabled = useFlags(s => s.isFunctionsEnabled);
    const clickCount = useAppClickStore(s => s.clickCount);
    const incrementClick = useAppClickStore(s => s.incrementClick);
    // NEW CODE: watchlist store
    const watchlist = useMovieWatchlistStore(state => state.watchlist);
    const toggleWatchlist = useMovieWatchlistStore(state => state.toggleWatchlist);
    const runGatedAction = useGatedAction({
        isFunctionsEnabled,
        clickCount,
        incrementClick,
        setShowAd,
        setShowLoadingAlert,
    });

    const heroMovie = movies[0];
    const listMovies = useMemo(() => (movies.length > 1 ? movies.slice(1) : []), [movies]);
    // NEW CODE: watchlist helpers
    const watchlistIds = useMemo(() => new Set(watchlist.map(movie => movie.id)), [watchlist]);
    const watchlistMovies = useMemo(
        () => movies.filter(movie => watchlistIds.has(movie.id)),
        [movies, watchlistIds],
    );
    const visibleMovies = watchlistFilter === 'watchlist' ? watchlistMovies : listMovies;

    const fetchMovies = useCallback(async () => {
        if (!TMDB_API_KEY) {
            setError(t('media.moviesMissingKey', 'TMDB API key is missing.'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${TMDB_ENDPOINT}&api_key=${TMDB_API_KEY}`);
            if (!response.ok) {
                throw new Error(`TMDB error: ${response.status}`);
            }

            const payload = (await response.json()) as MoviesResponse;
            setMovies(payload.results ?? []);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load movies', err);
            setError(t('media.moviesError', 'Unable to load movies. Please try again.'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    const handlePress = useCallback(

        (movie: any) => {
            runGatedAction(() => {
                navigation.navigate('LumenFeatureProfile', { movie });
            });
        },
        [navigation, runGatedAction],
    );

    const renderItem = ({ item }: { item: Movie }) => {
        const posterUri = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : undefined;
        const releaseLabel = item.release_date
            ? new Date(item.release_date).getFullYear().toString()
            : t('media.moviesUnknownDate', 'TBA');
        const synopsis = item.overview || t('media.moviesNoSummary', 'Tap to see the full synopsis.');
        const isWatchlisted = watchlistIds.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.movieCard, styles.cardShadow]}
                activeOpacity={0.85}
                onPress={() => handlePress(item)}
                onLongPress={() => {
                    Vibration.vibrate(10);
                    setPreviewMovie(item);
                    setShowPreview(true);
                }}
                delayLongPress={200}
                accessibilityLabel={t('media.moviesCardLabel', `Movie card ${item.title}`)}
            >
                {posterUri ? (
                    <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                ) : (
                    <View style={[styles.poster, styles.posterPlaceholder]}>
                        <Text style={styles.posterPlaceholderText}>{t('media.moviesNoPoster', 'No Image')}</Text>
                    </View>
                )}
                {/* NEW CODE: watchlist toggle */}
                <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() => {
                        Vibration.vibrate(10);
                        toggleWatchlist(item);
                    }}
                    accessibilityLabel={
                        isWatchlisted
                            ? t('media.moviesRemoveWatchlist', 'Remove from watchlist')
                            : t('media.moviesAddWatchlist', 'Add to watchlist')
                    }
                >
                    <Icon
                        name={isWatchlisted ? 'bookmarkCheck' : 'bookmark'}
                        size={18}
                        color={isWatchlisted ? palette.accent : palette.textSecondary}
                    />
                </TouchableOpacity>
                <View style={styles.movieBody}>
                    <Text style={styles.movieTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.movieMetaRow}>
                        <View style={styles.movieChip}>
                            <Text style={styles.movieChipText}>{releaseLabel}</Text>
                        </View>
                        <Text style={styles.movieMeta}>{t('media.moviesSource', 'Powered by TMDB')}</Text>
                    </View>
                    <Text numberOfLines={3} style={styles.movieOverview}>
                        {synopsis}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (watchlistFilter === 'watchlist') {
            if (loading) {
                return null;
            }
            if (visibleMovies.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>{t('media.moviesWatchlistEmpty', 'No saved movies yet')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {t('media.moviesWatchlistHint', 'Bookmark movies to build your watchlist.')}
                        </Text>
                    </View>
                );
            }
            return null;
        }

        if (heroMovie) {
            return null;
        }

        if (loading) {
            return null;
        }

        if (error) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>{t('media.moviesErrorTitle', 'Unable to load movies')}</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
                        <Text style={styles.retryLabel}>{t('common.retry', 'Retry')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t('media.moviesEmptyTitle', 'No movies to show')}</Text>
                <Text style={styles.emptySubtitle}>{t('media.moviesEmptySubtitle', 'Pull to refresh to load movies.')}</Text>
            </View>
        );
    };

    const renderHero = () => {
        if (!heroMovie) {
            return null;
        }
        if (watchlistFilter === 'watchlist') {
            return null;
        }

        const posterUri = heroMovie.poster_path ? `${TMDB_IMAGE_BASE}${heroMovie.poster_path}` : undefined;
        const isHeroWatchlisted = watchlistIds.has(heroMovie.id);

        return (
            <TouchableOpacity
                style={styles.heroCard}
                activeOpacity={0.9}
                onPress={() => handlePress(heroMovie)}
            >
                {posterUri ? (
                    <>
                        <Image source={{ uri: posterUri }} style={styles.heroImage} resizeMode="cover" />
                        <LinearGradient
                            colors={palette.heroGradient}
                            style={styles.heroGradient}
                        />
                    </>
                ) : (
                    <View style={[styles.heroImage, styles.posterPlaceholder]}>
                        <Text style={styles.posterPlaceholderText}>{t('media.moviesNoPoster', 'No Image')}</Text>
                    </View>
                )}
                {/* NEW CODE: hero watchlist toggle */}
                <TouchableOpacity
                    style={styles.heroBookmarkButton}
                    onPress={() => {
                        Vibration.vibrate(10);
                        toggleWatchlist(heroMovie);
                    }}
                    accessibilityLabel={
                        isHeroWatchlisted
                            ? t('media.moviesRemoveWatchlist', 'Remove from watchlist')
                            : t('media.moviesAddWatchlist', 'Add to watchlist')
                    }
                >
                    <Icon
                        name={isHeroWatchlisted ? 'bookmarkCheck' : 'bookmark'}
                        size={20}
                        color={isHeroWatchlisted ? palette.accent : palette.textPrimary}
                    />
                </TouchableOpacity>
                <View style={styles.heroOverlay}>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>{t('media.moviesHeroBadge', 'Now Trending')}</Text>
                    </View>
                    <Text style={styles.heroSubtitle}>{t('media.moviesSubtitle', 'Browse trending movies powered by TMDB.')}</Text>
                    <Text style={styles.heroTitle}>{heroMovie.title}</Text>
                    <Text style={styles.heroMeta}>{heroMovie.release_date || t('media.moviesUnknownDate', 'TBA')}</Text>
                    <View style={styles.heroActions}>
                        <TouchableOpacity style={styles.heroButton} onPress={() => handlePress(heroMovie)}>
                            <Text style={styles.heroButtonLabel}>{t('common.viewArrow', 'View ›')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (

        <ScreenGradient>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <BackButton style={styles.backButton} accessibilityLabel={t('common.back', 'Back')} />
                        <View style={styles.headerText}>
                            <Text style={styles.screenEyebrow}>{t('media.moviesTitle', 'Movies')}</Text>
                            <Text style={styles.screenTitle}>{t('media.moviesSubtitle', 'Browse trending movies powered by TMDB.')}</Text>
                        </View>
                    </View>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                watchlistFilter === 'all' && styles.filterChipActive,
                            ]}
                            onPress={() => setWatchlistFilter('all')}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    watchlistFilter === 'all' && styles.filterChipTextActive,
                                ]}
                            >
                                {t('media.moviesFilterAll', 'All')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                watchlistFilter === 'watchlist' && styles.filterChipActive,
                            ]}
                            onPress={() => setWatchlistFilter('watchlist')}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    watchlistFilter === 'watchlist' && styles.filterChipTextActive,
                                ]}
                            >
                                {t('media.moviesFilterWatchlist', 'Watchlist')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={visibleMovies}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMovies} tintColor={palette.accent} />}
                        ListEmptyComponent={renderEmpty}
                        ListHeaderComponent={renderHero}
                        ListHeaderComponentStyle={styles.headerComponent}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
                <Modal
                    visible={showPreview}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowPreview(false)}
                >
                    <View style={styles.previewOverlay}>
                        <View style={styles.previewCard}>
                            {previewMovie?.poster_path ? (
                                <Image
                                    source={{ uri: `${TMDB_IMAGE_BASE}${previewMovie.poster_path}` }}
                                    style={styles.previewPoster}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.previewPoster, styles.posterPlaceholder]}>
                                    <Text style={styles.posterPlaceholderText}>{t('media.moviesNoPoster', 'No Image')}</Text>
                                </View>
                            )}
                            <Text style={styles.previewTitle}>{previewMovie?.title}</Text>
                            <Text style={styles.previewMeta}>
                                {previewMovie?.release_date
                                    ? new Date(previewMovie.release_date).getFullYear().toString()
                                    : t('media.moviesUnknownDate', 'TBA')}
                            </Text>
                            <Text style={styles.previewOverview} numberOfLines={4}>
                                {previewMovie?.overview || t('media.moviesNoSummary', 'Tap to see the full synopsis.')}
                            </Text>
                            <View style={styles.previewActions}>
                                <TouchableOpacity
                                    style={styles.previewPrimary}
                                    onPress={() => {
                                        if (previewMovie) {
                                            setShowPreview(false);
                                            handlePress(previewMovie);
                                        }
                                    }}
                                >
                                    <Text style={styles.previewPrimaryText}>{t('common.viewDetails', 'View Details')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.previewSecondary}
                                    onPress={() => setShowPreview(false)}
                                >
                                    <Text style={styles.previewSecondaryText}>{t('common.close', 'Close')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                {loading && movies.length === 0 ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator color={palette.accent} />
                    </View>
                ) : null}
                {showAd && (
                    <ApexEventInterstitial
                        onAdLoaded={ad => {
                            setShowLoadingAlert(false);
                            setTimeout(() => {
                                ad
                                    .show()
                                    .catch(e => {
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
        </ScreenGradient>

    );
};

type MoviePalette = {
    backgroundAlt: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    accent: string;
    accentMuted: string;
    textPrimary: string;
    textSecondary: string;
    overlay: string;
    heroGradient: string[];
};

const createPalette = (themeColors: Theme['colors'], dark?: boolean): MoviePalette => {
    const accent = themeColors?.primary ?? '#FE2B54';
    return {
        backgroundAlt: '#F8FAFC',
        surface: '#F1F5F9',
        surfaceElevated: '#FFFFFF',
        border: 'rgba(148,163,184,0.35)',
        accent,
        accentMuted: 'rgba(254,43,84,0.12)',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        overlay: 'rgba(15,23,42,0.25)',
        heroGradient: ['rgba(248,250,252,0)', 'rgba(248,250,252,0.88)', '#F8FAFC'],
    };
};

const createStyles = (palette: MoviePalette) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        content: {
            flex: 1,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
        },
        backButton: {
            marginRight: 4,
        },
        headerText: {
            flex: 1,
        },
        screenEyebrow: {
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.1,
            color: '#FFFFFF',
        },
        screenTitle: {
            marginTop: 4,
            fontSize: 16,
            lineHeight: 20,
            color: '#FFFFFF',
        },
        filterRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 6,
        },
        filterChip: {
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: 'rgba(255,255,255,0.85)',
        },
        filterChipActive: {
            backgroundColor: palette.textPrimary,
            borderColor: palette.textPrimary,
        },
        filterChipText: {
            fontSize: 12,
            fontWeight: '600',
            color: palette.textSecondary,
        },
        filterChipTextActive: {
            color: '#FFFFFF',
        },
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 32,
            gap: 18,
        },
        headerComponent: {
            marginBottom: 16,
        },
        heroCard: {
            borderRadius: 28,
            overflow: 'hidden',
            height: 320,
            backgroundColor: palette.surfaceElevated,
            borderWidth: 1,
            borderColor: palette.border,
            shadowColor: '#0F172A',
            shadowOpacity: 0.08,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
        },
        heroImage: {
            ...StyleSheet.absoluteFillObject,
            width: '100%',
            height: '100%',
        },
        heroGradient: {
            ...StyleSheet.absoluteFillObject,
        },
        heroOverlay: {
            flex: 1,
            padding: 24,
            justifyContent: 'flex-end',
            gap: 8,
        },
        heroBadge: {
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: palette.textPrimary,
        },
        heroBadgeText: {
            fontSize: 12,
            color: '#FFFFFF',
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        heroSubtitle: {
            color: palette.textSecondary,
            fontSize: 13,
            letterSpacing: 0.3,
        },
        heroTitle: {
            fontSize: 26,
            fontWeight: '800',
            color: palette.textPrimary,
        },
        heroMeta: {
            color: palette.textSecondary,
            fontSize: 13,
        },
        heroActions: {
            marginTop: 12,
        },
        heroButton: {
            alignSelf: 'flex-start',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: palette.accent,
        },
        heroButtonLabel: {
            color: '#FFFFFF',
            fontWeight: '700',
            letterSpacing: 0.4,
        },
        heroBookmarkButton: {
            position: 'absolute',
            top: 18,
            right: 18,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
        },
        separator: {
            height: 16,
        },
        movieCard: {
            flexDirection: 'row',
            backgroundColor: palette.surfaceElevated,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.border,
            overflow: 'hidden',
            padding: 12,
            gap: 14,
        },
        cardShadow: {
            shadowColor: '#0F172A',
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 3,
        },
        poster: {
            width: 110,
            height: 165,
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.border,
        },
        bookmarkButton: {
            position: 'absolute',
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
        },
        posterPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surface,
        },
        posterPlaceholderText: {
            fontSize: 12,
            color: palette.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 8,
        },
        movieBody: {
            flex: 1,
            gap: 8,
            paddingVertical: 4,
        },
        movieTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: palette.textPrimary,
        },
        movieMetaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        movieChip: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 14,
            backgroundColor: 'rgba(15,23,42,0.08)',
        },
        movieChipText: {
            fontSize: 12,
            fontWeight: '600',
            color: palette.textPrimary,
            letterSpacing: 0.3,
        },
        movieMeta: {
            fontSize: 12,
            color: palette.textSecondary,
        },
        movieOverview: {
            fontSize: 13,
            color: palette.textSecondary,
            lineHeight: 18,
        },
        emptyState: {
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.surfaceElevated,
            marginTop: 40,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: palette.textPrimary,
            textAlign: 'center',
        },
        emptySubtitle: {
            fontSize: 14,
            color: palette.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            paddingHorizontal: 24,
        },
        retryButton: {
            marginTop: 8,
            paddingHorizontal: 26,
            paddingVertical: 12,
            borderRadius: 26,
            backgroundColor: palette.accent,
        },
        retryLabel: {
            color: palette.textPrimary,
            fontWeight: '700',
        },
        loadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.overlay,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: palette.overlay,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalCard: {
            backgroundColor: palette.surfaceElevated,
            padding: 20,
            borderRadius: 16,
            width: '80%',
        },
        modalText: {
            fontSize: 16,
            color: palette.textPrimary,
            textAlign: 'center',
        },
        previewOverlay: {
            flex: 1,
            backgroundColor: palette.overlay,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        previewCard: {
            width: '100%',
            maxWidth: 340,
            borderRadius: 20,
            padding: 18,
            backgroundColor: palette.surfaceElevated,
            borderWidth: 1,
            borderColor: palette.border,
            gap: 10,
        },
        previewPoster: {
            width: '100%',
            height: 200,
            borderRadius: 16,
            backgroundColor: palette.surface,
        },
        previewTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: palette.textPrimary,
        },
        previewMeta: {
            fontSize: 12,
            color: palette.textSecondary,
        },
        previewOverview: {
            fontSize: 13,
            lineHeight: 18,
            color: palette.textSecondary,
        },
        previewActions: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 6,
        },
        previewPrimary: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: palette.accent,
        },
        previewPrimaryText: {
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 13,
        },
        previewSecondary: {
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: palette.border,
            alignItems: 'center',
        },
        previewSecondaryText: {
            color: palette.textSecondary,
            fontSize: 13,
            fontWeight: '600',
        },
    });

export default VideosScreen;
