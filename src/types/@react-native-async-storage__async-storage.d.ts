declare module '@react-native-async-storage/async-storage' {
  type AsyncStorageType = {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };

  const AsyncStorage: AsyncStorageType;
  export default AsyncStorage;
}
