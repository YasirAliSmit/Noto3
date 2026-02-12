import {Platform, StyleSheet, View} from 'react-native';
import React, {useRef} from 'react';
import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';
import { bannerAddKey } from '../services/constant';
  
interface Props {
  addType?: BannerAdSize;
}
const AppBannerAd = ({addType}: Props) => {
  console.log('addType', addType);

  // Hook
  const bannerRef = useRef<BannerAd>(null);
  // adds
  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });
  return (
    <View style={styles.mainStyle}>
      <BannerAd
        ref={bannerRef}
        size={addType ? addType : BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        unitId={__DEV__ ? TestIds.BANNER : bannerAddKey}
      />
    </View>
  );
};


export default AppBannerAd;

const styles = StyleSheet.create({
  mainStyle: {
    marginVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});




