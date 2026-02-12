import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import TrackPlayer, { Capability, State, usePlaybackState } from 'react-native-track-player';
import DocumentPicker from 'react-native-document-picker';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAudioStore, Station, ImportedTrack } from '../store/useAudioStore';
import { useRadioStore } from '../store/useRadioStore';
import type { Station as RadioStation } from '../store/useRadioStore';
import ScreenGradient from '../components/ScreenGradient';

type RadioBrowserStation = {
  stationuuid: string;
  name?: string;
  country?: string;
  bitrate?: number;
  urlResolved?: string;
  url?: string;
};

type AudioTabParamList = {
  all: undefined;
  liked: undefined;
  most: undefined;
  import: undefined;
};

const Tab = createMaterialTopTabNavigator<AudioTabParamList>();
const LIST_BOTTOM_INSET = 136;

function mapStationToRadioStation(station: Station): RadioStation | null {
  if (!station.streamUrl) {
    return null;
  }
  return {
    id: station.id,
    name: station.name,
    url: station.streamUrl,
    country: station.country,
    bitrate: station.bitrate,
    artwork: undefined,
    artist: station.country,
  };
}

function mapStationsToRadio(stations: Station[]): RadioStation[] {
  const seen = new Set<string>();
  return stations.reduce<RadioStation[]>((acc, station) => {
    const radio = mapStationToRadioStation(station);
    if (radio && !seen.has(radio.id)) {
      seen.add(radio.id);
      acc.push(radio);
    }
    return acc;
  }, []);
}

function prepareRadioQueue(sourceStations: Station[], targetStation: Station): RadioStation | null {
  const target = mapStationToRadioStation(targetStation);
  if (!target) {
    return null;
  }
  const queue = mapStationsToRadio(sourceStations);
  const store = useRadioStore.getState();
  if (queue.length) {
    store.setQueue(queue, targetStation.id);
  } else {
    store.setQueue([target], targetStation.id);
  }
  const audioLiked = useAudioStore.getState().likedStations;
  const likedEntries = (queue.length ? queue : [target]).reduce<Record<string, boolean>>((acc, station) => {
    acc[station.id] = Boolean(audioLiked[station.id]);
    return acc;
  }, {});
  useRadioStore.setState((state) => ({
    liked: { ...state.liked, ...likedEntries },
  }));
  return target;
}

export default function RadioScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    const setup = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
        });
      } catch (error) {
        console.warn('TrackPlayer setup failed', error);
      }
    };
    setup();
  }, []);

  return (
    <ScreenGradient>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerEyebrow}>{t('audio.header.title')}</Text>
              <Text style={styles.headerTitle}>{t('audio.header.subtitle')}</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{t('audio.tabs.all')}</Text>
            </View>
          </View>
          <View style={styles.heroPanel}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{t('audio.header.title')}</Text>
              <Text style={styles.heroSubtitle}>{t('audio.header.subtitle')}</Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillValue}>24/7</Text>
                <Text style={styles.heroPillLabel}>{t('audio.tabs.most')}</Text>
              </View>
              <View style={styles.heroPillAlt}>
                <Text style={styles.heroPillValue}>HD</Text>
                <Text style={styles.heroPillLabel}>{t('audio.tabs.liked')}</Text>
              </View>
            </View>
          </View>
        </View>
        <Tab.Navigator
          style={styles.tabNavigator}
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.tabIndicator,
            tabBarLabelStyle: styles.tabLabel,
            tabBarActiveTintColor: '#0F172A',
            tabBarInactiveTintColor: '#64748B',
            tabBarPressColor: '#E2E8F0',
          }}
        >
          <Tab.Screen
            name="all"
            component={AllChannelsTab}
            options={{ tabBarLabel: t('audio.tabs.all') }}
          />
          <Tab.Screen
            name="liked"
            component={LikedTab}
            options={{ tabBarLabel: t('audio.tabs.liked') }}
          />
          <Tab.Screen
            name="most"
            component={MostPlayedTab}
            options={{ tabBarLabel: t('audio.tabs.most') }}
          />
          <Tab.Screen
            name="import"
            component={ImportTab}
            options={{ tabBarLabel: t('audio.tabs.import') }}
          />
        </Tab.Navigator>
        <MiniPlayer />
      </View>
    </ScreenGradient>
  );
}

function useStationControls() {
  const { t } = useTranslation();
  const toggleLike = useAudioStore((state) => state.toggleLike);
  const incrementPlayCount = useAudioStore((state) => state.incrementPlayCount);
  const setCurrentStation = useAudioStore((state) => state.setCurrentStation);
  const addStationToCatalog = useAudioStore((state) => state.addStationToCatalog);
  const setRadioCurrent = useRadioStore((state) => state.setCurrent);
  const toggleRadioLike = useRadioStore((state) => state.toggleLike);

  const normalizeStation = useCallback(
    (station: Station): Station => ({
      ...station,
      name: station.name?.trim() || t('audio.common.unknownStation'),
    }),
    [t],
  );

  const playStation = useCallback(
    async (station: Station) => {
      const normalized = normalizeStation(station);
      if (!normalized.streamUrl) {
        throw new Error('no-stream');
      }
      addStationToCatalog(normalized);
      incrementPlayCount(normalized);
      setCurrentStation(normalized);
      const radioStation = mapStationToRadioStation(normalized);
      if (radioStation) {
        setRadioCurrent(radioStation);
      }
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: normalized.id,
          url: normalized.streamUrl,
          title: normalized.name,
          artist: normalized.country ?? t('audio.common.unknownCountry'),
        });
        await TrackPlayer.play();
      } catch (error) {
        console.warn('TrackPlayer play error', error);
        throw new Error('playback');
      }
    },
    [addStationToCatalog, incrementPlayCount, normalizeStation, setCurrentStation, setRadioCurrent, t],
  );

  const toggleStationLike = useCallback(
    (station: Station) => {
      const normalized = normalizeStation(station);
      toggleLike(normalized);
      const liked = useAudioStore.getState().isLiked(normalized.id);
      const radioLiked = useRadioStore.getState().liked[normalized.id];
      if (Boolean(radioLiked) !== liked) {
        toggleRadioLike(normalized.id);
      }
    },
    [normalizeStation, toggleLike, toggleRadioLike],
  );

  return { playStation, toggleStationLike };
}

function AllChannelsTab() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const likedStations = useAudioStore((state) => state.likedStations);
  const registerStations = useAudioStore((state) => state.registerStations);
  const { playStation, toggleStationLike } = useStationControls();

  const loadStations = useCallback(async () => {
    setError(null);
    setFeedback(null);
    setLoading(true);
    try {
      const response = await axios.get('https://de2.api.radio-browser.info/json/stations', {
        params: { limit: 15, hidebroken: true },
      });
      const nextStations: Station[] = (response.data as RadioBrowserStation[])
        .map((item) => ({
          id: item.stationuuid,
          name: item.name?.trim() || t('audio.common.unknownStation'),
          country: item.country?.trim(),
          bitrate: typeof item.bitrate === 'number' ? item.bitrate : undefined,
          streamUrl: item.urlResolved || item.url,
        }))
        .filter((station: Station) => Boolean(station.id));
      registerStations(nextStations);
      setStations(nextStations);
    } catch (err) {
      console.warn('Failed to load stations', err);
      setError(t('audio.errors.loadStations'));
    } finally {
      setLoading(false);
    }
  }, [registerStations, t]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStations();
    setRefreshing(false);
  }, [loadStations]);

  const handlePlay = useCallback(
    async (station: Station) => {
      try {
        const radioStation = prepareRadioQueue(stations, station);
        if (!radioStation) {
          throw new Error('no-stream');
        }
        await playStation(station);
        navigation.navigate('SignalBroadcastStudio', { station: radioStation });
      } catch (err) {
        const message = (err as Error).message === 'no-stream'
          ? t('audio.errors.noStream')
          : t('audio.errors.loadStations');
        setFeedback(message);
      }
    },
    [navigation, playStation, stations, t],
  );

  const handleLike = useCallback(
    (station: Station) => {
      toggleStationLike(station);
    },
    [toggleStationLike],
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={COLORS.secondary} />
        <Text style={styles.loaderText}>{t('audio.status.loading')}</Text>
      </View>
    );
  }

  const listHeader = feedback ? (
    <View style={styles.feedbackBanner}>
      <Text style={styles.feedbackText}>{feedback}</Text>
    </View>
  ) : null;

  return (
    <FlatList
      data={stations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StationCard
          station={item}
          countryLabel={item.country ? t('audio.list.country', { country: item.country }) : t('audio.common.unknownCountry')}
          bitrateLabel={
            item.bitrate
              ? t('audio.list.bitrate', { value: item.bitrate })
              : t('audio.list.unknownBitrate')
          }
          supportingValue={null}
          liked={Boolean(likedStations[item.id])}
          onToggleLike={() => handleLike(item)}
          onPlay={() => handlePlay(item)}
        />
      )}
      contentContainerStyle={styles.list}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholderText}>{error ?? t('audio.errors.loadStations')}</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function LikedTab() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const likedMap = useAudioStore((state) => state.likedStations);
  const likedStations = useMemo(
    () =>
      Object.values(likedMap).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [likedMap],
  );
  const { playStation, toggleStationLike } = useStationControls();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (station: Station) => {
      try {
        const radioStation = prepareRadioQueue(likedStations, station);
        if (!radioStation) {
          throw new Error('no-stream');
        }
        await playStation(station);
        navigation.navigate('SignalBroadcastStudio', { station: radioStation });
      } catch (err) {
        const message = (err as Error).message === 'no-stream'
          ? t('audio.errors.noStream')
          : t('audio.errors.loadStations');
        setFeedback(message);
      }
    },
    [likedStations, navigation, playStation, t],
  );

  const handleLike = useCallback(
    (station: Station) => {
      toggleStationLike(station);
    },
    [toggleStationLike],
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  if (!likedStations.length) {
    return (
      <View style={styles.placeholderWrap}>
        <Text style={styles.placeholderText}>{t('audio.list.emptyLiked')}</Text>
      </View>
    );
  }

  const listHeader = feedback ? (
    <View style={styles.feedbackBanner}>
      <Text style={styles.feedbackText}>{feedback}</Text>
    </View>
  ) : null;

  return (
    <FlatList
      data={likedStations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StationCard
          station={item}
          countryLabel={item.country ? t('audio.list.country', { country: item.country }) : t('audio.common.unknownCountry')}
          bitrateLabel={
            item.bitrate
              ? t('audio.list.bitrate', { value: item.bitrate })
              : t('audio.list.unknownBitrate')
          }
          supportingValue={null}
          liked
          onToggleLike={() => handleLike(item)}
          onPlay={() => handlePlay(item)}
        />
      )}
      contentContainerStyle={styles.list}
      ListHeaderComponent={listHeader}
      showsVerticalScrollIndicator={false}
    />
  );
}

function MostPlayedTab() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const playCounts = useAudioStore((state) => state.playCounts);
  const catalog = useAudioStore((state) => state.stationCatalog);
  const { playStation, toggleStationLike } = useStationControls();
  const likedMap = useAudioStore((state) => state.likedStations);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rankedStations = useMemo(() => {
    return Object.entries(playCounts)
      .map(([id, count]) => {
        const station = catalog[id];
        if (!station) {
          return null;
        }
        return { station, count };
      })
      .filter((item): item is { station: Station; count: number } => Boolean(item))
      .sort((a, b) => b.count - a.count);
  }, [catalog, playCounts]);

  const handlePlay = useCallback(
    async (station: Station) => {
      try {
        const queueSource = rankedStations.map((item) => item.station);
        const radioStation = prepareRadioQueue(queueSource, station);
        if (!radioStation) {
          throw new Error('no-stream');
        }
        await playStation(station);
        navigation.navigate('SignalBroadcastStudio', { station: radioStation });
      } catch (err) {
        const message = (err as Error).message === 'no-stream'
          ? t('audio.errors.noStream')
          : t('audio.errors.loadStations');
        setFeedback(message);
      }
    },
    [navigation, playStation, rankedStations, t],
  );

  const handleLike = useCallback(
    (station: Station) => {
      toggleStationLike(station);
    },
    [toggleStationLike],
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  if (!rankedStations.length) {
    return (
      <View style={styles.placeholderWrap}>
        <Text style={styles.placeholderText}>{t('audio.list.emptyMostPlayed')}</Text>
      </View>
    );
  }

  const listHeader = feedback ? (
    <View style={styles.feedbackBanner}>
      <Text style={styles.feedbackText}>{feedback}</Text>
    </View>
  ) : null;

  return (
    <FlatList
      data={rankedStations}
      keyExtractor={(item) => item.station.id}
      renderItem={({ item }) => (
        <StationCard
          station={item.station}
          countryLabel={
            item.station.country
              ? t('audio.list.country', { country: item.station.country })
              : t('audio.common.unknownCountry')
          }
          bitrateLabel={
            item.station.bitrate
              ? t('audio.list.bitrate', { value: item.station.bitrate })
              : t('audio.list.unknownBitrate')
          }
          supportingValue={t('audio.list.playCount', { count: item.count })}
          liked={Boolean(likedMap[item.station.id])}
          onToggleLike={() => handleLike(item.station)}
          onPlay={() => handlePlay(item.station)}
        />
      )}
      contentContainerStyle={styles.list}
      ListHeaderComponent={listHeader}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ImportTab() {
  const { t } = useTranslation();
  const importedTracks = useAudioStore((state) => state.importedTracks);
  const addImportedTrack = useAudioStore((state) => state.addImportedTrack);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    try {
      setError(null);
      const file = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.audio,
      });
      const track: ImportedTrack = {
        id: `${file.uri}:${file.name ?? ''}`,
        name: file.name ?? t('audio.import.lastImported'),
        uri: file.uri,
        size: file.size ?? null,
      };
      addImportedTrack(track);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        return;
      }
      console.warn('Import audio failed', err);
      setError(t('audio.import.error'));
    }
  }, [addImportedTrack, t]);

  const formatSize = useCallback(
    (size?: number | null) => {
      if (!size) {
        return t('audio.import.lastImported');
      }
      const megabytes = size / (1024 * 1024);
      if (megabytes >= 1) {
        return t('audio.import.fileSize', { size: `${megabytes.toFixed(1)} MB` });
      }
      const kilobytes = size / 1024;
      return t('audio.import.fileSize', { size: `${kilobytes.toFixed(0)} KB` });
    },
    [t],
  );

  return (
    <View style={styles.importContainer}>
      <TouchableOpacity style={styles.importButton} onPress={handleImport} activeOpacity={0.85}>
        <Text style={styles.importButtonText}>{t('audio.import.button')}</Text>
      </TouchableOpacity>
      {error ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{error}</Text>
        </View>
      ) : null}
      {importedTracks.length === 0 ? (
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholderText}>{t('audio.list.emptyImport')}</Text>
        </View>
      ) : (
        <FlatList
          data={importedTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.importedItem}>
              <Text style={styles.importedName} numberOfLines={1}>
                {/* {item.name} */}
              </Text>
              <Text style={styles.importedMeta}>{formatSize(item.size)}</Text>
            </View>
          )}
          contentContainerStyle={styles.importedList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

type StationCardProps = {
  station: Station;
  countryLabel: string;
  bitrateLabel: string;
  supportingValue: string | null;
  liked: boolean;
  onToggleLike: () => void;
  onPlay: () => void | Promise<void>;
};

function StationCard({
  station,
  countryLabel,
  bitrateLabel,
  supportingValue,
  liked,
  onToggleLike,
  onPlay,
}: StationCardProps) {
  const { t } = useTranslation();

  const handleLikePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onToggleLike();
    },
    [onToggleLike],
  );

  const handlePlayPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onPlay();
    },
    [onPlay],
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {station.name}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {countryLabel}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMetaLabel}>{t('audio.list.bitrate', { value: '' })}</Text>
          <View style={styles.cardMetaPill}>
            <Text style={styles.cardMetaValue}>{bitrateLabel}</Text>
          </View>
        </View>
        {supportingValue ? <Text style={styles.cardMetaSecondary}>{supportingValue}</Text> : null}
        <View style={styles.cardButtons}>
          <TouchableOpacity
            onPress={handleLikePress}
            style={[styles.cardButton, styles.cardButtonGhost]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.cardButtonText,
                liked ? styles.cardButtonTextActive : undefined,
              ]}
            >
              {liked ? t('audio.actions.liked') : t('audio.actions.like')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayPress}
            style={[styles.cardButton, styles.cardButtonPrimary]}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardButtonText, styles.cardButtonTextPrimary]}>
              {t('audio.actions.play')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MiniPlayer() {
  const { t } = useTranslation();
  const currentStation = useAudioStore((state) => state.currentStation);
  const playbackState = usePlaybackState();

  const stateValue = playbackState.state;
  const isPlaying = stateValue === State.Playing || stateValue === State.Buffering;

  const handleTogglePlayback = useCallback(async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      console.warn('Mini player action failed', error);
    }
  }, [isPlaying]);

  if (!currentStation) {
    return null;
  }

  return (
    <View style={styles.miniPlayer}>
      <View style={styles.miniArt} />
      <View style={styles.miniInfo}>
        <Text style={styles.miniLabel}>{t('audio.miniPlayer.nowPlaying')}</Text>
        <Text style={styles.miniTitle} numberOfLines={1}>
          {currentStation.name}
        </Text>
        <Text style={styles.miniSubtitle} numberOfLines={1}>
          {currentStation.country ?? t('audio.common.unknownCountry')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.miniButton}
        onPress={handleTogglePlayback}
        activeOpacity={0.85}
      >
        <Text style={styles.miniButtonText}>
          {isPlaying ? t('audio.actions.pause') : t('audio.actions.play')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  headerTitle: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroPanel: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  heroStats: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  heroPillAlt: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  heroPillValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroPillLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  tabNavigator: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomColor: 'rgba(148,163,184,0.3)',
    borderBottomWidth: 1,
  },
  tabIndicator: {
    backgroundColor: '#0F172A',
    height: 3,
    borderRadius: 3,
  },
  tabLabel: {
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'none',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  feedbackBanner: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(148,163,184,0.35)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  feedbackText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  placeholderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },
  cardRight: {
    marginLeft: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cardMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  cardMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardMetaSecondary: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardButtons: {
    flexDirection: 'row',
    marginTop: 2,
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    marginLeft: 8,
    backgroundColor: '#F8FAFC',
  },
  cardButtonGhost: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(203,213,225,0.8)',
  },
  cardButtonPrimary: {
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
  },
  cardButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  cardButtonTextActive: {
    color: '#0F172A',
  },
  cardButtonTextPrimary: {
    color: '#FFFFFF',
  },
  importContainer: {
    flex: 1,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  importButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  importedList: {
    paddingHorizontal: 20,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  importedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  importedName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  importedMeta: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.35)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  miniArt: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  miniInfo: {
    flex: 1,
  },
  miniLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 2,
  },
  miniTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  miniSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  miniButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0F172A',
  },
  miniButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
