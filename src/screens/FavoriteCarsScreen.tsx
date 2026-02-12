// NEW CODE: favorites screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import ScreenGradient from '../components/ScreenGradient';
import Icon from '../components/Icon';
import { useFavoriteCarsStore, type Car } from '../store/useFavoriteCarsStore';
import { useCarNotesStore } from '../store/useCarNotesStore';

type Navigation = {
  navigate: (screen: string, params?: object) => void;
  goBack: () => void;
};

export default function FavoriteCarsScreen() {
  const navigation = useNavigation<Navigation>();
  const favorites = useFavoriteCarsStore((state) => state.favorites);
  const toggleFavorite = useFavoriteCarsStore((state) => state.toggleFavorite);
  const notes = useCarNotesStore((state) => state.notes);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => item.id)),
    [favorites],
  );

  const renderItem = ({ item }: { item: Car }) => {
    const isFavorite = favoriteIds.has(item.id);
    const notePreview = notes[item.id];
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => navigation.navigate('CarDetailsScreen', { car: item })}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heartOff'}
            color={isFavorite ? PALETTE.accent : PALETTE.muted}
            size={20}
          />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={styles.cardBrand}>{item.brand}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
          {!!notePreview && (
            <Text style={styles.cardNote} numberOfLines={1}>
              {notePreview}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <BackButton accessibilityLabel="Back" />
          <Text style={styles.headerTitle}>Favorite Cars</Text>
          <View style={styles.headerSpacer} />
        </View>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on a car to save it here.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const PALETTE = {
  background: '#45B6C8',
  card: '#EAF7F9',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  accent: '#E11D48',
  shadow: '#111827',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.card,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 20,
    paddingBottom: 140,
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
    height: 180,
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
  cardNote: {
    marginTop: 6,
    fontSize: 12,
    color: PALETTE.text,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.card,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(234,247,249,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
