import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppTabs from './AppTabs';
import SignalBroadcastStudio from '../modules/broadcast/SignalBroadcastStudio';
import PrismStreamTheater from '../modules/cinema/PrismStreamTheater';
import QuotesScreen from '../screens/QuotesScreen';
import RecentVideosScreen from '../screens/RecentVideosScreen';
import { AppStackParamList } from './types';
import NebulaControlCenter from '../modules/system/NebulaControlCenter';
import AuroraVideoGallery from '../modules/library/AuroraVideoGallery';
import LumenFeatureProfile from '../modules/cinema/LumenFeatureProfile';
import AddEventScreen from '../screens/Calendar/AddEventScreen';
import AiToolChatScreen from '../screens/AiTools/AiToolChatScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import AiToolsScreen from '../screens/AiTools/AiToolsScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import FavoriteCarsScreen from '../screens/FavoriteCarsScreen';
import FolderOptionsScreen from '../screens/Folders/FolderOptionsScreen';
import FolderImagesScreen from '../screens/Folders/FolderImagesScreen';
import FolderImageViewerScreen from '../screens/Folders/FolderImageViewerScreen';
import FolderVideosScreen from '../screens/Folders/FolderVideosScreen';
import FolderVideoPlayerScreen from '../screens/Folders/FolderVideoPlayerScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AppTabs" component={AppTabs} />
    <Stack.Screen
      name="CarDetailsScreen"
      component={CarDetailsScreen}
      options={{ headerShown: false }}
    />
    {/* NEW CODE: favorites screen */}
    <Stack.Screen
      name="FavoriteCarsScreen"
      component={FavoriteCarsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="SignalBroadcastStudio" component={SignalBroadcastStudio} />
    <Stack.Screen name="PrismStreamTheater" component={PrismStreamTheater} />
    <Stack.Screen name="Quotes" component={QuotesScreen} />
    <Stack.Screen name="RecentVideos" component={RecentVideosScreen} />
    <Stack.Screen name="FolderOptions" component={FolderOptionsScreen} />
    <Stack.Screen name="FolderImages" component={FolderImagesScreen} />
    <Stack.Screen name="FolderImageViewer" component={FolderImageViewerScreen} />
    <Stack.Screen name="FolderVideos" component={FolderVideosScreen} />
    <Stack.Screen name="FolderVideoPlayer" component={FolderVideoPlayerScreen} />
    <Stack.Screen name="NebulaControlCenter" component={NebulaControlCenter} />
    <Stack.Screen name="AuroraVideoGallery" component={AuroraVideoGallery} />
    <Stack.Screen name="LumenFeatureProfile" component={LumenFeatureProfile} />
    <Stack.Screen name="AddEvent" component={AddEventScreen} />
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="AiToolsScreen" component={AiToolsScreen} />
    <Stack.Screen name="AiToolChat" component={AiToolChatScreen} />
  </Stack.Navigator>
);

export default AppStackNavigator;
