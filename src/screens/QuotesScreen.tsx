import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { ChevronLeft } from 'lucide-react-native';

import { quoteData } from '../data/localData';
import { useDailyQuote } from '../hooks/useDailyQuote';
import useGatedAction from '../components/useGatedAction';
import { useAppClickStore } from '../components/HelperFunction';
import { useFlags } from '../hooks/featureFlags';
import ApexEventInterstitial from '../components/ApexEventInterstitial';

const QuotesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { quote: dailyQuote, loading, refresh } = useDailyQuote();
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

  const quotes = useMemo(() => quoteData, []);

  const renderItem = ({ item }: { item: typeof quoteData[number] }) => (
    <View style={[styles.quoteCard, { borderColor: colors.border }]}> 
      <Text style={[styles.quoteCategory, { color: colors.primary }]}>{item.category}</Text>
      <Text style={[styles.quoteName, { color: colors.text }]}>{item.quoteName}</Text>
      <Text style={[styles.quoteText, { color: colors.text }]}>
        {`“${item.text}”`}
      </Text>
      <Text style={[styles.quoteAuthor, { color: colors.text }]}>{`— ${item.author}`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: colors.border }]}
          onPress={() => runGatedAction(() => navigation.goBack())}
          accessibilityRole="button"
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}> 
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quotes.header.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>{t('quotes.header.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.dailyCard, { borderColor: colors.primary }]}> 
            <Text style={[styles.dailyLabel, { color: colors.primary }]}>{t('quotes.header.today')}</Text>
            <Text style={[styles.dailyText, { color: colors.text }]}>
              {`“${dailyQuote?.text ?? t('home.cards.quotes.subtitle')}”`}
            </Text>
            <Text style={[styles.dailyAuthor, { color: colors.text }]}>
              {dailyQuote?.author ? `— ${dailyQuote.author}` : '—'}
            </Text>
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
    paddingBottom: 16,
    paddingTop: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dailyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  dailyLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  dailyText: {
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  dailyAuthor: {
    marginTop: 10,
    fontSize: 14,
  },
  quoteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  quoteCategory: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    opacity: 0.75,
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

export default QuotesScreen;
