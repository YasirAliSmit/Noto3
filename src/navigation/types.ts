import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Station as RadioStation } from '../store/useRadioStore';

export type InitialStackParamList = {
  PolyglotPalette: undefined;
  HorizonLaunchGuide: undefined;
};

export type AppTabsParamList = {
  Home: undefined;
  Videos: undefined;
  Radio: undefined;
  LiveTV: undefined;
  NebulaControlCenter: undefined;
  AuroraVideoGallery: undefined;
  Calendar: undefined;
  AiToolsScreen: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabsParamList>;
  SignalBroadcastStudio: { station?: RadioStation } | undefined;
  PrismStreamTheater: { videoUri: string; title?: string; video?: any };
  Quotes: undefined;
  RecentVideos: undefined;
  FolderOptions: { folderName: string };
  FolderImages: { folderName: string };
  FolderImageViewer: { uri: string; title?: string };
  FolderVideos: { folderName: string };
  FolderVideoPlayer: { uri: string; title?: string };
  CarDetailsScreen: {
    car: {
      id: string;
      brand: string;
      title: string;
      description: string;
      image: string;
    };
  };
  // NEW CODE: favorites screen route
  FavoriteCarsScreen: undefined;
  NebulaControlCenter: undefined;
  AuroraVideoGallery: undefined;
  LumenFeatureProfile: any;
  AddEvent: { initialDate: string };
  Calendar: undefined;
  AiToolsScreen: undefined;
  AiToolChat: { toolId: string };
};
