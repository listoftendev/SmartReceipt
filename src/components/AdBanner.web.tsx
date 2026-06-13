import React from 'react';
import { View, Text } from 'react-native';

export default function AdBanner() {
  return (
    <View style={{ alignItems: 'center', width: '100%', padding: 10, backgroundColor: '#E5E7EB' }}>
      <Text style={{ color: '#6B7280' }}>AdMob Banner (Hidden on Web)</Text>
    </View>
  );
}
