import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import { saveRecentVideo } from '../../services/recentVideos';
import { AppStackParamList } from '../../navigation/types';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import ScreenGradient from '../../components/ScreenGradient';

type PrismStreamTheaterRouteProps = RouteProp<AppStackParamList, 'PrismStreamTheater'>;
type PrismStreamTheaterNavProps = NativeStackNavigationProp<AppStackParamList, 'PrismStreamTheater'>;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remaining = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
};

const PrismStreamTheater: React.FC = () => {
  const route = useRoute<PrismStreamTheaterRouteProps>();
  const navigation = useNavigation<PrismStreamTheaterNavProps>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const videoRef = useRef<any | null>(null);

  const videoUri = route?.params?.videoUri;
  const videoTitle = route?.params?.title ?? t('videos.title');
  const videoMeta = route?.params?.video;

  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
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

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const playbackProgress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(1, Math.max(0, currentTime / duration));
  }, [currentTime, duration]);

  const scheduleControlsHide = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    if (paused) {
      return;
    }
    controlsTimeout.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  }, [paused]);

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration ?? 0);
    setIsBuffering(false);
    setHasError(false);
  }, []);

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      setCurrentTime(data.currentTime ?? 0);
      if (controlsVisible) {
        scheduleControlsHide();
      }
    },
    [controlsVisible, scheduleControlsHide],
  );

  const handleBuffer = useCallback((meta: { isBuffering: boolean }) => {
    setIsBuffering(Boolean(meta?.isBuffering));
  }, []);

  const handleEnd = useCallback(() => {
    setPaused(true);
    videoRef.current?.seek(0);
    setCurrentTime(duration);
  }, [duration]);

  const togglePlay = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      if (!next) {
        setControlsVisible(true);
        scheduleControlsHide();
      }
      return next;
    });
  }, [scheduleControlsHide]);

  const handleSeekBarPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!duration || !progressWidth) return;
      const pressX = event.nativeEvent.locationX;
      const ratio = Math.min(1, Math.max(0, pressX / progressWidth));
      const newTime = ratio * duration;
      videoRef.current?.seek(newTime);
      setCurrentTime(newTime);
      setControlsVisible(true);
      scheduleControlsHide();
    },
    [duration, progressWidth, scheduleControlsHide],
  );

  const handleError = useCallback(() => {
    setHasError(true);
    setIsBuffering(false);
  }, []);

  const handleSeekBy = useCallback(
    (delta: number) => {
      const target = Math.min(Math.max(currentTime + delta, 0), duration);
      videoRef.current?.seek(target);
      setCurrentTime(target);
      setControlsVisible(true);
      scheduleControlsHide();
    },
    [currentTime, duration, scheduleControlsHide],
  );

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      if (!prev && !paused) {
        scheduleControlsHide();
      } else if (prev && controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      return !prev;
    });
  }, [paused, scheduleControlsHide]);

  useEffect(() => {
    if (videoMeta) {
      saveRecentVideo({ ...videoMeta, uri: videoUri ?? videoMeta.uri });
    } else if (videoUri) {
      saveRecentVideo({ id: videoUri, uri: videoUri, filename: videoTitle });
    }
  }, [videoMeta, videoTitle, videoUri]);

  useEffect(() => {
    if (!paused) {
      setControlsVisible(true);
      scheduleControlsHide();
    } else if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [paused, scheduleControlsHide]);

  if (!videoUri) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {t('videos.missingVideo', 'Unable to load this video.')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.primary }]}
            onPress={() => runGatedAction(() => navigation.goBack())}
          >
            <Text style={[styles.retryButtonText, { color: colors.primary }]}>
              {t('common.back', 'Go Back')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    
      <ScreenGradient>
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoContainer}>
          <Video
            ref={(ref) => {
              videoRef.current = ref;
            }}
            source={{ uri: videoUri }}
            style={styles.videoSurface}
            resizeMode="contain"
            paused={paused}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onBuffer={handleBuffer}
            onEnd={handleEnd}
            onError={handleError}
            posterResizeMode="cover"
          />
          {(isBuffering || hasError) && (
            <View style={styles.bufferOverlay}>
              {hasError ? (
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {t('videos.playbackError', 'Playback error. Please try again.')}
                </Text>
              ) : (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
            </View>
          )}
          {controlsVisible && !hasError && (
            <View style={styles.controlsOverlay} pointerEvents="box-none">
              <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <BackButton style={styles.backButton} accessibilityLabel={t('common.back', 'Back')} />
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {videoTitle}
                </Text>
              </View>
              <View style={styles.centerControls}>
                <TouchableOpacity
                  style={[styles.circleButton, { backgroundColor: colors.border }]}
                  onPress={() => handleSeekBy(-15)}
                  accessibilityLabel={t('videos.back15', 'Back 15 seconds')}
                >
                  <SkipBack size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleButton, styles.playCircle, { backgroundColor: colors.primary }]}
                  onPress={togglePlay}
                  accessibilityLabel={paused ? t('videos.play', 'Play') : t('videos.pause', 'Pause')}
                >
                  {paused ? <Play size={32} color="#fff" /> : <Pause size={32} color="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleButton, { backgroundColor: colors.border }]}
                  onPress={() => handleSeekBy(15)}
                  accessibilityLabel={t('videos.forward15', 'Forward 15 seconds')}
                >
                  <SkipForward size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.progressBlock}>
                <Pressable
                  style={[styles.progressTrack, { backgroundColor: colors.border }]}
                  onPress={handleSeekBarPress}
                  onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
                >
                  <View
                    style={[
                      styles.progressIndicator,
                      {
                        width: `${playbackProgress * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </Pressable>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: colors.text }]}>{formatTime(currentTime)}</Text>
                  <Text style={[styles.timeLabel, { color: colors.text }]}>{formatTime(duration)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

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
      )}</ScreenGradient>
    
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    // backgroundColor: '#000',
  },
  videoSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 22,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 16,
  },
  progressBlock: {
    width: '100%',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 999,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  retryButtonText: {
    fontWeight: '600',
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

export default PrismStreamTheater;
