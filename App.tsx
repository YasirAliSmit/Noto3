import React, { Activity, useEffect, useRef, useState } from 'react';
import 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n';
import { ActivityIndicator, LogBox, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFlags } from './src/hooks/featureFlags';
import { INTERTSIAL_KEY } from './src/services/constant';
import Video from 'react-native-video';
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { IMAGES } from './src/Images';
import ScreenGradient from './src/components/ScreenGradient';

const App = () => {
  const [isSplash, setIsSplash] = useState(true);
  const [flagsReady, setFlagsReady] = useState(false);
  const isFunctionsEnabled = useFlags(s => s.isFunctionsEnabled);
  LogBox.ignoreAllLogs();

  useEffect(() => {
    setFlagsReady(true);
  }, []);
  // Ads logic
  const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : INTERTSIAL_KEY;
  useEffect(() => {
    if (!flagsReady) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const init = async () => {
        // If remote config has disabled app functions, don't load ads – just hide splash
        if (!isFunctionsEnabled) {
          console.log('Functions disabled, hiding splash without ads.');
          setTimeout(() => {
            setIsSplash(false);
          }, 2000);
          return;
        }

        const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
          keywords: ['ai', 'image', 'generator'],
        });

        const proceedAfterAd = () => {
          setIsSplash(false);
        };

        const unsubscribeClosed = interstitial.addAdEventListener(
          AdEventType.CLOSED,
          proceedAfterAd,
        );
        const unsubscribeError = interstitial.addAdEventListener(
          AdEventType.ERROR,
          proceedAfterAd,
        );
        const unsubscribeLoaded = interstitial.addAdEventListener(
          AdEventType.LOADED,
          () => {
            // Give a small delay before showing the ad
            setTimeout(() => {
              interstitial.show().catch(e => {
                console.error('Ad show error:', e);
                proceedAfterAd();
              });
            }, 4000);
          },
        );

        interstitial.load();

        // Local cleanup: event listeners
        return () => {
          unsubscribeClosed();
          unsubscribeError();
          unsubscribeLoaded();
        };
      };

      init();
    }, 1000);

    // Clear the timeout if the effect re-runs or unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [adUnitId, flagsReady, isFunctionsEnabled]);

  return (
    <ScreenGradient>
      <SafeAreaProvider>
        {isSplash ? (
          <SafeAreaView
            style={[styles.safeArea, styles.splashCenter]}
            edges={['top', 'bottom', 'left', 'right']}
          >
            <StatusBar
              barStyle="light-content"
              backgroundColor="#000000"
              translucent={false}
            />

            <ActivityIndicator size="small" color="#FFFFFF" />
            {/* <Video
            source={IMAGES.SplashVideoSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            repeat
            muted
            paused={false}
            ignoreSilentSwitch="obey"
            playInBackground={false}
            playWhenInactive={false}
          /> */}
          </SafeAreaView>
        ) : (
          <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom', 'left', 'right']}
          >
            <StatusBar
              barStyle="light-content"
              backgroundColor="#000000"
              translucent={false}
            />
            <RootNavigator />
          </SafeAreaView>
        )}
      </SafeAreaProvider>
    </ScreenGradient>
  );
};

export default App;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: '#000000',
  },
  splashCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appShell: {
    flex: 1,
  },
});
