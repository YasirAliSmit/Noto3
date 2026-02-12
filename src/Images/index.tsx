import type { ImageSourcePropType } from 'react-native';

const onboarding1: ImageSourcePropType = require('./onboarding1.png');
const onboarding2: ImageSourcePropType = require('./onboarding2.png');
const onboarding3: ImageSourcePropType = require('./onboarding3.png');
const paywall: ImageSourcePropType = require('./paywall.png');
const instagram: ImageSourcePropType = require('./instagram.png');
const snapTube: ImageSourcePropType = require('./snapTube.png');
const socialBanner: ImageSourcePropType = require('./socialBanner.png');
const SplashVideoSource: ImageSourcePropType = require('./SplashVideoSource.mp4');
const tiktok: ImageSourcePropType = require('./tik-tok.png');
const twitter: ImageSourcePropType = require('./twitter.png');
const youtube: ImageSourcePropType = require('./youtube.png');
const home: ImageSourcePropType = require('./home.png');
const TvBanner: ImageSourcePropType = require('./TvBanner.png');

export const IMAGES = {
  Onboarding1: onboarding1,
  Onboarding2: onboarding2,
  Onboarding3: onboarding3,
  paywall: paywall,
  instagram: instagram,
  snapTube: snapTube,
  socialBanner: socialBanner,
  SplashVideoSource: SplashVideoSource,
  tiktok: tiktok,
  twitter: twitter,
  youtube: youtube,
  home: home,
  TvBanner: TvBanner,
} as const;
