import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';

import { AppStackParamList } from '../../navigation/types';
import { COLORS } from '../../theme/colors';
import { AiToolDefinition } from '../../types/aiTools';
import { createChatCompletion, ChatMessage } from '../../services/openai/openaiClient';
import { useAiToolsStore } from '../../store/aiToolsStore';
import { aiCalendarEventSchema, useCalendarStore } from '../../store/calendarStore';
import { formatDateKey } from '../../utils/date';
import { AI_TOOL_DEFINITIONS } from '../../data/aiTools';
import BackButton from '../../components/BackButton';
import useGatedAction from '../../components/useGatedAction';
import { useAppClickStore } from '../../components/HelperFunction';
import { useFlags } from '../../hooks/featureFlags';
import ApexEventInterstitial from '../../components/ApexEventInterstitial';

const clampJson = (value: string) => value?.replace(/```json|```/gi, '').trim() ?? value;

const relativeDateContext = (prompt: string) => {
  const normalized = prompt.toLowerCase();
  const now = new Date();
  const contexts: string[] = [];

  if (normalized.includes('today')) {
    contexts.push(`"today"=${formatDateKey(now)}`);
  }
  if (normalized.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    contexts.push(`"tomorrow"=${formatDateKey(tomorrow)}`);
  }
  return contexts;
};

type Props = NativeStackScreenProps<AppStackParamList, 'AiToolChat'>;

export default function AiToolChatScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { toolId } = route.params;
  const addHistoryEntry = useAiToolsStore((state) => state.addHistoryEntry);
  const addEvent = useCalendarStore((state) => state.addEvent);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const tool = useMemo<AiToolDefinition | null>(() => {
    return AI_TOOL_DEFINITIONS.find((item) => item.id === toolId) ?? null;
  }, [toolId]);

  const messages = useMemo(() => {
    if (!tool) {
      return [] as ChatMessage[];
    }
    const trimmedPrompt = prompt.trim();
    const baseSystem = tool.kind === 'taskReminder'
      ? `${tool.systemPrompt} Respond with raw JSON only, never add code fences or commentary.`
      : tool.systemPrompt;
    if (tool.kind === 'taskReminder') {
      const context = relativeDateContext(trimmedPrompt);
      const schemaDescription =
        '{"id":"string","title":"string","date":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm","allDay":true|false,"color":"#HEX","icon":"idea|instagram|telegram|x|youtube|vk|compass|facebook|tiktok","note":"string"}';
      const userContent = [trimmedPrompt, context.length ? `Resolved context: ${context.join(', ')}` : null]
        .filter(Boolean)
        .join('\n');
      return [
        { role: 'system', content: `${baseSystem}\nSchema:${schemaDescription}` },
        { role: 'user', content: userContent },
      ] as ChatMessage[];
    }
    return [
      { role: 'system', content: baseSystem },
      { role: 'user', content: trimmedPrompt },
    ] as ChatMessage[];
  }, [prompt, tool]);

  const handleSend = async () => {
    if (!tool) {
      return;
    }
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const text = await createChatCompletion({
        model: '3',
        messages,
      });
      setResponse(text);
      addHistoryEntry({ toolId: tool.id, prompt: trimmedPrompt, result: text });

      if (tool.kind === 'taskReminder') {
        try {
          const parsedRaw = JSON.parse(clampJson(text));
          const validated = aiCalendarEventSchema.parse(parsedRaw);
          const payload = addEvent({
            ...validated,
            id: validated.id,
            createdAt: validated.createdAt,
          });
          setSelectedDate(payload.date);
          runGatedAction(() => {
            navigation.navigate('Calendar');
            navigation.goBack();
          });
        } catch (parseError) {
          setError(t('aiTools.errors.invalidJson'));
        }
      }
    } catch (err) {
      setError(t('aiTools.errors.aiFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) {
      return;
    }
    Clipboard.setString(response);
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('aiTools.actions.copy'), ToastAndroid.SHORT);
    } else {
      Alert.alert(t('aiTools.actions.copy'));
    }
  };

  if (!tool) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.error}>{t('aiTools.errors.aiFailed')}</Text>
      </SafeAreaView>
    );
  }

  const toolTitle = t(tool.titleKey);

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
              <BackButton accessibilityLabel={t('common.back', 'Back')} />
              <Text style={styles.title}>{toolTitle}</Text>
              <TouchableOpacity onPress={() => runGatedAction(() => navigation.goBack())}>
                <Text style={styles.closeText}>{t('aiTools.actions.close')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder={t('aiTools.inputPlaceholder')}
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                multiline
                value={prompt}
                onChangeText={setPrompt}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!prompt.trim() || loading) && styles.sendDisabled]}
                disabled={!prompt.trim() || loading}
                onPress={handleSend}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.sendText}>{t('aiTools.actions.send')}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.responseContainer}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseLabel}>{t('aiTools.responseLabel')}</Text>
                <TouchableOpacity onPress={handleCopy} disabled={!response}>
                  <Text style={[styles.copyText, !response && styles.copyDisabled]}>
                    {t('aiTools.actions.copy')}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.responseScroll}>{response
                ? <Text style={styles.responseText}>{response}</Text>
                : <Text style={styles.placeholder}>{t('aiTools.inputPlaceholder')}</Text>
              }</ScrollView>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    backgroundColor: COLORS.surface,
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: COLORS.border,
  },
  sendText: {
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  responseContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 12,
    flex: 1,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  responseLabel: {
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: 1,
  },
  copyText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  copyDisabled: {
    color: COLORS.border,
  },
  responseScroll: {
    flex: 1,
  },
  responseText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
  },
  placeholder: {
    color: COLORS.muted,
  },
  errorText: {
    color: COLORS.primary,
    marginTop: 12,
  },
  error: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 16,
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
