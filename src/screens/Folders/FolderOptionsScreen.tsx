import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Film, Image as ImageIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenGradient from '../../components/ScreenGradient';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'FolderOptions'>;

const ICON_COLOR = '#FFFFFF';

const FolderOptionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { folderName } = route.params;
  const isFunctionsEnabled = useFlags((s) => s.isFunctionsEnabled);
  const clickCount = useAppClickStore((s) => s.clickCount);
  const incrementClick = useAppClickStore((s) => s.incrementClick);
  const [showAd, setShowAd] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(() => Math.max(0, width - 40), [width]);
  const runGatedAction = useGatedAction({
    isFunctionsEnabled,
    clickCount,
    incrementClick,
    setShowAd,
    setShowLoadingAlert,
  });

  const handleOpenImages = useCallback(() => {
    runGatedAction(() => {
      navigation.navigate('FolderImages', { folderName });
    });
  }, [folderName, navigation, runGatedAction]);

  const handleOpenVideos = useCallback(() => {
    runGatedAction(() => {
      navigation.navigate('FolderVideos', { folderName });
    });
  }, [folderName, navigation, runGatedAction]);

  return (
    <ScreenGradient style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={20} color={ICON_COLOR} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {folderName}
            </Text>
            <Text style={styles.subtitle}>Choose what you want to view</Text>
          </View>
        </View>
        <View style={styles.options}>
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sliderContent}
            snapToInterval={cardWidth + 12}
            onMomentumScrollEnd={(event) => {
              const x = event.nativeEvent.contentOffset.x;
              const index = Math.round(x / (cardWidth + 12));
              setActiveIndex(index);
            }}
          >
            <Pressable style={[styles.optionCard, { width: cardWidth }]} onPress={handleOpenImages}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardSurface}
              >
                <View style={styles.cardSheen} />
                <View style={styles.iconWrapper}>
                  <ImageIcon size={26} color={ICON_COLOR} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.optionTitle}>Image Folder</Text>
                  <Text style={styles.optionSubtitle}>Browse photos</Text>
                </View>
              </LinearGradient>
            </Pressable>
            <Pressable style={[styles.optionCard, { width: cardWidth }]} onPress={handleOpenVideos}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardSurface}
              >
                <View style={styles.cardSheen} />
                <View style={styles.iconWrapper}>
                  <Film size={26} color={ICON_COLOR} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.optionTitle}>Video Folder</Text>
                  <Text style={styles.optionSubtitle}>Browse videos</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </ScrollView>
          <View style={styles.pagination}>
            <View style={[styles.dot, activeIndex === 0 && styles.dotActive]} />
            <View style={[styles.dot, activeIndex === 1 && styles.dotActive]} />
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
              <Text style={styles.modalText}>Loading ads...</Text>
            </View>
          </View>
        </Modal>
      )}
    </ScreenGradient>
  );
};

export default FolderOptionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 6,
  },
  options: {
    marginTop: 4,
    flex: 1,
    justifyContent: 'center',
  },
  sliderContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionCard: {
    height: 360,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardSurface: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  cardSheen: {
    position: 'absolute',
    top: -80,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  pagination: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
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
