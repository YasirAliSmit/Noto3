import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react-native';

import BackButton from '../components/BackButton';
import { useRecentVideos } from '../hooks/useRecentVideos';
import { RecentVideo } from '../services/recentVideos';
import useGatedAction from '../components/useGatedAction';
import { useAppClickStore } from '../components/HelperFunction';
import { useFlags } from '../hooks/featureFlags';
import ApexEventInterstitial from '../components/ApexEventInterstitial';

type Navigation = ReturnType<typeof useNavigation>;

const RecentVideosScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { videos, loading, refresh } = useRecentVideos();
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

  const navigateToVideo = useCallback(
    (video: RecentVideo) => {
      runGatedAction(() => {
        navigation.navigate('PrismStreamTheater' as never, {
          videoUri: video.uri,
          title: video.filename,
          video,
        } as never);
      });
    },
    [navigation, runGatedAction],
  );

  const renderItem = ({ item }: { item: RecentVideo }) => (
    <TouchableOpacity
      style={[styles.videoCard, { borderColor: colors.border }]}
      onPress={() => navigateToVideo(item)}
      activeOpacity={0.85}
    >
      <ImageBackground
        source={{ uri: item.thumbnailUri ?? item.uri }}
        style={styles.thumbnail}
        imageStyle={styles.thumbnailImage}
      >
        <View style={styles.overlay} />
        <View style={[styles.playBadge, { backgroundColor: colors.primary }]}>
          <Play size={16} color="#fff" />
        </View>
      </ImageBackground>
      <View style={styles.meta}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={[styles.timestamp, { color: colors.text }]}>
          {new Date(item.lastPlayedAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('recentVideos.header.title')}
        </Text>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {t('recentVideos.empty')}
              </Text>
            )}
          </View>
        }
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  videoCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  meta: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
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

export default RecentVideosScreen;
