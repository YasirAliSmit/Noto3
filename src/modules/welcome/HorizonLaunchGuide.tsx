import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../theme/colors';
import { setOnboardingAlreadyViewed } from '../../storage/mmkv';
import Icon from '../../components/Icon';
import { IMAGES } from '../../Images';
import AppBannerAd from '../../components/AppBannerAd';
import { useRootFlowStore } from '../../store/useRootFlowStore';
import ScreenGradient from '../../components/ScreenGradient';

const heroPalettes = [
  { accent: '#ff0f68', background: '#ffeef4' },
  { accent: '#ff8f5c', background: '#fff3ea' },
  { accent: '#7b5bff', background: '#f4f0ff' },
];

export default function HorizonLaunchGuide() {
  const { t } = useTranslation();
  const setInitialFlow = useRootFlowStore((state) => state.setInitialFlow);
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        key: 'video',
        title: t('onboarding.slides.video.title', 'Video Player'),
        subtitle: t('onboarding.slides.video.subtitle', 'Play any video.'),
        image: IMAGES.Onboarding1,
      },
      {
        key: 'audio',
        title: t('onboarding.slides.audio.title', 'Radio & Podcasts'),
        subtitle: t('onboarding.slides.audio.subtitle', 'Stream live radio and podcasts.'),
        image: IMAGES.Onboarding2,
      },
      {
        key: 'offline',
        title: t('onboarding.slides.offline.title', 'Offline mode'),
        subtitle: t('onboarding.slides.offline.subtitle', 'Download shows to watch anywhere.'),
        image: IMAGES.Onboarding3,
      },
    ],
    [t],
  );

  const handleComplete = () => {
    setOnboardingAlreadyViewed(true);
    setInitialFlow(false);
  };

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    handleComplete();
  };

  const heroPalette = heroPalettes[index % heroPalettes.length];
  const slide = slides[index];

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Image source={slides[index].image} style={{ height: 400, width: "100%", resizeMode:'contain' }} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.dotsRow}>
              {slides.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.dot,
                    idx === index ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextLabel}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerWrap}>
            {/* <AppBannerAd addType={BannerAdSize.MEDIUM_RECTANGLE} /> */}
          </View>
        </View>
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  heroWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroCard: {
    width: 260,
    height: 230,
    borderRadius: 48,
    paddingTop: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff0f68',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  heroDots: {
    flexDirection: 'row',
    gap: 8,
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroDotPrimary: {
    backgroundColor: '#fff',
  },
  heroPlayShadow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.08)',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  heroPlay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bannerWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary
  },
  nextLabel: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 32,
  },
});
