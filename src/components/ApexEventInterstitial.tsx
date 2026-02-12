import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { INTERTSIAL_KEY } from '../services/constant';

interface ApexEventInterstitialProps {
  keywords?: string[];
  onAdLoaded?: (interstitial: InterstitialAd) => void;
  onAdClosed?: () => void;
}

const ApexEventInterstitial: React.FC<ApexEventInterstitialProps> = ({
  keywords = ['fashion', 'clothing', 'games', 'rewards'],
  onAdLoaded = () => {},
  onAdClosed = () => {},
}) => {
  const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : INTERTSIAL_KEY;

  // Use useRef to store the interstitial ad instance
  const interstitial = useRef<InterstitialAd>(
    InterstitialAd.createForAdRequest(adUnitId, {keywords}),
  ).current;

  useEffect(() => {
    const loadListener = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        StatusBar.setHidden(true);
        console.log('Interstitial Ad Loaded.');
        onAdLoaded(interstitial); // Notify parent when ad is loaded
      },
    );

    const errorListener = interstitial.addAdEventListener(
      AdEventType.ERROR,
      error => {
        console.error('Interstitial Ad failed to load:', error);
        StatusBar.setHidden(false);
      },
    );
    const closeListener = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Interstitial Ad Closed.');
        StatusBar.setHidden(false);
        onAdClosed(); // Notify parent when ad is closed
      },
    );

    // Load the ad only once
    interstitial.load();

    // Cleanup event listeners on unmount
    return () => {
      loadListener();
      errorListener();
      closeListener();
    };
  }, [interstitial, onAdLoaded, onAdClosed]);

  return null;
};

export default ApexEventInterstitial;