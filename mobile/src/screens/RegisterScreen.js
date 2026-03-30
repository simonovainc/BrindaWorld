import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

const API_URL = 'https://brindaworld.ca/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);

  const set = (field) => (val) => setForm(p => ({ ...p, [field]: val }));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return Alert.alert('Error', 'Please fill in all fields');
    if (form.password !== form.confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    if (form.password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, firstName: form.firstName, lastName: form.lastName, role: 'parent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      Alert.alert('Success', 'Account created! Please sign in.', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: 'white', borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: '#f0c0d8', marginBottom: 12, fontSize: 15 };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff0f5' }}>
      <ScrollView contentContainerStyle={{ justifyContent: 'center', padding: 24, paddingTop: 60 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#d63384', textAlign: 'center', marginBottom: 24 }}>Create Account</Text>

        <TextInput placeholder="First Name" value={form.firstName} onChangeText={set('firstName')} style={inputStyle} />
        <TextInput placeholder="Last Name" value={form.lastName} onChangeText={set('lastName')} style={inputStyle} />
        <TextInput placeholder="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" style={inputStyle} />
        <TextInput placeholder="Password (min 8 chars)" value={form.password} onChangeText={set('password')} secureTextEntry style={inputStyle} />
        <TextInput placeholder="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry style={inputStyle} />

        <TouchableOpacity onPress={handleRegister} disabled={loading}
          style={{ backgroundColor: loading ? '#ccc' : '#d63384', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Already have an account? <Text style={{ color: '#d63384', fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
