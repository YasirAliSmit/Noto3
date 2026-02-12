import { MMKV } from 'react-native-mmkv';

export const ONBOARDING_ALREADY_VIEWED_KEY = 'onboardingAlreadyViewed';

export const storage = new MMKV();

export const getOnboardingAlreadyViewed = (): boolean =>
  storage.getBoolean(ONBOARDING_ALREADY_VIEWED_KEY) ?? false;

export const setOnboardingAlreadyViewed = (value: boolean) => {
  storage.set(ONBOARDING_ALREADY_VIEWED_KEY, value);
};
