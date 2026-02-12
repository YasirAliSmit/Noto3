import AsyncStorage from '@react-native-async-storage/async-storage';

export type StorageLocation = 'internal' | 'sd';

export type SettingsPreferences = {
  autoplay: boolean;
  hdOnly: boolean;
  pushAlerts: boolean;
  emailUpdates: boolean;
  storageLocation: StorageLocation;
};

const STORAGE_KEY = '@turn-player/settings';

const defaultPreferences: SettingsPreferences = {
  autoplay: true,
  hdOnly: false,
  pushAlerts: true,
  emailUpdates: false,
  storageLocation: 'internal',
};

export const loadSettingsPreferences = async (): Promise<SettingsPreferences> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw);
    return { ...defaultPreferences, ...parsed };
  } catch (error) {
    console.warn('[settings] Failed to load prefs', error);
    return defaultPreferences;
  }
};

export const saveSettingsPreferences = async (
  prefs: Partial<SettingsPreferences>,
): Promise<SettingsPreferences> => {
  const current = await loadSettingsPreferences();
  const merged = { ...current, ...prefs };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.warn('[settings] Failed to save prefs', error);
  }
  return merged;
};

export const clearSettingsPreferences = () => AsyncStorage.removeItem(STORAGE_KEY);
