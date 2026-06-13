import React from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export default function AdBanner() {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAd
        unitId="ca-app-pub-8653699399884825/5214571336"
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}
