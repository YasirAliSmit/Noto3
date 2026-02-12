import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ApexEventInterstitial from '../components/ApexEventInterstitial';
import { useAppClickStore } from '../components/HelperFunction';
import Icon from '../components/Icon';
import useGatedAction from '../components/useGatedAction';
import { useFlags } from '../hooks/featureFlags';
import NebulaControlCenter from '../modules/system/NebulaControlCenter';
import AiToolsScreen from '../screens/AiTools/AiToolsScreen';
import RadioScreen from '../screens/RadioScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import HomeScreen from '../screens/HomeScreen';
import VideosScreen from '../screens/VideosScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FavoriteVideosScreen from '../screens/FavoriteVideosScreen';
import { AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();
const TAB_GRADIENT_COLORS = ['#0F2027', '#203A43', '#2C5364'];
type AiTabIconProps = {
  color: string;
  size?: number;
};

const AiTabIcon = ({ color, size = 24 }: AiTabIconProps) => {
  const dimension = Math.max(size * 1.2, 28);
  return (
     <Text style={[styles.aiIconText, { color }]}>AI</Text>
  );
};
export default function AppTabs() {
  const { t } = useTranslation();
  const isFunctionsEnabled = useFlags((s) => s.isFunctionsEnabled);
  const [showAd, setShowAd] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState(false);
  const clickCount = useAppClickStore((s) => s.clickCount);
  const incrementClick = useAppClickStore((s) => s.incrementClick);

  const runGatedAction = useGatedAction({
    isFunctionsEnabled,
    clickCount,
    incrementClick,
    setShowAd,
    setShowLoadingAlert,
  });

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#EAF7F9',
          tabBarInactiveTintColor: 'rgba(234,247,249,0.6)',
          tabBarActiveBackgroundColor: 'transparent',
          tabBarBackground: () => (
            <LinearGradient
              colors={TAB_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarStyle: styles.tabBar,
        }}
      >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size ?? 24} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            runGatedAction(() => navigation.navigate('Home'));
          },
        })}
      />
      {!isFunctionsEnabled ? (
        <>
          <Tab.Screen
            name="Videos"
            component={VideosScreen}
            options={{
              tabBarLabel: t('videos.title'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="videos" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('Videos'));
              },
            })}
          />
          {/* <Tab.Screen
            name="Radio"
            component={RadioScreen}
            options={{
              tabBarLabel: t('tabs.audio'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="audio" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('Radio'));
              },
            })}
          /> */}
          <Tab.Screen
            name="LiveTV"
            component={FavoriteVideosScreen}
            options={{
              tabBarLabel: t('tabs.favorites', 'Favorites'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="heart" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('LiveTV'));
              },
            })}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: t('settings.header.title', 'Settings'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="settings" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('Settings'));
              },
            })}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarLabel: t('tabs.calendar'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="heart" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('Calendar'));
              },
            })}
          />
          <Tab.Screen
            name="AiToolsScreen"
            component={AiToolsScreen}
            options={{
              tabBarLabel: t('tabs.notes', 'Notes'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="list" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('AiToolsScreen'));
              },
            })}
          />
          <Tab.Screen
            name="NebulaControlCenter"
            component={NebulaControlCenter}
            options={{
              tabBarLabel: t('settings.header.title'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="settings" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('NebulaControlCenter'));
              },
            })}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: t('settings.header.title', 'Settings'),
              tabBarIcon: ({ color, size }) => (
                <Icon name="settings" color={color} size={size ?? 24} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                runGatedAction(() => navigation.navigate('Settings'));
              },
            })}
          />
        </>
      )}

      </Tab.Navigator>
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
            }, 100);
          }}
          onAdClosed={() => {
            setShowAd(false);
            setShowLoadingAlert(false);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    height: 76,
    paddingBottom: 10,
    paddingTop: 6,
  },
  aiIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  aiIconText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
});
