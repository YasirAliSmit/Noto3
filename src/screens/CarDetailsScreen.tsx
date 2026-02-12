import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { useCarNotesStore } from '../store/useCarNotesStore';

type Props = NativeStackScreenProps<AppStackParamList, 'CarDetailsScreen'>;

export default function CarDetailsScreen({ route }: Props) {
  const { t } = useTranslation();
  const { car } = route.params;
  // NEW CODE: notes state
  const savedNote = useCarNotesStore((state) => state.notes[car.id]);
  const setNote = useCarNotesStore((state) => state.setNote);
  const clearNote = useCarNotesStore((state) => state.clearNote);
  const [noteDraft, setNoteDraft] = React.useState(savedNote ?? '');
  const [showNoteEditor, setShowNoteEditor] = React.useState(false);

  React.useEffect(() => {
    setNoteDraft(savedNote ?? '');
  }, [savedNote, car.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton accessibilityLabel={t('common.back', 'Back')} />
        <Text style={styles.headerTitle}>{t('carDetails.title', 'Car Details')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: car.image }} style={styles.image} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.brand}>{car.brand}</Text>
          <Text style={styles.title}>{car.title}</Text>
          <Text style={styles.description}>{car.description}</Text>
          {/* NEW CODE: add note action */}
          <View style={styles.noteSection}>
            {!!savedNote && !showNoteEditor && (
              <Text style={styles.notePreview}>{savedNote}</Text>
            )}
            <TouchableOpacity
              style={styles.noteToggle}
              onPress={() => setShowNoteEditor((prev) => !prev)}
            >
              <Text style={styles.noteToggleText}>
                {savedNote ? 'Edit Note' : 'Add Note'}
              </Text>
            </TouchableOpacity>
            {showNoteEditor && (
              <View style={styles.noteEditor}>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Add a short note"
                  placeholderTextColor="rgba(203,213,245,0.6)"
                  style={styles.noteInput}
                  maxLength={80}
                />
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.notePrimary}
                    onPress={() => {
                      setNote(car.id, noteDraft);
                      setShowNoteEditor(false);
                    }}
                  >
                    <Text style={styles.notePrimaryText}>Save Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.noteSecondary}
                    onPress={() => {
                      clearNote(car.id);
                      setNoteDraft('');
                      setShowNoteEditor(false);
                    }}
                  >
                    <Text style={styles.noteSecondaryText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0B1220',
  },
  image: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  textBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#94A3B8',
    fontWeight: '700',
  },
  title: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5F5',
  },
  noteSection: {
    marginTop: 20,
    gap: 10,
  },
  notePreview: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  noteToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.4)',
  },
  noteToggleText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  noteEditor: {
    marginTop: 6,
    gap: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E2E8F0',
    fontSize: 14,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notePrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  notePrimaryText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  noteSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
  },
  noteSecondaryText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
});
