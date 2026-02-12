import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Linking } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import BackButton from '../../components/BackButton';
import {
  loadSettingsPreferences,
  saveSettingsPreferences,
  SettingsPreferences,
} from '../../services/settingsPreferences';
import { clearDailyQuoteCache } from '../../services/quoteService';
import { clearRecentVideos } from '../../services/recentVideos';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import ScreenGradient from '../../components/ScreenGradient';

type Props = {
  showBackButton?: boolean;
};

export default function NebulaControlCenter({ showBackButton = true }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<SettingsPreferences | null>(null);
  const [cacheSize, setCacheSize] = useState('218 MB in use');
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

  useEffect(() => {
    const loadPrefs = async () => {
      const loaded = await loadSettingsPreferences();
      setPreferences(loaded);
    };
    loadPrefs();
  }, []);

  const persistPreference = async (key: keyof SettingsPreferences, value: any) => {
    const updated = await saveSettingsPreferences({ [key]: value });
    setPreferences(updated);
  };
 

  const handleClearCache = async () => {
    await clearDailyQuoteCache();
    await clearRecentVideos();
    setCacheSize('0 MB in use');
    Alert.alert(t('settings.rows.clearCache'), t('settings.messages.cacheCleared'));
  };

  const handleStorageLocation = () => {
    Alert.alert(t('settings.rows.storageLocation'), t('settings.messages.chooseStorage'), [
      {
        text: t('settings.labels.internal', 'Internal'),
        onPress: () => persistPreference('storageLocation', 'internal'),
      },
      {
        text: t('settings.labels.sdCard', 'SD Card'),
        onPress: () => persistPreference('storageLocation', 'sd'),
      },
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
    ]);
  };

  const handlePrivacyPolicy = () =>
    Linking.openURL('https://www.freeprivacypolicy.com/live/f3122c07-e956-4d00-acf1-42f73707aceb');
  const handleTermsOfUse = () =>
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  const handleRestorePurchases = () =>
    Alert.alert(t('settings.actions.restorePurchases'), t('settings.messages.restore'));

  const renderToggleRow = (
    label: string,
    description: string,
    key: keyof SettingsPreferences,
  ) => (
    <View style={styles.row}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.text }]}>{description}</Text>
      </View>
      <Switch
        value={Boolean(preferences?.[key])}
        onValueChange={(next) => persistPreference(key, next)}
        trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.2)' }}
        thumbColor={preferences?.[key] ? '#fff' : '#666'}
      />
    </View>
  );

  const renderActionRow = (label: string, description?: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.rowSubtitle, { color: colors.text }]}>{description}</Text>
        ) : null}
      </View>
      <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>
    </TouchableOpacity>
  );

  if (!preferences) {
    return (
      <ScreenGradient>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        </SafeAreaView>
      </ScreenGradient>
    );
  }

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            {showBackButton ? (
              <BackButton
                style={styles.backButton}
                accessibilityLabel={t('common.back', 'Back')}
              />
            ) : null}
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('settings.header.title')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text }]}>
                {t('settings.header.subtitle')}
              </Text>
            </View>
          </View>

        {/* <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.profileName, { color: colors.text }]}>Turn Player Pro</Text>
          <Text style={[styles.profileSubtitle, { color: colors.text }]}>you@turnplayer.app</Text>
          <TouchableOpacity
            style={[styles.pillButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            onPress={handleManageSubscription}
          >
            <Text style={styles.pillText}>{t('settings.actions.manageSubscription')}</Text>
          </TouchableOpacity>
        </View> */}

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('settings.sections.playback')}
        </Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {renderToggleRow(
            t('settings.rows.autoplay'),
            t('settings.rows.autoplayDesc'),
            'autoplay',
          )}
          {renderToggleRow(
            t('settings.rows.hdOnly'),
            t('settings.rows.hdOnlyDesc'),
            'hdOnly',
          )}
        </View>

        {/* <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('settings.sections.notifications')}
        </Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {renderToggleRow(
            t('settings.rows.pushAlerts'),
            t('settings.rows.pushAlertsDesc'),
            'pushAlerts',
          )}
          {renderToggleRow(
            t('settings.rows.emailUpdates'),
            t('settings.rows.emailUpdatesDesc'),
            'emailUpdates',
          )}    
        </View>            */}

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('settings.sections.downloads')}
        </Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {renderActionRow(t('settings.rows.clearCache'), cacheSize, handleClearCache)}
          {renderActionRow(
            t('settings.rows.storageLocation'),
            preferences.storageLocation === 'internal'
              ? t('settings.rows.storageLocationDesc')
              : t('settings.labels.sdCard', 'SD Card · 32 GB free'),
            handleStorageLocation,
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('settings.sections.support')}
        </Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {renderActionRow('Privacy Policy', undefined, handlePrivacyPolicy)}
          {renderActionRow('Terms of Use', undefined, handleTermsOfUse)}
        </View>

          {/* <TouchableOpacity style={styles.textButton} onPress={handleRestorePurchases}>
          <Text style={[styles.textButtonLabel, { color: colors.primary }]}>
            {t('settings.actions.restorePurchases')}
          </Text>
        </TouchableOpacity>   */}
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
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  pillButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 4,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
  },
  textButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  textButtonLabel: {
    fontSize: 15,
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
