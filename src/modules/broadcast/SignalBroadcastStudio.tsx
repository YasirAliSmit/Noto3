import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, { State, usePlaybackState } from 'react-native-track-player';
import { COLORS } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useRadioStore, type Station as RadioStation } from '../../store/useRadioStore';
import { playStation } from '../../services/radioPlayer';
import { useAudioStore, type Station as AudioStation } from '../../store/useAudioStore';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_RADIUS = 24;
const CARD_WIDTH = width - 32;

type NavigationProp = {
  goBack: () => void;
  navigate?: (route: string, params?: Record<string, unknown>) => void;
};

type Props = {
  navigation: NavigationProp;
  route: { params?: { station?: RadioStation } };
};

export default function SignalBroadcastStudio({ navigation, route }: Props) {
  const { t } = useTranslation();
  const stationParam = route?.params?.station;
  const current = useRadioStore((state) => state.current);
  const queue = useRadioStore((state) => state.queue);
  const setCurrent = useRadioStore((state) => state.setCurrent);
  const toggleRadioLike = useRadioStore((state) => state.toggleLike);
  const playNext = useRadioStore((state) => state.playNext);
  const playPrevious = useRadioStore((state) => state.playPrevious);
  const playRandom = useRadioStore((state) => state.playRandom);
  const playbackState = usePlaybackState();
  const addStationToCatalog = useAudioStore((state) => state.addStationToCatalog);
  const setAudioCurrent = useAudioStore((state) => state.setCurrentStation);
  const toggleAudioLike = useAudioStore((state) => state.toggleLike);
  const stationCatalog = useAudioStore((state) => state.stationCatalog);
  const likedStations = useAudioStore((state) => state.likedStations);
  const [progress, setProgress] = useState(0);
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

  const toAudioStation = useCallback(
    (station: RadioStation): AudioStation => ({
      id: station.id,
      name: station.name,
      country: station.country,
      bitrate: station.bitrate,
      streamUrl: station.url,
    }),
    [],
  );

  const syncAudioStation = useCallback(
    (station: RadioStation) => {
      const audioStation = toAudioStation(station);
      addStationToCatalog(audioStation);
      setAudioCurrent(audioStation);
    },
    [addStationToCatalog, setAudioCurrent, toAudioStation],
  );

  useEffect(() => {
    if (stationParam) {
      const store = useRadioStore.getState();
      if (!store.queue.length) {
        store.setQueue([stationParam], stationParam.id);
      }
      setCurrent(stationParam);
      syncAudioStation(stationParam);
      playStation(stationParam).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Failed to start radio station', error);
      });
    }
  }, [setCurrent, stationParam, syncAudioStation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((value) => {
        const next = value + 0.01;
        return next >= 1 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const stateValue = playbackState.state;
  const isPlaying = stateValue === State.Playing || stateValue === State.Buffering;
  const activeStation = current ?? stationParam;
  const isLiked = activeStation ? Boolean(likedStations[activeStation.id]) : false;
  const artwork =
    activeStation?.artwork ??
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop';

  const handlePlayPause = async () => {
    if (!activeStation) {
      return;
    }
    try {
      const state = await TrackPlayer.getState();
      if (state === State.Playing || state === State.Buffering) {
        await TrackPlayer.pause();
        return;
      }
      const queueItems = await TrackPlayer.getQueue();
      if (!queueItems.length) {
        syncAudioStation(activeStation);
        await playStation(activeStation);
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Unable to toggle playback', error);
    }
  };

  const handleSkipPrevious = async () => {
    const station = playPrevious();
    if (!station) {
      return;
    }
    try {
      syncAudioStation(station);
      await playStation(station);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Unable to play previous station', error);
    }
  };

  const handleSkipNext = async () => {
    const station = playNext();
    if (!station) {
      return;
    }
    try {
      syncAudioStation(station);
      await playStation(station);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Unable to play next station', error);
    }
  };

  const handleShuffle = async () => {
    const station = playRandom();
    if (!station) {
      return;
    }
    try {
      syncAudioStation(station);
      await playStation(station);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Unable to shuffle station', error);
    }
  };

  const handleShare = async () => {
    if (!activeStation) {
      return;
    }
    try {
      await Share.share({
        message: `${activeStation.name} • ${activeStation.url}`,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Unable to share station', error);
    }
  };

  const handleToggleLike = () => {
    if (!activeStation) {
      return;
    }
    const catalogStation = stationCatalog[activeStation.id];
    if (catalogStation) {
      toggleAudioLike(catalogStation);
    } else {
      toggleAudioLike(toAudioStation(activeStation));
    }
    toggleRadioLike(activeStation.id);
  };

  const handleOpenQueue = () => {
    runGatedAction(() => {
      navigation.goBack();
    });
  };

  const canNavigateQueue = queue.length > 1;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => runGatedAction(() => navigation.goBack())} style={styles.iconButton}>
          <Icon name="chevronLeft" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Icon name="moreHorizontal" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Image source={{ uri: artwork }} style={styles.artwork} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cornerActions}>
          <TouchableOpacity
            style={[styles.cornerIcon, queue.length <= 1 ? styles.disabled : undefined]}
            onPress={handleShuffle}
            disabled={queue.length <= 1}
          >
            <Icon name="shuffle" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cornerIcon}
            onPress={handleToggleLike}
          >
            <Icon name={isLiked ? 'heart' : 'heartOff'} size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {activeStation?.name ?? 'Live Radio'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {activeStation?.country ?? 'Online'}
            {activeStation?.bitrate ? ` • ${activeStation.bitrate} kbps` : ''}
          </Text>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]}
            />
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleSkipPrevious}
              style={[styles.controlButton, queue.length <= 1 ? styles.disabled : undefined]}
              disabled={queue.length <= 1}
            >
              <Icon name="skipBack" size={26} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
              <Icon name={isPlaying ? 'pause' : 'play'} size={30} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkipNext}
              style={[styles.controlButton, queue.length <= 1 ? styles.disabled : undefined]}
              disabled={queue.length <= 1}
            >
              <Icon name="skipForward" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.utilityRow}>
            <TouchableOpacity style={styles.utilityIcon} onPress={handleOpenQueue}>
              <Icon name="list" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 55,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    padding: 6,
  },
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  artwork: {
    width: '100%',
    height: CARD_WIDTH * 1.15,
  },
  cornerActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  cornerIcon: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 8,
    borderRadius: 999,
  },
  meta: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#171717',
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  controls: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    height: 68,
    width: 68,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  utilityRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 12,
  },
  utilityIcon: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
  },
  disabled: {
    opacity: 0.5,
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
