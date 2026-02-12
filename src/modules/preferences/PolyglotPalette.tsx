import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { InitialStackParamList } from '../../navigation/types';
import { getOnboardingAlreadyViewed } from '../../storage/mmkv';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenGradient from '../../components/ScreenGradient';
import { useRootFlowStore } from '../../store/useRootFlowStore';
// import ScreenGradient from '../components/ScreenGradient';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', region: 'Global' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', region: 'Europe' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', region: 'LatAm' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', region: 'Europe' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', region: 'LatAm' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', region: 'Europe' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', region: 'Europe' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', region: 'Asia' },
] as const;

type PolyglotPaletteNav = NativeStackNavigationProp<InitialStackParamList, 'PolyglotPalette'>;

const PolyglotPalette = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<PolyglotPaletteNav>();
  const setInitialFlow = useRootFlowStore((state) => state.setInitialFlow);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language ?? 'en');
  const selectedLanguageMeta = useMemo(
    () => LANGUAGES.find((entry) => entry.code === selectedLanguage),
    [selectedLanguage],
  );

  const proceedToNext = () => {
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage).catch(() => undefined);
    }

    const onboardingAlreadyViewed = getOnboardingAlreadyViewed();
    if (!onboardingAlreadyViewed) {
      navigation.replace('HorizonLaunchGuide');
      return;
    }
    setInitialFlow(false);
  };

  const renderLanguageCard = (language: typeof LANGUAGES[number]) => {
    const isActive = language.code === selectedLanguage;
    return (
      <TouchableOpacity
        key={language.code}
        style={[styles.languageCard, isActive ? styles.languageCardActive : undefined]}
        onPress={() => setSelectedLanguage(language.code)}
        activeOpacity={0.9}
      >
        <View style={[styles.languageBadge, isActive ? styles.languageBadgeActive : undefined]}>
          <Text style={styles.badgeLabel}>{language.code.toUpperCase()}</Text>
        </View>
        <Text style={[styles.languageLabel, isActive ? styles.languageLabelActive : undefined]}>
          {language.label}
        </Text>
        <Text style={styles.languageNative}>{language.nativeLabel}</Text>
        <Text style={styles.languageRegion}>{language.region}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{t('language.title', 'Select your language')}</Text>
              <Text style={styles.heroSubtitle}>
                {t('language.subtitle', 'Choose a language to personalize your app experience.')}
              </Text>
              {selectedLanguageMeta ? (
                <View style={styles.selectedChip}>
                  <Text style={styles.selectedChipLabel}>
                    {t('language.selected', 'Currently selected')} · {selectedLanguageMeta.label}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.quickActions}>
            <View style={[styles.quickCard, styles.quickCardSpacer]}>
              <Text style={styles.quickTitle}>{t('language.fastTrack.title', 'Adaptive')}</Text>
              <Text style={styles.quickSubtitle}>
                {t('language.fastTrack.subtitle', 'App copy adjusts instantly after picking.')}
              </Text>
            </View>
            <View style={[styles.quickCard, styles.quickCardAccent]}>
              <Text style={styles.quickTitle}>{t('language.moreComing.title', 'More soon')}</Text>
              <Text style={styles.quickSubtitle}>
                {t('language.moreComing.subtitle', 'New dialects arrive every update.')}
              </Text>
            </View>
          </View>

          <View style={styles.languagesGrid}>
            {LANGUAGES.map(renderLanguageCard)}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={proceedToNext} activeOpacity={0.9}>
            <Text style={styles.primaryButtonLabel}>{t('common.continue', 'Continue')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={proceedToNext}>
            <Text style={styles.secondaryButtonLabel}>{t('common.skip', 'Skip for now')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 26,
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: COLORS.text,
    opacity: 0.75,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  selectedChip: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  selectedChipLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  quickCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickCardSpacer: {
    marginRight: 12,
  },
  quickCardAccent: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  quickTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 22,
    justifyContent: 'space-between',
  },
  languageCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  languageCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  languageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  languageBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  badgeLabel: {
    color: COLORS.text,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  languageLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  languageLabelActive: {
    color: COLORS.primary,
  },
  languageNative: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  languageRegion: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonLabel: {
    color: COLORS.muted,
    fontWeight: '600',
  },
});

export default PolyglotPalette;
