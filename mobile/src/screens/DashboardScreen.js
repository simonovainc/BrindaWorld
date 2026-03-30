import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://brindaworld.ca/api';

export default function DashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('brinda_token');
        const res = await fetch(`${API_URL}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setData(json);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff0f5' }}><ActivityIndicator color="#d63384" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff0f5' }}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#2d1b69' }}>Dashboard 👑</Text>
          <TouchableOpacity onPress={logout}><Text style={{ color: '#888' }}>Logout</Text></TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {[
            { icon: '👧', label: 'Children', value: data?.summary?.total_children || 0 },
            { icon: '⏱', label: 'Minutes', value: data?.weekly_activity?.minutes_this_week || 0 },
            { icon: '🎮', label: 'Games', value: data?.weekly_activity?.games_played || 0 },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, minWidth: 90, backgroundColor: 'white', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0c0d8' }}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#d63384' }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Children */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#2d1b69', marginBottom: 12 }}>Your Children</Text>
        {(data?.children || []).map(child => (
          <View key={child.id} style={{ backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f0c0d8', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 32 }}>{child.avatar || '🧒'}</Text>
            <View>
              <Text style={{ fontWeight: '700', color: '#2d1b69', fontSize: 15 }}>{child.displayName || child.name}</Text>
              <Text style={{ color: '#888', fontSize: 13 }}>Age {child.age}</Text>
            </View>
          </View>
        ))}

        {/* Nav buttons */}
        <TouchableOpacity onPress={() => navigation.navigate('SheCanBe')}
          style={{ backgroundColor: '#7b2ff7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>She Can Be 🌟</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Learn')}
          style={{ backgroundColor: '#d63384', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Learn 📚</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
