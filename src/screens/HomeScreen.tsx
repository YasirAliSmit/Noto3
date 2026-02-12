import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import FolderVideosScreen from './Folders/FolderVideosScreen';
import type { AppStackParamList } from '../navigation/types';

const ALL_FOLDERS_NAME = 'All Folders';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useMemo(
    () => ({
      key: 'FolderOptions',
      name: 'FolderOptions',
      params: { folderName: ALL_FOLDERS_NAME },
    }),
    [],
  );

  return <FolderVideosScreen navigation={navigation as any} route={route as any} hideBackButton />;
}
