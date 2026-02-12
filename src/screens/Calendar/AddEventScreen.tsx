import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../theme/colors';
import {
  CalendarEventInput,
  EventIconKey,
  eventIconKeys,
  useCalendarStore,
} from '../../store/calendarStore';
import { addDays, formatDateKey, parseDateKey, toDisplayDate } from '../../utils/date';
import { DEFAULT_EVENT_ICON, EVENT_ICON_MAP } from './eventIcons';
import { AppStackParamList } from '../../navigation/types';
import BackButton from '../../components/BackButton';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';

const COLOR_OPTIONS = ['#7C3AED', '#F472B6', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444'];

type PickerKind = 'date' | 'start' | 'end' | null;

const timeSlots = Array.from({ length: 24 }).flatMap((_, hour) => [0, 30].map((minute) => {
  const hh = `${hour}`.padStart(2, '0');
  const mm = `${minute}`.padStart(2, '0');
  return `${hh}:${mm}`;
}));

const buildDateOptions = (dateKey: string, locale: string) => {
  const parsed = parseDateKey(dateKey) ?? new Date();
  const PAST_DAYS = 10;
  const TOTAL = 40;
  return Array.from({ length: TOTAL }).map((_, index) => {
    const offset = index - PAST_DAYS;
    const date = addDays(parsed, offset);
    const value = formatDateKey(date);
    return {
      label: toDisplayDate(value, locale),
      value,
    };
  });
};

type Props = NativeStackScreenProps<AppStackParamList, 'AddEvent'>;

export default function AddEventScreen({ route, navigation }: Props) {
  const { initialDate } = route.params;
  const { t, i18n } = useTranslation();
  const addEvent = useCalendarStore((state) => state.addEvent);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState<EventIconKey>(DEFAULT_EVENT_ICON);
  const [allDay, setAllDay] = useState(true);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState<PickerKind>(null);
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
    setDate(initialDate);
    setTitle('');
    setColor(COLOR_OPTIONS[0]);
    setIcon(DEFAULT_EVENT_ICON);
    setAllDay(true);
    setStartTime('09:00');
    setEndTime('10:00');
    setNote('');
    setPicker(null);
  }, [initialDate]);

  const dateOptions = useMemo(
    () => buildDateOptions(date, i18n.language),
    [date, i18n.language],
  );

  const pickerOptions = useMemo(() => {
    if (picker === 'date') {
      return dateOptions;
    }
    if (picker === 'start' || picker === 'end') {
      return timeSlots.map((slot) => ({ label: slot, value: slot }));
    }
    return [];
  }, [picker, dateOptions]);

  const pickerTitle = useMemo(() => {
    switch (picker) {
      case 'date':
        return t('calendar.add.date');
      case 'start':
        return t('calendar.add.startTime');
      case 'end':
        return t('calendar.add.endTime');
      default:
        return '';
    }
  }, [picker, t]);

  const handleSave = () => {
    runGatedAction(() => {
      const payload: CalendarEventInput = {
        title: title.trim() || t('calendar.add.defaultTitle'),
        date,
        allDay,
        color,
        icon,
        note: note.trim() || undefined,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
      };
      const saved = addEvent(payload);
      setSelectedDate(saved.date);
      navigation.goBack();
    });
  };

  const handleSelectValue = (value: string) => {
    if (picker === 'date') {
      setDate(value);
    } else if (picker === 'start') {
      setStartTime(value);
    } else if (picker === 'end') {
      setEndTime(value);
    }
    setPicker(null);
  };

  const renderPicker = () => (
    <Modal visible={Boolean(picker)} transparent animationType="fade">
      <Pressable style={styles.pickerOverlay} onPress={() => setPicker(null)}>
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>{pickerTitle}</Text>
          <ScrollView>
            {pickerOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.pickerOption}
                onPress={() => handleSelectValue(option.value)}
              >
                <Text style={styles.pickerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const renderIconOption = (key: EventIconKey) => {
    const meta = EVENT_ICON_MAP[key];
    return (
      <TouchableOpacity
        key={key}
        style={[styles.iconPill, icon === key && styles.iconPillActive]}
        onPress={() => setIcon(key)}
      >
        <Text style={styles.iconEmoji}>{meta.emoji}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>

            <View style={styles.header}>
              <BackButton style={styles.backButton} accessibilityLabel={t('common.back', 'Back')} />
              <Text style={styles.title}>{t('calendar.add.title')}</Text>
              <TouchableOpacity onPress={() => runGatedAction(() => navigation.goBack())}>
                <Text style={styles.close}>{t('aiTools.actions.close')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder={t('calendar.add.eventTitle')}
                placeholderTextColor={COLORS.muted}
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <Text style={styles.label}>{t('calendar.add.color')}</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((swatch) => (
                  <TouchableOpacity
                    key={swatch}
                    style={[
                      styles.colorDot,
                      { backgroundColor: swatch },
                      color === swatch && styles.colorDotActive,
                    ]}
                    onPress={() => setColor(swatch)}
                  />
                ))}
              </View>
              <Text style={styles.label}>{t('calendar.add.icon')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconRow}>{eventIconKeys.map(renderIconOption)}</View>
              </ScrollView>
              <Text style={styles.label}>{t('calendar.add.date')}</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setPicker('date')}>
                <Text style={styles.selectorText}>{toDisplayDate(date, i18n.language)}</Text>
              </TouchableOpacity>
              <View style={styles.switchRow}>
                <Text style={styles.label}>{t('calendar.add.allDay')}</Text>
                <Switch value={allDay} onValueChange={setAllDay} />
              </View>
              {!allDay && (
                <>
                  <Text style={styles.label}>{t('calendar.add.startTime')}</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setPicker('start')}>
                    <Text style={styles.selectorText}>{startTime}</Text>
                  </TouchableOpacity>
                  <Text style={styles.label}>{t('calendar.add.endTime')}</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setPicker('end')}>
                    <Text style={styles.selectorText}>{endTime}</Text>
                  </TouchableOpacity>
                </>
              )}
              <Text style={styles.label}>{t('calendar.add.notes')}</Text>
              <TextInput
                placeholder={t('calendar.add.notesPlaceholder')}
                placeholderTextColor={COLORS.muted}
                value={note}
                onChangeText={setNote}
                style={[styles.input, styles.textArea]}
                multiline
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('calendar.add.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
            {renderPicker()}
          </View>
        </TouchableWithoutFeedback>
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    marginRight: 12,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  close: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  label: {
    color: COLORS.muted,
    marginBottom: 6,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: COLORS.text,
  },
  iconRow: {
    flexDirection: 'row',
  },
  iconPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconPillActive: {
    borderColor: COLORS.primary,
  },
  iconEmoji: {
    fontSize: 22,
  },
  selector: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  selectorText: {
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  pickerTitle: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
  },
  pickerOptionText: {
    color: COLORS.text,
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
