import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff0f5' }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>👑</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#d63384' }}>BrindaWorld</Text>
      <Text style={{ fontSize: 14, color: '#888', marginTop: 4 }}>She Can Be Anything</Text>
      <ActivityIndicator style={{ marginTop: 20 }} color="#d63384" />
    </View>
  );
}
