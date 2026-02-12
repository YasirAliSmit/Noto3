import {MMKV} from 'react-native-mmkv';
// local storage
const storage = new MMKV();
/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export function loadString(key: string): string | null {
  const value = storage.getString(key);
  if (value) {
    return value;
  } else {
    return null;
  }
}
/**
 * Saves a number to storage.
 *
 * @param key The key to store.
 * @param value The number value to store.
 */
export function saveNumber(key: string, value: number): boolean {
  storage.set(key, value);
  return true;
}

/**
 * Retrieves a number from storage.
 *
 * @param key The key to fetch.
 * @returns The number value, or null if not found.
 */
export function getNumber(key: string): number | null {
  const value = storage.getNumber(key);
  return typeof value === 'number' ? value : null;
}
/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function saveStringStorage(key: string, value: string): boolean {
  storage.set(key, value);
  return true;
}
export function saveBoolean(key: string, value: boolean): boolean {
  storage.set(key, value);
  return true;
}
export function getBoolean(key: string): boolean | any {
  const value = storage.getBoolean(key);
  return value;
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export function loadStorage<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (value) {
      return JSON.parse(value);
    } else {
      return '' as T;
    }
  } catch (error) {
    throw new Error('Unable to fetch value');
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function saveStorage(key: string, value: string | boolean | object) {
  storage.set(key, JSON.stringify(value));
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export function removeStorage(key: string) {
  storage.delete(key);
}

/**
 * Burn it all to the ground.
 */
export function clearStorage() {
  storage.clearAll();
}

