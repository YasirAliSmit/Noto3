import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { AI_TOOL_DEFINITIONS } from '../../data/aiTools';
import { AiToolCategory, AiToolDefinition } from '../../types/aiTools';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import BackButton from '../../components/BackButton';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';
import ScreenGradient from '../../components/ScreenGradient';

type FavoriteCar = {
  id: string;
  brand: string;
  model: string;
};

const FAVORITE_CARS: FavoriteCar[] = [
  { id: 'fav-1', brand: 'Tesla', model: 'Model S Plaid' },
  { id: 'fav-2', brand: 'Porsche', model: '911 Carrera' },
  { id: 'fav-3', brand: 'Mercedes-Benz', model: 'AMG GT' },
];

const categories: { key: AiToolCategory; labelKey: string }[] = [
  { key: 'work', labelKey: 'aiTools.tabs.work' },
  { key: 'health', labelKey: 'aiTools.tabs.health' },
  { key: 'fun', labelKey: 'aiTools.tabs.fun' },
];

type CarNoteCardProps = {
  car: FavoriteCar;
  note: string | undefined;
  isEditing: boolean;
  draftNote: string;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onChangeDraft: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

const CarNoteCard = ({
  car,
  note,
  isEditing,
  draftNote,
  onStartEditing,
  onCancelEditing,
  onChangeDraft,
  onSave,
  onDelete,
}: CarNoteCardProps) => {
  const hasNote = Boolean(note && note.trim().length > 0);
  const canSave = draftNote.trim().length > 0;

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteCarTitle}>{`${car.brand} ${car.model}`}</Text>
        <View style={styles.noteHeaderActions}>
          <TouchableOpacity onPress={onStartEditing} style={styles.noteChipButton}>
            <Text style={styles.noteChipText}>{hasNote ? 'Edit Note' : 'Add Note'}</Text>
          </TouchableOpacity>
          {hasNote && (
            <TouchableOpacity onPress={onDelete} style={[styles.noteChipButton, styles.noteChipDanger]}>
              <Text style={[styles.noteChipText, styles.noteChipDangerText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isEditing && hasNote && <Text style={styles.noteText}>{note}</Text>}

      {!isEditing && !hasNote && (
        <Text style={styles.notePlaceholder}>No note yet. Add your thoughts.</Text>
      )}

      {isEditing && (
        <View style={styles.noteEditor}>
          <TextInput
            value={draftNote}
            onChangeText={onChangeDraft}
            placeholder="Write something about your favorite car..."
            placeholderTextColor={COLORS.muted}
            style={styles.noteInput}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.noteButtonRow}>
            <TouchableOpacity
              onPress={onSave}
              style={[styles.noteButton, styles.noteButtonPrimary, !canSave && styles.noteButtonDisabled]}
              disabled={!canSave}
            >
              <Text style={styles.noteButtonPrimaryText}>Save Note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEditing} style={[styles.noteButton, styles.noteButtonGhost]}>
              <Text style={styles.noteButtonGhostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default function AiToolsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const stackNavigation = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();

  const [category, setCategory] = useState<AiToolCategory>('work');
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

  const tools = useMemo(
    () => AI_TOOL_DEFINITIONS.filter((tool) => tool.category === category),
    [category],
  );

  // Notes are stored locally in memory and keyed by carId for quick lookup.
  const [notesByCarId, setNotesByCarId] = useState<Record<string, string>>({});
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  const startEditing = (carId: string) => {
    setActiveCarId(carId);
    setDraftNote(notesByCarId[carId] ?? '');
  };

  const cancelEditing = () => {
    setActiveCarId(null);
    setDraftNote('');
  };

  const saveNote = (carId: string) => {
    const trimmed = draftNote.trim();
    if (!trimmed) {
      return;
    }
    setNotesByCarId((prev) => ({ ...prev, [carId]: trimmed }));
    setActiveCarId(null);
    setDraftNote('');
  };

  const deleteNote = (carId: string) => {
    setNotesByCarId((prev) => {
      const { [carId]: removed, ...rest } = prev;
      return rest;
    });
    if (activeCarId === carId) {
      setActiveCarId(null);
      setDraftNote('');
    }
  };

  const openTool = (tool: AiToolDefinition) => {
    runGatedAction(() => {
      stackNavigation?.navigate('AiToolChat', { toolId: tool.id });
    });
  };

  const renderCard = ({ item }: { item: AiToolDefinition }) => (
    <TouchableOpacity style={styles.card} onPress={() => openTool(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
      <Text style={styles.cardSubtitle}>{t(item.subtitleKey)}</Text>
    </TouchableOpacity>
  );

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <Text style={styles.sectionTitle}>Favorite Car Notes</Text>
      <Text style={styles.sectionSubtitle}>
        Capture why you love each car and the details that matter most.
      </Text>
      {FAVORITE_CARS.map((car) => (
        <CarNoteCard
          key={car.id}
          car={car}
          note={notesByCarId[car.id]}
          isEditing={activeCarId === car.id}
          draftNote={activeCarId === car.id ? draftNote : ''}
          onStartEditing={() => startEditing(car.id)}
          onCancelEditing={cancelEditing}
          onChangeDraft={setDraftNote}
          onSave={() => saveNote(car.id)}
          onDelete={() => deleteNote(car.id)}
        />
      ))}
    </View>
  );

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.headerRow}>
            <BackButton accessibilityLabel={t('common.back', 'Back')} />
            {/* <Text style={styles.headerTitle}>{t('aiTools.title')}</Text> */}
            <View style={styles.headerSpacer} />
          </View>
         
          <FlatList
            data={tools}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={tools.length > 0 ? styles.column : undefined}
            contentContainerStyle={styles.listContent}
            renderItem={renderNotesSection}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            // ListHeaderComponent={renderNotesSection}
            // ListEmptyComponent={
            //   <View style={styles.emptyState}>
            //     <Text style={styles.emptyText}>{t('aiTools.emptyState')}</Text>
            //   </View>
            // }
          />
        </KeyboardAvoidingView>

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
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 12,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tabPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tabPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 140,
  },
  column: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    flex: 0.48,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.muted,
  },
  notesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,

  },
  noteCard: {
    backgroundColor: '#EAF7F9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  noteCarTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  noteHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteChipButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  noteChipText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  noteChipDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  noteChipDangerText: {
    color: '#B91C1C',
  },
  noteText: {
    marginTop: 12,
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  notePlaceholder: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 13,
  },
  noteEditor: {
    marginTop: 12,
  },
  noteInput: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 14,
  },
  noteButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  noteButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noteButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  noteButtonDisabled: {
    opacity: 0.5,
  },
  noteButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  noteButtonGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteButtonGhostText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
  },
  modalText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
