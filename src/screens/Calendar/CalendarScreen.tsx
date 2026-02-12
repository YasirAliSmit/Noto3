import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { Car, useFavoriteCarsStore } from '../../store/useFavoriteCarsStore';
import ScreenGradient from '../../components/ScreenGradient';

const PALETTE = {
  background: '#45B6C8',
  card: '#EAF7F9',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  accent: '#E11D48',
  shadow: '#111827',
};

export default function CalendarScreen() {
  const favorites = useFavoriteCarsStore((state) => state.favorites);
  const removeFavorite = useFavoriteCarsStore((state) => state.removeFavorite);

  const renderItem = ({ item }: { item: Car }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardBrand}>{item.brand}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          activeOpacity={0.8}
          onPress={() => removeFavorite(item.id)}
        >
          <Icon name="heartOff" color={PALETTE.accent} size={16} />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const listContentStyle = [
    styles.listContent,
    favorites.length === 0 && styles.listEmptyContent,
  ];

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.screen}>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Favorite Cars</Text>
              <Text style={styles.headerSubtitle}>
                Saved picks you want to revisit.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="heartOff" color={PALETTE.muted} size={28} />
              </View>
              <Text style={styles.emptyTitle}>No favorite cars yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart on a car to add it here.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PALETTE.card,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: PALETTE.muted,
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 0.8,
  },
  cardTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.muted,
  },
  removeButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFF5F5',
  },
  removeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.accent,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.card,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: PALETTE.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
