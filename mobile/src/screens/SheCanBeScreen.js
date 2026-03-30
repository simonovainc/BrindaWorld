import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const PROFESSIONS = [
  { emoji: '⚖️', title: 'Judge' }, { emoji: '🎖️', title: 'Military Officer' },
  { emoji: '🏛️', title: 'Prime Minister' }, { emoji: '🩺', title: 'Doctor' },
  { emoji: '🚀', title: 'Astronaut' }, { emoji: '💻', title: 'Engineer' },
  { emoji: '🌿', title: 'Climate Scientist' }, { emoji: '📖', title: 'Author' },
  { emoji: '🚀', title: 'CEO' }, { emoji: '🎓', title: 'Teacher' },
  { emoji: '🕊️', title: 'Diplomat' }, { emoji: '🏥', title: 'Public Health Officer' },
];

export default function SheCanBeScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff0f5' }}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#d63384', fontWeight: '600', marginBottom: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: '800', color: '#2d1b69', marginBottom: 8 }}>She Can Be... 🌟</Text>
        <Text style={{ color: '#888', marginBottom: 20, lineHeight: 20 }}>
          Explore 12 amazing professions with real Canadian women role models.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PROFESSIONS.map(p => (
            <View key={p.title} style={{
              width: '47%', backgroundColor: 'white', borderRadius: 14,
              padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f0c0d8',
            }}>
              <Text style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji}</Text>
              <Text style={{ fontWeight: '700', color: '#2d1b69', fontSize: 13, textAlign: 'center' }}>{p.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
