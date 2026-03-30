import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff0f5' }}>
      <View style={{ padding: 24, paddingTop: 80, alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>👑</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#d63384', textAlign: 'center' }}>BrindaWorld</Text>
        <Text style={{ fontSize: 16, color: '#2d1b69', textAlign: 'center', marginTop: 8, lineHeight: 24 }}>
          Chess, Coding, Geography{'\n'}& Leadership for Girls 6-14
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ backgroundColor: '#d63384', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 32 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={{ borderWidth: 2, borderColor: '#d63384', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40, marginTop: 12 }}>
          <Text style={{ color: '#d63384', fontWeight: '700', fontSize: 16 }}>Create Account</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2d1b69', marginBottom: 16 }}>She Can Be...</Text>
          {['Judge', 'Astronaut', 'Engineer', 'Doctor', 'CEO', 'Prime Minister'].map(p => (
            <Text key={p} style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>{p}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
