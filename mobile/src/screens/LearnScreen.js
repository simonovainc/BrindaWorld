import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function LearnScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff0f5', padding: 24 }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#2d1b69', textAlign: 'center', marginBottom: 8 }}>Learning Content</Text>
      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
        Learning content coming soon! Visit brindaworld.ca on your browser for the full chess, coding, and geography experience.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://brindaworld.ca')}
        style={{ backgroundColor: '#d63384', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}>
        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Open BrindaWorld.ca</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#d63384', fontWeight: '600' }}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
